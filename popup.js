// ScrollMark Popup Logic

document.addEventListener("DOMContentLoaded", () => {
  let activeTabObj = null;
  let activePageKey = "";

  // Tab Navigation Setup
  const tabBtns = document.querySelectorAll(".nav-tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(targetId).classList.add("active");

      if (targetId === "tab-saved") {
        loadSavedSites();
      } else if (targetId === "tab-settings") {
        loadSettings();
      }
    });
  });

  // Query Active Tab Information
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    activeTabObj = tabs[0];
    const url = activeTabObj.url || "";
    
    if (url) {
      try {
        const u = new URL(url);
        document.getElementById("active-domain").textContent = u.hostname;
        activePageKey = `scrollmark:${u.origin}${u.pathname}`;
      } catch (e) {
        document.getElementById("active-domain").textContent = "Local Page";
        activePageKey = `scrollmark:${url}`;
      }
    }

    refreshActiveTabStatus();
  });

  // Refresh Active Page Gauge & Pins
  function refreshActiveTabStatus() {
    if (!activeTabObj || !activeTabObj.id) return;

    // Send message to content script to get current metrics
    chrome.tabs.sendMessage(activeTabObj.id, { action: "GET_CURRENT_STATUS" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        // Fallback: Read directly from chrome.storage if content script isn't reachable
        fetchPageFromStorage();
        return;
      }

      const { metrics, savedData } = res;
      updateGauge(metrics ? metrics.percentage : (savedData ? savedData.percentage : 0));
      renderPins(savedData ? savedData.pins : []);
    });
  }

  function fetchPageFromStorage() {
    if (!activePageKey) return;
    chrome.storage.local.get([activePageKey], (result) => {
      const data = result[activePageKey];
      updateGauge(data ? data.percentage : 0);
      renderPins(data ? data.pins : []);
    });
  }

  // Update Progress Gauge
  function updateGauge(percentage) {
    const pct = Math.min(100, Math.max(0, percentage || 0));
    document.getElementById("scroll-percentage").textContent = `${pct}%`;
    
    const gaugeBar = document.getElementById("gauge-bar");
    const maxOffset = 283;
    const offset = maxOffset - (maxOffset * pct) / 100;
    gaugeBar.style.strokeDashoffset = offset;
  }

  // Render Page Pins
  function renderPins(pins) {
    const container = document.getElementById("pins-container");
    const countEl = document.getElementById("pin-count");

    if (!pins || pins.length === 0) {
      countEl.textContent = "0 pins";
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📍</div>
          <span>No pins added for this page yet.<br>Click "Add Custom Pin" above to create one.</span>
        </div>
      `;
      return;
    }

    countEl.textContent = `${pins.length} pin${pins.length > 1 ? 's' : ''}`;
    container.innerHTML = pins.map((pin) => `
      <div class="pin-item">
        <div class="pin-info">
          <span class="pin-label">${escapeHtml(pin.label)}</span>
          <span class="pin-meta">${pin.percentage}% • ${formatTime(pin.timestamp)}</span>
        </div>
        <div class="pin-actions">
          <button class="btn-icon-sm btn-jump-pin" data-y="${pin.scrollY}" title="Jump to Pin">🚀</button>
          <button class="btn-icon-sm btn-delete-pin" data-id="${pin.id}" title="Delete Pin">🗑️</button>
        </div>
      </div>
    `).join("");

    // Pin Jump Event Handlers
    container.querySelectorAll(".btn-jump-pin").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetY = parseInt(btn.getAttribute("data-y"), 10);
        if (activeTabObj && activeTabObj.id) {
          chrome.tabs.sendMessage(activeTabObj.id, { action: "JUMP_TO_Y", targetY });
        }
      });
    });

    // Pin Delete Event Handlers
    container.querySelectorAll(".btn-delete-pin").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pinId = btn.getAttribute("data-id");
        deletePin(pinId);
      });
    });
  }

  // Delete a Pin
  function deletePin(pinId) {
    if (!activePageKey) return;
    chrome.storage.local.get([activePageKey], (result) => {
      const data = result[activePageKey];
      if (!data || !data.pins) return;
      data.pins = data.pins.filter((p) => p.id !== pinId);
      chrome.storage.local.set({ [activePageKey]: data }, () => {
        renderPins(data.pins);
      });
    });
  }

  // Button Handlers for Active Tab
  document.getElementById("btn-save-now").addEventListener("click", () => {
    if (!activeTabObj || !activeTabObj.id) return;
    chrome.tabs.sendMessage(activeTabObj.id, { action: "SAVE_SCROLL_NOW" }, () => {
      refreshActiveTabStatus();
    });
  });

  document.getElementById("btn-restore-now").addEventListener("click", () => {
    if (!activeTabObj || !activeTabObj.id) return;
    chrome.tabs.sendMessage(activeTabObj.id, { action: "RESTORE_SCROLL_NOW" });
  });

  document.getElementById("btn-add-pin").addEventListener("click", () => {
    if (!activeTabObj || !activeTabObj.id) return;
    chrome.tabs.sendMessage(activeTabObj.id, { action: "PROMPT_ADD_PIN" }, () => {
      window.close(); // close popup to let user view modal in page
    });
  });

  // Saved Sites Logic
  function loadSavedSites(filter = "") {
    const container = document.getElementById("saved-sites-container");
    
    chrome.storage.local.get(null, (allData) => {
      const savedItems = [];
      
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith("scrollmark:") && value && value.url) {
          savedItems.push(value);
        }
      }

      savedItems.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

      const filtered = savedItems.filter((item) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return (item.title && item.title.toLowerCase().includes(q)) || 
               (item.url && item.url.toLowerCase().includes(q)) ||
               (item.domain && item.domain.toLowerCase().includes(q));
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <span>${filter ? 'No saved pages matching search.' : 'No pages tracked yet. Start scrolling on websites to automatically save positions.'}</span>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map((item) => `
        <div class="site-card" data-url="${escapeHtml(item.url)}">
          <div class="site-details">
            <img class="site-favicon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain)}&sz=32" onerror="this.src='icons/icon16.png'" />
            <div>
              <div class="site-title">${escapeHtml(item.title || item.domain)}</div>
              <div class="site-sub">${escapeHtml(item.domain)} • ${formatTime(item.lastUpdated)}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="site-tag">${item.percentage}%</span>
            <button class="btn-icon-sm btn-delete-site" data-key="scrollmark:${getPageKeyFromUrl(item.url)}" title="Remove Entry">&times;</button>
          </div>
        </div>
      `).join("");

      // Open Saved Page Click
      container.querySelectorAll(".site-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("btn-delete-site")) return;
          const targetUrl = card.getAttribute("data-url");
          chrome.tabs.create({ url: targetUrl });
        });
      });

      // Delete Entry Click
      container.querySelectorAll(".btn-delete-site").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const keyToDelete = btn.getAttribute("data-key");
          chrome.storage.local.remove(keyToDelete, () => {
            loadSavedSites(filter);
          });
        });
      });
    });
  }

  // Search Filter Handler
  document.getElementById("search-sites").addEventListener("input", (e) => {
    loadSavedSites(e.target.value);
  });

  // Clear All Data
  document.getElementById("btn-clear-all").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all saved scroll data?")) {
      chrome.storage.local.get(null, (allData) => {
        const keysToRemove = Object.keys(allData).filter((k) => k.startsWith("scrollmark:"));
        chrome.storage.local.remove(keysToRemove, () => {
          loadSavedSites();
          refreshActiveTabStatus();
        });
      });
    }
  });

  // Settings Logic
  function loadSettings() {
    chrome.storage.local.get(["settings"], (result) => {
      const s = result.settings || {
        extensionEnabled: true,
        autoRestore: true,
        showFloatingBadge: true,
        smoothScroll: true,
        showBadgePercentage: true
      };

      const enabled = s.extensionEnabled !== false;
      setMasterPowerState(enabled, false);

      document.getElementById("setting-auto-restore").checked = s.autoRestore !== false;
      document.getElementById("setting-floating-badge").checked = s.showFloatingBadge !== false;
      document.getElementById("setting-smooth-scroll").checked = s.smoothScroll !== false;
      document.getElementById("setting-badge-pct").checked = s.showBadgePercentage !== false;
    });
  }

  // Master Power Switch Logic
  const masterToggle = document.getElementById("master-toggle");
  const settingMasterEnable = document.getElementById("setting-master-enable");
  const disabledBanner = document.getElementById("disabled-banner");
  const tabActiveEl = document.getElementById("tab-active");

  function setMasterPowerState(enabled, updateStorage = true) {
    if (masterToggle) masterToggle.checked = enabled;
    if (settingMasterEnable) settingMasterEnable.checked = enabled;

    if (enabled) {
      if (disabledBanner) disabledBanner.style.display = "none";
      if (tabActiveEl) tabActiveEl.classList.remove("is-disabled");
    } else {
      if (disabledBanner) disabledBanner.style.display = "block";
      if (tabActiveEl) tabActiveEl.classList.add("is-disabled");
    }

    if (updateStorage) {
      chrome.storage.local.get(["settings"], (result) => {
        const s = result.settings || {};
        s.extensionEnabled = enabled;
        chrome.storage.local.set({ settings: s }, () => {
          if (activeTabObj && activeTabObj.id) {
            chrome.tabs.sendMessage(activeTabObj.id, { action: "TOGGLE_EXTENSION", enabled }).catch(() => {});
          }
          chrome.runtime.sendMessage({ action: "REFRESH_BADGE" }).catch(() => {});
        });
      });
    }
  }

  if (masterToggle) {
    masterToggle.addEventListener("change", (e) => {
      setMasterPowerState(e.target.checked, true);
    });
  }

  if (settingMasterEnable) {
    settingMasterEnable.addEventListener("change", (e) => {
      setMasterPowerState(e.target.checked, true);
    });
  }

  // Initial load of master settings on startup
  loadSettings();

  function saveSettings() {
    chrome.storage.local.get(["settings"], (result) => {
      const current = result.settings || {};
      const newSettings = {
        ...current,
        extensionEnabled: document.getElementById("master-toggle") ? document.getElementById("master-toggle").checked : true,
        autoRestore: document.getElementById("setting-auto-restore").checked,
        showFloatingBadge: document.getElementById("setting-floating-badge").checked,
        smoothScroll: document.getElementById("setting-smooth-scroll").checked,
        showBadgePercentage: document.getElementById("setting-badge-pct").checked
      };

      chrome.storage.local.set({ settings: newSettings });
    });
  }

  // Bind Settings Changes
  ["setting-auto-restore", "setting-floating-badge", "setting-smooth-scroll", "setting-badge-pct"].forEach((id) => {
    document.getElementById(id).addEventListener("change", saveSettings);
  });

  // Export Data JSON
  document.getElementById("btn-export-data").addEventListener("click", () => {
    chrome.storage.local.get(null, (allData) => {
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ScrollMark_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Import Data JSON
  const importInput = document.getElementById("import-file-input");
  document.getElementById("btn-import-data").addEventListener("click", () => {
    importInput.click();
  });

  importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        chrome.storage.local.set(importedData, () => {
          alert("ScrollMark data imported successfully!");
          loadSettings();
          refreshActiveTabStatus();
        });
      } catch (err) {
        alert("Failed to parse backup JSON file.");
      }
    };
    reader.readAsText(file);
  });

  // Utilities
  function formatTime(timestamp) {
    if (!timestamp) return "";
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getPageKeyFromUrl(urlStr) {
    try {
      const u = new URL(urlStr);
      return `${u.origin}${u.pathname}`;
    } catch (e) {
      return urlStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
});
