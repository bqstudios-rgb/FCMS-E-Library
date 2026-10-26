const msg = document.getElementById("msg");
document.getElementById("f").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.style.color = "#D61F1F";
  msg.textContent = "";
  const token = location.hash.slice(1);
  const t = new FormData(e.target).get("cf-turnstile-response");
  const r = await fetch("/api/admin/invitations/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, email: document.getElementById("email").value, password: document.getElementById("password").value, turnstile: t }),
  });
  let d = {};
  try { d = await r.json(); } catch (x) {}
  if (r.ok) {
    msg.style.color = "#3F8A2A";
    msg.textContent = "Account created. You can now sign in at /admin.html";
    e.target.hidden = true;
  } else {
    msg.textContent = d.error || "Something went wrong.";
    if (window.turnstile) window.turnstile.reset();
  }
});
