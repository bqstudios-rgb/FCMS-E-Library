import { randomToken, sha256Hex } from "../../utils/crypto.js";
import { json, sameOrigin, getAdmin, logActivity } from "../../utils/auth.js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const admin = await getAdmin(ctx);
  if (!admin || admin.role !== "owner") return json({ error: "Owner only" }, 403);
  const token = randomToken();
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO invitations (id, token_hash, expires_at, created_by) VALUES (?, ?, ?, ?)")
    .bind(id, await sha256Hex(token), expires, admin.id).run();
  await logActivity(env, admin.id, "invite", "invitation", id, null);
  return json({ link: new URL(request.url).origin + "/accept.html#" + token, expires });
}
