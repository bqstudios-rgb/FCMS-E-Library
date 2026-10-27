import { json, sameOrigin, verifyTurnstile } from "../../utils/auth.js";
import { hit } from "../../utils/limit.js";
import { sha256Hex } from "../../utils/crypto.js";
import { MAX, STANDARD, MIME, looksRight, cleanName, bufHash, newTicket, newSecret } from "../../utils/files.js";
import { storageReady, putFile, deleteFile } from "../../utils/storage.js";
import { CATS } from "../../utils/pub.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!storageReady(env)) return json({ error: "Uploads are not available yet." }, 503);
  const len = parseInt(request.headers.get("content-length") || "0", 10);
  if (len > MAX + 200 * 1024) return json({ error: "File is too large. The limit is 6 MB." }, 413);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!(await hit(env, ip, "upload", 6, 3600))) return json({ error: "Too many uploads. Please try again later." }, 429);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "Bad request" }, 400); }
  if (!(await verifyTurnstile(env, String(form.get("turnstile") || ""), ip))) return json({ error: "Verification failed. Please try again." }, 400);

  const name = String(form.get("name") || "").trim();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const category = String(form.get("category") || "");
  const courseId = String(form.get("course") || "");
  const file = form.get("file");
  if (name.length < 2 || name.length > 60) return json({ error: "Please enter your name (2 to 60 characters)." }, 400);
  if (title.length < 3 || title.length > 120) return json({ error: "Please enter a document name (3 to 120 characters)." }, 400);
  if (description.length > 500) return json({ error: "Description is too long (500 characters maximum)." }, 400);
  if (!CATS.includes(category)) return json({ error: "Please choose a material type." }, 400);
  if (!file || typeof file === "string" || !file.size) return json({ error: "Please choose a file." }, 400);
  if (file.size > MAX) return json({ error: "File is too large. The limit is 6 MB." }, 413);
  const course = await env.DB.prepare("SELECT id FROM courses WHERE id = ? AND is_approved = 1").bind(courseId).first();
  if (!course) return json({ error: "Please choose a valid course." }, 400);

  const ext = (String(file.name).split(".").pop() || "").toLowerCase();
  if (!MIME[ext]) return json({ error: "This file type is not allowed." }, 400);
  const buf = await file.arrayBuffer();
  if (!looksRight(ext, new Uint8Array(buf.slice(0, 1024)))) return json({ error: "The file content does not match its type." }, 400);
  const hash = await bufHash(buf);
  const dup = await env.DB.prepare("SELECT id FROM submissions WHERE file_hash = ? AND status IN ('pending','approved') LIMIT 1").bind(hash).first();
  if (dup) return json({ error: "This file has already been submitted." }, 409);
  const sim = await env.DB.prepare("SELECT id FROM submissions WHERE course_id = ? AND status IN ('pending','approved') AND (lower(title) = lower(?) OR size_bytes = ?) LIMIT 1").bind(courseId, title, buf.byteLength).first();

  const id = crypto.randomUUID();
  const key = "sub/" + id;
  try { await putFile(env, key, buf); }
  catch (e) { return json({ error: "Could not store your file. Please try again." }, 500); }
  const secret = newSecret();
  for (let i = 0; i < 5; i++) {
    const ticket = newTicket();
    try {
      await env.DB.prepare("INSERT INTO submissions (id, ticket_number, secret_hash, contributor_name, course_id, title, type, description, original_filename, mime_type, size_bytes, file_hash, duplicate_warning, possible_duplicate_of, status, r2_original_key, category) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)")
        .bind(id, ticket, await sha256Hex(ticket + ":" + secret), name, courseId, title, ext, description || null, cleanName(file.name), MIME[ext], buf.byteLength, hash, sim ? 1 : 0, sim ? sim.id : null, key, category).run();
      return json({ ok: true, ticket, secret, needsCompression: buf.byteLength > STANDARD }, 201);
    } catch (e) { /* retry with a new ticket */ }
  }
  try { await deleteFile(env, key); } catch (e) {}
  return json({ error: "Could not save your file. Please try again." }, 500);
}
