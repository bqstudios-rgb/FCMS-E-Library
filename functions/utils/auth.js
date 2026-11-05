import { sha256Hex } from "./crypto.js";

export const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

export function sameOrigin(request) {
  const o = request.headers.get("Origin");
  return !o || o === new URL(request.url).origin;
}

export function getCookie(request, name) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function getAdmin({ request, env }) {
  const token = getCookie(request, "fcms_session");
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT a.id, a.email, a.role, a.name FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.id = ? AND s.expires_at > ?"
  ).bind(await sha256Hex(token), new Date().toISOString()).first();
  return row || null;
}

export async function logActivity(env, adminId, action, targetType, targetId, details) {
  await env.DB.prepare("INSERT INTO activity_log (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), adminId, action, targetType, targetId, details || null).run();
}

export async function checkLock(env, ip, action) {
  const row = await env.DB.prepare("SELECT lockout_until FROM rate_limits WHERE ip_address = ? AND action = ?").bind(ip, action).first();
  return !!(row && row.lockout_until && row.lockout_until > new Date().toISOString());
}

export async function recordFailure(env, ip, action) {
  const row = await env.DB.prepare("SELECT attempts FROM rate_limits WHERE ip_address = ? AND action = ?").bind(ip, action).first();
  const attempts = (row ? row.attempts : 0) + 1;
  const lock = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
  await env.DB.prepare("INSERT INTO rate_limits (ip_address, action, attempts, lockout_until) VALUES (?, ?, ?, ?) ON CONFLICT(ip_address, action) DO UPDATE SET attempts = excluded.attempts, lockout_until = excluded.lockout_until")
    .bind(ip, action, lock ? 0 : attempts, lock).run();
}

export async function clearFailures(env, ip, action) {
  await env.DB.prepare("DELETE FROM rate_limits WHERE ip_address = ? AND action = ?").bind(ip, action).run();
}

export async function verifyTurnstile(env, token, ip, action) {
  if (!token || token.length > 2048 || !env.TURNSTILE_SECRET) return false;
  const allowed = (env.TURNSTILE_HOSTNAMES || "fcms-e-library.pages.dev")
    .split(",").map((h) => h.trim()).filter(Boolean);
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return false;
    const d = await r.json();
    if (d.success !== true) return false;
    if (!allowed.includes(d.hostname)) return false;
    if (action && d.action !== action) return false;
    return true;
  } catch (e) {
    return false;
  }
}
