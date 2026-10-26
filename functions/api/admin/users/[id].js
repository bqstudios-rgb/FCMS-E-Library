import { json, sameOrigin, getAdmin, logActivity } from "../../../utils/auth.js";

export async function onRequestDelete(ctx) {
  const { request, env, params } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  if (!admin || admin.role !== "owner") return json({ error: "Owner only" }, 403);
  const id = params.id;
  if (id === admin.id) return json({ error: "You cannot remove yourself." }, 400);
  const target = await env.DB.prepare("SELECT id, role FROM admins WHERE id = ? AND email NOT LIKE 'removed:%'").bind(id).first();
  if (!target) return json({ error: "Not found" }, 404);
  if (target.role === "owner") return json({ error: "The owner cannot be removed." }, 400);
  await env.DB.prepare("DELETE FROM sessions WHERE admin_id = ?").bind(id).run();
  await env.DB.prepare("UPDATE submissions SET lock_admin_id = NULL, lock_expires_at = NULL WHERE lock_admin_id = ?").bind(id).run();
  await env.DB.prepare("UPDATE admins SET email = ?, password_hash = '!', password_salt = '!' WHERE id = ?").bind("removed:" + id, id).run();
  await logActivity(env, admin.id, "remove_admin", "admin", id, null);
  return json({ ok: true });
}
