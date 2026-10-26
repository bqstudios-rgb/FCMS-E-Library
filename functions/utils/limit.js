export async function hit(env, ip, action, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const r = await env.DB.prepare("SELECT attempts, strftime('%s', created_at) AS ts FROM rate_limits WHERE ip_address = ? AND action = ?").bind(ip, action).first();
  if (!r || now - parseInt(r.ts, 10) > windowSec) {
    await env.DB.prepare("INSERT INTO rate_limits (ip_address, action, attempts, created_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(ip_address, action) DO UPDATE SET attempts = 1, lockout_until = NULL, created_at = CURRENT_TIMESTAMP").bind(ip, action).run();
    return true;
  }
  if (r.attempts >= max) return false;
  await env.DB.prepare("UPDATE rate_limits SET attempts = attempts + 1 WHERE ip_address = ? AND action = ?").bind(ip, action).run();
  return true;
}
