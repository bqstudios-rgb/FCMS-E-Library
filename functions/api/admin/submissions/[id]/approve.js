import { json, sameOrigin, getAdmin, logActivity } from "../../../../utils/auth.js";
import { STANDARD } from "../../../../utils/files.js";

export async function onRequestPost(ctx) {
  const { request, env, params } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const s = await env.DB.prepare("SELECT s.*, c.code AS ccode, c.title AS ctitle FROM submissions s JOIN courses c ON c.id = s.course_id WHERE s.id = ? AND s.status = 'pending'").bind(params.id).first();
  if (!s) return json({ error: "Not found or already reviewed." }, 404);
  if (s.size_bytes > STANDARD && !s.r2_compressed_key) return json({ error: "File is over 3 MB. Compress it before approving." }, 400);
  const mid = crypto.randomUUID();
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO materials (id, submission_id, course_id, contributor_name, title, type, size_bytes, r2_object_key, category) VALUES (?,?,?,?,?,?,?,?,?)")
        .bind(mid, s.id, s.course_id, s.contributor_name, s.title, s.type, s.r2_compressed_key ? (s.compressed_size_bytes || s.size_bytes) : s.size_bytes, s.r2_compressed_key || s.r2_original_key, s.category || "Notes"),
      env.DB.prepare("UPDATE submissions SET status = 'approved' WHERE id = ? AND status = 'pending'").bind(s.id),
      env.DB.prepare("INSERT INTO search_index (title, course_code, course_title, contributor_name, material_id) VALUES (?,?,?,?,?)")
        .bind(s.title, s.ccode, s.ctitle, s.contributor_name, mid),
    ]);
  } catch (e) {
    return json({ error: "Could not approve. It may already be approved." }, 409);
  }
  await logActivity(env, admin.id, "approve", "submission", s.id, s.ticket_number);
  return json({ ok: true });
}
