(function () {
  try {
    var admin = /^\/(admin|queue)/.test(location.pathname);
    var st = document.createElement("style");
    st.textContent = "#legal-foot{text-align:center;padding:18px 16px 28px;font-size:13px;color:#6B7280}#legal-foot a{color:#002F68;margin:0 8px;text-decoration:none}#cn{position:fixed;left:12px;right:12px;bottom:12px;max-width:520px;margin:0 auto;background:#002F68;color:#fff;border-radius:16px;padding:14px 16px;z-index:9999;font:14px/1.5 system-ui,-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,47,104,.3)}#cn a{color:#04CEFF}#cn button{display:block;margin-top:10px;background:#04CEFF;color:#002F68;font-weight:600;border:0;border-radius:9999px;padding:8px 18px;font-size:14px;cursor:pointer;width:auto}";
    document.head.appendChild(st);
    if (!admin && !document.body.hasAttribute("data-nofoot") && !document.getElementById("legal-foot")) {
      var f = document.createElement("div");
      f.id = "legal-foot";
      [["/privacy", "Privacy"], ["/terms", "Terms"], ["/takedown", "Takedown"], ["/suggest", "Suggest a course"]].forEach(function (l) {
        var a = document.createElement("a");
        a.href = l[0]; a.textContent = l[1];
        f.appendChild(a);
      });
      document.body.appendChild(f);
    }
    var seen = false;
    try { seen = localStorage.getItem("fcms_notice_v1") === "1"; } catch (e) {}
    if (seen) return;
    var n = document.createElement("div");
    n.id = "cn";
    n.setAttribute("role", "region");
    n.setAttribute("aria-label", "Cookies and privacy");
    var t = document.createElement("div");
    t.textContent = admin
      ? "This area uses one sign-in cookie so the site knows you are signed in. It is not used for tracking. "
      : "No ads, no analytics and no tracking cookies. Cloudflare's security check may use a short-lived technical cookie on some forms. ";
    var a2 = document.createElement("a");
    a2.href = "/privacy"; a2.textContent = "Read the privacy policy";
    t.appendChild(a2);
    var b = document.createElement("button");
    b.type = "button"; b.textContent = "Got it";
    b.addEventListener("click", function () {
      try { localStorage.setItem("fcms_notice_v1", "1"); } catch (e) {}
      n.remove();
    });
    n.appendChild(t); n.appendChild(b);
    document.body.appendChild(n);
  } catch (e) {}
})();
