(() => {
  function normalizeAnimManifestItem(item) {
    if (Array.isArray(item) && item.length >= 2) {
      return [String(item[0]), String(item[1])];
    }
    if (item && typeof item === "object" && item.url) {
      const url = String(item.url);
      const fallbackName = url.split("/").pop()?.replace(/\.glb$/i, "") || "Animation";
      return [String(item.name || fallbackName), url];
    }
    return null;
  }

  function populateAnimationSelect(selectEl, presets = []) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    presets.forEach(([name, url], idx) => {
      const opt = document.createElement("option");
      opt.value = url;
      opt.textContent = name;
      if (idx === 0) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function getAnimUrlByName(name, presets = []) {
    const target = String(name || "").toLowerCase();
    const hit = presets.find(([animName]) => String(animName).toLowerCase() === target);
    return hit?.[1] || "";
  }

  window.FrienemiesAnimUtils = {
    normalizeAnimManifestItem,
    populateAnimationSelect,
    getAnimUrlByName
  };
})();
