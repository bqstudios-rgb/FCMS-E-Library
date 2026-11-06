import { json, getAdmin, sameOrigin, logActivity } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const db = ctx.env.DB;
  const [s, m] = await db.batch([
    db.prepare("SELECT id, type, suggested_name, suggested_code, level_id FROM course_tag_suggestions WHERE status = 'pending' ORDER BY rowid DESC LIMIT 50"),
    db.prepare("SELECT * FROM semesters"),
  ]);
  return json({ items: s.results, semesters: m.results });
}

export async function onRequestPost(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (!sameOrigin(ctx.request)) return json({ error: "Forbidden" }, 403);
  const db = ctx.env.DB;
  let b = {};
  try { b = await ctx.request.json(); } catch (e) {}
  const s = await db.prepare("SELECT * FROM course_tag_suggestions WHERE id = ? AND status = 'pending'").bind(String(b.id || "")).first();
  if (!s) return json({ error: "Not found or already reviewed." }, 404);
  const now = new Date().toISOString();
  if (b.action === "reject") {
    await db.prepare("UPDATE course_tag_suggestions SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?").bind(admin.id, now, s.id).run();
    await logActivity(ctx.env, admin.id, "reject_suggestion", "suggestion", s.id, s.suggested_name);
    return json({ ok: true });
  }
  if (b.action !== "approve") return json({ error: "Invalid action" }, 400);
  if (s.type === "course") {
    const code = String(b.code || s.suggested_code || "").trim().toUpperCase();
    if (code.length < 3 || code.length > 12) return json({ error: "Enter a course code (3 to 12 characters)." }, 400);
    const sem = await db.prepare("SELECT id FROM semesters WHERE id = ?").bind(String(b.semester_id || "")).first();
    if (!sem) return json({ error: "Choose a semester." }, 400);
    if (!s.level_id) return json({ error: "This suggestion has no level." }, 400);
    const ex = await db.prepare("SELECT id FROM courses WHERE code = ?").bind(code).first();
    if (ex) return json({ error: "That course code already exists." }, 409);
    await db.batch([
      db.prepare("INSERT INTO courses (id, code, title, level_id, semester_id, is_approved) VALUES (?, ?, ?, ?, ?, 1)").bind(crypto.randomUUID(), code, s.suggested_name, s.level_id, sem.id),
      db.prepare("UPDATE course_tag_suggestions SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?").bind(admin.id, now, s.id),
    ]);
  } else {
    await db.prepare("UPDATE course_tag_suggestions SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?").bind(admin.id, now, s.id).run();
  }
  await logActivity(ctx.env, admin.id, "approve_suggestion", "suggestion", s.id, s.suggested_name);
  return json({ ok: true });
}
