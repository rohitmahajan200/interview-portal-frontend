// src/components/ProctorGhost.tsx
import React, { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { useMicVAD } from "@/hooks/useMicVAD";
import {
  incLookingAway,
  incSpeechStarted,
  incMultiFace,
  incNoFace,
  incForbiddenObject,           // ← add this
} from "@/lib/proctorStore";


const VIDEO_WIDTH = 480;
const VIDEO_HEIGHT = 360;

// Only log when these objects are detected (no logs when none)
const FORBIDDEN_OBJECTS = [
  "cell phone",
  "book",
  "laptop",
  "headphones",
  "mouse",
  "keyboard",
  "remote",
  "tv",
  "tablet",
  "monitor",
  "camera",
];

/** ── Sensitivity + Stability (tweak here) ──────────────────────────
 * GAZE_*         → widen (less sensitive) or narrow (more sensitive)
 * GAZE_STREAK    → frames required to flip gaze state
 * FACE_STREAK    → frames required to confirm none/one/multi face
 */
const GAZE_X_MIN = 0.25;
const GAZE_X_MAX = 0.75;
const GAZE_Y_MIN = 0.25;
const GAZE_Y_MAX = 0.99;
const GAZE_STREAK_FRAMES = 2;

const FACE_STREAK_FRAMES = 4;
// ───────────────────────────────────────────────────────────────────

// --- shared singletons to survive StrictMode remounts ---
let _modelsReady: Promise<void> | null = null;
let _coco: cocoSsd.ObjectDetection | null = null;
let _face: faceLandmarksDetection.FaceLandmarksDetector | null = null;

async function ensureModels() {
  if (!_modelsReady) {
    _modelsReady = (async () => {
      await tf.setBackend("webgl");
      await tf.ready();
      _coco = await cocoSsd.load();
      _face = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: "tfjs", refineLandmarks: true, maxFaces: 5 }
      );
    })();
  }
  await _modelsReady;
}

// --------------------------------------------------------

const ProctorGhost: React.FC = () => {
  const webcamRef = useRef<Webcam | null>(null);

  // last-known states (what we’ve announced to console)
  const lastFaceState = useRef<"none" | "one" | "multi" | null>(null);
  const lastGaze = useRef<"center" | "away" | null>(null);
  const lastObjects = useRef<string>("");

  // smoothing: pending states + streak counters
  const pendingFace = useRef<"none" | "one" | "multi" | null>(null);
  const faceStreak = useRef<number>(0);

  const pendingGaze = useRef<"center" | "away" | null>(null);
  const gazeStreak = useRef<number>(0);

  // throttle object detection to lighten CPU
  const lastObjectsTs = useRef<number>(0);
  const OBJECT_INTERVAL_MS = 800;

  // ✅ Audio VAD — ONLY real-speech start + end
  useMicVAD({
    startOnLoad: true,
    userSpeakingThreshold: 0.8,
    onSpeechStart: () => {},            // suppressed
    onVADMisfire: () => {},             // suppressed
    onSpeechRealStart: () => {
            incSpeechStarted();               // ← count speech starts (per-minute bucket)
    },
   
  });

  useEffect(() => {
    let mounted = true;
    let raf = 0;

    (async () => {
      try {
        await ensureModels();
      } catch {
        return;
      }
      if (!mounted) return;

      const loop = async () => {
        const video = webcamRef.current?.video as HTMLVideoElement | undefined;
        if (!mounted) return;
        if (!video || video.readyState !== 4) {
          raf = requestAnimationFrame(loop);
          return;
        }

        // ---- Face count (with stability) + gaze (with stability) ----
        let faces: Array<
          Awaited<ReturnType<faceLandmarksDetection.FaceLandmarksDetector["estimateFaces"]>>[number]
        > = [];
        try {
          faces = await _face!.estimateFaces(video);
        } catch {
          faces = [];
        }

        // raw state this frame
        const count = faces.length;
        const faceStateNow: "none" | "one" | "multi" =
          count === 0 ? "none" : count === 1 ? "one" : "multi";

        // streak logic to suppress misfires (esp. multi on reacquire)
        if (pendingFace.current === faceStateNow) {
          faceStreak.current += 1;
        } else {
          pendingFace.current = faceStateNow;
          faceStreak.current = 1;
        }

        if (
          faceStreak.current >= FACE_STREAK_FRAMES &&
          faceStateNow !== lastFaceState.current
        ) {
          if (faceStateNow === "none") {
                        incNoFace();
          } else if (faceStateNow === "one") {
                      } else {
        
            incMultiFace(); 
          }
          lastFaceState.current = faceStateNow;
        }

        // only compute/announce gaze when at least one face is present
        if (count > 0) {
          let gazeNow: "center" | "away" | null = null;
          try {
            const kps = faces[0].keypoints as faceLandmarksDetection.Keypoint[];
            const leftEyeOuter = kps[33];
            const leftEyeInner = kps[133];
            const leftIris = kps[468]; // requires refineLandmarks
            const eyeTop = kps[159];
            const eyeBottom = kps[145];

            if (leftEyeOuter && leftEyeInner && leftIris && eyeTop && eyeBottom) {
              const eyeW = Math.abs(leftEyeInner.x - leftEyeOuter.x);
              const eyeH = Math.abs(eyeBottom.y - eyeTop.y);
              if (eyeW > 0 && eyeH > 0) {
                const x = (leftIris.x - leftEyeOuter.x) / eyeW;
                const y = (leftIris.y - eyeTop.y) / eyeH;

                const center =
                  x >= GAZE_X_MIN && x <= GAZE_X_MAX &&
                  y >= GAZE_Y_MIN && y <= GAZE_Y_MAX;

                gazeNow = center ? "center" : "away";
              }
            }
          } catch {
            // ignore
          }

          if (gazeNow) {
            if (pendingGaze.current === gazeNow) {
              gazeStreak.current += 1;
            } else {
              pendingGaze.current = gazeNow;
              gazeStreak.current = 1;
            }

            if (
              gazeStreak.current >= GAZE_STREAK_FRAMES &&
              gazeNow !== lastGaze.current
            ) {
                            if (gazeNow === "away") incLookingAway(); 
              lastGaze.current = gazeNow;
            }
          }
        } else {
          // reset gaze streaks when no face
          pendingGaze.current = null;
          gazeStreak.current = 0;
          lastGaze.current = null;
        }

        // ---- Objects (forbidden only; no log if none) ----
        const now = performance.now();
        if (now - lastObjectsTs.current >= OBJECT_INTERVAL_MS) {
          lastObjectsTs.current = now;
          try {
            const preds = await _coco!.detect(video);
            const forbidden = preds
              .filter((p) => FORBIDDEN_OBJECTS.includes(p.class))
              .map((p) => p.class);

            if (forbidden.length) {
              // increment counts once per tick per unique class
              const unique = Array.from(new Set(forbidden));
              for (const cls of unique) {
                // don’t block the loop, but do catch errors
                void incForbiddenObject(cls).catch((e) =>
                );
              }

              const str = unique.join(", ");
              if (str !== lastObjects.current) {
                                lastObjects.current = str;
              }
            } else {
              lastObjects.current = "";
            }
          } catch {
            // ignore
          }
        }


        raf = requestAnimationFrame(loop);
      };

      raf = requestAnimationFrame(loop);
    })();

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // invisible webcam element (required to drive detection)
  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      muted
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      videoConstraints={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT, facingMode: "user" }}
      style={{ position: "fixed", inset: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
    />
  );
};

export default ProctorGhost;
