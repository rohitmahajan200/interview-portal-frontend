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
  assessmentId: string;
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
        throw new Error("Failed to process snapshot data");
  }
}

// 🆕 ADDED: Upload snapshot to your backend using FormData
const uploadSnapshotToBackend = async (file: File, assessmentId: string, candidateId?: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('snapshots', file); // Field name for the file
    
    // Add candidate ID if provided
    if (candidateId) {
      formData.append('candidateId', candidateId);
    }
    
    // Add timestamp for tracking
    formData.append('timestamp', Date.now().toString());
    formData.append('type', 'snapshots');
    formData.append('folder', 'snapshots');


        
    // 🆕 UPDATED: Use your API endpoint for snapshot upload
    console.log("assessid=>",assessmentId);
    
    const response = await api.post(`/candidates/snapshots/${assessmentId}`, formData);

    if (response.data?.success && response.data?.data?.url) {
      return response.data.data.url;
    } else if (response.data?.url) {
      return response.data.url;
    } else {
      throw new Error(response.data?.message || 'Upload failed - no URL returned');
    }
  } catch (error: any) {
        
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

const ProctorSnapshots: React.FC<Props> = ({ active, candidateId, assessmentId }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false); // 🆕 ADDED: Track upload state
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
        
    // 🆕 ADDED: Show initial status
    if (assessmentId) {
      console.log(assessmentId)
          }
  }, [active, candidateId, assessmentId]);

  useEffect(() => {
    if (!active || !ready) return;

    const tick = async () => {
      // 🆕 ADDED: Skip if already uploading to prevent overlap
      if (uploading) {
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
        const snapshotUrl = await uploadSnapshotToBackend(file, assessmentId);
        
        // Store the snapshot URL in local storage/store
        await addSnapshotUrl(snapshotUrl);
        

      } catch (err: unknown) {
                
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`❌ Snapshot error: ${msg}`, { 
          id: toastId, 
          duration: 4000 
        });
        console.log(assessmentId)
        // 🆕 ADDED: Could implement retry logic here
                
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
  }, [active, ready, candidateId, uploading, assessmentId]);

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
                    toast.success("📸 Proctor monitoring active", { 
            id: "snap-active", 
            duration: 2000 
          });
        }}
        onUserMediaError={(e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
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
