function cfg(env) {
  return {
    ep: (env.APPWRITE_ENDPOINT || "").replace(/\/+$/, ""),
    project: env.APPWRITE_PROJECT,
    bucket: env.APPWRITE_BUCKET,
    key: env.APPWRITE_KEY,
  };
}

export function storageReady(env) {
  const c = cfg(env);
  return !!(c.ep && c.project && c.bucket && c.key);
}

function fid(key) {
  let id = String(key).replace(/[^A-Za-z0-9._-]/g, "_");
  id = id.replace(/^[^A-Za-z0-9]+/, "x");
  return id.slice(-36).replace(/^[^A-Za-z0-9]+/, "x");
}

function hdr(c) {
  return { "X-Appwrite-Project": c.project, "X-Appwrite-Key": c.key };
}

export async function putFile(env, key, bytes, mime) {
  const c = cfg(env);
  const id = fid(key);
  const form = new FormData();
  form.append("fileId", id);
  form.append(
    "file",
    new File([bytes], id, { type: mime || "application/octet-stream" })
  );
  const r = await fetch(c.ep + "/storage/buckets/" + c.bucket + "/files", {
    method: "POST", headers: hdr(c), body: form,
  });
  if (!r.ok) throw new Error("storage put failed " + r.status);
  return key;
}

export async function getFile(env, key) {
  const c = cfg(env);
  const r = await fetch(
    c.ep + "/storage/buckets/" + c.bucket + "/files/" + fid(key) + "/download",
    { headers: hdr(c) }
  );
  return r.ok ? r : null;
}

export async function deleteFile(env, key) {
  const c = cfg(env);
  const r = await fetch(
    c.ep + "/storage/buckets/" + c.bucket + "/files/" + fid(key),
    { method: "DELETE", headers: hdr(c) }
  );
  return r.ok || r.status === 404;
}
