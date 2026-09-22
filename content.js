// ScrollMark - Content Script
(function () {
  if (window.hasScrollMarkInjected) return;
  window.hasScrollMarkInjected = true;

  let pageKey = getPageKey(location.href);
  let currentSettings = {
    extensionEnabled: true,
    autoRestore: true,
    showFloatingBadge: true,
    smoothScroll: true,
    showBadgePercentage: true,
    blacklist: []
  };

  function getPageKey(urlStr) {
    try {
      const u = new URL(urlStr);
      return `scrollmark:${u.origin}${u.pathname}`;
    } catch (e) {
      return `scrollmark:${urlStr}`;
    }
  }

  function cleanupUI() {
    const toastRoot = document.getElementById("scrollmark-toast-root");
    if (toastRoot) toastRoot.remove();
    const hudRoot = document.getElementById("scrollmark-hud-root");
    if (hudRoot) hudRoot.remove();
    const modalRoot = document.getElementById("scrollmark-modal-root");
    if (modalRoot) modalRoot.remove();
  }

  // Load Settings and Initial Scroll Restore
  function init() {
    chrome.storage.local.get(["settings", pageKey], (result) => {
      if (result.settings) {
        currentSettings = { ...currentSettings, ...result.settings };
      }

      if (currentSettings.extensionEnabled === false) {
        cleanupUI();
        return;
      }

      // Check if domain is blacklisted
      const isBlacklisted = currentSettings.blacklist && currentSettings.blacklist.some(domain => 
        location.hostname.includes(domain)
      );

      if (isBlacklisted) return;

      const pageData = result[pageKey];
      if (pageData && pageData.scrollY > 40) {
        if (currentSettings.autoRestore) {
          // Delay slightly to ensure page layout rendering completes
          setTimeout(() => {
            scrollToPosition(pageData.scrollY, currentSettings.smoothScroll);
            showToast(`Restored to ${pageData.percentage}%`, pageData.scrollY);
          }, 300);
        } else if (currentSettings.showFloatingBadge) {
          showFloatingBadge(pageData.percentage, pageData.scrollY);
        }
      }
    });
  }

  // Calculate current scroll metrics
  function getScrollMetrics() {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - window.innerHeight;

    const percentage = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100))) : 0;

    return { scrollY, percentage, maxScroll };
  }

  // Save current scroll position to chrome.storage (triggered ONLY when Save Mark button is clicked)
  function saveCurrentPosition(customPin = null) {
    if (currentSettings.extensionEnabled === false) return;
    const { scrollY, percentage } = getScrollMetrics();
    if (scrollY < 10 && !customPin) return;

    chrome.storage.local.get([pageKey], (result) => {
      const existing = result[pageKey] || { pins: [] };
      let updatedPins = existing.pins || [];

      if (customPin) {
        updatedPins.unshift({
          id: Date.now().toString(),
          label: customPin.label || `Pin at ${percentage}%`,
          scrollY: scrollY,
          percentage: percentage,
          timestamp: Date.now()
        });
      }

      const pageData = {
        url: location.href,
        title: document.title || location.hostname,
        domain: location.hostname,
        scrollY: scrollY,
        percentage: percentage,
        lastUpdated: Date.now(),
        pins: updatedPins
      };

      chrome.storage.local.set({ [pageKey]: pageData }, () => {
        // Send badge update to service worker
        chrome.runtime.sendMessage({
          action: "UPDATE_BADGE",
          percentage: percentage
        }).catch(() => {});
      });
    });
  }

  // Scroll to target Y position
  function scrollToPosition(targetY, smooth = true) {
    window.scrollTo({
      top: targetY,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  // Floating Toast Notification
  function showToast(message, savedY) {
    let existingToast = document.getElementById("scrollmark-toast-root");
    if (existingToast) existingToast.remove();

    const toastRoot = document.createElement("div");
    toastRoot.id = "scrollmark-toast-root";
    toastRoot.innerHTML = `
      <div id="scrollmark-toast-host">
        <div class="scrollmark-toast">
          <div class="scrollmark-toast-icon">📍</div>
          <div class="scrollmark-toast-content">
            <span class="scrollmark-toast-title">${message}</span>
            <span class="scrollmark-toast-subtitle">ScrollMark restored your reading spot</span>
          </div>
          <div class="scrollmark-toast-actions">
            <button class="scrollmark-toast-btn" id="scrollmark-btn-top">Top</button>
            <button class="scrollmark-toast-close" id="scrollmark-toast-close">&times;</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toastRoot);

    const toastEl = toastRoot.querySelector(".scrollmark-toast");
    setTimeout(() => toastEl.classList.add("scrollmark-show"), 50);

    // Toast event listeners
    toastRoot.querySelector("#scrollmark-btn-top").addEventListener("click", () => {
      scrollToPosition(0, currentSettings.smoothScroll);
      toastEl.classList.remove("scrollmark-show");
      setTimeout(() => toastRoot.remove(), 300);
    });

    toastRoot.querySelector("#scrollmark-toast-close").addEventListener("click", () => {
      toastEl.classList.remove("scrollmark-show");
      setTimeout(() => toastRoot.remove(), 300);
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      if (document.body.contains(toastRoot)) {
        toastEl.classList.remove("scrollmark-show");
        setTimeout(() => toastRoot.remove(), 300);
      }
    }, 4500);
  }

  // Floating Badge Pill in Bottom Right
  function showFloatingBadge(percentage, savedY) {
    let existingHud = document.getElementById("scrollmark-hud-root");
    if (existingHud) existingHud.remove();

    const hudRoot = document.createElement("div");
    hudRoot.id = "scrollmark-hud-root";
    hudRoot.innerHTML = `
      <div id="scrollmark-hud-host">
        <div class="scrollmark-floating-hud">
          <div class="scrollmark-hud-pill" id="scrollmark-hud-jump" title="Click to jump to saved scroll position">
            <span class="scrollmark-hud-dot"></span>
            <span>Jump to ${percentage}%</span>
          </div>
          <div class="scrollmark-hud-btn-group">
            <button class="scrollmark-hud-action-btn" id="scrollmark-hud-pin" title="Pin current scroll position">📌</button>
            <button class="scrollmark-hud-action-btn" id="scrollmark-hud-top" title="Scroll to top">⬆️</button>
            <button class="scrollmark-hud-action-btn" id="scrollmark-hud-close" title="Hide badge">&times;</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(hudRoot);

    hudRoot.querySelector("#scrollmark-hud-jump").addEventListener("click", () => {
      scrollToPosition(savedY, currentSettings.smoothScroll);
      showToast(`Jumped to ${percentage}%`, savedY);
    });

    hudRoot.querySelector("#scrollmark-hud-pin").addEventListener("click", () => {
      promptAddPin();
    });

    hudRoot.querySelector("#scrollmark-hud-top").addEventListener("click", () => {
      scrollToPosition(0, currentSettings.smoothScroll);
    });

    hudRoot.querySelector("#scrollmark-hud-close").addEventListener("click", () => {
      hudRoot.remove();
    });
  }

  // Interactive Pin Modal
  function promptAddPin() {
    let existingModal = document.getElementById("scrollmark-modal-root");
    if (existingModal) existingModal.remove();

    const { scrollY, percentage } = getScrollMetrics();

    const modalRoot = document.createElement("div");
    modalRoot.id = "scrollmark-modal-root";
    modalRoot.innerHTML = `
      <div id="scrollmark-hud-host">
        <div class="scrollmark-modal-overlay">
          <div class="scrollmark-modal-card">
            <div class="scrollmark-modal-header">
              <span>📌</span> Pin Scroll Position (${percentage}%)
            </div>
            <input type="text" class="scrollmark-modal-input" id="scrollmark-pin-input" placeholder="e.g. Chapter 3, Key insights, Stopped reading..." />
            <div class="scrollmark-modal-buttons">
              <button class="scrollmark-modal-btn-cancel" id="scrollmark-modal-cancel">Cancel</button>
              <button class="scrollmark-modal-btn-confirm" id="scrollmark-modal-confirm">Save Pin</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalRoot);

    const inputEl = modalRoot.querySelector("#scrollmark-pin-input");
    inputEl.focus();

    const closeModal = () => modalRoot.remove();

    modalRoot.querySelector("#scrollmark-modal-cancel").addEventListener("click", closeModal);
    
    const savePinHandler = () => {
      const label = inputEl.value.trim() || `Bookmark at ${percentage}%`;
      saveCurrentPosition({ label });
      closeModal();
      showToast(`Saved pin: "${label}"`, scrollY);
    };

    modalRoot.querySelector("#scrollmark-modal-confirm").addEventListener("click", savePinHandler);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") savePinHandler();
      if (e.key === "Escape") closeModal();
    });
  }

  // Keyboard Shortcuts Listener
  document.addEventListener("keydown", (e) => {
    if (currentSettings.extensionEnabled === false) return;

    // Alt + Shift + S => Add Pin
    if (e.altKey && e.shiftKey && e.code === "KeyS") {
      e.preventDefault();
      promptAddPin();
    }
    // Alt + Shift + R => Restore Scroll
    if (e.altKey && e.shiftKey && e.code === "KeyR") {
      e.preventDefault();
      chrome.storage.local.get([pageKey], (result) => {
        const data = result[pageKey];
        if (data && data.scrollY) {
          scrollToPosition(data.scrollY, true);
          showToast(`Jumped to ${data.percentage}%`, data.scrollY);
        }
      });
    }
  });

  // Listen for messages from Background / Popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "TOGGLE_EXTENSION") {
      currentSettings.extensionEnabled = message.enabled;
      if (message.enabled) {
        init();
      } else {
        cleanupUI();
      }
      sendResponse({ status: "toggled", enabled: message.enabled });
    } else if (message.action === "SAVE_SCROLL_NOW") {
      if (currentSettings.extensionEnabled === false) {
        sendResponse({ status: "disabled" });
        return;
      }
      saveCurrentPosition();
      const { percentage } = getScrollMetrics();
      showToast(`Position saved (${percentage}%)`, window.scrollY);
      sendResponse({ status: "saved", percentage });
    } else if (message.action === "RESTORE_SCROLL_NOW") {
      if (currentSettings.extensionEnabled === false) {
        sendResponse({ status: "disabled" });
        return;
      }
      chrome.storage.local.get([pageKey], (result) => {
        const data = result[pageKey];
        if (data && data.scrollY) {
          scrollToPosition(data.scrollY, true);
          showToast(`Restored to ${data.percentage}%`, data.scrollY);
          sendResponse({ status: "restored", scrollY: data.scrollY });
        } else {
          sendResponse({ status: "no_data" });
        }
      });
      return true; // async response
    } else if (message.action === "PROMPT_ADD_PIN") {
      if (currentSettings.extensionEnabled === false) {
        sendResponse({ status: "disabled" });
        return;
      }
      promptAddPin();
      sendResponse({ status: "prompted" });
    } else if (message.action === "JUMP_TO_Y") {
      scrollToPosition(message.targetY, true);
      sendResponse({ status: "jumped" });
    } else if (message.action === "GET_CURRENT_STATUS") {
      const metrics = getScrollMetrics();
      chrome.storage.local.get([pageKey], (result) => {
        sendResponse({
          metrics,
          savedData: result[pageKey] || null,
          enabled: currentSettings.extensionEnabled !== false
        });
      });
      return true;
    }
  });

  // Initialize on document ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
