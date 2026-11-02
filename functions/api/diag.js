export async function onRequestGet({ env }) {
  const names = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT_URL_S3", "AWS_REGION", "DBRIJ_BUCKET", "TURNSTILE_SECRET"];
  const out = {};
  for (const n of names) out[n] = !!env[n];
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" } });
}
