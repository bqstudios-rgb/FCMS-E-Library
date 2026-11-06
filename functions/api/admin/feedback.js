import { json, getAdmin, sameOrigin, logActivity } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const r = await ctx.env.DB.prepare(
    "SELECT id, CASE WHEN is_anonymous = 1 THEN NULL ELSE name END AS name, text, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 100"
  ).all();
  return json({ items: r.results });
}

export async function onRequestPost(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (!sameOrigin(ctx.request)) return json({ error: "Bad request origin" }, 403);
  let b = {};
  try { b = await ctx.request.json(); } catch (e) {}
  const id = Number(b.id);
  if (!Number.isInteger(id)) return json({ error: "Invalid id" }, 400);
  if (b.action === "read") {
    await ctx.env.DB.prepare("UPDATE feedback SET status = 'read' WHERE id = ?").bind(id).run();
  } else if (b.action === "delete") {
    await ctx.env.DB.prepare("DELETE FROM feedback WHERE id = ?").bind(id).run();
    await logActivity(ctx.env, admin.id, "delete_feedback", "feedback", String(id), "");
  } else {
    return json({ error: "Invalid action" }, 400);
  }
  return json({ ok: true });
}
