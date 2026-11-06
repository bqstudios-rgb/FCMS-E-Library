function mMatRow(m, reload) {
  const pinned = Number(m.is_pinned) ? 1 : 0;
  const ext = String(m.type || "").toLowerCase();
  const kind = ext === "pdf" ? "pdf" : /^xlsx?$/.test(ext) ? "excel" : "word";
  const pin = mEl("button", { class: "m-ic" + (pinned ? " on" : ""), "aria-label": "Pin or unpin", onclick: async () => {
    const r = await mApi("/api/admin/materials/" + m.id, mJson("PATCH", { is_pinned: !pinned }));
    if (!r.ok) alert(r.data.error || "Could not update.");
    reload();
  } }, mIcon("pin", 18));
  const ed = mEl("button", { class: "m-ic", "aria-label": "Edit", onclick: () => mMatForm(m) }, mIcon("pencil", 18));
  const del = mEl("button", { class: "m-ic red", "aria-label": "Delete", onclick: async () => {
    if (!confirm('Delete "' + m.title + '" permanently? The file and its ticket record are removed.')) return;
    const r = await mApi("/api/admin/materials/" + m.id, { method: "DELETE" });
    if (!r.ok) alert(r.data.error || "Could not delete.");
    else if (r.data.files_left) alert("Entry removed, but " + r.data.files_left + " file(s) remain in storage.");
    reload();
  } }, mIcon("trash", 18));
  return mEl("div", { class: "file-row" },
    mEl("div", { class: "file-icon icon-" + kind }, mIcon("files", 24)),
    mEl("div", { class: "m-grow" },
      mEl("div", { class: "m-t", text: m.title }),
      mEl("div", { class: "m-s", text: [m.course_code, m.category, mFmt(m.size_bytes), m.contributor_name].filter(Boolean).join(" \u2022 ") })),
    pin, ed, del);
}
(function () {
  const g = (id) => document.getElementById(id);
  const tiles = [["pending", "Pending uploads", "var(--bg-tint-blue)"], ["approved", "Approved files", "var(--bg-tint-green)"], ["downloads", "Total downloads", "var(--bg-tint-cyan)"], ["feedback", "Feedback received", "var(--bg-tint-blue)"]];
  async function stats() {
    const r = await mApi("/api/admin/stats");
    if (!r.ok) return;
    const grid = mEl("div", { class: "grid-2" });
    tiles.forEach((t) => {
      const c = mEl("div", { class: "card level-card" }, mEl("h3", { text: String(r.data[t[0]]) }), mEl("p", { text: t[1] }));
      c.style.background = t[2];
      grid.append(c);
    });
    g("stats").replaceChildren(grid);
  }
  function banner() {
    let b = g("w-banner");
    if (!b) {
      b = mEl("div", { id: "w-banner" }, mEl("h2", { id: "w-name", text: "Welcome" }), mEl("p", { text: "Manage materials, review uploads and keep the library tidy." }));
      g("top-header").after(b);
    }
    const n = (g("top-name").textContent || "").trim().split(" ")[0];
    g("w-name").textContent = n && n !== "User" ? "Welcome, " + n : "Welcome";
    b.hidden = g("panel").hasAttribute("hidden");
  }
  function sync() {
    banner();
    if (!g("panel").hasAttribute("hidden")) stats();
  }
  new MutationObserver(sync).observe(g("panel"), { attributes: true });
  new MutationObserver(banner).observe(g("top-name"), { childList: true, characterData: true, subtree: true });
  sync();
})();
