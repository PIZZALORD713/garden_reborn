(() => {
  function isTexture(value) {
    return Boolean(value && value.isTexture);
  }

  function collectMaterialTextures(material, outSet) {
    if (!material || !(outSet instanceof Set)) return;

    for (const value of Object.values(material)) {
      if (isTexture(value)) outSet.add(value);
    }
  }

  function disposeMaterial(material, options = {}) {
    if (!material) return;

    const {
      preserveTextures = new Set(),
      disposedTextures = new Set(),
      disposedMaterials = new Set(),
      stats = null
    } = options;

    const mats = Array.isArray(material) ? material : [material];

    for (const mat of mats) {
      if (!mat || disposedMaterials.has(mat)) continue;

      const textures = new Set();
      collectMaterialTextures(mat, textures);

      for (const tex of textures) {
        if (!tex || preserveTextures.has(tex) || disposedTextures.has(tex)) continue;
        tex.dispose?.();
        disposedTextures.add(tex);
        if (stats) stats.textures += 1;
      }

      mat.dispose?.();
      disposedMaterials.add(mat);
      if (stats) stats.materials += 1;
    }
  }

  function disposeObjectTree(root, options = {}) {
    if (!root) return options.stats || null;

    const {
      preserveTextures = new Set(),
      preserveGeometries = new Set(),
      preserveMaterials = new Set(),
      disposedGeometries = new Set(),
      disposedMaterials = new Set(),
      disposedTextures = new Set(),
      stats = { nodes: 0, geometries: 0, materials: 0, textures: 0 }
    } = options;

    root.traverse?.((node) => {
      if (!node) return;
      stats.nodes += 1;

      if ((node.isMesh || node.isPoints || node.isLine) && node.geometry) {
        const geom = node.geometry;
        if (!preserveGeometries.has(geom) && !disposedGeometries.has(geom)) {
          geom.dispose?.();
          disposedGeometries.add(geom);
          stats.geometries += 1;
        }
      }

      if ((node.isMesh || node.isPoints || node.isLine) && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        const filtered = mats.filter((mat) => mat && !preserveMaterials.has(mat));
        if (!filtered.length) return;

        disposeMaterial(filtered, {
          preserveTextures,
          disposedTextures,
          disposedMaterials,
          stats
        });
      }
    });

    return stats;
  }

  window.FrienemiesAvatarCleanupUtils = {
    collectMaterialTextures,
    disposeMaterial,
    disposeObjectTree
  };
})();
