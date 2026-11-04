import { hashPassword } from "../utils/crypto.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const newPass = url.searchParams.get('pass');
  if (!newPass) return new Response("ERROR: Add ?pass=YourPassword to the URL");
  
  const { env } = context;
  try {
    const { hash, salt } = await hashPassword(newPass);
    await env.DB.prepare(`UPDATE admins SET password_hash = ?, password_salt = ?`).bind(hash, salt).run();
    try { await env.DB.prepare(`UPDATE admins SET locked_until = NULL, failed_attempts = 0`).run(); } catch(e){}
    try { await env.DB.prepare(`DELETE FROM login_attempts`).run(); } catch(e){}
    try { await env.DB.prepare(`DELETE FROM rate_limits`).run(); } catch(e){}
    
    return new Response("SUCCESS: Hash matched. Password updated perfectly.");
  } catch (e) {
    return new Response("ERROR: " + e.message);
  }
}
