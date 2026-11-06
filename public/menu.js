const mP = {
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  queue: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  files: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  disk: '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  pin: '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>'
};
function mIcon(n, s) {
  const v = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  v.setAttribute("width", s || 20); v.setAttribute("height", s || 20);
  v.setAttribute("viewBox", "0 0 24 24"); v.setAttribute("fill", "none");
  v.setAttribute("stroke", "currentColor"); v.setAttribute("stroke-width", "2");
  v.setAttribute("stroke-linecap", "round"); v.setAttribute("stroke-linejoin", "round");
  v.innerHTML = mP[n];
  return v;
}
function mEl(t, a, ...k) {
  const e = document.createElement(t);
  for (const x in a || {}) {
    if (x === "class") e.className = a[x];
    else if (x === "text") e.textContent = a[x];
    else if (x.startsWith("on")) e[x] = a[x];
    else e.setAttribute(x, a[x]);
  }
  k.flat().forEach((c) => { if (c != null) e.append(c); });
  return e;
}
async function mApi(p, o) {
  const r = await fetch(p, { credentials: "same-origin", ...o });
  let d = {};
  try { d = await r.json(); } catch (e) {}
  return { ok: r.ok, data: d };
}
function mJson(method, body) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
function mFmt(n) {
  n = Number(n) || 0;
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
  if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB";
  return (n / 1073741824).toFixed(2) + " GB";
}
function mWhen(t) {
  const d = new Date(String(t).replace(" ", "T") + "Z");
  return isNaN(d) ? String(t || "") : d.toLocaleString();
}
const mCss = document.createElement("style");
mCss.textContent = `
#m-scr{position:fixed;inset:0;background:#fff;z-index:200;overflow-y:auto}
.m-top{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #E5E7EB;color:#002F68;position:sticky;top:0;background:#fff}
.m-body{max-width:420px;margin:0 auto;padding:16px}
#m-scr button{width:auto;padding:8px 12px}
#m-scr input,#m-scr select{width:100%;padding:10px;border:1px solid #E5E7EB;border-radius:8px;font-size:16px;margin-bottom:12px;background:#fff}
.m-ic{background:#EEF4FC!important;color:#002F68!important;border-radius:9999px!important;padding:8px!important;display:inline-flex;align-items:center;justify-content:center}
.m-ic.on{background:#04CEFF!important}
.m-ic.red{background:#FDE8E8!important;color:#D61F1F!important}
.m-pill{border-radius:9999px!important;display:inline-flex;align-items:center;gap:6px;margin-bottom:12px}
.m-wide{width:100%!important;justify-content:center}
.m-row{display:flex;align-items:center;gap:6px;padding:10px;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:8px}
.m-grow{flex:1;min-width:0}
.m-t{font-weight:600;font-size:14px;color:#002F68;overflow-wrap:anywhere}
.m-s{font-size:12px;color:#6B7280;margin-top:2px}
.m-note{font-size:13px;color:#6B7280;margin:8px 0}
.m-card{padding:14px;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:12px}
.m-track{height:10px;background:#EEF4FC;border-radius:9999px;overflow:hidden;margin-top:8px}
.m-fill{height:100%}
.m-nav{margin-bottom:16px}
.m-item{display:flex!important;align-items:center;gap:12px;width:100%;background:#fff!important;color:#002F68!important;border-bottom:1px solid #EEF4FC!important;border-radius:0!important;text-align:left;padding:12px 4px!important;font-weight:500}
.m-burger{margin-left:10px;color:#002F68;display:inline-flex;align-items:center}
`;
document.head.append(mCss);
let mScr;
function mOpen(title, fn, back) {
  if (!mScr) { mScr = mEl("div", { id: "m-scr" }); mScr.hidden = true; document.body.append(mScr); }
  document.getElementById("side-menu").classList.remove("open");
  const body = mEl("div", { class: "m-body" });
  const bk = mEl("button", { class: "m-ic", "aria-label": "Back", onclick: back || (() => { mScr.hidden = true; }) }, mIcon("back", 20));
  mScr.replaceChildren(mEl("div", { class: "m-top" }, bk, mEl("strong", { text: title })), body);
  mScr.hidden = false;
  fn(body);
}
function mMatRow(m, reload) {
  const pinned = Number(m.is_pinned) ? 1 : 0;
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
  return mEl("div", { class: "m-row" },
    mEl("div", { class: "m-grow" },
      mEl("div", { class: "m-t", text: m.title }),
      mEl("div", { class: "m-s", text: [m.course_code, m.category, mFmt(m.size_bytes), m.contributor_name].filter(Boolean).join(" · ") })),
    pin, ed, del);
}
function mMaterials() {
  mOpen("Materials", (b) => {
    const q = mEl("input", { type: "search", placeholder: "Search title, course or contributor", "aria-label": "Search materials" });
    const list = mEl("div");
    b.append(mEl("button", { class: "m-pill", onclick: () => mMatForm(null) }, mIcon("plus", 16), " Add material"), q, list);
    const load = async () => {
      const r = await mApi("/api/admin/materials?q=" + encodeURIComponent(q.value));
      list.replaceChildren();
      if (!r.ok) { list.append(mEl("p", { class: "m-note", text: "Could not load materials." })); return; }
      if (!r.data.materials.length) { list.append(mEl("p", { class: "m-note", text: "No materials found." })); return; }
      r.data.materials.forEach((m) => list.append(mMatRow(m, load)));
    };
    let t;
    q.oninput = () => { clearTimeout(t); t = setTimeout(load, 300); };
    load();
  });
}
function mMatForm(m) {
  mOpen(m ? "Edit material" : "Add material", async (b) => {
    const title = mEl("input", { type: "text", maxlength: "120", value: m ? m.title : "" });
    const cat = mEl("select", {}, ...["Notes", "Past questions", "Slides", "Textbook"].map((c) => mEl("option", { value: c, text: c })));
    if (m) cat.value = m.category || "Notes";
    const msg = mEl("p", { class: "m-note" });
    const go = mEl("button", { class: "m-pill m-wide" }, m ? "Save changes" : "Upload and publish");
    b.append(mEl("label", {}, "Title"), title, mEl("label", {}, "Type"), cat);
    let course, file, who;
    if (!m) {
      course = mEl("select");
      who = mEl("input", { type: "text", maxlength: "60", placeholder: "Leave empty to use your name" });
      file = mEl("input", { type: "file", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png" });
      const cr = await mApi("/api/admin/courses");
      (cr.data.courses || []).forEach((c) => course.append(mEl("option", { value: c.id, text: c.code + " · " + c.title })));
      b.append(mEl("label", {}, "Course"), course, mEl("label", {}, "Contributor name"), who, mEl("label", {}, "File (6 MB maximum)"), file);
    }
    b.append(go, msg);
    go.onclick = async () => {
      msg.textContent = "";
      go.disabled = true;
      let r;
      if (m) {
        r = await mApi("/api/admin/materials/" + m.id, mJson("PATCH", { title: title.value, category: cat.value }));
      } else {
        if (!file.files[0]) { msg.textContent = "Choose a file first."; go.disabled = false; return; }
        const f = new FormData();
        f.append("title", title.value); f.append("category", cat.value); f.append("course", course.value);
        f.append("name", who.value); f.append("file", file.files[0]);
        r = await mApi("/api/admin/upload", { method: "POST", body: f });
      }
      go.disabled = false;
      if (r.ok) mMaterials(); else msg.textContent = r.data.error || "Something went wrong.";
    };
  }, mMaterials);
}
function mBar(label, used, limit) {
  const p = Math.min(100, Math.round((used / limit) * 1000) / 10);
  const fill = mEl("div", { class: "m-fill" });
  fill.style.width = p + "%";
  fill.style.background = p >= 95 ? "#D61F1F" : p >= 80 ? "#F59E0B" : "#002F68";
  return mEl("div", { class: "m-card" },
    mEl("div", { class: "m-t", text: label }),
    mEl("div", { class: "m-s", text: mFmt(used) + " of " + mFmt(limit) + " (" + p + "%)" }),
    mEl("div", { class: "m-track" }, fill));
}
function mMeters() {
  mOpen("Storage and egress", async (b) => {
    const r = await mApi("/api/admin/meters");
    if (!r.ok) { b.append(mEl("p", { class: "m-note", text: "Could not load meters." })); return; }
    const d = r.data;
    b.append(
      mBar("Storage used", d.storage.bytes, d.storage.limit),
      mEl("p", { class: "m-note", text: d.storage.files + " files recorded. This is the total of file sizes in the library, including rejected files not yet cleaned up." }),
      mBar("Egress this month", d.egress.month, d.egress.limit),
      mEl("p", { class: "m-note", text: "Last 30 days: " + mFmt(d.egress.last30) + ". Counted by this site on public downloads only. Dbrij's own dashboard is the true figure." })
    );
  });
}
const mActs = {
  approve: "Approved an upload", reject: "Rejected an upload", add_material: "Added a material",
  edit_material: "Edited a material", delete_material: "Deleted a material",
  pin_material: "Pinned a material", unpin_material: "Unpinned a material", delete_feedback: "Deleted feedback"
};
function mLog(mine) {
  mOpen(mine ? "My actions" : "Activity log", async (b) => {
    const r = await mApi("/api/admin/log" + (mine ? "?mine=1" : ""));
    if (!r.ok) { b.append(mEl("p", { class: "m-note", text: "Could not load the log." })); return; }
    if (!r.data.entries.length) { b.append(mEl("p", { class: "m-note", text: "Nothing logged yet." })); return; }
    r.data.entries.forEach((e) => b.append(mEl("div", { class: "m-row" }, mEl("div", { class: "m-grow" },
      mEl("div", { class: "m-t", text: mActs[e.action] || String(e.action).replace(/_/g, " ") }),
      mEl("div", { class: "m-s", text: [e.details, e.name || e.email, mWhen(e.timestamp)].filter(Boolean).join(" · ") })))));
  });
}
function mFeed() {
  mOpen("Feedback", (b) => {
    const list = mEl("div");
    b.append(list);
    const load = async () => {
      const r = await mApi("/api/admin/feedback");
      list.replaceChildren();
      if (!r.ok) { list.append(mEl("p", { class: "m-note", text: "Could not load feedback." })); return; }
      if (!r.data.items.length) { list.append(mEl("p", { class: "m-note", text: "No feedback yet." })); return; }
      r.data.items.forEach((f) => {
        const act = async (a) => { await mApi("/api/admin/feedback", mJson("POST", { id: f.id, action: a })); load(); };
        const row = mEl("div", { class: "m-row" }, mEl("div", { class: "m-grow" },
          mEl("div", { class: "m-t", text: f.text }),
          mEl("div", { class: "m-s", text: [f.name || "Anonymous", mWhen(f.created_at), f.status === "read" ? "Read" : "New"].join(" · ") })));
        if (f.status !== "read") row.append(mEl("button", { class: "m-ic", "aria-label": "Mark read", onclick: () => act("read") }, mIcon("check", 18)));
        row.append(mEl("button", { class: "m-ic red", "aria-label": "Delete", onclick: () => { if (confirm("Delete this feedback?")) act("delete"); } }, mIcon("trash", 18)));
        list.append(row);
      });
    };
    load();
  });
}
mP.down = '<path d="m6 9 6 6 6-6"/>';
const mGroups = [
  ["files", "Library", [
    ["queue", "Review queue", () => { location.href = "/queue.html"; }],
    ["files", "Materials", mMaterials],
    ["chat", "Feedback inbox", mFeed],
    ["plus", "Suggestions", mSugg]]],
  ["history", "Records", [
    ["disk", "Storage and egress", mMeters],
    ["history", "Activity log", () => mLog(false)],
    ["user", "My actions", () => mLog(true)],
    ["trash", "Clean up storage", mCleanup]]]
];
const mCss2 = document.createElement("style");
mCss2.textContent = `
.m-sub{display:none;padding-left:14px;margin-left:10px;border-left:2px solid #EEF4FC}
.m-grp.open .m-sub{display:block}
.m-grp.open .m-chev{transform:rotate(180deg)}
.m-chev{margin-left:auto;transition:transform .2s}
.m-sub .m-item{font-weight:400;font-size:14px}
`;
document.head.append(mCss2);
function mInit() {
  const sm = document.getElementById("side-menu");
  if (!sm) return;
  const nav = mEl("div", { class: "m-nav" }, ...mGroups.map((g) => {
    const grp = mEl("div", { class: "m-grp" });
    const head = mEl("button", { class: "m-item", onclick: () => grp.classList.toggle("open") },
      mIcon(g[0], 20), mEl("span", { text: g[1] }), mEl("span", { class: "m-chev" }, mIcon("down", 18)));
    const sub = mEl("div", { class: "m-sub" }, ...g[2].map((i) =>
      mEl("button", { class: "m-item", onclick: i[2] }, mIcon(i[0], 18), mEl("span", { text: i[1] }))));
    grp.append(head, sub);
    return grp;
  }));
  const old = sm.querySelector(".menu-section");
  if (old && old.textContent.includes("Actions taken by me")) { sm.insertBefore(nav, old); old.remove(); }
  else sm.insertBefore(nav, sm.children[2] || null);
  const hp = document.querySelector(".header-profile");
  if (hp && !hp.querySelector(".m-burger")) hp.append(mEl("span", { class: "m-burger", "aria-label": "Open menu" }, mIcon("menu", 24)));
}
let mDashBox;
async function mDash() {
  const st = document.getElementById("stats");
  if (!st) return;
  const r = await mApi("/api/admin/meters");
  if (!r.ok) return;
  const d = r.data;
  if (!mDashBox) { mDashBox = mEl("div"); st.after(mDashBox); }
  mDashBox.replaceChildren(
    mBar("Storage", d.storage.bytes, d.storage.limit),
    mBar("Egress this month", d.egress.month, d.egress.limit),
    mEl("p", { class: "m-note", text: "Downloads in the last 30 days: " + (d.downloads ? d.downloads.last30 : 0) })
  );
}
mInit();
const mPanel = document.getElementById("panel");
if (mPanel) {
  new MutationObserver(() => { if (!mPanel.hidden) mDash(); }).observe(mPanel, { attributes: true });
  if (!mPanel.hidden) mDash();
}
