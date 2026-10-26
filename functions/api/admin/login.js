import { verifyPassword, randomToken, sha256Hex } from "../../utils/crypto.js";
import { json, sameOrigin, checkLock, recordFailure, clearFailures, verifyTurnstile, logActivity } from "../../utils/auth.js";

const DUMMY_SALT = "MDEyMzQ1Njc4OWFiY2RlZg==";
const DUMMY_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const SESSION_SECONDS = 12 * 60 * 60;

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (await checkLock(env, ip, "login")) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!(await verifyTurnstile(env, body.turnstile, ip))) return json({ error: "Verification failed. Please try again." }, 400);

  const admin = await env.DB.prepare("SELECT id, password_hash, password_salt FROM admins WHERE email = ?").bind(email).first();
  const ok = admin
    ? await verifyPassword(password, admin.password_hash, admin.password_salt)
    : (await verifyPassword(password, DUMMY_HASH, DUMMY_SALT), false);

  if (!ok) {
    await recordFailure(env, ip, "login");
    return json({ error: "Incorrect email or password." }, 401);
  }

  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id, admin_id, expires_at, user_agent) VALUES (?, ?, ?, ?)")
    .bind(await sha256Hex(token), admin.id, expires, (request.headers.get("User-Agent") || "").slice(0, 200)).run();
  await clearFailures(env, ip, "login");
  await logActivity(env, admin.id, "login", "admin", admin.id, null);

  return json({ ok: true }, 200, {
    "Set-Cookie": `fcms_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`,
  });
}
