import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const all = admin.role === "owner" && new URL(ctx.request.url).searchParams.get("mine") !== "1";
  const sql = "SELECT l.action, l.target_type, l.details, l.timestamp, a.name, a.email FROM activity_log l LEFT JOIN admins a ON a.id = l.admin_id" + (all ? "" : " WHERE l.admin_id = ?") + " ORDER BY l.timestamp DESC LIMIT 100";
  const st = ctx.env.DB.prepare(sql);
  const r = await (all ? st : st.bind(admin.id)).all();
  return json({ scope: all ? "all" : "mine", entries: r.results });
}
