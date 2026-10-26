import { hashPassword } from '../../utils/crypto.js';

function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

const json = (obj, status) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export async function onRequestPost({ request, env }) {
  const secret = request.headers.get("x-seed-secret") || "";
  if (!env.SEED_SECRET || !safeEqual(secret, env.SEED_SECRET)) return json({ error: "Unauthorized" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
  if (password.length < 12) return json({ error: "Password must be at least 12 characters" }, 400);
  const check = await env.DB.prepare("SELECT COUNT(*) as count FROM admins").first();
  if (check.count > 0) return json({ error: "Owner exists" }, 403);
  const { hash, salt } = await hashPassword(password);
  await env.DB.prepare("INSERT INTO admins (id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'owner')").bind(crypto.randomUUID(), email, hash, salt).run();
  return json({ success: true }, 201);
}
