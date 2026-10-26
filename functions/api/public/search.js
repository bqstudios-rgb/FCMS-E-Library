import { COLS, CATS, LEVELS, reply } from "../../utils/pub.js";
import { checkSearchRateLimit } from "../../utils/rateLimit.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return reply({ results: [], courses: [] }, 200, "no-store");
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (!(await checkSearchRateLimit(env, ip))) {
    return reply({ error: "Too many search requests. Please wait 60 seconds." }, 429, "no-store", { "Retry-After": "60" });
  }
  const lvl = LEVELS[url.searchParams.get("level")];
  const cat = CATS.includes(url.searchParams.get("category")) ? url.searchParams.get("category") : null;
  let extra = "";
  const ep = [];
  if (lvl) { extra += " AND c.level_id = ?"; ep.push(lvl); }
  if (cat) { extra += " AND m.category = ?"; ep.push(cat); }

  const terms = q.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 6);
  let results = null;
  if (terms.length) {
    try {
      const n = await env.DB.prepare("SELECT COUNT(*) AS c FROM search_index").first();
      if (n.c > 0) {
        const match = terms.map((t) => '"' + t + '"*').join(" ");
        const r = await env.DB.prepare(`SELECT ${COLS} FROM search_index JOIN materials m ON search_index.material_id = m.id JOIN courses c ON m.course_id = c.id WHERE search_index MATCH ? AND c.is_approved = 1${extra} ORDER BY rank LIMIT 20`).bind(match, ...ep).all();
        results = r.results;
      }
    } catch (e) { results = null; }
  }
  const like = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
  if (results === null) {
    const r = await env.DB.prepare(`SELECT ${COLS} FROM materials m JOIN courses c ON m.course_id = c.id WHERE c.is_approved = 1 AND (m.title LIKE ? ESCAPE '\\' OR c.code LIKE ? ESCAPE '\\' OR c.title LIKE ? ESCAPE '\\' OR m.contributor_name LIKE ? ESCAPE '\\')${extra} ORDER BY m.published_at DESC LIMIT 20`).bind(like, like, like, like, ...ep).all();
    results = r.results;
  }
  const cl = lvl ? " AND level_id = ?" : "";
  const cr = await env.DB.prepare(`SELECT id, code, title, level_id, semester_id FROM courses WHERE is_approved = 1 AND (code LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\')${cl} ORDER BY code LIMIT 10`).bind(like, like, ...(lvl ? [lvl] : [])).all();
  return reply({ results, courses: cr.results }, 200, "private, no-cache");
}
