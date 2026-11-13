import { verifyPassword, randomToken, sha256Hex } from "../../utils/crypto.js";
import { json, sameOrigin, checkLock, recordLoginFailure, clearFailures, verifyTurnstile, logActivity } from "../../utils/auth.js";
import { notifyTelegram } from "../../utils/telegram.js";

const DUMMY_SALT = "MDEyMzQ1Njc4OWFiY2RlZg==";
const DUMMY_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const SESSION_SECONDS = 12 * 60 * 60;

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (await checkLock(env, ip, "login")) {
    return json({ error: "Too many failed attempts. Try again in 15 minutes." }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const attemptsRow = await env.DB.prepare(
    "SELECT CASE WHEN lockout_until IS NOT NULL AND lockout_until <= ? THEN 0 ELSE attempts END AS attempts FROM rate_limits WHERE ip_address = ? AND action = 'login'"
  ).bind(new Date().toISOString(), ip).first();

  if ((attemptsRow?.attempts || 0) >= 2) {
    if (!(await verifyTurnstile(env, body.turnstile, ip))) {
      return json({
        error: body.turnstile
          ? "Verification failed. Please try again."
          : "Additional security verification required.",
        requiresTurnstile: true
      }, 403);
    }
  }

  const admin = await env.DB.prepare(
    "SELECT id, password_hash, password_salt FROM admins WHERE email = ?"
  ).bind(email).first();

  const ok = admin
    ? await verifyPassword(password, admin.password_hash, admin.password_salt)
    : (await verifyPassword(password, DUMMY_HASH, DUMMY_SALT), false);

  if (!ok) {
    const current = await recordLoginFailure(env, ip);

    if (current?.lockout_until) {
      await notifyTelegram(
        env,
        "🚨 SECURITY ALERT\n\n🔒 Admin login locked for 15 minutes.\n🌐 Source IP: " + ip + "\n⛔ Failed attempts: 3\n🕒 " + new Date().toISOString()
      );

      return json({
        error: "Too many failed attempts. Login locked for 15 minutes."
      }, 429);
    }

    const remaining = 3 - (current?.attempts || 0);

    if (remaining === 1) {
      await notifyTelegram(
        env,
        "⚠️ SECURITY WARNING\n\n🔐 Admin login reached 2 failed attempts.\n🛡️ Turnstile verification is now required.\n🌐 Source IP: " + ip + "\n🕒 " + new Date().toISOString()
      );
    }

    return json({
      error: "Incorrect email or password. " + remaining + " attempt" + (remaining === 1 ? "" : "s") + " remaining.",
      attemptsRemaining: remaining,
      requiresTurnstile: remaining === 1
    }, 401);
  }

  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions (id, admin_id, expires_at, user_agent) VALUES (?, ?, ?, ?)"
  ).bind(
    await sha256Hex(token),
    admin.id,
    expires,
    (request.headers.get("User-Agent") || "").slice(0, 200)
  ).run();

  await clearFailures(env, ip, "login");
  await logActivity(env, admin.id, "login", "admin", admin.id, null);

  return json({ ok: true }, 200, {
    "Set-Cookie": `fcms_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`,
  });
}
