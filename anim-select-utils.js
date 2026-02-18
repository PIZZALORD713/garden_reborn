(() => {
  function populateOnboardingAnimationSelects(onboardingSelectEl, controlSelectEl, populateFn, presets = []) {
    if (typeof populateFn !== "function") return;
    populateFn(onboardingSelectEl, presets);
    populateFn(controlSelectEl, presets);
  }

  function getSelectedAnimUrl(controlSelectEl, onboardingSelectEl, presets = []) {
    return controlSelectEl?.value || onboardingSelectEl?.value || presets?.[0]?.[1] || "";
  }

  window.FrienemiesAnimSelectUtils = {
    populateOnboardingAnimationSelects,
    getSelectedAnimUrl
  };
})();
