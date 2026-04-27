import axios from "axios";
import axiosInstance from "./axiosInstance";

// Short-lived signature cache to avoid hitting our backend for every file
// in a multi-file upload. Cloudinary signatures are valid for ~1 hour by
// default; we expire ours conservatively after 30 minutes.
let cached = null;
const TTL_MS = 30 * 60 * 1000;

async function getSignature() {
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.payload;
  const { data } = await axiosInstance.get("/api/v1/cloudinary-signature");
  cached = { payload: data, fetchedAt: Date.now() };
  return data;
}

/**
 * Upload a single File to Cloudinary directly from the browser using a
 * signed upload. Returns the saved asset shape `{ path, filename }` that
 * the rest of the codebase already uses on Manufacturer/Blog/Car records.
 *
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]  Called with 0-100 as upload progresses.
 * @returns {Promise<{ path: string, filename: string }>}
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error("No file provided");

  const sig = await getSignature();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);

  try {
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      fd,
      {
        onUploadProgress: (e) => {
          if (!onProgress || !e.total) return;
          onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    );
    return { path: data.secure_url, filename: data.public_id };
  } catch (err) {
    // Bust the cache so the next call fetches a fresh signature
    cached = null;
    throw err;
  }
}

/**
 * Upload many files in parallel, surfacing per-file progress.
 *
 * @param {File[]} files
 * @param {(index: number, percent: number) => void} [onItemProgress]
 * @returns {Promise<Array<{ path, filename } | { error: string }>>}
 *   Same length as `files`. Failed entries get `{ error }` so the caller
 *   can decide whether to abort or partially proceed.
 */
export async function uploadManyToCloudinary(files, onItemProgress) {
  return Promise.all(
    Array.from(files).map((file, idx) =>
      uploadToCloudinary(file, (p) => onItemProgress?.(idx, p)).catch((err) => ({
        error: err?.response?.data?.error?.message || err?.message || "Upload failed",
      }))
    )
  );
}
