import { json, sameOrigin, getAdmin, logActivity } from "../../../../utils/auth.js";

export async function onRequestPost(ctx) {
  const { request, env, params } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  const reason = String(b.reason || "").trim();
  if (reason.length < 3 || reason.length > 300) return json({ error: "Enter a reason (3 to 300 characters)." }, 400);
  const r = await env.DB.prepare("UPDATE submissions SET status = 'rejected', rejection_reason = ? WHERE id = ? AND status = 'pending'").bind(reason, params.id).run();
  if (!r.meta.changes) return json({ error: "Not found or already reviewed." }, 404);
  await logActivity(env, admin.id, "reject", "submission", params.id, reason);
  return json({ ok: true });
}
