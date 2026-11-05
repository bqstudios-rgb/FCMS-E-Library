import { json, sameOrigin } from "../../utils/auth.js";
import { hit } from "../../utils/limit.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!(await hit(env, ip, "track", 10, 900))) return json({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
  let b;
  try { b = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  const ticket = String(b.ticket || "").trim().toUpperCase();
  const bad = { error: "Ticket not recognised." };
  if (!/^[A-Z]{3}-\d{6}$/.test(ticket)) return json(bad, 404);
  const r = await env.DB.prepare("SELECT ticket_number, title, category, status, rejection_reason, created_at FROM submissions WHERE ticket_number = ?").bind(ticket).first();
  if (!r) return json(bad, 404);
  return json({
    ticket: r.ticket_number, title: r.title, category: r.category, status: r.status,
    reason: r.status === "rejected" ? r.rejection_reason : null, submitted: r.created_at,
  });
}
