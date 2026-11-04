export async function onRequest(context) {
  const url = new URL(context.request.url);
  const newPass = url.searchParams.get('pass');
  if (!newPass) return new Response("ERROR: Add ?pass=YourPassword to the URL");
  const { env } = context;
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(newPass), { name: "PBKDF2" }, false, ["deriveBits"]);
  const hashBuffer = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  try {
    await env.DB.prepare(`DELETE FROM admins`).run();
    await env.DB.prepare(
      `INSERT INTO admins (email, password_hash, password_salt) VALUES ('tbestbq59@gmail.com', ?, ?)`
    ).bind(hashHex, saltHex).run();
    return new Response("SUCCESS: Admin account wiped and recreated with your custom password.");
  } catch (e) {
    return new Response("ERROR: " + e.message);
  }
}
