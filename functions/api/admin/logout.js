import { sha256Hex } from "../../utils/crypto.js";
import { json, sameOrigin, getCookie, getAdmin, logActivity } from "../../utils/auth.js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  const token = getCookie(request, "fcms_session");
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256Hex(token)).run();
  if (admin) await logActivity(env, admin.id, "logout", "admin", admin.id, null);
  return json({ ok: true }, 200, { "Set-Cookie": "fcms_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0" });
}
