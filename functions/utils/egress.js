export async function addEgress(env, bytes) {
  if (!bytes) return;
  try {
    await env.DB.prepare("INSERT INTO egress_log (date, bytes) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET bytes = bytes + excluded.bytes")
      .bind(new Date().toISOString().slice(0, 10), bytes).run();
  } catch (e) {}
}
