import { json, getAdmin, sameOrigin, logActivity } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const db = ctx.env.DB;
  const [l, c, s] = await db.batch([
    db.prepare("SELECT id, name FROM levels ORDER BY CAST(name AS INTEGER), name"),
    db.prepare("SELECT c.id, c.code, c.title, c.level_id, c.semester_id, c.is_approved, (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id) AS materials FROM courses c ORDER BY c.code"),
    db.prepare("SELECT id, name FROM semesters ORDER BY id"),
  ]);
  return json({ levels: l.results, courses: c.results, semesters: s.results });
}

export async function onRequestPost(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (!sameOrigin(ctx.request)) return json({ error: "Forbidden" }, 403);
  const db = ctx.env.DB;
  let b = {};
  try { b = await ctx.request.json(); } catch (e) {}
  const id = String(b.id || "");

  if (b.action === "add_level") {
    const name = String(b.name || "").trim();
    if (!/^[0-9]{3}$/.test(name)) return json({ error: "Enter the level as three digits, for example 500." }, 400);
    if (await db.prepare("SELECT id FROM levels WHERE name = ?").bind(name).first()) return json({ error: "That level already exists." }, 409);
    const lid = "lvl_" + name;
    await db.prepare("INSERT INTO levels (id, name) VALUES (?, ?)").bind(lid, name).run();
    await logActivity(ctx.env, admin.id, "add_level", "level", lid, name + " level");
    return json({ ok: true, id: lid }, 201);
  }

  if (b.action === "delete_level") {
    const lv = await db.prepare("SELECT id, name FROM levels WHERE id = ?").bind(id).first();
    if (!lv) return json({ error: "Level not found." }, 404);
    const n = await db.prepare("SELECT COUNT(*) AS n FROM courses WHERE level_id = ?").bind(id).first();
    if (n.n > 0) return json({ error: "This level still has courses. Remove or move them first." }, 409);
    await db.prepare("DELETE FROM levels WHERE id = ?").bind(id).run();
    await logActivity(ctx.env, admin.id, "delete_level", "level", id, lv.name + " level");
    return json({ ok: true });
  }

  if (b.action === "add_course" || b.action === "edit_course") {
    const code = String(b.code || "").trim().toUpperCase().replace(/\s+/g, " ");
    const title = String(b.title || "").trim();
    if (code.length < 3 || code.length > 12) return json({ error: "Course code must be 3 to 12 characters." }, 400);
    if (title.length < 3 || title.length > 120) return json({ error: "Course title must be 3 to 120 characters." }, 400);
    const sem = await db.prepare("SELECT id FROM semesters WHERE id = ?").bind(String(b.semester_id || "")).first();
    if (!sem) return json({ error: "Choose a semester." }, 400);
    if (b.action === "add_course") {
      const lv = await db.prepare("SELECT id, name FROM levels WHERE id = ?").bind(String(b.level_id || "")).first();
      if (!lv) return json({ error: "Choose a level." }, 400);
      if (await db.prepare("SELECT id FROM courses WHERE code = ?").bind(code).first()) return json({ error: "That course code already exists." }, 409);
      const cid = crypto.randomUUID();
      await db.prepare("INSERT INTO courses (id, code, title, level_id, semester_id, is_approved) VALUES (?, ?, ?, ?, ?, 1)").bind(cid, code, title, lv.id, sem.id).run();
      await logActivity(ctx.env, admin.id, "add_course", "course", cid, code + " (" + lv.name + " level)");
      return json({ ok: true, id: cid }, 201);
    }
    const cur = await db.prepare("SELECT id, code FROM courses WHERE id = ?").bind(id).first();
    if (!cur) return json({ error: "Course not found." }, 404);
    if (await db.prepare("SELECT id FROM courses WHERE code = ? AND id != ?").bind(code, id).first()) return json({ error: "That course code already exists." }, 409);
    await db.prepare("UPDATE courses SET code = ?, title = ?, semester_id = ?, is_approved = 1 WHERE id = ?").bind(code, title, sem.id, id).run();
    await logActivity(ctx.env, admin.id, "edit_course", "course", id, code);
    return json({ ok: true });
  }

  if (b.action === "delete_course") {
    const c = await db.prepare("SELECT id, code FROM courses WHERE id = ?").bind(id).first();
    if (!c) return json({ error: "Course not found." }, 404);
    const m = await db.prepare("SELECT (SELECT COUNT(*) FROM materials WHERE course_id = ?1) + (SELECT COUNT(*) FROM submissions WHERE course_id = ?1) AS n").bind(id).first();
    if (m.n > 0) return json({ error: "This course has uploaded materials or submissions, so it cannot be deleted." }, 409);
    await db.prepare("DELETE FROM courses WHERE id = ?").bind(id).run();
    await logActivity(ctx.env, admin.id, "delete_course", "course", id, c.code);
    return json({ ok: true });
  }

  return json({ error: "Invalid action" }, 400);
}
