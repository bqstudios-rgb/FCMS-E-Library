import { COLS, reply } from "../../utils/pub.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const base = `SELECT ${COLS} FROM materials m JOIN courses c ON m.course_id = c.id`;
  const [recent, picks, top, people] = await env.DB.batch([
    env.DB.prepare(`${base} WHERE c.is_approved = 1 ORDER BY m.published_at DESC LIMIT 8`),
    env.DB.prepare(`${base} WHERE c.is_approved = 1 AND m.is_pinned = 1 ORDER BY m.published_at DESC LIMIT 8`),
    env.DB.prepare(`SELECT ${COLS}, SUM(d.count) AS total_dl FROM materials m JOIN courses c ON m.course_id = c.id JOIN download_counts d ON d.material_id = m.id WHERE c.is_approved = 1 GROUP BY m.id HAVING total_dl > 0 ORDER BY total_dl DESC LIMIT 8`),
    env.DB.prepare("SELECT contributor_name FROM materials GROUP BY contributor_name ORDER BY MAX(published_at) DESC LIMIT 8"),
  ]);
  const res = reply({
    recent: recent.results,
    topPicks: picks.results,
    topRead: top.results,
    latestContributors: people.results.map((r) => r.contributor_name),
  });
  context.waitUntil(cache.put(request, res.clone()));
  return res;
}
