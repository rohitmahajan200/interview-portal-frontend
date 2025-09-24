// src/components/ProctorSnapshots.tsx
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { addSnapshotUrl } from "@/lib/proctorStore";
import api from "@/lib/api"; // 🆕 UPDATED: Use your API instance
import toast from "react-hot-toast";

const SNAP_MS = 1 * 60 * 1000;
const SHOT_W = 640;
const SHOT_H = 480;

type Props = { 
  active: boolean;
  candidateId?: string; // 🆕 ADDED: Optional candidate ID for API calls
};

// 🆕 UPDATED: Improved file conversion with better error handling
function dataURLtoFile(dataURL: string, filename: string): File {
  try {
    const arr = dataURL.split(",");
    const mime = arr[0]?.match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1] || "");
    
    if (!bstr) {
      throw new Error("Invalid data URL - no base64 data");
    }
    
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    
    return new File([u8], filename, { type: mime });
  } catch (error) {
    console.error("[SNAP] Failed to convert dataURL to File:", error);
    throw new Error("Failed to process snapshot data");
  }
}

// 🆕 ADDED: Upload snapshot to your backend using FormData
const uploadSnapshotToBackend = async (file: File, candidateId?: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('snapshot', file); // Field name for the file
    
    // Add candidate ID if provided
    if (candidateId) {
      formData.append('candidateId', candidateId);
    }
    
    // Add timestamp for tracking
    formData.append('timestamp', Date.now().toString());
    formData.append('type', 'proctor_snapshot');

    console.log('[SNAP] Uploading to backend...');
    
    // 🆕 UPDATED: Use your API endpoint for snapshot upload
    const response = await api.post('/candidates/snapshots', formData);

    if (response.data?.success && response.data?.data?.url) {
      return response.data.data.url;
    } else if (response.data?.url) {
      return response.data.url;
    } else {
      throw new Error(response.data?.message || 'Upload failed - no URL returned');
    }
  } catch (error: any) {
    console.error('[SNAP] Backend upload failed:', error);
    
    // Extract error message
    let errorMessage = 'Upload failed';
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const ProctorSnapshots: React.FC<Props> = ({ active, candidateId }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false); // 🆕 ADDED: Track upload state
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    console.log("[SNAP] Proctor snapshots module mounted");
    
    // 🆕 ADDED: Show initial status
    if (candidateId) {
      console.log("[SNAP] Candidate ID:", candidateId);
    }
  }, [active, candidateId]);

  useEffect(() => {
    if (!active || !ready) return;

    const tick = async () => {
      // 🆕 ADDED: Skip if already uploading to prevent overlap
      if (uploading) {
        console.log("[SNAP] Skipping tick - upload in progress");
        return;
      }

      const ts = Date.now();
      const toastId = `snap-${ts}`;
      
      try {
        setUploading(true);
        
        const shot = webcamRef.current?.getScreenshot();
        if (!shot) {
          console.warn("[SNAP] getScreenshot() returned null");
          toast.error("Snapshot failed: camera not ready", { id: toastId });
          return;
        }

        // Convert screenshot to file
        const file = dataURLtoFile(shot, `proctor_snapshot_${ts}.jpg`);
        console.log("[SNAP] File created:", file.name, `(${(file.size / 1024).toFixed(1)} KB)`);

        // 🆕 UPDATED: Upload to your backend instead of Cloudinary
        const snapshotUrl = await uploadSnapshotToBackend(file, candidateId);
        
        // Store the snapshot URL in local storage/store
        await addSnapshotUrl(snapshotUrl);
        console.log("[SNAP] Snapshot saved:", snapshotUrl);


      } catch (err: unknown) {
        console.error("[SNAP] Snapshot upload error:", err);
        
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`❌ Snapshot error: ${msg}`, { 
          id: toastId, 
          duration: 4000 
        });
        
        // 🆕 ADDED: Could implement retry logic here
        console.log("[SNAP] Will retry on next interval");
        
      } finally {
        setUploading(false);
      }
    };

    // Start taking snapshots after 5 seconds, then every SNAP_MS interval
    const firstTimeout = window.setTimeout(() => void tick(), 5000);
    intervalRef.current = window.setInterval(() => void tick(), SNAP_MS);

    return () => {
      clearTimeout(firstTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setUploading(false);
    };
  }, [active, ready, candidateId, uploading]);

  // 🆕 ADDED: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setUploading(false);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
        minScreenshotWidth={SHOT_W}
        minScreenshotHeight={SHOT_H}
        width={1}
        height={1}
        videoConstraints={{ 
          width: SHOT_W, 
          height: SHOT_H, 
          facingMode: "user" 
        }}
        onUserMedia={() => {
          setReady(true);
          console.log("[SNAP] Camera ready - starting snapshot monitoring");
          toast.success("📸 Proctor monitoring active", { 
            id: "snap-active", 
            duration: 2000 
          });
        }}
        onUserMediaError={(e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[SNAP] Camera access error:", e);
          toast.error(`❌ Camera error: ${msg}`, { duration: 5000 });
          setReady(false);
        }}
        style={{
          position: "fixed",
          inset: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1, // 🆕 ADDED: Ensure it's behind everything
        }}
      />
      
    </>
  );
};

export default ProctorSnapshots;
