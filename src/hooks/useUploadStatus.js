import { useEffect, useRef, useState } from "react";
import axiosInstance from "../services/axiosInstance";

/**
 * Polls /api/v1/upload-status/:type/:id every `intervalMs` while the linked
 * resource has imageStatus === "pending". Stops as soon as the status flips
 * to "done" or "failed". Returns the live image payload so callers can swap
 * their optimistic local preview for the real Cloudinary URL.
 *
 * @param {"manufacturer"|"blog"|"car"} type
 * @param {string|null} id   Pass null to disable
 * @param {object} opts
 * @param {boolean} opts.enabled  Default true. Set false to disable polling.
 * @param {number}  opts.intervalMs  Default 2500.
 * @param {(payload) => void} opts.onDone  Called when imageStatus flips to "done".
 * @param {(payload) => void} opts.onFailed  Called when imageStatus flips to "failed".
 */
export default function useUploadStatus(type, id, opts = {}) {
  const { enabled = true, intervalMs = 2500, onDone, onFailed } = opts;
  const [status, setStatus] = useState("idle"); // idle | pending | done | failed
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const onDoneRef = useRef(onDone);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onDoneRef.current = onDone;
    onFailedRef.current = onFailed;
  }, [onDone, onFailed]);

  useEffect(() => {
    if (!enabled || !id || !type) return;
    let cancelled = false;
    let timer;

    const tick = async () => {
      try {
        const { data: res } = await axiosInstance.get(`/api/v1/upload-status/${type}/${id}`);
        if (cancelled) return;
        setData(res);
        setError(null);
        if (res.imageStatus === "done") {
          setStatus("done");
          onDoneRef.current?.(res);
          return;
        }
        if (res.imageStatus === "failed") {
          setStatus("failed");
          onFailedRef.current?.(res);
          return;
        }
        setStatus("pending");
        timer = setTimeout(tick, intervalMs);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to check status");
        timer = setTimeout(tick, intervalMs * 2);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [type, id, enabled, intervalMs]);

  return { status, data, error };
}
