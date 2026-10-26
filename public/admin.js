const $ = (id) => document.getElementById(id);

async function api(path, opts) {
  const r = await fetch(path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opts });
  let data = {};
  try { data = await r.json(); } catch (e) {}
  return { ok: r.ok, data };
}

async function loadUsers() {
  const r = await api("/api/admin/users");
  const box = $("users");
  box.textContent = "";
  if (!r.ok) return;
  r.data.users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("span");
    label.textContent = u.email + " (" + u.role + ")";
    row.appendChild(label);
    if (u.role !== "owner") {
      const b = document.createElement("button");
      b.className = "small";
      b.textContent = "Remove";
      b.onclick = async () => {
        if (!confirm("Remove " + u.email + "?")) return;
        const d = await api("/api/admin/users/" + u.id, { method: "DELETE" });
        $("msg").textContent = d.ok ? "" : d.data.error || "Could not remove.";
        loadUsers();
      };
      row.appendChild(b);
    }
    box.appendChild(row);
  });
}

async function showState() {
  const r = await api("/api/admin/me");
  $("login").hidden = r.ok;
  $("panel").hidden = !r.ok;
  if (r.ok) {
    $("who").textContent = r.data.email + " (" + r.data.role + ")";
    $("owner").hidden = r.data.role !== "owner";
    if (r.data.role === "owner") loadUsers();
  }
}

$("login").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("msg").textContent = "";
  const t = new FormData(e.target).get("cf-turnstile-response");
  const r = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: $("email").value, password: $("password").value, turnstile: t }),
  });
  if (r.ok) { $("password").value = ""; showState(); }
  else {
    $("msg").textContent = r.data.error || "Sign in failed.";
    if (window.turnstile) window.turnstile.reset();
  }
});

$("invite").addEventListener("click", async () => {
  $("msg").textContent = "";
  const r = await api("/api/admin/invitations", { method: "POST" });
  if (r.ok) { $("link").value = r.data.link; $("link").hidden = false; $("link").select(); }
  else $("msg").textContent = r.data.error || "Could not create invite.";
});

$("logout").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  $("link").hidden = true;
  showState();
});

showState();
