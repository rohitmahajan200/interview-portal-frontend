// src/components/ProctorSnapshots.tsx
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { uploadToCloudinary } from "@/lib/clodinary"; // ensure this path/file name is correct
import { addSnapshotUrl } from "@/lib/proctorStore";
import toast, { Toaster } from "react-hot-toast";

const SNAP_MS = 0.5 * 60 * 1000; // 30s (testing). Use 3*60*1000 in prod.
const SHOT_W = 640;
const SHOT_H = 480;

type Props = { active: boolean };

function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1] || "");
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new File([u8], filename, { type: mime });
}

const ProctorSnapshots: React.FC<Props> = ({ active }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [ready, setReady] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    console.log("[SNAP] module mounted");
  }, [active]);

  useEffect(() => {
    if (!active || !ready) return;

    const tick = async () => {
      const ts = Date.now();
      const toastId = `snap-${ts}`;
      try {
        const shot = webcamRef.current?.getScreenshot();
        if (!shot) {
          console.warn("[SNAP] getScreenshot() returned null");
          toast.error("Snapshot failed: empty image", { id: toastId });
          return;
        }

        console.log("[SNAP] uploading…");
        toast.loading("Uploading snapshot…", { id: toastId });

        const file = dataURLtoFile(shot, `snap_${ts}.jpg`);
        const res = await uploadToCloudinary(file, "snapshots");
        const finalUrl = (res as { url?: string }).url;

        if (!finalUrl) throw new Error("Upload returned no URL");

        await addSnapshotUrl(finalUrl);
        console.log("[SNAP] saved:", finalUrl);

        const short = finalUrl.replace(/^https?:\/\//, "").slice(0, 60);
        toast.success(`Snapshot saved: ${short}…`, { id: toastId, duration: 2500 });
      } catch (err: unknown) {
        console.error("[SNAP] error", err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Snapshot error: ${msg}`, { id: toastId, duration: 4000 });
      }
    };

    const first = window.setTimeout(() => void tick(), 5000);
    intervalRef.current = window.setInterval(() => void tick(), SNAP_MS);

    return () => {
      clearTimeout(first);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [active, ready]);

  return active ? (<>
    <Webcam
      ref={webcamRef}
      audio={false}
      screenshotFormat="image/jpeg"
      screenshotQuality={0.8}
      // use min* props for this version of react-webcam
      minScreenshotWidth={SHOT_W}
      minScreenshotHeight={SHOT_H}
      width={1}
      height={1}
      videoConstraints={{ width: SHOT_W, height: SHOT_H, facingMode: "user" }}
      onUserMedia={() => {
        setReady(true);
        console.log("[SNAP] camera ready");
        toast.success("Snapshots module active", { id: "snap-active", duration: 1500 });
      }}
      onUserMediaError={(e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[SNAP] camera error", e);
        toast.error(`Camera permission error: ${msg}`);
      }}
      style={{
        position: "fixed",
        inset: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
      }}
    /><Toaster position="bottom-center"/></>
  ) : null;
};

export default ProctorSnapshots;
