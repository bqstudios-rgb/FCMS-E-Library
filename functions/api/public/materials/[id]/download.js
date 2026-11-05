import { json } from "../../../../utils/auth.js";
import { hit } from "../../../../utils/limit.js";
import { MIME } from "../../../../utils/files.js";
import { getFile } from "../../../../utils/storage.js";

export async function onRequestGet({ request, env, params }) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!(await hit(env, ip, "download", 30, 3600))) return json({ error: "Too many downloads. Please try again later." }, 429);
  const m = await env.DB.prepare("SELECT m.id, m.title, m.type, m.r2_object_key FROM materials m JOIN submissions s ON s.id = m.submission_id WHERE m.id = ? AND s.status = 'approved'").bind(params.id).first();
  if (!m) return json({ error: "Not found" }, 404);
  let r;
  try { r = await getFile(env, m.r2_object_key); } catch (e) { r = null; }
  if (!r) return json({ error: "File not available" }, 404);
  const ext = String(m.type).replace(/[^a-z0-9]/gi, "").toLowerCase();
  const base = String(m.title).normalize("NFD").replace(/[^A-Za-z0-9 _-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "material";
  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare("INSERT INTO download_counts (id, material_id, date, count) VALUES (?, ?, ?, 1) ON CONFLICT(material_id, date) DO UPDATE SET count = count + 1")
      .bind(crypto.randomUUID(), m.id, day).run();
  } catch (e) {}
  const h = {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Disposition": 'attachment; filename="' + base + "." + ext + '"',
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
  const len = r.headers.get("content-length");
  if (len) h["Content-Length"] = len;
  return new Response(r.body, { headers: h });
}
