import { json, sameOrigin } from "../../utils/auth.js";
import { hit } from "../../utils/limit.js";
import { LEVELS } from "../../utils/pub.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!(await hit(env, ip, "suggest", 3, 3600))) return json({ error: "Too many suggestions. Try again later." }, 429);
  let b = {};
  try { b = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400); }
  if (b.website) return json({ ok: true });
  const name = String(b.name || "").trim();
  const code = String(b.code || "").trim().toUpperCase();
  const level = LEVELS[String(b.level || "")];
  if (name.length < 3 || name.length > 80) return json({ error: "Enter the course title (3 to 80 characters)." }, 400);
  if (code.length > 12) return json({ error: "The course code is too long." }, 400);
  if (!level) return json({ error: "Choose a level." }, 400);
  if (code) {
    const ex = await env.DB.prepare("SELECT id FROM courses WHERE code = ?").bind(code).first();
    if (ex) return json({ error: "That course code is already in the library." }, 409);
  }
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM course_tag_suggestions WHERE status = 'pending'").first();
  if (n && n.n >= 200) return json({ error: "Suggestions are full right now. Try again later." }, 503);
  await env.DB.prepare("INSERT INTO course_tag_suggestions (id, type, suggested_name, suggested_code, level_id, semester_id, status) VALUES (?, 'course', ?, ?, ?, NULL, 'pending')")
    .bind(crypto.randomUUID(), name, code || null, level).run();
  return json({ ok: true }, 201);
}
