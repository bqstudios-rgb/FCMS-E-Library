import { json, getAdmin } from "../../utils/auth.js";

const GB = 1073741824;
const STORAGE_LIMIT_GB = 5;
const EGRESS_LIMIT_GB = 10;

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const db = ctx.env.DB;
  const month = new Date().toISOString().slice(0, 7) + "%";
  const [s, m, d, c] = await db.batch([
    db.prepare("SELECT COUNT(*) AS files, COALESCE(SUM(size_bytes), 0) + COALESCE(SUM(compressed_size_bytes), 0) AS bytes FROM submissions"),
    db.prepare("SELECT COALESCE(SUM(bytes), 0) AS n FROM egress_log WHERE date LIKE ?").bind(month),
    db.prepare("SELECT COALESCE(SUM(bytes), 0) AS n FROM egress_log WHERE date >= date('now', '-30 day')"),
    db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM download_counts WHERE date >= date('now', '-30 day')"),
  ]);
  return json({
    storage: { files: s.results[0].files, bytes: s.results[0].bytes, limit: STORAGE_LIMIT_GB * GB },
    egress: { month: m.results[0].n, last30: d.results[0].n, limit: EGRESS_LIMIT_GB * GB },
    downloads: { last30: c.results[0].n },
  });
}
