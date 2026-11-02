import * as A from "./appwrite.js";
import { s3 } from "./s3.js";

const dOn = (e) =>
  !!(e.AWS_ENDPOINT_URL_S3 && e.DBRIJ_BUCKET &&
     e.AWS_ACCESS_KEY_ID && e.AWS_SECRET_ACCESS_KEY);

export function storageReady(env) {
  return dOn(env);
}

// Returns the prefixed key. Store THIS value in the database.
export async function putFile(env, key, bytes, mime, levelId) {
  const low = levelId === "lvl_100" || levelId === "lvl_200";
  if (low || !A.storageReady(env)) {
    const r = await s3(env, "PUT", key, bytes, mime);
    if (!r.ok) throw new Error("dbrij put failed " + r.status);
    return "d:" + key;
  }
  await A.putFile(env, key, bytes, mime);
  return "a:" + key;
}

export async function getFile(env, stored) {
  if (stored.startsWith("d:")) {
    const r = await s3(env, "GET", stored.slice(2));
    return r.ok ? r : null;
  }
  return A.getFile(env, stored.replace(/^a:/, ""));
}

export async function deleteFile(env, stored) {
  if (stored.startsWith("d:")) {
    const r = await s3(env, "DELETE", stored.slice(2));
    return r.ok || r.status === 404;
  }
  return A.deleteFile(env, stored.replace(/^a:/, ""));
}
