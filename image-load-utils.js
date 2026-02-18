(() => {
  function hydrateImageFromDataset(img, { markLoaded = true, clearDataset = true } = {}) {
    if (!img) return false;
    const src = img.dataset?.src;
    if (!src) return false;
    img.src = src;
    if (markLoaded && img.dataset) img.dataset.loaded = "true";
    if (clearDataset) img.removeAttribute("data-src");
    return true;
  }

  function createTokenImageObserver({ existingObserver = null, canObserve = true, root = null, rootMargin = "60px" } = {}) {
    if (existingObserver || !canObserve || typeof IntersectionObserver === "undefined") {
      return existingObserver || null;
    }

    return new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          hydrateImageFromDataset(img);
          observer?.unobserve(img);
        });
      },
      { root, rootMargin }
    );
  }

  function observeTokenImage({ img, observer }) {
    if (!img) return false;
    if (!observer) return hydrateImageFromDataset(img, { markLoaded: false, clearDataset: false });
    observer.observe(img);
    return true;
  }

  window.FrienemiesImageLoadUtils = {
    hydrateImageFromDataset,
    createTokenImageObserver,
    observeTokenImage
  };
})();
