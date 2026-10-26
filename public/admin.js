const $ = (id) => document.getElementById(id);

async function api(path, opts) {
  const r = await fetch(path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opts });
  let data = {};
  try { data = await r.json(); } catch (e) {}
  return { ok: r.ok, data };
}

async function showState() {
  const r = await api("/api/admin/me");
  $("login").hidden = r.ok;
  $("panel").hidden = !r.ok;
  if (r.ok) $("who").textContent = r.data.email + " (" + r.data.role + ")";
}

$("login").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("msg").textContent = "";
  const t = new FormData(e.target).get("cf-turnstile-response");
  const r = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: $("email").value, password: $("password").value, turnstile: t }),
  });
  if (r.ok) {
    $("password").value = "";
    showState();
  } else {
    $("msg").textContent = r.data.error || "Sign in failed.";
    if (window.turnstile) window.turnstile.reset();
  }
});

$("logout").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  showState();
});

showState();
