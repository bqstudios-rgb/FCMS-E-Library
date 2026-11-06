(function () {
  var f = document.getElementById("f"), m = document.getElementById("msg");
  f.addEventListener("submit", async function (e) {
    e.preventDefault();
    m.textContent = "";
    var b = f.querySelector("button");
    b.disabled = true;
    try {
      var r = await fetch("/api/public/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: document.getElementById("cname").value,
          code: document.getElementById("ccode").value,
          level: document.getElementById("clevel").value,
          website: document.getElementById("cweb").value
        })
      });
      var d = {};
      try { d = await r.json(); } catch (x) {}
      if (r.ok) { m.textContent = "Thanks. An admin will review your suggestion."; f.reset(); }
      else m.textContent = d.error || "Could not send. Try again.";
    } catch (x) { m.textContent = "Could not send. Check your connection."; }
    b.disabled = false;
  });
})();
