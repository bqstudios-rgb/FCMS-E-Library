(function () {
  const panel = document.getElementById("panel");
  const box = document.getElementById("stats");
  if (!panel || !box) return;
  box.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0";
  const items = [
    ["pending", "Pending uploads", "#EEF4FC", "#002F68"],
    ["approved", "Approved files", "#E5F2E0", "#3F8A2A"],
    ["downloads", "Total downloads", "#E6F9FF", "#002F68"],
    ["feedback", "Feedback received", "#EEF4FC", "#002F68"],
  ];
  async function load() {
    try {
      const r = await fetch("/api/admin/stats", { credentials: "same-origin" });
      if (!r.ok) return;
      const d = await r.json();
      box.textContent = "";
      items.forEach(([k, label, bg, fg]) => {
        const c = document.createElement("div");
        c.style.cssText = "background:" + bg + ";border-radius:14px;padding:12px";
        const n = document.createElement("p");
        n.textContent = String(d[k]);
        n.style.cssText = "font-size:24px;font-weight:700;color:" + fg;
        const l = document.createElement("p");
        l.textContent = label;
        l.style.cssText = "font-size:13px;color:#6B7280;margin-top:2px";
        c.append(n, l);
        box.append(c);
      });
    } catch (e) {}
  }
  new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  if (!panel.hidden) load();
})();
