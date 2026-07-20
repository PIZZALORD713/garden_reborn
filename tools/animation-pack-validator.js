(() => {
  const DEFAULT_CONTRACT = {
    version: "v1",
    canonicalBones: [
      "root",
      "hips",
      "spine",
      "spine1",
      "spine2",
      "spine3",
      "neck",
      "head",
      "leftshoulder",
      "leftarm",
      "leftforearm",
      "lefthand",
      "rightshoulder",
      "rightarm",
      "rightforearm",
      "righthand",
      "leftupleg",
      "leftleg",
      "leftfoot",
      "lefttoebase",
      "rightupleg",
      "rightleg",
      "rightfoot",
      "righttoebase"
    ],
    requiredBones: ["hips", "head"],
    aliases: {
      hip: "hips",
      pelvis: "hips",
      "mixamorig:hips": "hips",
      spine01: "spine1",
      spine02: "spine2",
      spine03: "spine3",
      leftupperarm: "leftarm",
      rightupperarm: "rightarm",
      leftlowerarm: "leftforearm",
      rightlowerarm: "rightforearm",
      biscepl: "leftarm",
      bicepl: "leftarm",
      arml: "leftforearm",
      handl: "lefthand",
      attachmentl: "lefthand",
      biscepr: "rightarm",
      bicepr: "rightarm",
      armr: "rightforearm",
      handr: "righthand",
      attachmentr: "righthand",
      backpieceattachment: "spine2",
      leftthigh: "leftupleg",
      rightthigh: "rightupleg",
      thighl: "leftupleg",
      thighr: "rightupleg",
      leftcalf: "leftleg",
      rightcalf: "rightleg",
      shinl: "leftleg",
      shinr: "rightleg",
      toel: "lefttoebase",
      toer: "righttoebase"
    }
  };

  const DEFAULT_LOCATION_BONES = ["root", "hips"];
  const REST_POSES = new Set(["a-pose", "t-pose", "unknown", "neutral"]);

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function makeMessage(severity, code, path, message, hint = "", details = {}) {
    return {
      severity,
      code,
      path,
      message,
      ...(hint ? { hint } : {}),
      ...(Object.keys(details).length ? { details } : {})
    };
  }

  function baseKey(name) {
    let value = String(name || "").toLowerCase();
    value = value.replace(/^armature[|:]/g, "");
    value = value.replace(/^mixamorig[:]?/g, "");
    value = value.replace(/\s+/g, "");
    value = value.replace(/[^a-z0-9]+/g, "");
    value = value.replace(/end$/g, "");
    return value;
  }

  function buildAliasMap(contract = DEFAULT_CONTRACT) {
    const aliases = new Map();
    for (const [from, to] of Object.entries(contract.aliases || {})) {
      const fromKey = baseKey(from);
      const toKey = baseKey(to);
      if (fromKey && toKey) aliases.set(fromKey, toKey);
    }
    aliases.set("pelvis", "hips");
    aliases.set("hip", "hips");
    return aliases;
  }

  function aliasKey(key, aliasMap = buildAliasMap()) {
    const normalized = String(key || "").toLowerCase();
    const spineKey = normalized.replace(/^spine0+(\d+)$/, "spine$1");
    return aliasMap.get(spineKey) || spineKey;
  }

  function keyForName(name, contract = DEFAULT_CONTRACT) {
    return aliasKey(baseKey(name), buildAliasMap(contract));
  }

  function extractSkeletonContract(rawContract) {
    if (isObject(rawContract) && Array.isArray(rawContract.canonicalBones)) {
      return { ...DEFAULT_CONTRACT, ...rawContract };
    }
    const example = rawContract?.examples?.find?.((item) => Array.isArray(item?.canonicalBones));
    if (example) return { ...DEFAULT_CONTRACT, ...example };
    return DEFAULT_CONTRACT;
  }

  function buildContractSets(contract = DEFAULT_CONTRACT) {
    const canonical = new Set();
    for (const bone of contract.canonicalBones || []) {
      const key = keyForName(bone, contract);
      if (key) canonical.add(key);
    }
    for (const bone of contract.requiredBones || []) {
      const key = keyForName(bone, contract);
      if (key) canonical.add(key);
    }
    for (const bone of Object.values(contract.aliases || {})) {
      const key = keyForName(bone, contract);
      if (key) canonical.add(key);
    }
    const required = new Set(
      (contract.requiredBones || []).map((bone) => keyForName(bone, contract)).filter(Boolean)
    );
    return { canonical, required };
  }

  function normalizeProperty(rawProperty) {
    const value = String(rawProperty || "").toLowerCase();
    if (value === "translation" || value === "location") return "position";
    if (value === "rotation") return "quaternion";
    return value;
  }

  function parseTrackName(name) {
    const rawName = String(name || "");
    const boneMatch = rawName.match(/\.?bones\[([^\]]+)\]\.([^.]+)$/i);
    if (boneMatch) {
      return {
        target: boneMatch[1],
        property: normalizeProperty(boneMatch[2])
      };
    }

    const lastDot = rawName.lastIndexOf(".");
    if (lastDot === -1) return { target: rawName, property: "" };
    let target = rawName.slice(0, lastDot);
    const property = normalizeProperty(rawName.slice(lastDot + 1));
    if (target.includes("|")) target = target.split("|").pop();
    if (target.includes("/")) target = target.split("/").pop();
    return { target, property };
  }

  function normalizeTrackDefinition(track) {
    if (typeof track === "string") {
      const parsed = parseTrackName(track);
      return {
        name: track,
        target: parsed.target,
        property: parsed.property,
        source: "manifest"
      };
    }

    if (isObject(track)) {
      const parsed = parseTrackName(track.name || "");
      const property = normalizeProperty(track.property || track.path || parsed.property);
      const target = track.bone || track.target || parsed.target || "";
      const name = track.name || [target, property].filter(Boolean).join(".");
      return {
        ...track,
        name,
        target,
        property,
        source: track.source || "manifest"
      };
    }

    return { name: "", target: "", property: "", source: "manifest" };
  }

  function isUri(value) {
    try {
      const url = new URL(String(value));
      return Boolean(url.protocol);
    } catch {
      return String(value || "").startsWith("./") || String(value || "").startsWith("../");
    }
  }

  function validateSchemaShape(manifest, schema = null) {
    const errors = [];
    const warnings = [];
    const required = Array.isArray(schema?.required)
      ? schema.required
      : ["id", "name", "version", "skeletonContract", "clips"];

    if (!isObject(manifest)) {
      errors.push(
        makeMessage(
          "error",
          "schema.type",
          "$",
          "Animation pack manifest must be a JSON object.",
          "Check that the pack file contains one object, not an array or primitive."
        )
      );
      return { errors, warnings };
    }

    for (const field of required) {
      if (manifest[field] === undefined || manifest[field] === null || manifest[field] === "") {
        errors.push(
          makeMessage(
            "error",
            "schema.required",
            `$.${field}`,
            `Missing required field '${field}'.`,
            "Follow schemas/animation.pack.schema.json."
          )
        );
      }
    }

    for (const field of ["id", "name", "version", "skeletonContract", "author", "license"]) {
      if (manifest[field] !== undefined && typeof manifest[field] !== "string") {
        errors.push(
          makeMessage(
            "error",
            "schema.type",
            `$.${field}`,
            `'${field}' must be a string.`,
            "Convert this field to a string value."
          )
        );
      }
    }

    if (manifest.skeletonContract !== undefined && manifest.skeletonContract !== "v1") {
      errors.push(
        makeMessage(
          "error",
          "schema.const",
          "$.skeletonContract",
          "Animation packs must target skeletonContract 'v1'.",
          "Retarget the pack to BODY skeleton v1 or publish it under a future contract."
        )
      );
    }

    if (manifest.tags !== undefined) {
      if (!Array.isArray(manifest.tags)) {
        errors.push(
          makeMessage("error", "schema.type", "$.tags", "'tags' must be an array of strings.")
        );
      } else {
        manifest.tags.forEach((tag, index) => {
          if (typeof tag !== "string") {
            errors.push(
              makeMessage(
                "error",
                "schema.type",
                `$.tags[${index}]`,
                "Animation pack tags must be strings."
              )
            );
          }
        });
      }
    }

    if (!Array.isArray(manifest.clips)) {
      errors.push(
        makeMessage(
          "error",
          "clip.missing",
          "$.clips",
          "Animation pack must include a clips array.",
          "Add at least one clip with name and url."
        )
      );
      return { errors, warnings };
    }

    if (manifest.clips.length === 0) {
      errors.push(
        makeMessage(
          "error",
          "clip.missing",
          "$.clips",
          "Animation pack must include at least one clip.",
          "Add a usable GLB animation clip before publishing the pack."
        )
      );
    }

    manifest.clips.forEach((clip, index) => {
      const path = `$.clips[${index}]`;
      if (!isObject(clip)) {
        errors.push(makeMessage("error", "schema.type", path, "Clip entries must be objects."));
        return;
      }
      if (!clip.name) {
        errors.push(
          makeMessage("error", "schema.required", `${path}.name`, "Clip is missing a name.")
        );
      }
      if (!clip.url) {
        errors.push(
          makeMessage("error", "schema.required", `${path}.url`, "Clip is missing a url.")
        );
      } else if (!isUri(clip.url)) {
        errors.push(
          makeMessage(
            "error",
            "schema.uri",
            `${path}.url`,
            "Clip url must be an absolute URI or repo-relative path.",
            "Use https://... for CDN clips or ./relative/path.glb for local pack assets."
          )
        );
      }
      if (clip.durationSec !== undefined) {
        if (typeof clip.durationSec !== "number" || clip.durationSec < 0) {
          errors.push(
            makeMessage(
              "error",
              "schema.minimum",
              `${path}.durationSec`,
              "durationSec must be a non-negative number."
            )
          );
        }
      }
      if (clip.loop !== undefined && typeof clip.loop !== "boolean") {
        errors.push(
          makeMessage("error", "schema.type", `${path}.loop`, "loop must be a boolean.")
        );
      }
    });

    return { errors, warnings };
  }

  function validateRigAssumptions(manifest, contract = DEFAULT_CONTRACT) {
    const errors = [];
    const warnings = [];
    const rig = manifest?.rigAssumptions || manifest?.rig || {};
    if (!isObject(rig)) return { errors, warnings };

    const targetContract = rig.targetSkeletonContract || rig.skeletonContract;
    if (targetContract && targetContract !== contract.version) {
      errors.push(
        makeMessage(
          "error",
          "rig.contractMismatch",
          "$.rigAssumptions.targetSkeletonContract",
          `Rig assumptions target '${targetContract}', but this validator is using '${contract.version}'.`,
          "Retarget the animation pack or validate it with the matching skeleton contract."
        )
      );
    }

    const sourceRestPose = String(rig.sourceRestPose || rig.restPose || "").toLowerCase();
    const targetRestPose = String(rig.targetRestPose || "").toLowerCase();
    for (const [field, value] of [
      ["sourceRestPose", sourceRestPose],
      ["targetRestPose", targetRestPose]
    ]) {
      if (value && !REST_POSES.has(value)) {
        warnings.push(
          makeMessage(
            "warning",
            "rig.restPoseUnknown",
            `$.rigAssumptions.${field}`,
            `Unknown rest pose '${value}'.`,
            "Use a-pose, t-pose, neutral, or unknown so retargeting expectations are explicit."
          )
        );
      }
    }

    if (
      sourceRestPose &&
      targetRestPose &&
      sourceRestPose !== "unknown" &&
      targetRestPose !== "unknown" &&
      sourceRestPose !== targetRestPose
    ) {
      errors.push(
        makeMessage(
          "error",
          "rig.restPoseMismatch",
          "$.rigAssumptions",
          `Source rest pose '${sourceRestPose}' does not match target rest pose '${targetRestPose}'.`,
          "Retarget the clip or document that the pack requires pose correction before Studio/Blender playback."
        )
      );
    }

    if (rig.unitScale !== undefined && (typeof rig.unitScale !== "number" || rig.unitScale <= 0)) {
      errors.push(
        makeMessage(
          "error",
          "rig.unitScale",
          "$.rigAssumptions.unitScale",
          "unitScale must be a positive number."
        )
      );
    }

    const declaredBones = rig.bones || manifest?.targetBones;
    if (declaredBones !== undefined && !Array.isArray(declaredBones)) {
      errors.push(
        makeMessage(
          "error",
          "rig.bonesType",
          "$.rigAssumptions.bones",
          "Declared rig bones must be an array of names."
        )
      );
    }

    if (Array.isArray(declaredBones)) {
      const { canonical, required } = buildContractSets(contract);
      const declared = new Set();
      declaredBones.forEach((bone, index) => {
        const key = keyForName(bone, contract);
        if (!key) return;
        declared.add(key);
        if (!canonical.has(key)) {
          warnings.push(
            makeMessage(
              "warning",
              "rig.boneUnknown",
              `$.rigAssumptions.bones[${index}]`,
              `Bone '${bone}' is not in skeleton contract ${contract.version}.`,
              "Use a canonical BODY bone name or add a documented alias."
            )
          );
        }
      });
      for (const requiredBone of required) {
        if (!declared.has(requiredBone)) {
          errors.push(
            makeMessage(
              "error",
              "rig.requiredBoneMissing",
              "$.rigAssumptions.bones",
              `Required skeleton bone '${requiredBone}' is not declared.`,
              "BODY-compatible packs must include required contract bones."
            )
          );
        }
      }
    }

    return { errors, warnings };
  }

  function collectClipTracks(clip) {
    if (Array.isArray(clip?.tracks)) return clip.tracks;
    if (Array.isArray(clip?.trackNames)) return clip.trackNames;
    if (Array.isArray(clip?.channels)) return clip.channels;
    return [];
  }

  function validateClipTracks(manifest, contract = DEFAULT_CONTRACT, options = {}) {
    const errors = [];
    const warnings = [];
    const { canonical } = buildContractSets(contract);
    const locationAllowlist = new Set(
      [
        ...DEFAULT_LOCATION_BONES,
        ...(contract.safeLocationBones || []),
        ...(manifest?.validation?.allowLocationTracks || []),
        ...(manifest?.rules?.allowLocationTracks || [])
      ]
        .map((bone) => keyForName(bone, contract))
        .filter(Boolean)
    );
    const strictTracks = Boolean(options.strictTracks);
    let trackCount = 0;

    (manifest.clips || []).forEach((clip, clipIndex) => {
      const path = `$.clips[${clipIndex}]`;
      const tracks = collectClipTracks(clip);
      const clipAllowlist = new Set(locationAllowlist);
      for (const bone of clip.allowLocationTracks || []) {
        const key = keyForName(bone, contract);
        if (key) clipAllowlist.add(key);
      }

      if (!tracks.length) {
        warnings.push(
          makeMessage(
            "warning",
            "clip.trackMetadataMissing",
            path,
            `Clip '${clip?.name || clipIndex}' has no track metadata.`,
            "Run tools/validate-animation-pack.mjs with --scan-glb, or add clip.tracks so scale/location/bone checks can run before playback."
          )
        );
        return;
      }

      tracks.forEach((track, trackIndex) => {
        const normalized = normalizeTrackDefinition(track);
        trackCount += 1;
        const trackPath = `${path}.tracks[${trackIndex}]`;
        const property = normalizeProperty(normalized.property);
        const boneKey = keyForName(normalized.target, contract);
        const trackLabel = normalized.name || `${normalized.target}.${property}`;

        if (!property) {
          warnings.push(
            makeMessage(
              "warning",
              "track.propertyMissing",
              trackPath,
              `Track '${trackLabel}' does not expose an animation property.`,
              "Use track names like Hips.quaternion, Hips.position, or Hips.scale."
            )
          );
          return;
        }

        if (boneKey && !canonical.has(boneKey)) {
          errors.push(
            makeMessage(
              "error",
              "track.boneUnknown",
              trackPath,
              `Track '${trackLabel}' targets bone '${normalized.target}', which is not in skeleton contract ${contract.version}.`,
              "Retarget the track to a BODY bone or add a documented alias before publishing."
            )
          );
        }

        if (property === "scale") {
          const message = makeMessage(
            strictTracks ? "error" : "warning",
            "track.scale",
            trackPath,
            `Track '${trackLabel}' animates scale.`,
            "Studio and Blender drop scale tracks by default; bake scale into the rig or remove this channel."
          );
          (strictTracks ? errors : warnings).push(message);
        }

        if (property === "position" && boneKey && !clipAllowlist.has(boneKey)) {
          const message = makeMessage(
            strictTracks ? "error" : "warning",
            "track.locationUnsafe",
            trackPath,
            `Track '${trackLabel}' animates location on non-root bone '${normalized.target}'.`,
            "Only root/hips location is allowed by default. Convert this to rotation or explicitly allow the bone."
          );
          (strictTracks ? errors : warnings).push(message);
        }
      });
    });

    return { errors, warnings, trackCount };
  }

  function validateAnimationPack(manifest, options = {}) {
    const schema = options.schema || null;
    const contract = extractSkeletonContract(options.contract || DEFAULT_CONTRACT);
    const schemaResult = validateSchemaShape(manifest, schema);
    const rigResult = validateRigAssumptions(manifest, contract);
    const trackResult = Array.isArray(manifest?.clips)
      ? validateClipTracks(manifest, contract, options)
      : { errors: [], warnings: [], trackCount: 0 };

    const errors = [...schemaResult.errors, ...rigResult.errors, ...trackResult.errors];
    const warnings = [...schemaResult.warnings, ...rigResult.warnings, ...trackResult.warnings];

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      summary: {
        clipCount: Array.isArray(manifest?.clips) ? manifest.clips.length : 0,
        trackCount: trackResult.trackCount,
        skeletonContract: manifest?.skeletonContract || null,
        expectedSkeletonContract: contract.version
      }
    };
  }

  const api = {
    DEFAULT_CONTRACT,
    baseKey,
    keyForName,
    extractSkeletonContract,
    normalizeTrackDefinition,
    validateAnimationPack
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    window.FrienemiesAnimationPackValidator = api;
  }
})();
