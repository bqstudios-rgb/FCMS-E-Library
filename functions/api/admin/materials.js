import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const q = new URL(ctx.request.url).searchParams.get("q") || "";
  const like = "%" + q.replace(/[%_]/g, "").slice(0, 60) + "%";
  const r = await ctx.env.DB.prepare(
    "SELECT m.id, m.title, m.type, m.category, m.size_bytes, m.is_pinned, m.published_at, m.contributor_name, c.code AS course_code FROM materials m LEFT JOIN courses c ON c.id = m.course_id WHERE m.title LIKE ? OR c.code LIKE ? OR m.contributor_name LIKE ? ORDER BY m.published_at DESC LIMIT 60"
  ).bind(like, like, like).all();
  return json({ materials: r.results });
}
