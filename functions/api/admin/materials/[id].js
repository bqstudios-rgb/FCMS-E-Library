import { json, getAdmin, sameOrigin, logActivity } from "../../../utils/auth.js";
import { deleteFile } from "../../../utils/storage.js";
import { CATS } from "../../../utils/pub.js";

async function guard(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return { err: json({ error: "Unauthorized" }, 401) };
  if (!sameOrigin(ctx.request)) return { err: json({ error: "Bad request origin" }, 403) };
  return { admin };
}

export async function onRequestPatch(ctx) {
  const g = await guard(ctx);
  if (g.err) return g.err;
  const { request, env, params } = ctx;
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const m = await env.DB.prepare("SELECT id, title, category, is_pinned FROM materials WHERE id = ?").bind(params.id).first();
  if (!m) return json({ error: "Not found" }, 404);
  const title = b.title === undefined ? m.title : String(b.title).trim().slice(0, 120);
  if (title.length < 3) return json({ error: "Title is too short" }, 400);
  const category = b.category === undefined ? m.category : b.category;
  if (!CATS.includes(category)) return json({ error: "Invalid category" }, 400);
  const was = Number(m.is_pinned) ? 1 : 0;
  const pinned = b.is_pinned === undefined ? was : (b.is_pinned ? 1 : 0);
  await env.DB.batch([
    env.DB.prepare("UPDATE materials SET title = ?, category = ?, is_pinned = ? WHERE id = ?").bind(title, category, pinned, m.id),
    env.DB.prepare("UPDATE search_index SET title = ? WHERE material_id = ?").bind(title, m.id),
  ]);
  const action = pinned !== was ? (pinned ? "pin_material" : "unpin_material") : "edit_material";
  await logActivity(env, g.admin.id, action, "material", m.id, title);
  return json({ ok: true });
}

export async function onRequestDelete(ctx) {
  const g = await guard(ctx);
  if (g.err) return g.err;
  const { env, params } = ctx;
  const m = await env.DB.prepare("SELECT m.id, m.title, m.submission_id, m.r2_object_key, s.r2_original_key, s.r2_compressed_key FROM materials m JOIN submissions s ON s.id = m.submission_id WHERE m.id = ?").bind(params.id).first();
  if (!m) return json({ error: "Not found" }, 404);
  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM download_counts WHERE material_id = ?").bind(m.id),
      env.DB.prepare("DELETE FROM search_index WHERE material_id = ?").bind(m.id),
      env.DB.prepare("DELETE FROM materials WHERE id = ?").bind(m.id),
      env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(m.submission_id),
    ]);
  } catch (e) {
    return json({ error: "Could not delete. Nothing was removed." }, 500);
  }
  let left = 0;
  for (const k of new Set([m.r2_object_key, m.r2_original_key, m.r2_compressed_key].filter(Boolean))) {
    try { if (!(await deleteFile(env, k))) left++; } catch (e) { left++; }
  }
  await logActivity(env, g.admin.id, "delete_material", "material", m.id, m.title);
  return json({ ok: true, files_left: left });
}
