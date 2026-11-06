(function () {
  const g = (id) => document.getElementById(id);
  function sync() {
    const open = !g("panel").hasAttribute("hidden");
    g("top-header").hidden = !open;
    g("login-title").hidden = open;
  }
  new MutationObserver(sync).observe(g("panel"), { attributes: true });
  new MutationObserver(() => {
    const t = g("who").textContent;
    if (!t) return;
    const p = t.split("·").map((s) => s.trim());
    g("top-name").textContent = p[0];
    if (p.length >= 3) {
      g("top-role").textContent = p[2];
      g("menu-name").textContent = p[0];
      g("menu-email").textContent = p[1];
      g("menu-role").textContent = p[2];
    }
  }).observe(g("who"), { childList: true, characterData: true, subtree: true });
  g("top-header").querySelector(".header-profile").addEventListener("click", () => g("side-menu").classList.add("open"));
  g("side-menu").querySelector(".close-btn").addEventListener("click", () => g("side-menu").classList.remove("open"));
  sync();
})();
