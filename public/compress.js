window.compressUI = function (card, it, reload) {
  const mk = (tag, text, css) => {
    const e = document.createElement(tag);
    if (text) e.textContent = text;
    if (css) e.style.cssText = css;
    return e;
  };
  const box = mk("div", "", "margin-top:10px;border-top:1px solid #E5E7EB;padding-top:10px");
  const orig = mk("a", "Download original", "color:#002F68;font-size:14px");
  orig.href = "/api/admin/submissions/" + it.id + "/file?original=1";
  orig.target = "_blank";
  orig.rel = "noopener";
  const state = it.compressed_size_bytes
    ? "Compressed copy uploaded (" + (it.compressed_size_bytes / 1048576).toFixed(2) + " MB). Approval will use it."
    : "No compressed copy yet.";
  const note = mk("p", state, "font-size:14px;margin:8px 0;color:" + (it.compressed_size_bytes ? "#3F8A2A" : "#6B7280"));
  const inp = mk("input");
  inp.type = "file";
  inp.accept = "." + it.type;
  const btn = mk("button", it.compressed_size_bytes ? "Replace compressed copy" : "Upload compressed copy", "width:auto;margin-top:8px");
  btn.type = "button";
  const err = mk("p", "", "color:#D61F1F;font-size:14px;margin-top:6px");
  btn.onclick = async () => {
    const f = inp.files[0];
    err.textContent = "";
    if (!f) { err.textContent = "Choose the compressed file first."; return; }
    if (f.size > 3145728) { err.textContent = "That file is still over 3 MB."; return; }
    btn.disabled = true;
    btn.textContent = "Uploading...";
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/admin/submissions/" + it.id + "/compressed", { method: "POST", credentials: "same-origin", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed");
      reload();
    } catch (e) {
      err.textContent = e.message;
      btn.disabled = false;
      btn.textContent = "Upload compressed copy";
    }
  };
  box.append(orig, note, inp, btn, err);
  card.append(box);
};
