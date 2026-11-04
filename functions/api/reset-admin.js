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
    const { results } = await env.DB.prepare(`SELECT email FROM admins`).all();
    if (results.length === 0) {
      await env.DB.prepare(`INSERT INTO admins (email, password_hash, password_salt) VALUES ('tbestbq59@gmail.com', ?, ?)`).bind(hashHex, saltHex).run();
      return new Response("SUCCESS: Created tbestbq59@gmail.com with your custom password.");
    }
    await env.DB.prepare(`UPDATE admins SET password_hash = ?, password_salt = ?`).bind(hashHex, saltHex).run();
    const emails = results.map(r => r.email).join(', ');
    return new Response("SUCCESS: Password updated! Log in using this exact email: " + emails);
  } catch (e) {
    return new Response("ERROR: " + e.message);
  }
}
