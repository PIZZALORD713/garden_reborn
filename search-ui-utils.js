(() => {
  function updateResetCollectionVisibility(button, tokenIds = [], defaultTokenIds = []) {
    if (!button) return;
    const isFiltered = tokenIds.length < defaultTokenIds.length;
    button.classList.toggle("is-visible", isFiltered);
    button.setAttribute("aria-hidden", isFiltered ? "false" : "true");
  }

  function renderSearchMessage(
    container,
    message,
    { tone = "info", showReset = false, hint = "" } = {}
  ) {
    if (!container) return;

    container.innerHTML = "";

    const notice = document.createElement("div");
    notice.className = `searchNotice searchNotice--${tone}`;
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");

    const msgEl = document.createElement("p");
    msgEl.className = "searchNoticeMessage";
    msgEl.textContent = String(message || "");
    notice.appendChild(msgEl);

    if (tone === "loading") {
      const shimmer = document.createElement("div");
      shimmer.className = "searchNoticeShimmer";
      shimmer.setAttribute("aria-hidden", "true");
      notice.appendChild(shimmer);
    }

    if (hint) {
      const hintEl = document.createElement("p");
      hintEl.className = "searchNoticeHint";
      hintEl.textContent = String(hint);
      notice.appendChild(hintEl);
    }

    if (showReset) {
      const actionBtn = document.createElement("button");
      actionBtn.className = "searchNoticeAction";
      actionBtn.type = "button";
      actionBtn.dataset.searchAction = "reset-collection";
      actionBtn.textContent = "View full collection";
      notice.appendChild(actionBtn);
    }

    container.appendChild(notice);
  }

  window.FrienemiesSearchUiUtils = {
    updateResetCollectionVisibility,
    renderSearchMessage
  };
})();
