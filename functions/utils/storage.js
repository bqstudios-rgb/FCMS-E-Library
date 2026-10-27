let cached = { token: null, exp: 0 };

export const storageReady = (env) => !!(env.DROPBOX_APP_KEY && env.DROPBOX_APP_SECRET && env.DROPBOX_REFRESH_TOKEN);

async function token(env) {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const r = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(env.DROPBOX_APP_KEY + ":" + env.DROPBOX_APP_SECRET), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: env.DROPBOX_REFRESH_TOKEN }),
  });
  if (!r.ok) throw new Error("storage auth failed");
  const d = await r.json();
  cached = { token: d.access_token, exp: Date.now() + (d.expires_in - 120) * 1000 };
  return cached.token;
}

export async function putFile(env, key, buf) {
  const r = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: { Authorization: "Bearer " + (await token(env)), "Content-Type": "application/octet-stream", "Dropbox-API-Arg": JSON.stringify({ path: "/" + key, mode: "overwrite", mute: true }) },
    body: buf,
  });
  if (!r.ok) throw new Error("storage put failed");
}

export async function getFile(env, key) {
  const r = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: { Authorization: "Bearer " + (await token(env)), "Dropbox-API-Arg": JSON.stringify({ path: "/" + key }) },
  });
  if (!r.ok) throw new Error("storage get failed");
  return r;
}

export async function deleteFile(env, key) {
  await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
    method: "POST",
    headers: { Authorization: "Bearer " + (await token(env)), "Content-Type": "application/json" },
    body: JSON.stringify({ path: "/" + key }),
  });
}
