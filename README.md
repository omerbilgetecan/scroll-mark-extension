# 📍 ScrollMark — Last Scroll Keeper

<div align="center">

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome&logoColor=white)
![Chrome](https://img.shields.io/badge/Browser-Chrome%20%7C%20Edge%20%7C%20Brave-success?style=for-the-badge&logo=google-chrome&logoColor=white)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20Storage-brightgreen?style=for-the-badge&logo=shield)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

<br/>

<img width="420" alt="ScrollMark Extension Preview" src="https://github.com/user-attachments/assets/229df6bd-ba7b-4523-a5df-fd2fe550e2a9" />

<p align="center">
  <b>Never lose your reading spot again.</b><br/>
  Save, manage, and seamlessly restore your exact scroll position across any website.
</p>

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Installation Guide](#-installation-guide)
- [Usage Guide](#-usage-guide)
- [Extension Architecture](#-extension-architecture)
- [Permissions & Privacy](#-permissions--privacy)
- [Customization](#-customization)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**ScrollMark** is a fast, lightweight, and modern browser extension built on **Manifest V3**. Whether you are reading long technical documentation, research papers, Reddit discussions, or lengthy articles, ScrollMark remembers exactly where you paused.

With interactive scroll pins, customizable notes, an elegant glassmorphic dashboard, and one-click data backup, ScrollMark gives you complete control over your reading workflow.

---

## ✨ Key Features

### 🎯 Precision Scroll Tracking & Restoration
- **On-Demand & Automatic Restore**: Automatically jump back to your reading spot upon revisiting, or restore manually whenever you want.
- **Smooth Scrolling Animation**: Experience seamless transitions rather than jarring page jumps.
- **Dynamic Toolbar Badge**: Real-time reading percentage overlay (e.g., `42%`) right on your extension icon.

### 📌 Custom Named Pins & Notes
- Drop multiple bookmarks on a single page with custom labels (e.g., *"Chapter 4 Summary"*, *"Bug reproduction steps"*, or *"Code snippet"*).
- Each pin saves exact scroll height, reading percentage, and timestamps.
- Instantly jump to any pin or delete unwanted pins with one click.

### 🎈 In-Page Floating HUD & Interactive Modals
- **Floating Helper Pill**: A clean, non-intrusive floating indicator in the bottom-right corner offering quick jump, pin, and scroll-to-top actions.
- **Toast Notifications**: Minimalist toast alerts confirm restored positions, complete with a quick *"Top"* jump button.
- **In-Page Pin Modal**: Create named pins on the fly without having to open the popup dashboard.

### 📊 Modern Glassmorphism Dashboard
- **Live Circular Gauge**: High-tech SVG progress gauge showing your current page scroll percentage.
- **Saved Sites Library**: Centralized view of all saved pages with site titles, domains, favicons, percentage markers, and relative timestamps.
- **Instant Search & Filter**: Filter saved articles by title, domain, or URL in real-time.
- **Full Settings Management**: Configure toggles for auto-restore, smooth animations, HUD, and badges.

### ⚡ Global Master Power Switch
- Toggle all extension functionality globally with one click from the header or settings tab.
- When paused, badges display `OFF`, content scripts go dormant, and in-page overlays are removed.

### 🔒 100% Private & Offline Backup
- All data is stored locally in `chrome.storage.local`.
- Zero analytics, zero third-party trackers, no account required.
- **Export & Import JSON Backup**: Export your entire reading library as a JSON file to transfer between devices or restore anytime.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `Alt + Shift + S` | **Drop Named Pin** | Opens the in-page modal to save a labeled pin at your current position |
| `Alt + Shift + R` | **Restore Position** | Instantly jumps to your last saved scroll position on the page |

*Note: You can also right-click anywhere on any page to access ScrollMark's context menu actions.*

---

## 🚀 Installation Guide

ScrollMark runs on any Chromium-based browser (Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi).

### Step-by-Step Setup:

1. **Download or Clone the Repository**:
   ```bash
   git clone https://github.com/omerbilgetecan/scroll-mark-extension.git
   ```
   *(Or download and extract the project `.zip` / folder)*

2. **Open Extensions Page**:
   - In **Google Chrome**: navigate to `chrome://extensions`
   - In **Microsoft Edge**: navigate to `edge://extensions`
   - In **Brave**: navigate to `brave://extensions`

3. **Enable Developer Mode**:
   - Toggle the **Developer mode** switch located in the **top-right corner** of the page.

4. **Load the Extension**:
   - Click the **"Load unpacked"** button in the top-left menu.
   - Select the root project folder containing `manifest.json`.

5. **Pin to Toolbar**:
   - Click the puzzle icon (Extensions) in your browser toolbar and pin **ScrollMark** for instant access!

---

## 💡 Usage Guide

### 1. Saving Your Spot
- **Via Popup**: Click the extension icon and select **"📌 Save Current Mark"**.
- **Via In-Page HUD**: Click the floating pill button in the bottom-right corner.
- **Via Right-Click**: Right-click anywhere and choose **"📌 Save Scroll Position Here"**.

### 2. Dropping Custom Pins
- Press `Alt + Shift + S` or click **"🏷️ Add Custom Pin"** in the popup.
- Enter a label (e.g., *"Interesting quote"* or *"Stop here for review"*), and hit <kbd>Enter</kbd>.
- Access and jump to your saved pins anytime from the popup dashboard.

### 3. Restoring Your Position
- If **Auto-Restore** is enabled, simply revisit the page—ScrollMark will smoothly scroll you back down.
- Or press `Alt + Shift + R`, click the floating HUD pill, or click **"🚀 Restore Saved"** in the popup.

### 4. Managing Saved Pages & Backups
- Open the **"📚 Saved Sites"** tab in the popup to browse or search all stored pages.
- Head to **"⚙️ Settings"** to export your saved data as a JSON file or restore from a previous backup.

---

## 📁 Extension Architecture

```
my_Extension/
├── manifest.json       # Manifest V3 manifest configuration & permissions
├── background.js       # Service worker (Context menus, tab lifecycle, icon badges)
├── content.js          # Injected content script (Scroll detection, floating HUD, modals, toasts)
├── content.css         # Scoped stylesheet for in-page HUD, modals, and toasts
├── popup.html          # Modern popup dashboard markup
├── popup.css           # Glassmorphism dark-theme popup styling
├── popup.js            # Popup logic, gauge calculations, search & storage operations
├── generate_icons.js   # Canvas utility script to generate extension icon assets
└── icons/              # Extension icon assets
    ├── icon16.png      # 16x16 toolbar & favicon icon
    ├── icon48.png      # 48x48 extension manager icon
    └── icon128.png     # 128x128 Chrome Web Store & high-DPI display icon
```

---

## 🛡️ Permissions & Privacy

ScrollMark is designed with a **privacy-first** approach:

| Permission | Purpose |
| :--- | :--- |
| `storage` | Saves your scroll coordinates, pins, and preferences locally in `chrome.storage.local`. |
| `activeTab` | Detects the active tab's URL and title to display current reading progress. |
| `scripting` | Coordinates content script communication with the active tab. |
| `contextMenus` | Provides convenient right-click options to save, restore, or pin scroll positions. |
| `tabs` | Refreshes extension toolbar badges upon switching or updating browser tabs. |
| `<all_urls>` | Allows reading position tracking across any website you browse. |

> [!NOTE]  
> **ScrollMark does NOT collect, track, or transmit any user data.** All scroll positions, pin titles, and URLs stay strictly on your local device.

---

## 🎨 Customization

- **Dark Theme & Styling**: Popup colors, gradients, and font families can be customized in [`popup.css`](file:///D:/VStudioProjects/my_Extension/popup.css) using `:root` CSS custom properties.
- **In-Page Components**: Floating badge and toast notifications can be styled via [`content.css`](file:///D:/VStudioProjects/my_Extension/content.css).

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are welcome!
Feel free to open an issue or submit a pull request:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for readers, researchers, and developers.</sub>
  <br/>
  <sub>Made by Antigravity — Out of necessity.</sub>
</div>
