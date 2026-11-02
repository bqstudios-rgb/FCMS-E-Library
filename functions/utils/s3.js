const enc = new TextEncoder();
const hex = (b) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (d) => hex(await crypto.subtle.digest("SHA-256", d));
async function hmac(k, d) {
  const key = await crypto.subtle.importKey(
    "raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(d)));
}

export async function s3(env, method, key, body, mime) {
  const ep = env.AWS_ENDPOINT_URL_S3.replace(/\/+$/, "");
  const host = new URL(ep).host;
  const region = env.AWS_REGION || "us-east-1";
  const path =
    "/" + env.DBRIJ_BUCKET + "/" +
    key.split("/").map(encodeURIComponent).join("/");
  const data = body ? new Uint8Array(body) : new Uint8Array();
  const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = now.slice(0, 8);
  const ph = await sha(data);
  const h = { host, "x-amz-content-sha256": ph, "x-amz-date": now };
  if (mime) h["content-type"] = mime;
  const names = Object.keys(h).sort();
  const signed = names.join(";");
  const canon = [
    method, path, "",
    names.map((n) => n + ":" + h[n] + "\n").join(""),
    signed, ph,
  ].join("\n");
  const scope = day + "/" + region + "/s3/aws4_request";
  const sts = [
    "AWS4-HMAC-SHA256", now, scope, await sha(enc.encode(canon)),
  ].join("\n");
  let k = await hmac(enc.encode("AWS4" + env.AWS_SECRET_ACCESS_KEY), day);
  k = await hmac(k, region);
  k = await hmac(k, "s3");
  k = await hmac(k, "aws4_request");
  const sig = hex(await hmac(k, sts));
  const headers = { ...h };
  delete headers.host;
  headers.authorization =
    "AWS4-HMAC-SHA256 Credential=" + env.AWS_ACCESS_KEY_ID + "/" + scope +
    ", SignedHeaders=" + signed + ", Signature=" + sig;
  return fetch(ep + path, {
    method,
    headers,
    body: method === "PUT" ? data : undefined,
  });
}
