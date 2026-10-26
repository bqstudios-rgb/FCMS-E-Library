import { hashPassword, sha256Hex } from "../../../utils/crypto.js";
import { json, sameOrigin, checkLock, recordFailure, verifyTurnstile, logActivity } from "../../../utils/auth.js";

const BAD = "This invitation is invalid or has expired.";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (await checkLock(env, ip, "accept")) return json({ error: "Too many attempts. Try again later." }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const token = String(body.token || "");
  if (!(await verifyTurnstile(env, body.turnstile, ip))) return json({ error: "Verification failed. Please try again." }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
  if (password.length < 12) return json({ error: "Password must be at least 12 characters" }, 400);

  const now = new Date().toISOString();
  const inv = await env.DB.prepare("SELECT id FROM invitations WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?")
    .bind(await sha256Hex(token), now).first();
  if (!inv) { await recordFailure(env, ip, "accept"); return json({ error: BAD }, 400); }

  const exists = await env.DB.prepare("SELECT id FROM admins WHERE email = ?").bind(email).first();
  if (exists) return json({ error: "That email is already registered." }, 400);

  const claim = await env.DB.prepare("UPDATE invitations SET used_at = ? WHERE id = ? AND used_at IS NULL").bind(now, inv.id).run();
  if (!claim.meta || claim.meta.changes !== 1) return json({ error: BAD }, 400);

  const { hash, salt } = await hashPassword(password);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO admins (id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'admin')")
      .bind(id, email, hash, salt).run();
  } catch (e) {
    await env.DB.prepare("UPDATE invitations SET used_at = NULL WHERE id = ?").bind(inv.id).run();
    return json({ error: "Could not create the account." }, 500);
  }
  await logActivity(env, id, "accept_invite", "admin", id, null);
  return json({ ok: true });
}
