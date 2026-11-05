(function () {
  const panel = document.getElementById("panel");
  const box = document.getElementById("queue");
  if (!panel || !box) return;
  const el = (tag, text, css) => {
    const e = document.createElement(tag);
    if (text) e.textContent = text;
    if (css) e.style.cssText = css;
    return e;
  };
  const mb = (n) => (n / 1048576).toFixed(2) + " MB";
  async function call(path, method, body) {
    const r = await fetch(path, { method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Request failed");
    return d;
  }
  function card(it) {
    const c = el("div", "", "border:1px solid #E5E7EB;border-radius:16px;padding:14px;margin-bottom:12px");
    c.append(el("p", it.title, "font-weight:600;margin-bottom:4px"));
    c.append(el("p", it.ticket_number + " · " + it.course_code + " · " + it.category + " · " + mb(it.size_bytes), "color:#6B7280;font-size:14px"));
    c.append(el("p", "By " + it.contributor_name, "font-size:14px;margin-top:4px"));
    if (it.description) c.append(el("p", it.description, "font-size:14px;margin-top:4px"));
    if (it.duplicate_warning) c.append(el("p", "Possible duplicate: similar title or size already in this course.", "background:#FDE8E8;color:#D61F1F;border-radius:10px;padding:6px 10px;font-size:14px;margin-top:8px"));
    if (it.size_bytes > 3145728) c.append(el("p", "Over 3 MB: must be compressed before approval.", "background:#EEF4FC;color:#002F68;border-radius:10px;padding:6px 10px;font-size:14px;margin-top:8px"));
    if (it.size_bytes > 3145728 && window.compressUI) window.compressUI(c, it, load);
    const msg = el("p", "", "color:#D61F1F;font-size:14px;margin-top:8px");
    const row = el("div", "", "display:flex;gap:8px;flex-wrap:wrap;margin-top:12px");
    const view = el("a", "Open file", "padding:10px 16px;border:1px solid #002F68;border-radius:999px;color:#002F68;text-decoration:none;font-size:15px");
    view.href = "/api/admin/submissions/" + it.id + "/file";
    view.target = "_blank";
    view.rel = "noopener";
    const ok = el("button", "Approve", "width:auto");
    ok.type = "button";
    const no = el("button", "Reject", "width:auto");
    no.type = "button";
    no.className = "alt";
    const rr = el("div", "", "display:none;margin-top:10px");
    const inp = el("input");
    inp.placeholder = "Reason shown to the contributor";
    inp.maxLength = 300;
    const go = el("button", "Confirm reject", "width:auto;margin-top:8px");
    go.type = "button";
    rr.append(inp, go);
    const all = [ok, no, go];
    async function act(path, body) {
      all.forEach((b) => (b.disabled = true));
      msg.textContent = "";
      try { await call(path, "POST", body); load(); }
      catch (e) { msg.textContent = e.message; all.forEach((b) => (b.disabled = false)); }
    }
    ok.onclick = () => act("/api/admin/submissions/" + it.id + "/approve");
    no.onclick = () => { rr.style.display = "block"; inp.focus(); };
    go.onclick = () => act("/api/admin/submissions/" + it.id + "/reject", { reason: inp.value });
    row.append(view, ok, no);
    c.append(row, rr, msg);
    return c;
  }
  async function load() {
    box.textContent = "Loading...";
    try {
      const d = await call("/api/admin/submissions", "GET");
      box.textContent = "";
      if (!d.items.length) { box.textContent = "No pending uploads."; return; }
      d.items.forEach((i) => box.append(card(i)));
    } catch (e) { box.textContent = e.message; }
  }
  new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  if (!panel.hidden) load();
})();
