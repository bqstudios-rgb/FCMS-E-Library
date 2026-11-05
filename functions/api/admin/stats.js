import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const db = ctx.env.DB;
  const [p, a, d, f] = await db.batch([
    db.prepare("SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending'"),
    db.prepare("SELECT COUNT(*) AS n FROM materials"),
    db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM download_counts"),
    db.prepare("SELECT COUNT(*) AS n FROM feedback"),
  ]);
  return json({
    pending: p.results[0].n,
    approved: a.results[0].n,
    downloads: d.results[0].n,
    feedback: f.results[0].n,
  });
}
