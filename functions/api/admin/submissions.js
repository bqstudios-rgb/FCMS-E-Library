import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const { results } = await ctx.env.DB.prepare(
    "SELECT s.id, s.ticket_number, s.title, s.category, s.type, s.contributor_name, s.description, s.size_bytes, s.compressed_size_bytes, s.duplicate_warning, s.created_at, c.code AS course_code FROM submissions s JOIN courses c ON c.id = s.course_id WHERE s.status = 'pending' ORDER BY s.created_at ASC LIMIT 50"
  ).all();
  return json({ items: results });
}
