(() => {
  function setControlPanelOpenState({ open, panel, gear }) {
    panel?.classList.toggle("is-open", !!open);
    panel?.setAttribute("aria-hidden", open ? "false" : "true");
    gear?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function computeControlAnchorStyles({
    windowWidth,
    windowHeight,
    carouselRect,
    hasPanel
  }) {
    const bottomGap = Math.max(12, windowHeight - carouselRect.bottom + 12);

    if (windowWidth <= 780) {
      return {
        gearStyle: {
          left: "",
          right: "12px",
          bottom: `${bottomGap}px`
        },
        panelStyle: hasPanel
          ? {
              left: "",
              right: "",
              bottom: ""
            }
          : null
      };
    }

    const gearLeft = Math.min(windowWidth - 54, carouselRect.right + 10);
    const panelWidth = Math.min(360, windowWidth - 96);
    const preferredLeft = gearLeft + 50;
    const maxLeft = windowWidth - panelWidth - 12;

    return {
      gearStyle: {
        left: `${gearLeft}px`,
        right: "auto",
        bottom: `${bottomGap}px`
      },
      panelStyle: hasPanel
        ? {
            left: `${Math.min(preferredLeft, maxLeft)}px`,
            right: "auto",
            bottom: `${Math.max(20, bottomGap - 6)}px`
          }
        : null
    };
  }

  function computeControlVisibility({ isCarouselHidden, carouselDismissed }) {
    return !isCarouselHidden && !carouselDismissed;
  }

  function applyControlTabState({ tab, tabButtons, sections }) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.controlTab === tab);
    });
    sections.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.controlSection === tab);
    });
  }

  window.FrienemiesControlPanelUtils = {
    setControlPanelOpenState,
    computeControlAnchorStyles,
    computeControlVisibility,
    applyControlTabState
  };
})();
