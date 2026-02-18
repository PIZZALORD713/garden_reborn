(function attachFrienemiesConsoleUtils(globalScope) {
  function renderConsoleViewer({ viewer, logBuffer }) {
    if (!viewer || !Array.isArray(logBuffer)) return;
    viewer.textContent = logBuffer.join("\n");
    viewer.scrollTop = viewer.scrollHeight;
  }

  function appendLogEntry({
    text,
    cls = "",
    logBuffer,
    logBufferMax = 300,
    viewer,
    debugLog,
    maxLines = 220
  }) {
    const entry = String(text);
    if (Array.isArray(logBuffer)) {
      logBuffer.push(entry);
      while (logBuffer.length > logBufferMax) logBuffer.shift();
    }

    renderConsoleViewer({ viewer, logBuffer });

    if (!debugLog) return;

    const nearBottom =
      debugLog.scrollTop + debugLog.clientHeight >= debugLog.scrollHeight - 30;

    const div = document.createElement("div");
    div.className = `logLine ${cls}`.trim();
    div.textContent = entry;
    debugLog.appendChild(div);

    while (debugLog.childNodes.length > maxLines) {
      debugLog.removeChild(debugLog.firstChild);
    }

    if (nearBottom) debugLog.scrollTop = debugLog.scrollHeight;
  }

  function clearLogEntries({ debugLog, logBuffer, viewer }) {
    if (debugLog) debugLog.innerHTML = "";
    if (Array.isArray(logBuffer)) logBuffer.length = 0;
    renderConsoleViewer({ viewer, logBuffer });
  }

  globalScope.FrienemiesConsoleUtils = {
    renderConsoleViewer,
    appendLogEntry,
    clearLogEntries
  };
})(window);
