import { json, getAdmin } from "../../utils/auth.js";

export async function onRequestGet(ctx) {
  const admin = await getAdmin(ctx);
  if (!admin) return json({ error: "Not signed in" }, 401);
  return json({ email: admin.email, role: admin.role });
}
