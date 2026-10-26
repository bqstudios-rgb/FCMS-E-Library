import { json, sameOrigin, verifyTurnstile } from "../../utils/auth.js";
import { hit } from "../../utils/limit.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  const text = String(body.text || "").trim();
  const anon = body.anonymous ? 1 : 0;
  const name = anon ? null : String(body.name || "").trim().slice(0, 60) || null;
  if (text.length < 5 || text.length > 1000) return json({ error: "Feedback must be between 5 and 1000 characters." }, 400);
  if (!(await hit(env, ip, "feedback", 5, 3600))) return json({ error: "Too many messages. Please try again later." }, 429);
  if (!(await verifyTurnstile(env, body.turnstile, ip))) return json({ error: "Verification failed. Please try again." }, 400);
  await env.DB.prepare("INSERT INTO feedback (name, text, is_anonymous) VALUES (?, ?, ?)").bind(name, text, anon || (name ? 0 : 1)).run();
  return json({ ok: true }, 201);
}
