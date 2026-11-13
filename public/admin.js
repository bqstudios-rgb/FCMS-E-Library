const $ = (id) => document.getElementById(id);

let turnstileWidget = null;
let turnstileToken = "";
let challengeRequired = false;

async function api(path, opts) {
  const r = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...opts
  });
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
    label.textContent = (u.name ? u.name + " · " : "") + u.email + " (" + u.role + ")";
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
    $("login-turnstile").hidden = true;
    $("who").textContent = (r.data.name ? r.data.name + " · " : "") + r.data.email + " · " + (r.data.role === "owner" ? "Owner" : "Admin");
    $("owner").hidden = r.data.role !== "owner";
    if (r.data.role === "owner") loadUsers();
  }
}

function showTurnstile() {
  challengeRequired = true;
  const box = $("login-turnstile");
  box.hidden = false;

  if (turnstileWidget !== null) return;

  if (window.turnstile) {
    turnstileWidget = window.turnstile.render(box, {
      sitekey: "0x4AAAAAAFmTpXkVyoEUblnG",
      callback: (token) => {
        turnstileToken = token;
        $("msg").textContent = "Verification complete. You can now sign in.";
      },
      "expired-callback": () => {
        turnstileToken = "";
        $("msg").textContent = "Verification expired. Please verify again.";
      },
      "error-callback": () => {
        turnstileToken = "";
        $("msg").textContent = "Verification could not load. Please try again.";
      }
    });
  } else {
    setTimeout(() => {
      if (challengeRequired && turnstileWidget === null) showTurnstile();
    }, 500);
  }
}

$("login").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("msg").textContent = "";

  if (challengeRequired && !turnstileToken) {
    $("msg").textContent = "Please complete the security verification first.";
    return;
  }

  const r = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email: $("email").value,
      password: $("password").value,
      turnstile: turnstileToken
    })
  });

  if (r.ok) {
    $("password").value = "";
    turnstileToken = "";
    challengeRequired = false;
    showState();
    return;
  }

  $("msg").textContent = r.data.error || "Sign in failed.";

  if (r.data.requiresTurnstile) {
    showTurnstile();
  }

  if (challengeRequired && window.turnstile && turnstileWidget !== null) {
    turnstileToken = "";
    window.turnstile.reset(turnstileWidget);
  }
});

$("invite").addEventListener("click", async () => {
  $("msg").textContent = "";
  const r = await api("/api/admin/invitations", { method: "POST" });
  if (r.ok) {
    $("link").value = r.data.link;
    $("link").hidden = false;
    $("link").select();
  } else {
    $("msg").textContent = r.data.error || "Could not create invite.";
  }
});

$("logout").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  $("link").hidden = true;
  showState();
});

showState();
