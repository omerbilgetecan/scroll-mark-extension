# 📍 ScrollMark - Chrome Extension (Manifest V3)

<img width="400" height="550" alt="Screenshot_3" src="https://github.com/user-attachments/assets/229df6bd-ba7b-4523-a5df-fd2fe550e2a9" />

**ScrollMark** is a sleek, modern Chrome Extension designed to save and restore your reading position across any website when you click **"Save Mark"**. Drop custom scroll pins with notes, view reading progress, and jump back to where you left off instantly!

---

## ✨ Features

- ⚡ **Master Power ON/OFF Switch**: Easily enable or disable all extension functionality globally with one click from the popup header or settings tab.
- 📌 **Manual Scroll Mark Saving**: Save your exact scroll position and site URL on-demand by clicking the **"Save Current Mark"** button, floating HUD button, right-click context menu, or keyboard shortcut.
- 🔄 **Scroll Position Restoration**: Automatically jumps to your saved position or displays a floating jump badge when returning to saved pages.
- 📌 **Named Scroll Pins**: Save specific locations on pages (e.g., *"Chapter 3 summary"* or *"Code example 4"*) with custom notes and timestamped bookmarks.
- 🎈 **Floating Helper Pill**: Non-intrusive floating indicator in the corner of web pages for 1-click position restoration.
- 🎯 **Visual Popup Dashboard**: High-tech gauge UI displaying current scroll position, site pins, saved sites history with search/filter, and full settings control.
- 🏷️ **Dynamic Badge Overlay**: Displays active reading percentage directly on your browser toolbar icon.
- ⚡ **Keyboard Shortcuts**:
  - `Alt + Shift + S`: Drop a named Pin at your current position.
  - `Alt + Shift + R`: Jump directly to saved position.
- 🖱️ **Context Menu Integration**: Right-click anywhere to save, restore, or pin positions.
- 💾 **Export & Import Backup**: Easily back up or transfer your saved reading history via JSON files.

---

## 🚀 How to Load & Test in Chrome

1. Open **Google Chrome** (or Microsoft Edge / Brave).
2. Go to the extensions management page by entering:
   `chrome://extensions` in the address bar.
3. Enable **Developer mode** using the toggle switch in the **top-right corner**.
4. Click the **"Load unpacked"** button in the top-left menu.
5. Select the project directory:
   `D:\VStudioProjects\my_Extension`
6. Done! 🎉 Pin **ScrollMark** to your Chrome toolbar and test it out on any article or web page!

---

## 📁 Project Architecture

```
my_Extension/
├── manifest.json       # Extension Manifest V3 configuration
├── background.js       # Background service worker (Context menu, badge sync)
├── content.js          # Injected content script (Scroll monitoring, HUD, Toasts)
├── content.css         # Isolated CSS styles for injected elements
├── popup.html          # Extension popup markup
├── popup.css           # Modern dark-mode glassmorphism styling
├── popup.js            # Popup UI logic & chrome.storage manager
├── generate_icons.js   # Script for generating PNG icon assets
└── icons/              # Extension icons (16x16, 48x48, 128x128)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🛠️ Customization & Next Steps

- **Blacklist Domains**: Go to Settings tab in the popup to customize behavior.
- **Styling**: All popup styles are customizable in `popup.css` using standard CSS variables (`:root`).

-Made by Antigravity
