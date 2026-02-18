(function attachCarouselUtils(global) {
  function getCardMetrics(root) {
    const style = getComputedStyle(root || document.documentElement);
    const cardWidth = parseFloat(style.getPropertyValue("--card-width")) || 120;
    const cardGap = parseFloat(style.getPropertyValue("--card-gap")) || 14;
    return { cardWidth, cardGap, step: cardWidth + cardGap };
  }

  function getViewportMetrics(viewport, step) {
    const vpWidth = viewport?.clientWidth || 0;
    const visibleCount = Math.max(1, Math.floor(vpWidth / (step || 1)));
    return { vpWidth, visibleCount };
  }

  function getEdgePad(vpWidth, cardWidth) {
    return Math.max(0, (vpWidth - cardWidth) / 2);
  }

  function indexToScrollLeft(index, metrics) {
    const { vpWidth = 0, step = 1, cardWidth = 0 } = metrics || {};
    const edgePad = getEdgePad(vpWidth, cardWidth);
    return edgePad + index * step + cardWidth / 2 - vpWidth / 2;
  }

  function scrollLeftToIndex(scrollLeft, metrics) {
    const { vpWidth = 0, step = 1, cardWidth = 0, totalCount = 0 } = metrics || {};
    if (!totalCount) return 0;
    const edgePad = getEdgePad(vpWidth, cardWidth);
    const centerPixel = scrollLeft + vpWidth / 2;
    const index = Math.round((centerPixel - edgePad - cardWidth / 2) / step);
    return Math.max(0, Math.min(totalCount - 1, index));
  }

  function getSpacerWidths(params) {
    const {
      renderStart = 0,
      renderEnd = 0,
      totalCount = 0,
      vpWidth = 0,
      step = 1,
      cardWidth = 0
    } = params || {};

    const edgePad = getEdgePad(vpWidth, cardWidth);
    const leftWidth = edgePad + renderStart * step;
    const rightTokens = totalCount - renderEnd;
    const rightWidth = rightTokens * step + edgePad;
    return {
      leftWidth: Math.max(0, leftWidth),
      rightWidth: Math.max(0, rightWidth)
    };
  }

  global.FrienemiesCarouselUtils = {
    getCardMetrics,
    getViewportMetrics,
    indexToScrollLeft,
    scrollLeftToIndex,
    getSpacerWidths
  };
})(window);
