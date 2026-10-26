import { reply } from "../../utils/pub.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const [levels, semesters, courses] = await env.DB.batch([
    env.DB.prepare("SELECT id, name FROM levels ORDER BY name"),
    env.DB.prepare("SELECT id, name FROM semesters ORDER BY id"),
    env.DB.prepare("SELECT c.id, c.code, c.title, c.level_id, c.semester_id, (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id) AS material_count, (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id AND m.category = 'Textbook') AS textbook_count FROM courses c WHERE c.is_approved = 1 ORDER BY c.code"),
  ]);
  const res = reply({ levels: levels.results, semesters: semesters.results, courses: courses.results });
  context.waitUntil(cache.put(request, res.clone()));
  return res;
}
