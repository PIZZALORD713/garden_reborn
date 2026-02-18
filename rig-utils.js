(() => {
  function baseKey(name) {
    let s = (name || "").toLowerCase();
    s = s.replace(/^armature[|:]/g, "");
    s = s.replace(/^mixamorig[:]?/g, "");
    s = s.replace(/\s+/g, "");
    s = s.replace(/[^a-z0-9]+/g, "");
    s = s.replace(/end$/g, "");
    return s;
  }

  function aliasKey(key) {
    const normalized = String(key || "").toLowerCase();
    const spineKey = normalized.replace(/^spine0+(\d+)$/, "spine$1");
    if (spineKey === "pelvis" || spineKey === "hip") return "hips";
    return spineKey;
  }

  function keyForName(name) {
    return aliasKey(baseKey(name));
  }

  function getBoneByKey(skeleton, key) {
    if (!skeleton || !Array.isArray(skeleton.bones)) return null;
    const target = aliasKey(String(key || "").toLowerCase());
    return skeleton.bones.find((bone) => keyForName(bone?.name) === target) || null;
  }

  function buildBoneMap(skeleton) {
    const map = new Map();
    for (const bone of skeleton?.bones || []) {
      map.set(keyForName(bone.name), bone);
    }
    return map;
  }

  window.FrienemiesRigUtils = {
    baseKey,
    aliasKey,
    keyForName,
    getBoneByKey,
    buildBoneMap
  };
})();
