function mCleanup() {
  document.getElementById("side-menu").classList.remove("open");
  if (!confirm("Delete rejected uploads older than 30 days and the replaced original copies? This frees storage and cannot be undone.")) return;
  mApi("/api/admin/cleanup", { method: "POST" }).then(function (r) {
    if (!r.ok) { alert(r.data.error || "Cleanup failed."); return; }
    alert("Removed " + r.data.removed + " item(s) and freed " + mFmt(r.data.freed) + "." + (r.data.left ? " " + r.data.left + " more are waiting. Run it again." : ""));
  });
}
function mSugg() {
  mOpen("Suggestions", function (b) {
    const list = mEl("div");
    b.append(list);
    const load = async function () {
      const r = await mApi("/api/admin/suggestions");
      list.replaceChildren();
      if (!r.ok) { list.append(mEl("p", { class: "m-note", text: "Could not load suggestions." })); return; }
      if (!r.data.items.length) { list.append(mEl("p", { class: "m-note", text: "No suggestions waiting." })); return; }
      const sems = r.data.semesters || [];
      r.data.items.forEach(function (s) {
        const code = mEl("input", { type: "text", maxlength: "12", placeholder: "Course code", value: s.suggested_code || "" });
        const sem = mEl("select", {}, ...sems.map(function (x) { return mEl("option", { value: x.id, text: x.name || x.title || x.label || x.id }); }));
        const msg = mEl("p", { class: "m-note" });
        const ok = mEl("button", { class: "m-pill", onclick: async function () {
          const d = await mApi("/api/admin/suggestions", mJson("POST", { id: s.id, action: "approve", code: code.value, semester_id: sem.value }));
          if (d.ok) load(); else msg.textContent = d.data.error || "Could not approve.";
        } }, mIcon("check", 16), " Approve");
        const no = mEl("button", { class: "m-ic red", "aria-label": "Reject", onclick: async function () {
          if (!confirm("Reject this suggestion?")) return;
          await mApi("/api/admin/suggestions", mJson("POST", { id: s.id, action: "reject" }));
          load();
        } }, mIcon("trash", 18));
        const lvl = String(s.level_id || "").replace("lvl_", "");
        list.append(mEl("div", { class: "m-card" },
          mEl("div", { class: "m-t", text: s.suggested_name }),
          mEl("div", { class: "m-s", text: (lvl ? lvl + " level" : "No level") + " \u2022 " + s.type }),
          mEl("div", { style: "margin-top:10px" }, code, sem), ok, no, msg));
      });
    };
    load();
  });
}
