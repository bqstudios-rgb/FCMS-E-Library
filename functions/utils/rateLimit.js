export async function checkSearchRateLimit(env, ip) {
    const now = Math.floor(Date.now() / 1000);
    const window = 60;
    const maxAttempts = 30;

    const record = await env.DB.prepare(
        "SELECT attempts, lockout_until, strftime('%s', created_at) as created_ts FROM rate_limits WHERE ip_address = ? AND action = 'search'"
    ).bind(ip).first();

    if (record) {
        if (record.lockout_until && record.lockout_until > now) return false;
        const age = now - parseInt(record.created_ts || now);
        if (age > window) {
            await env.DB.prepare(
                "UPDATE rate_limits SET attempts = 1, lockout_until = NULL, created_at = CURRENT_TIMESTAMP WHERE ip_address = ? AND action = 'search'"
            ).bind(ip).run();
            return true;
        }
        if (record.attempts >= maxAttempts) {
            await env.DB.prepare(
                "UPDATE rate_limits SET lockout_until = ? WHERE ip_address = ? AND action = 'search'"
            ).bind(now + window, ip).run();
            return false;
        }
        await env.DB.prepare(
            "UPDATE rate_limits SET attempts = attempts + 1 WHERE ip_address = ? AND action = 'search'"
        ).bind(ip).run();
        return true;
    }
    await env.DB.prepare(
        "INSERT INTO rate_limits (ip_address, action, attempts, created_at) VALUES (?, 'search', 1, CURRENT_TIMESTAMP)"
    ).bind(ip).run();
    return true;
}
