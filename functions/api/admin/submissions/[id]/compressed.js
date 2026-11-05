import { json, sameOrigin, getAdmin, logActivity } from "../../../../utils/auth.js";
import { STANDARD, MIME, looksRight } from "../../../../utils/files.js";
import { putFile } from "../../../../utils/storage.js";

export async function onRequestPost(ctx) {
  const { request, env, params } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const s = await env.DB.prepare("SELECT id, type, ticket_number FROM submissions WHERE id = ? AND status = 'pending'").bind(params.id).first();
  if (!s) return json({ error: "Not found or already reviewed." }, 404);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "Bad request" }, 400); }
  const file = form.get("file");
  if (!file || typeof file === "string" || !file.size) return json({ error: "Please choose a file." }, 400);
  if (file.size > STANDARD) return json({ error: "The compressed file must be 3 MB or less." }, 413);
  const ext = (String(file.name).split(".").pop() || "").toLowerCase();
  if (ext !== s.type) return json({ error: "Use the same file type (." + s.type + ")." }, 400);
  const buf = await file.arrayBuffer();
  if (!looksRight(ext, new Uint8Array(buf.slice(0, 1024)))) return json({ error: "The file content does not match its type." }, 400);
  let stored;
  try { stored = await putFile(env, "cmp/" + s.id, buf, MIME[ext]); }
  catch (e) { return json({ error: "Could not store the file. Please try again." }, 500); }
  await env.DB.prepare("UPDATE submissions SET r2_compressed_key = ?, compressed_size_bytes = ? WHERE id = ? AND status = 'pending'").bind(stored, buf.byteLength, s.id).run();
  await logActivity(env, admin.id, "compress", "submission", s.id, s.ticket_number);
  return json({ ok: true });
}
