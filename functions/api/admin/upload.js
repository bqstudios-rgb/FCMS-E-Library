import { json, getAdmin, sameOrigin, logActivity } from "../../utils/auth.js";
import { sha256Hex } from "../../utils/crypto.js";
import { MAX, MIME, looksRight, cleanName, bufHash, newTicket } from "../../utils/files.js";
import { storageReady, putFile, deleteFile } from "../../utils/storage.js";
import { CATS } from "../../utils/pub.js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (!storageReady(env)) return json({ error: "Storage is not available." }, 503);
  const len = parseInt(request.headers.get("content-length") || "0", 10);
  if (len > MAX + 200 * 1024) return json({ error: "File is too large. The limit is 6 MB." }, 413);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "Bad request" }, 400); }
  const title = String(form.get("title") || "").trim();
  const category = String(form.get("category") || "");
  const courseId = String(form.get("course") || "");
  const name = (String(form.get("name") || "").trim() || admin.name || "FCMS Library").slice(0, 60);
  const file = form.get("file");
  if (title.length < 3 || title.length > 120) return json({ error: "Title must be 3 to 120 characters." }, 400);
  if (!CATS.includes(category)) return json({ error: "Choose a material type." }, 400);
  if (!file || typeof file === "string" || !file.size) return json({ error: "Choose a file." }, 400);
  if (file.size > MAX) return json({ error: "File is too large. The limit is 6 MB." }, 413);
  const course = await env.DB.prepare("SELECT id, code, title FROM courses WHERE id = ? AND is_approved = 1").bind(courseId).first();
  if (!course) return json({ error: "Choose a valid course." }, 400);
  const ext = (String(file.name).split(".").pop() || "").toLowerCase();
  if (!MIME[ext]) return json({ error: "This file type is not allowed." }, 400);
  const buf = await file.arrayBuffer();
  if (!looksRight(ext, new Uint8Array(buf.slice(0, 1024)))) return json({ error: "The file content does not match its type." }, 400);
  const hash = await bufHash(buf);
  const dup = await env.DB.prepare("SELECT id FROM submissions WHERE file_hash = ? AND status IN ('pending','approved') LIMIT 1").bind(hash).first();
  if (dup) return json({ error: "This file is already in the library." }, 409);
  const id = crypto.randomUUID();
  const mid = crypto.randomUUID();
  let stored;
  try { stored = await putFile(env, "sub/" + id, buf, MIME[ext], null); }
  catch (e) { return json({ error: "Could not store the file." }, 500); }
  for (let i = 0; i < 3; i++) {
    const ticket = newTicket(name);
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO submissions (id, ticket_number, secret_hash, contributor_name, course_id, title, type, original_filename, mime_type, size_bytes, file_hash, status, r2_original_key, category) VALUES (?,?,?,?,?,?,?,?,?,?,?,'approved',?,?)")
          .bind(id, ticket, await sha256Hex(ticket + ":"), name, course.id, title, ext, cleanName(file.name), MIME[ext], buf.byteLength, hash, stored, category),
        env.DB.prepare("INSERT INTO materials (id, submission_id, course_id, contributor_name, title, type, size_bytes, r2_object_key, category) VALUES (?,?,?,?,?,?,?,?,?)")
          .bind(mid, id, course.id, name, title, ext, buf.byteLength, stored, category),
        env.DB.prepare("INSERT INTO search_index (title, course_code, course_title, contributor_name, material_id) VALUES (?,?,?,?,?)")
          .bind(title, course.code, course.title, name, mid),
      ]);
      await logActivity(env, admin.id, "add_material", "material", mid, title);
      return json({ ok: true, id: mid }, 201);
    } catch (e) { /* retry with a new ticket */ }
  }
  try { await deleteFile(env, stored); } catch (e) {}
  return json({ error: "Could not save. Nothing was added." }, 500);
}
