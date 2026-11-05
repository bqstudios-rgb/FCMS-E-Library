import { json, getAdmin } from "../../../../utils/auth.js";
import { getFile } from "../../../../utils/storage.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const s = await ctx.env.DB.prepare("SELECT type, mime_type, r2_original_key, r2_compressed_key FROM submissions WHERE id = ?").bind(ctx.params.id).first();
  if (!s) return json({ error: "Not found" }, 404);
  const r = await getFile(ctx.env, (new URL(ctx.request.url).searchParams.get("original") === "1" ? s.r2_original_key : (s.r2_compressed_key || s.r2_original_key)));
  if (!r) return json({ error: "File missing" }, 404);
  const ext = String(s.type).replace(/[^a-z0-9]/gi, "");
  return new Response(r.body, { headers: {
    "Content-Type": s.mime_type,
    "Content-Disposition": 'attachment; filename="submission.' + ext + '"',
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  } });
}
