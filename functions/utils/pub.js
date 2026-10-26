export const COLS = "m.id, m.title, m.type, m.size_bytes, m.published_at, m.category, m.contributor_name, c.code AS course_code";
export const CATS = ["Notes", "Past questions", "Slides", "Textbook"];
export const LEVELS = { "100": "lvl_100", "200": "lvl_200", "300": "lvl_300", "400": "lvl_400" };

export const reply = (obj, status = 200, cache = "public, max-age=60", extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": cache, ...extra } });
