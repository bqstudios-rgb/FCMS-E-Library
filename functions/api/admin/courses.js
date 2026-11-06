import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const r = await ctx.env.DB.prepare("SELECT id, code, title FROM courses WHERE is_approved = 1 ORDER BY code").all();
  return json({ courses: r.results });
}
