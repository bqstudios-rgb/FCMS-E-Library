import { json, getAdmin, sameOrigin, logActivity } from "../../utils/auth.js";
import { deleteFile } from "../../utils/storage.js";

const OLD = "status = 'rejected' AND ((cleanup_at IS NOT NULL AND cleanup_at <= datetime('now')) OR (cleanup_at IS NULL AND created_at <= datetime('now', '-30 day')))";
const ORIG = "FROM submissions s JOIN materials m ON m.submission_id = s.id WHERE s.status = 'approved' AND s.r2_compressed_key IS NOT NULL AND s.r2_original_key != s.r2_compressed_key AND m.r2_object_key = s.r2_compressed_key";
const ok = (k) => typeof k === "string" && k.startsWith("d:");

async function drop(env, keys) {
  let good = true;
  for (const k of new Set(keys.filter(ok))) {
    try { if (!(await deleteFile(env, k))) good = false; } catch (e) { good = false; }
  }
  return good;
}

export async function onRequestPost(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (!sameOrigin(ctx.request)) return json({ error: "Forbidden" }, 403);
  const env = ctx.env, db = env.DB;
  let removed = 0, freed = 0;
  const rej = await db.prepare("SELECT id, r2_original_key, r2_compressed_key, size_bytes, compressed_size_bytes FROM submissions WHERE " + OLD + " LIMIT 8").all();
  for (const r of rej.results) {
    if (await drop(env, [r.r2_original_key, r.r2_compressed_key])) {
      await db.prepare("DELETE FROM submissions WHERE id = ?").bind(r.id).run();
      removed++; freed += (r.size_bytes || 0) + (r.compressed_size_bytes || 0);
    }
  }
  const org = await db.prepare("SELECT s.id, s.r2_original_key, s.size_bytes " + ORIG + " LIMIT 8").all();
  for (const o of org.results) {
    if (await drop(env, [o.r2_original_key])) {
      await db.prepare("UPDATE submissions SET r2_original_key = r2_compressed_key WHERE id = ?").bind(o.id).run();
      removed++; freed += o.size_bytes || 0;
    }
  }
  const [a, c] = await db.batch([
    db.prepare("SELECT COUNT(*) AS n FROM submissions WHERE " + OLD),
    db.prepare("SELECT COUNT(*) AS n " + ORIG),
  ]);
  const left = a.results[0].n + c.results[0].n;
  await logActivity(env, admin.id, "cleanup", "storage", "cleanup", removed + " removed");
  return json({ ok: true, removed, freed, left });
}
