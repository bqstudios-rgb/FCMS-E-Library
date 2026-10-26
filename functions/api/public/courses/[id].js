import { CATS, reply } from "../../../utils/pub.js";

export async function onRequestGet({ request, env, params }) {
  const id = String(params.id || "").slice(0, 60);
  const course = await env.DB.prepare("SELECT id, code, title, level_id, semester_id FROM courses WHERE id = ? AND is_approved = 1").bind(id).first();
  if (!course) return reply({ error: "Course not found" }, 404, "no-store");
  const url = new URL(request.url);
  const cat = url.searchParams.get("category");
  const page = Math.min(1000, Math.max(1, parseInt(url.searchParams.get("page"), 10) || 1));
  const useCat = CATS.includes(cat);
  const where = useCat ? " AND category = ?" : "";
  const args = useCat ? [id, cat] : [id];
  const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM materials WHERE course_id = ?" + where).bind(...args).first();
  const rows = await env.DB.prepare("SELECT id, title, type, size_bytes, published_at, category, contributor_name FROM materials WHERE course_id = ?" + where + " ORDER BY published_at DESC LIMIT 30 OFFSET ?").bind(...args, (page - 1) * 30).all();
  return reply({ course, materials: rows.results, total: total.n, page, pageSize: 30 }, 200, "public, max-age=10");
}
