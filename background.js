// ScrollMark - Service Worker (Background Script)

// Initialize Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scrollmark_save",
    title: "📌 Save Scroll Position Here",
    contexts: ["page", "selection", "link"]
  });

  chrome.contextMenus.create({
    id: "scrollmark_restore",
    title: "🚀 Jump to Saved Scroll Position",
    contexts: ["page", "selection", "link"]
  });

  chrome.contextMenus.create({
    id: "scrollmark_add_pin",
    title: "🏷️ Add Named Scroll Pin...",
    contexts: ["page", "selection"]
  });

  // Default settings if not already present
  chrome.storage.local.get(["settings"], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          extensionEnabled: true,
          autoRestore: true,
          showFloatingBadge: true,
          smoothScroll: true,
          showBadgePercentage: true,
          blacklist: []
        }
      });
    }
  });
});

// Handle Context Menu Item Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  chrome.storage.local.get(["settings"], (res) => {
    const settings = res.settings || {};
    if (settings.extensionEnabled === false) return; // Ignore when OFF

    if (info.menuItemId === "scrollmark_save") {
      chrome.tabs.sendMessage(tab.id, { action: "SAVE_SCROLL_NOW" });
    } else if (info.menuItemId === "scrollmark_restore") {
      chrome.tabs.sendMessage(tab.id, { action: "RESTORE_SCROLL_NOW" });
    } else if (info.menuItemId === "scrollmark_add_pin") {
      chrome.tabs.sendMessage(tab.id, { action: "PROMPT_ADD_PIN" });
    }
  });
});

// Listen for messages from Content Script or Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_BADGE") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId && message.percentage !== undefined) {
      chrome.storage.local.get(["settings"], (res) => {
        const settings = res.settings || {};
        if (settings.extensionEnabled === false) {
          chrome.action.setBadgeText({ tabId, text: "OFF" });
          chrome.action.setBadgeBackgroundColor({ tabId, color: "#64748b" });
        } else if (settings.showBadgePercentage !== false && message.percentage > 0) {
          chrome.action.setBadgeText({ tabId, text: `${Math.round(message.percentage)}%` });
          chrome.action.setBadgeBackgroundColor({ tabId, color: "#6366f1" });
        } else {
          chrome.action.setBadgeText({ tabId, text: "" });
        }
      });
    }
    sendResponse({ status: "ok" });
  } else if (message.action === "REFRESH_BADGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        updateBadgeForUrl(tabs[0].id, tabs[0].url);
      }
    });
    sendResponse({ status: "ok" });
  }
});

// Refresh badge when tab is activated or updated
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      updateBadgeForUrl(activeInfo.tabId, tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadgeForUrl(tabId, tab.url);
  }
});

function updateBadgeForUrl(tabId, url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  
  const pageKey = getPageKey(url);
  chrome.storage.local.get([pageKey, "settings"], (result) => {
    const settings = result.settings || {};
    const data = result[pageKey];

    if (settings.extensionEnabled === false) {
      chrome.action.setBadgeText({ tabId, text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#64748b" });
    } else if (settings.showBadgePercentage !== false && data && data.percentage > 0) {
      chrome.action.setBadgeText({ tabId, text: `${Math.round(data.percentage)}%` });
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#6366f1" });
    } else {
      chrome.action.setBadgeText({ tabId, text: "" });
    }
  });
}

// Utility to derive a clean page key from URL
function getPageKey(urlStr) {
  try {
    const u = new URL(urlStr);
    // Use origin + pathname to uniquely identify articles/pages while stripping query params/hashes if needed
    return `scrollmark:${u.origin}${u.pathname}`;
  } catch (e) {
    return `scrollmark:${urlStr}`;
  }
}
