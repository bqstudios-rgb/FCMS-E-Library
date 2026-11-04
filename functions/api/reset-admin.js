export async function onRequest(context) {
  const { env } = context;
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode("Admin@1234"), { name: "PBKDF2" }, false, ["deriveBits"]);
  const hashBuffer = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  await env.DB.prepare(
    `UPDATE admins SET password_hash = ?, password_salt = ? WHERE email = 'tbestbq59@gmail.com'`
  ).bind(hashHex, saltHex).run();
  
  return new Response("Password reset to: Admin@1234");
}
