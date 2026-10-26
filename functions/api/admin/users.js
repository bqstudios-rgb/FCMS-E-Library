import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin || admin.role !== "owner") return json({ error: "Owner only" }, 403);
  const rows = await ctx.env.DB.prepare("SELECT id, email, role, created_at FROM admins WHERE email NOT LIKE 'removed:%' ORDER BY created_at").all();
  return json({ users: rows.results });
}
