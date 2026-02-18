(() => {
  function initMascotHook({
    mascotToggle,
    mascotSprite,
    mascotBody,
    mascotPanel,
    mascotConfig,
    getAnimUrlByName,
    playAnimUrl,
    logLine
  } = {}) {
    if (mascotToggle) mascotToggle.textContent = mascotConfig?.mascotName || "Mascot";

    if (mascotSprite) {
      mascotSprite.src = mascotConfig?.mascotOpenSeaImage || "";
      mascotSprite.loading = "lazy";
    }

    mascotToggle?.addEventListener("click", () => {
      const collapsed = mascotBody?.classList.toggle("is-collapsed");
      mascotToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });

    mascotPanel?.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-mascot-emote]");
      if (!btn) return;
      const emoteName = btn.dataset.mascotEmote;
      const animUrl = getAnimUrlByName?.(emoteName);
      if (!animUrl) {
        logLine?.(`Mascot emote missing in manifest: ${emoteName}`, "warn");
        return;
      }
      await playAnimUrl?.(animUrl);
    });
  }

  window.FrienemiesMascotUtils = {
    initMascotHook
  };
})();
