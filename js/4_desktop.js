/* =============================================
   4_desktop.js - Desktop Environment & Window Manager
   ============================================= */

'use strict';

// ─── Desktop Windows Registry ────────────────────────────────────────────────
const desktopWindows = {};
var topZIndex = 100;

function registerDesktopWindow(appId, windowEl, titleBarEl, defaultPos) {
    desktopWindows[appId] = {
        id: appId,
        windowEl,
        titleBarEl,
        state: 'hidden',
        normalPos: { ...defaultPos },
        taskbarTabEl: null,
    };
}

function focusDesktopWindow(appId) {
    topZIndex++;
    const win = desktopWindows[appId];
    if (!win) return;
    Object.values(desktopWindows).forEach(w => w.windowEl.classList.remove('focused'));
    win.windowEl.classList.add('focused');
    win.windowEl.style.zIndex = topZIndex;
}

function openDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win) return;

    if (win.state === 'minimized') {
        restoreDesktopWindow(appId);
        return;
    }
    if (win.state !== 'hidden') {
        focusDesktopWindow(appId);
        return;
    }

    win.state = 'normal';
    win.windowEl.classList.remove('is-maximized');
    win.windowEl.style.display = 'flex';
    
    // Clear any manual transforms (like from centering in Main Menu)
    win.windowEl.style.transform = 'none';
    
    applyDesktopWindowGeometry(appId);
    focusDesktopWindow(appId);
    addDesktopTaskbarTab(appId);

    if (appId === 'pallpay') {
        if (typeof updateCashDisplay === 'function') updateCashDisplay();
    }

    if (typeof saveGame === 'function') saveGame();
}

function closeDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win) return;

    if (appId === 'hackos') {
        // No longer need to close internal sub-windows specifically
        // as they are independent standalone windows now.
    }

    // App-specific cleanup on close
    if (appId === 'terminal') {
        if (typeof stopAmbientStream === 'function') stopAmbientStream();
        if (typeof deactivateTyping === 'function') deactivateTyping();
    }
    
    if (appId === 'settings') {
        const blocker = document.getElementById('mm-blocker');
        if (blocker) blocker.style.display = 'none';
    }

    win.state = 'hidden';
    win.windowEl.style.display = 'none';
    win.windowEl.classList.remove('is-maximized');
    removeDesktopTaskbarTab(appId);
    if (typeof saveGame === 'function') saveGame();
}

function minimizeDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win || win.state === 'hidden') return;

    if (win.state === 'normal') saveDesktopWindowGeometry(appId);
    if (win.state === 'maximized') {
        win.windowEl.classList.remove('is-maximized');
    }

    win.state = 'minimized';
    win.windowEl.style.display = 'none';
    updateDesktopTaskbarTab(appId);
    if (typeof saveGame === 'function') saveGame();
}

function restoreDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win) return;

    win.state = 'normal';
    win.windowEl.classList.remove('is-maximized');
    win.windowEl.style.display = 'flex';
    
    // Clear any manual transforms (like from centering in Main Menu)
    win.windowEl.style.transform = 'none';

    applyDesktopWindowGeometry(appId);
    focusDesktopWindow(appId);
    updateDesktopTaskbarTab(appId);
    if (typeof saveGame === 'function') saveGame();
}

function toggleMaximizeDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win) return;

    if (win.state === 'maximized') {
        win.state = 'normal';
        win.windowEl.classList.remove('is-maximized');
        applyDesktopWindowGeometry(appId);
    } else if (win.state === 'normal') {
        saveDesktopWindowGeometry(appId);
        win.state = 'maximized';
        win.windowEl.classList.add('is-maximized');
        win.windowEl.style.top = '0';
        win.windowEl.style.left = '0';
        win.windowEl.style.width = '100%';
        win.windowEl.style.height = '100%';
    }
    focusDesktopWindow(appId);
    if (typeof saveGame === 'function') saveGame();
}

function applyDesktopWindowGeometry(appId) {
    const win = desktopWindows[appId];
    if (!win) return;
    win.windowEl.style.top = win.normalPos.top + 'px';
    win.windowEl.style.left = win.normalPos.left + 'px';
    win.windowEl.style.width = win.normalPos.width + 'px';
    win.windowEl.style.height = win.normalPos.height + 'px';
}

function saveDesktopWindowGeometry(appId) {
    const win = desktopWindows[appId];
    if (!win) return;
    win.normalPos.top = parseInt(win.windowEl.style.top) || win.normalPos.top;
    win.normalPos.left = parseInt(win.windowEl.style.left) || win.normalPos.left;
    win.normalPos.width = parseInt(win.windowEl.style.width) || win.normalPos.width;
    win.normalPos.height = parseInt(win.windowEl.style.height) || win.normalPos.height;
}

// ─── Desktop Taskbar Tabs ─────────────────────────────────────────────────────
const appTabConfig = {
    'hackos': { label: 'BlueCode v0.1', icon: './assets/icon-hackos.png' },
    'pallpay': { label: 'PallPay', icon: './assets/icon-pallpay.png' },
    'terminal': { label: 'H. Terminal', icon: './assets/icon-terminal.png' },
    'decodify': { label: 'Decodifier', icon: './assets/icon-hackos.png' },
    'onionweb': { label: 'OnionWeb', icon: './assets/icon-darknet.svg' },
    'darknet': { label: 'Dark Net', icon: './assets/icon-darknet.svg' },
    'topmail': { label: 'TopMail', icon: './assets/icon-topmail.svg' },
    'documents': { label: 'Documents', icon: './assets/icon-documents.svg' },
    'notepad': { label: 'Notepad', icon: './assets/icon-documents.svg' },
    'bluemium': { label: 'Bluemium', icon: './assets/icon-bluemium.png' },
    'settings': { label: 'Settings', icon: './assets/icon-hackos.png' },
    'bluecoin': { label: 'BlueCoin', icon: './assets/icon-hackos.png' },
    'ipchanger': { label: 'IP Spoofer', icon: './assets/icon-hackos.png' },
};

function addDesktopTaskbarTab(appId) {
    const cfg = appTabConfig[appId];
    if (!cfg) return;
    if (document.getElementById('dtab-' + appId)) return;

    const tab = document.createElement('button');
    tab.id = 'dtab-' + appId;
    tab.className = 'taskbar-app-tab active';
    tab.innerHTML = `<img src="${cfg.icon}" alt=""><span>${cfg.label}</span>`;
    tab.onclick = () => {
        const win = desktopWindows[appId];
        if (win.state === 'minimized') {
            restoreDesktopWindow(appId);
        } else {
            focusDesktopWindow(appId);
        }
    };
    if (taskbarApps) taskbarApps.appendChild(tab);
}

function removeDesktopTaskbarTab(appId) {
    const tab = document.getElementById('dtab-' + appId);
    if (tab) tab.remove();
}

function updateDesktopTaskbarTab(appId) {
    const tab = document.getElementById('dtab-' + appId);
    if (!tab) return;
    const win = desktopWindows[appId];
    if (win.state === 'minimized') {
        tab.classList.remove('active');
    } else {
        tab.classList.add('active');
    }
}

// ─── Drag Logic ────────────────────────────────────────────────────────────────
var desktopDragActive = false;
var desktopDragAppId = null;
var desktopDragOffset = { x: 0, y: 0 };

function initDesktopDrag(appId, e) {
    const win = desktopWindows[appId];
    if (!win) return;
    if (e.target.tagName === 'BUTTON') return;
    if (win.state !== 'normal') return;
    desktopDragActive = true;
    desktopDragAppId = appId;
    const rect = win.windowEl.getBoundingClientRect();
    desktopDragOffset.x = e.clientX - rect.left;
    desktopDragOffset.y = e.clientY - rect.top;
    focusDesktopWindow(appId);
    e.preventDefault();
}

document.addEventListener('mousemove', e => {
    if (desktopDragActive && desktopDragAppId) {
        const win = desktopWindows[desktopDragAppId];
        const par = windowContainer.getBoundingClientRect();
        let newLeft = e.clientX - par.left - desktopDragOffset.x;
        let newTop = e.clientY - par.top - desktopDragOffset.y;
        newLeft = Math.max(0, Math.min(newLeft, par.width - win.windowEl.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, par.height - win.windowEl.offsetHeight));
        win.windowEl.style.left = newLeft + 'px';
        win.windowEl.style.top = newTop + 'px';
        win.normalPos.left = newLeft;
        win.normalPos.top = newTop;
    }
});

document.addEventListener('mouseup', () => {
    if (desktopDragActive) {
        if (typeof saveGame === 'function') saveGame();
    }
    desktopDragActive = false;
    desktopDragAppId = null;
});

// ─── Register Desktop Windows ─────────────────────────────────────────────────
const hackosWindow = document.getElementById('hackos-window');
const hackosTitleBar = document.getElementById('hackos-title-bar');
if (hackosWindow && hackosTitleBar) {
    registerDesktopWindow('hackos', hackosWindow, hackosTitleBar,
        { top: 40, left: 60, width: Math.round(window.innerWidth * 0.85), height: Math.round(window.innerHeight * 0.80) });
    hackosTitleBar.addEventListener('mousedown', e => initDesktopDrag('hackos', e));
    hackosWindow.addEventListener('mousedown', () => focusDesktopWindow('hackos'));
}

const pallpayWindow = document.getElementById('pallpay-window');
const pallpayTitleBar = document.getElementById('pallpay-title-bar');
if (pallpayWindow && pallpayTitleBar) {
    registerDesktopWindow('pallpay', pallpayWindow, pallpayTitleBar,
        { top: 80, left: 200, width: 620, height: 550 });
    pallpayTitleBar.addEventListener('mousedown', e => initDesktopDrag('pallpay', e));
    pallpayWindow.addEventListener('mousedown', () => focusDesktopWindow('pallpay'));
}

const terminalWindow = document.getElementById('terminal-window');
const terminalTitleBar = document.getElementById('terminal-title-bar');
if (terminalWindow && terminalTitleBar) {
    registerDesktopWindow('terminal', terminalWindow, terminalTitleBar,
        { top: 100, left: 100, width: 900, height: 450 });
    terminalTitleBar.addEventListener('mousedown', e => initDesktopDrag('terminal', e));
    terminalWindow.addEventListener('mousedown', () => focusDesktopWindow('terminal'));
}

const decodifyWindow = document.getElementById('decodify-window');
const decodifyTitleBar = document.getElementById('decodify-title-bar');
if (decodifyWindow && decodifyTitleBar) {
    registerDesktopWindow('decodify', decodifyWindow, decodifyTitleBar,
        { top: 120, left: 300, width: 380, height: 400 });
    decodifyTitleBar.addEventListener('mousedown', e => initDesktopDrag('decodify', e));
    decodifyWindow.addEventListener('mousedown', () => focusDesktopWindow('decodify'));
}

const bluecoinWindow = document.getElementById('bluecoin-window');
const bluecoinTitleBar = document.getElementById('bluecoin-title-bar');
if (bluecoinWindow && bluecoinTitleBar) {
    registerDesktopWindow('bluecoin', bluecoinWindow, bluecoinTitleBar,
        { top: 130, left: 320, width: 450, height: 400 });
    bluecoinTitleBar.addEventListener('mousedown', e => initDesktopDrag('bluecoin', e));
    bluecoinWindow.addEventListener('mousedown', () => focusDesktopWindow('bluecoin'));
}

const ipchangerWindow = document.getElementById('ipchanger-window');
const ipchangerTitleBar = document.getElementById('ipchanger-title-bar');
if (ipchangerWindow && ipchangerTitleBar) {
    registerDesktopWindow('ipchanger', ipchangerWindow, ipchangerTitleBar,
        { top: 150, left: 340, width: 320, height: 180 });
    ipchangerTitleBar.addEventListener('mousedown', e => initDesktopDrag('ipchanger', e));
    ipchangerWindow.addEventListener('mousedown', () => focusDesktopWindow('ipchanger'));
}

const onionwebWindow = document.getElementById('onionweb-window');
const onionwebTitleBar = document.getElementById('onionweb-title-bar');
if (onionwebWindow && onionwebTitleBar) {
    registerDesktopWindow('onionweb', onionwebWindow, onionwebTitleBar,
        { top: 140, left: 350, width: 380, height: 450 });
    onionwebTitleBar.addEventListener('mousedown', e => initDesktopDrag('onionweb', e));
    onionwebWindow.addEventListener('mousedown', () => focusDesktopWindow('onionweb'));
}

const topmailWindow = document.getElementById('topmail-window');
const topmailTitleBar = document.getElementById('topmail-title-bar');
if (topmailWindow && topmailTitleBar) {
    registerDesktopWindow('topmail', topmailWindow, topmailTitleBar,
        { top: 60, left: 80, width: 700, height: 500 });
    topmailTitleBar.addEventListener('mousedown', e => initDesktopDrag('topmail', e));
    topmailWindow.addEventListener('mousedown', () => focusDesktopWindow('topmail'));
}

const documentsWindow = document.getElementById('documents-window');
const documentsTitleBar = document.getElementById('documents-title-bar');
if (documentsWindow && documentsTitleBar) {
    registerDesktopWindow('documents', documentsWindow, documentsTitleBar,
        { top: 80, left: 140, width: 550, height: 400 });
    documentsTitleBar.addEventListener('mousedown', e => initDesktopDrag('documents', e));
    documentsWindow.addEventListener('mousedown', () => focusDesktopWindow('documents'));
}

const notepadWindow = document.getElementById('notepad-window');
const notepadTitleBar = document.getElementById('notepad-title-bar');
if (notepadWindow && notepadTitleBar) {
    registerDesktopWindow('notepad', notepadWindow, notepadTitleBar,
        { top: 120, left: 200, width: 450, height: 350 });
    notepadTitleBar.addEventListener('mousedown', e => initDesktopDrag('notepad', e));
    notepadWindow.addEventListener('mousedown', () => focusDesktopWindow('notepad'));
}

const darknetWindow = document.getElementById('darknet-window');
const darknetTitleBar = document.getElementById('darknet-title-bar');
if (darknetWindow && darknetTitleBar) {
    registerDesktopWindow('darknet', darknetWindow, darknetTitleBar,
        { top: 50, left: 100, width: 750, height: 550 });
    darknetTitleBar.addEventListener('mousedown', e => initDesktopDrag('darknet', e));
    darknetWindow.addEventListener('mousedown', () => focusDesktopWindow('darknet'));
}

const calcWindow = document.getElementById('calc-window');
const calcTitleBar = document.getElementById('calc-title-bar');
if (calcWindow && calcTitleBar) {
    registerDesktopWindow('calc', calcWindow, calcTitleBar,
        { top: 150, left: 250, width: 1000, height: 350 });
}

const installerWindow = document.getElementById('installer-window');
if (installerWindow) {
    registerDesktopWindow('installer', installerWindow, installerWindow.querySelector('.title-bar'),
        { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 175, width: 350, height: 200 });
}

const bluemiumWindow = document.getElementById('bluemium-window');
const bluemiumTitleBar = document.getElementById('bluemium-title-bar');
if (bluemiumWindow && bluemiumTitleBar) {
    registerDesktopWindow('bluemium', bluemiumWindow, bluemiumTitleBar,
        { top: 40, left: 80, width: 1000, height: 640 });
    bluemiumTitleBar.addEventListener('mousedown', e => initDesktopDrag('bluemium', e));
    bluemiumWindow.addEventListener('mousedown', () => focusDesktopWindow('bluemium'));
    bluemiumTitleBar.addEventListener('dblclick', () => toggleMaximizeDesktopWindow('bluemium'));
}

const settingsWindow = document.getElementById('settings-window');
const settingsTitleBar = document.getElementById('settings-title-bar');
if (settingsWindow && settingsTitleBar) {
    registerDesktopWindow('settings', settingsWindow, settingsTitleBar,
        { top: window.innerHeight / 2 - 175, left: window.innerWidth / 2 - 175, width: 350, height: 350 });
    settingsTitleBar.addEventListener('mousedown', e => initDesktopDrag('settings', e));
    // NOTE: no mousedown→focusDesktopWindow listener here intentionally —
    // focusDesktopWindow resets z-index to a low value which breaks display when in Main Menu context
}


// ─── Control Buttons ──────────────────────────────────────────────────────────
const controlMap = {
    'hackos-minimize': () => minimizeDesktopWindow('hackos'),
    'hackos-maximize': () => toggleMaximizeDesktopWindow('hackos'),
    'hackos-close': () => closeDesktopWindow('hackos'),
    'pallpay-minimize': () => minimizeDesktopWindow('pallpay'),
    'pallpay-maximize': () => toggleMaximizeDesktopWindow('pallpay'),
    'pallpay-close': () => closeDesktopWindow('pallpay'),
    'terminal-minimize': () => minimizeDesktopWindow('terminal'),
    'terminal-maximize': () => toggleMaximizeDesktopWindow('terminal'),
    'terminal-close': () => closeDesktopWindow('terminal'),
    'decodify-minimize': () => minimizeDesktopWindow('decodify'),
    'decodify-maximize': () => toggleMaximizeDesktopWindow('decodify'),
    'decodify-close': () => closeDesktopWindow('decodify'),
    'bluecoin-minimize': () => minimizeDesktopWindow('bluecoin'),
    'bluecoin-maximize': () => toggleMaximizeDesktopWindow('bluecoin'),
    'bluecoin-close': () => closeDesktopWindow('bluecoin'),
    'onionweb-minimize': () => minimizeDesktopWindow('onionweb'),
    'onionweb-maximize': () => toggleMaximizeDesktopWindow('onionweb'),
    'onionweb-close': () => closeDesktopWindow('onionweb'),
    'topmail-minimize': () => minimizeDesktopWindow('topmail'),
    'topmail-maximize': () => toggleMaximizeDesktopWindow('topmail'),
    'topmail-close': () => closeDesktopWindow('topmail'),
    'minimize-documents': () => minimizeDesktopWindow('documents'),
    'maximize-documents': () => toggleMaximizeDesktopWindow('documents'),
    'close-documents': () => closeDesktopWindow('documents'),
    'minimize-notepad': () => minimizeDesktopWindow('notepad'),
    'maximize-notepad': () => toggleMaximizeDesktopWindow('notepad'),
    'close-notepad': () => closeDesktopWindow('notepad'),
    'darknet-minimize': () => minimizeDesktopWindow('darknet'),
    'darknet-maximize': () => toggleMaximizeDesktopWindow('darknet'),
    'darknet-close': () => closeDesktopWindow('darknet'),
    'bluemium-minimize': () => minimizeDesktopWindow('bluemium'),
    'bluemium-maximize': () => toggleMaximizeDesktopWindow('bluemium'),
    'bluemium-close': () => closeDesktopWindow('bluemium'),
    'ipchanger-minimize': () => minimizeDesktopWindow('ipchanger'),
    'ipchanger-close': () => closeDesktopWindow('ipchanger'),
    'settings-minimize': () => minimizeDesktopWindow('settings'),
    'settings-close': () => closeDesktopWindow('settings'),
};

Object.entries(controlMap).forEach(([id, fn]) => {
    const btn = document.getElementById('btn-' + id);
    if (btn) btn.addEventListener('click', fn);
});

// ─── Desktop Icons & Shortcuts ────────────────────────────────────────────────
var lastClickTime = 0;
var lastClickTarget = null;

const desktopIconsArea = document.getElementById('desktop-icons');
if (desktopIconsArea) {
    desktopIconsArea.addEventListener('click', e => {
        const icon = e.target.closest('.desktop-icon');
        if (!icon) return;
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');

        const now = Date.now();
        if (lastClickTarget === icon && (now - lastClickTime) < 400) {
            const app = icon.dataset.app;
            if (app === 'hackos') openDesktopWindow('hackos');
            if (app === 'terminal') { openDesktopWindow('terminal'); if (typeof openTerminal === 'function') openTerminal(); }
            if (app === 'pallpay') { openDesktopWindow('pallpay'); if (typeof updatePallPayActivity === 'function') updatePallPayActivity(); }
            if (app === 'topmail') openDesktopWindow('topmail');
            if (app === 'documents') { openDesktopWindow('documents'); if (typeof renderDocumentsList === 'function') renderDocumentsList(); }
            if (app === 'darknet') {
                openDesktopWindow('darknet');
                if (typeof receiveDarkNetMail === 'function') receiveDarkNetMail();
            }
            if (app === 'onionweb') openDesktopWindow('onionweb');
            if (app === 'decodify') openDesktopWindow('decodify');
            if (app === 'bluemium') { openDesktopWindow('bluemium'); if (typeof browserNavigateTo === 'function') browserNavigateTo('newtab'); }
            lastClickTime = 0;
            lastClickTarget = null;
        } else {
            lastClickTime = now;
            lastClickTarget = icon;
        }
    });
}

if (xpDesktop) {
    xpDesktop.addEventListener('click', e => {
        if (e.target === xpDesktop || (desktopIconsArea && e.target === desktopIconsArea)) {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        }
    });
}

// ─── System UI ────────────────────────────────────────────────────────────────
// Real-time clock is DISABLED — ingame clock is managed by 9_daycycle.js
// function updateClock() { ... } — removed to avoid overwriting ingame time

function showDesktop() {
    Object.keys(desktopWindows).forEach(appId => {
        const win = desktopWindows[appId];
        if (win.state === 'normal' || win.state === 'maximized') {
            minimizeDesktopWindow(appId);
        }
    });
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    closeStartMenu();
}

const startMenu = document.getElementById('start-menu');
function toggleStartMenu() {
    if (!startMenu) return;
    startMenu.style.display = startMenu.style.display === 'none' ? 'flex' : 'none';
}

function closeStartMenu() {
    if (startMenu) startMenu.style.display = 'none';
}

document.addEventListener('click', e => {
    if (startMenu && !e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
        closeStartMenu();
    }
});

// Notifications
const btnNotifications = document.getElementById('btn-notifications');
const notificationPanel = document.getElementById('notification-panel');
const notificationList = document.getElementById('notification-list');
const unreadBadge = document.getElementById('unread-count');

function renderNotificationPanel() {
    if (!notificationList) return;
    notificationList.innerHTML = '';
    if (typeof inboxEmails === 'undefined') return;
    const recent = inboxEmails.slice(0, 5);
    let unreadCount = 0;

    recent.forEach(m => {
        if (m.unread) unreadCount++;
        const item = document.createElement('div');
        item.style.cssText = `padding: 5px; cursor: pointer; border-bottom: 1px solid #eee; background: ${m.unread ? '#fff' : 'transparent'}; font-weight: ${m.unread ? 'bold' : 'normal'};`;
        item.innerHTML = `<div style="color:#003399;">${m.sender}</div><div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.subject}</div>`;

        item.onmouseenter = () => item.style.backgroundColor = '#d4d0c8';
        item.onmouseleave = () => item.style.backgroundColor = m.unread ? '#fff' : 'transparent';

        item.onclick = () => {
            openDesktopWindow('topmail');
            if (typeof selectMail === 'function') selectMail(m.id);
            if (notificationPanel) notificationPanel.style.display = 'none';
        };
        notificationList.appendChild(item);
    });

    if (unreadBadge) {
        if (unreadCount > 0) {
            unreadBadge.style.display = 'block';
            unreadBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        } else {
            unreadBadge.style.display = 'none';
        }
    }
}

if (btnNotifications) {
    btnNotifications.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notificationPanel) {
            if (notificationPanel.style.display === 'flex') {
                notificationPanel.style.display = 'none';
            } else {
                renderNotificationPanel();
                notificationPanel.style.display = 'flex';
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (notificationPanel && !notificationPanel.contains(e.target) && e.target !== btnNotifications && !btnNotifications.contains(e.target)) {
            notificationPanel.style.display = 'none';
        }
    });
}

// ─── Dark Net Browser Logic ──────────────────────────────────────────────────
const darknetUrlBar = document.getElementById('darknet-url-bar');
const btnDarknetGo = document.getElementById('btn-darknet-go');
const darknetContent = document.getElementById('darknet-content');

if (btnDarknetGo && darknetUrlBar) {
    btnDarknetGo.addEventListener('click', () => {
        handleDarkNetURL(darknetUrlBar.value.trim());
    });

    darknetUrlBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleDarkNetURL(darknetUrlBar.value.trim());
    });
}

function handleDarkNetURL(url) {
    if (!darknetContent) return;

    // Show loading overlay
    const overlay = document.getElementById('darknet-loading-overlay');
    if (overlay) overlay.style.display = 'flex';

    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';

        // Exact match for the hidden OnionWeb url
    if (url === 'http://onion.web/laundering_service' || url === 'onion.web/laundering_service') {
        if (gameState.addonInstalled) {
            darknetContent.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#d33c3c; font-family:'Verdana', sans-serif; text-shadow:0 0 1px #000;">
                    <h2 style="color:#d33c3c; border-bottom:1px dashed #d33c3c; padding-bottom:10px;">AddOn ALREADY INSTALLED</h2>
                    <p style="color:#a85b5b; margin-top:20px;">Access the service from within BlueCode.</p>
                </div>
            `;
        } else {
            // Render Landing Page
            darknetContent.innerHTML = `
                <div class="darknet-addon-landing" style="display:block; padding:10px 20px; font-family:'Courier New', monospace; color:#a85b5b;">
                    <div style="border-bottom:3px double #d33c3c; padding-bottom:15px; margin-bottom:20px; display:flex; align-items:center; gap:20px;">
                        <img src="assets/icon-darknet.svg" width="80" style="filter: drop-shadow(0 0 5px rgba(255,0,0,0.5)) grayscale(0.5) sepia(1) hue-rotate(310deg) saturate(3);" alt="">
                        <div>
                            <h2 style="color:#d33c3c; font-weight:bold; margin:0 0 5px 0; font-size:28px; text-transform:uppercase; letter-spacing:2px;">WASH-NET GATEWAY</h2>
                            <p style="margin:0; font-size:12px; font-weight:bold;">[ VERIFIED PGP SIGNATURE: 0x9F82A1B ]</p>
                        </div>
                    </div>

                    <div style="background:#2a0a0a; border:1px solid #4a1515; padding:15px; margin-bottom:20px; font-size:12px;">
                        <h3 style="color:#d33c3c; margin-top:0;">/// SYSTEM NOTICE</h3>
                        <p>Welcome to the premium unindexed mixer. Our service obfuscates digital footprints using multi-layered relay hashing mechanisms. We retain a standard 10% fee for network maintenance and anonymization protocols.</p>
                        <p style="color:#ff6b6b; font-weight:bold; margin-bottom:0;">Strict NO-LOG policy explicitly enforced via code constraints.</p>
                    </div>

                    <div style="display:flex; gap:20px;">
                        <div style="flex:2;">
                            <h3 style="color:#d33c3c; border-bottom:1px solid #d33c3c; padding-bottom:5px;">/// INSTRUCTIONS</h3>
                            <p style="font-size:12px;">Due to recent sweeps by federated authorities across the regular web, our gateway node is no longer accessible via standard browser layers. You MUST inject our proprietary routing add-on directly into your system binaries.</p>
                            <p style="font-size:12px; color:#555;">(MD5 Hash: 5eb63bbbe01eeed093cb22bb8f5acdc3)</p>
                            
                            <div style="margin-top:25px; padding:20px; border:2px dashed #d33c3c; text-align:center; background:#110000;">
                                <h4 style="margin:0 0 10px 0; color:#ff6b6b;">CLIENT BINARY V2.4</h4>
                                <p style="font-size:11px; margin-bottom:15px;">Size: 844 KB <br> Format: Executable Payload</p>
                                <button class="btn-turbina-download" onclick="startAddonInstaller()" style="background:#d33c3c; color:#fff; border:1px solid #ff6b6b; padding:12px 25px; font-weight:bold; cursor:pointer; font-size:14px; text-transform:uppercase;">[ DOWNL0AD ARCHIVE ]</button>
                            </div>
                        </div>
                        
                        <div style="flex:1; border-left:1px dashed #4a1515; padding-left:20px; font-size:11px; color:#774444; word-wrap: break-word;">
                            <strong style="color:#a85b5b; display:block; margin-bottom:10px;">RECENT ACTIVITY LOGS</strong>
                            <p>> addr:1x8f... clean out $10,400</p>
                            <p>> addr:0xbb... clean out $85,000</p>
                            <p>> addr:3xc2... clean out $2,100</p>
                            <p>> addr:0x9a... clean out $19,500</p>
                            <p style="color:#552222; margin-top:20px;">01001101 01101111 01101110 01100101 01111001 00100000 01101100 01100001 01110101 01101110 01100100 01100101 01110010 01101001 01101110 01100111</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } else if (url === 'http://onion.web/v3_access' || url === 'onion.web/v3_access') {
        darknetContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:40px; background:#000; color:#fff; font-family:'Courier New', monospace; text-align:center;">
                <div style="font-size:64px; margin-bottom:20px;">⚠️</div>
                <h1 style="color:#ff0000; border:2px solid #ff0000; padding:10px 20px; font-size:24px; margin-bottom:30px;">SERVICE SUSPENDED</h1>
                <p style="max-width:500px; line-height:1.6; color:#aaa;">This hidden service has been seized by international law enforcement agencies in coordination with the Cyber-Financial Crimes Division.</p>
                <p style="margin-top:30px; font-size:12px; color:#555;">[ Error Code: 0x80040154 - Connection Refused by Remote Host ]</p>
                <div style="margin-top:40px; display:flex; gap:15px;">
                    <button onclick="document.getElementById('darknet-url-bar').value='dark.web/search'; document.getElementById('btn-darknet-go').click();" style="background:#333; color:#fff; border:1px solid #555; padding:8px 15px; cursor:pointer;">Return to Search</button>
                </div>
            </div>
        `;
    } else if (url === '9fd8vgdf9.5333.bg' || url === 'http://9fd8vgdf9.5333.bg') {
        darknetContent.innerHTML = `
        <div style="background:#000; min-height:100%; font-family:'Courier New', monospace; color:#00cc00; font-size:12px; padding:0;">

            <!-- Marquee banner -->
            <div style="background:#001100; border-top:2px solid #00aa00; border-bottom:2px solid #00aa00; padding:4px 0; overflow:hidden; white-space:nowrap;">
                <span style="display:inline-block; animation: marquee 18s linear infinite; color:#00ff00; font-weight:bold;">
                    ★ VERIFIED SELLER ★ ANONYMOUS PAYMENTS ONLY ★ NO LOGS ★ ENCRYPTED TRANSFERS ★ PGP KEY AVAILABLE ★ OPERATIONAL SINCE 1999 ★ FAST DELIVERY ★ NO REFUNDS ★ TOR RECOMMENDED ★
                </span>
            </div>
            <style>
                @keyframes marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
                .virus-buy-btn { background:#001a00; color:#00ff00; border:1px solid #00aa00; padding:5px 14px; font-family:'Courier New', monospace; font-size:11px; font-weight:bold; cursor:not-allowed; letter-spacing:1px; }
                .virus-buy-btn:hover { background:#003300; }
                .virus-card { border:1px solid #005500; padding:14px; margin-bottom:14px; background:#000d00; }
                .virus-card:hover { border-color:#00aa00; }
                .virus-badge { display:inline-block; font-size:9px; padding:2px 6px; border:1px solid; margin-left:8px; vertical-align:middle; }
                .badge-rare { color:#ffff00; border-color:#aaaa00; }
                .badge-new { color:#00ffff; border-color:#008888; }
                .badge-hot { color:#ff6600; border-color:#aa4400; }
            </style>

            <!-- Header -->
            <div style="background:#000800; border-bottom:3px double #00aa00; padding:16px 20px;">
                <table width="100%">
                    <tr>
                        <td>
                            <div style="font-size:22px; font-weight:bold; color:#00ff00; text-shadow:0 0 8px #00ff00; letter-spacing:3px;">[ V1RU5-M4RK3T ]</div>
                            <div style="font-size:10px; color:#006600; margin-top:3px;">// node: 9fd8vgdf9.5333.bg // encrypted via relay-9 // Anonymous Access Granted</div>
                        </td>
                        <td align="right" style="font-size:10px; color:#004400; vertical-align:top; line-height:1.7;">
                            Server Time: 03:47:22 UTC<br>
                            Visitors [today]: 847<br>
                            PGP: 4A9F-8B21<br>
                            Status: <span style="color:#00ff00">ONLINE</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Nav -->
            <div style="background:#001100; border-bottom:1px solid #003300; padding:5px 20px; font-size:10px; color:#005500;">
                [ <span style="color:#00aa00; cursor:pointer;">HOME</span> ] &nbsp;|&nbsp;
                [ <span style="color:#00aa00; cursor:pointer;">CATALOG</span> ] &nbsp;|&nbsp;
                [ <span style="color:#006600; cursor:not-allowed;">MY ACCOUNT</span> ] &nbsp;|&nbsp;
                [ <span style="color:#006600; cursor:not-allowed;">ORDERS</span> ] &nbsp;|&nbsp;
                [ <span style="color:#006600; cursor:not-allowed;">SUPPORT</span> ]
                <span style="float:right; color:#003300;">// Only accepts: XMR · BTC · BlueCoin [NEW]</span>
            </div>

            <!-- Body -->
            <div style="display:flex; min-height:calc(100% - 120px);">

                <!-- Sidebar -->
                <div style="width:160px; min-width:160px; border-right:1px solid #003300; padding:12px; background:#000900;">
                    <div style="color:#00aa00; font-weight:bold; border-bottom:1px solid #003300; padding-bottom:5px; margin-bottom:10px; font-size:11px;">CATEGORIES</div>
                    <div style="color:#006600; line-height:2.2; font-size:10px;">
                        &gt; <span style="color:#00cc00;">ALL PRODUCTS</span><br>
                        &gt; Ransomware<br>
                        &gt; Worms<br>
                        &gt; Trojans<br>
                        &gt; Spyware<br>
                        &gt; Keyloggers<br>
                        &gt; Rootkits<br>
                        &gt; Botnets<br>
                        &gt; <span style="color:#444;">[LOCKED]</span><br>
                        &gt; <span style="color:#444;">[LOCKED]</span>
                    </div>

                    <div style="color:#00aa00; font-weight:bold; border-bottom:1px solid #003300; border-top:1px solid #003300; padding:5px 0; margin:12px 0; font-size:11px;">PAYMENT</div>
                    <div style="font-size:10px; color:#006600; line-height:1.8;">
                        ✔ Monero (XMR)<br>
                        ✔ Bitcoin (BTC)<br>
                        ✔ BlueCoin ★<br>
                        ✘ Credit Cards<br>
                        ✘ PayPal
                    </div>

                    <div style="margin-top:14px; font-size:10px; color:#004400; border-top:1px solid #002200; padding-top:10px; line-height:1.7;">
                        OP.SEC NOTICE:<br>
                        Use Tor. Never<br>
                        your real IP.<br>
                        No exceptions.
                    </div>
                </div>

                <!-- Main content -->
                <div style="flex:1; padding:16px 20px; overflow-y:auto;">
                    <div style="color:#006600; font-size:10px; margin-bottom:16px; border-bottom:1px dashed #002200; padding-bottom:8px;">
                        // Catalog // All Products // Showing 8 of 31 listings // Sort: Popularity DESC
                    </div>

                    <!-- PRODUCT 1 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">LockShadow v3.2 <span class="virus-badge badge-hot">🔥 HOT</span></div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Ransomware &nbsp;|&nbsp; PLATFORM: Win32/64 &nbsp;|&nbsp; PAYLOAD: AES-256 File Encryption</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Autonomous file encryptor. Targets documents, images and databases. Custom ransom note included. C2 panel pre-configured. 97% AV bypass rate (tested Jan 2001).
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 142 &nbsp;|&nbsp; Rating: ★★★★☆ &nbsp;|&nbsp; Last updated: 2001-03-12</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$280 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 2 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">NetCrawler Worm 0.9b <span class="virus-badge badge-new">NEW</span></div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Worm &nbsp;|&nbsp; PLATFORM: Win98/2000/XP &nbsp;|&nbsp; PAYLOAD: LAN/WAN Self-Propagation</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Network-aware worm that spreads via shared drives and open ports. Minimal footprint, survives reboots. Includes optional payload injector for secondary stage attacks.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 61 &nbsp;|&nbsp; Rating: ★★★☆☆ &nbsp;|&nbsp; Last updated: 2001-01-28</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$90 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 3 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">GhostRAT Basic <span class="virus-badge badge-rare">★ RARE</span></div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Remote Access Trojan &nbsp;|&nbsp; PLATFORM: Win32 &nbsp;|&nbsp; PAYLOAD: Full Remote Shell</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Full-featured RAT with keylogger, screenshot capture, webcam access (if present), and remote command shell. Works behind NAT via reverse tunnel. Obfuscated binary — low detection.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 39 &nbsp;|&nbsp; Rating: ★★★★★ &nbsp;|&nbsp; Last updated: 2001-02-14</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$450 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 4 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">KeyPhantom v1.1</div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Keylogger &nbsp;|&nbsp; PLATFORM: Win95/98/2000 &nbsp;|&nbsp; PAYLOAD: Credential Harvesting</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Silent keylogger that logs all keystrokes and periodically emails results to a configurable address. Survives antivirus scans via polymorphic loader. Captures bank sessions, passwords, chat logs.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 208 &nbsp;|&nbsp; Rating: ★★★★☆ &nbsp;|&nbsp; Last updated: 2000-11-05</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$55 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 5 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">ShadowRoot Pro <span class="virus-badge badge-rare">★ RARE</span></div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Rootkit &nbsp;|&nbsp; PLATFORM: WinNT/2000/XP &nbsp;|&nbsp; PAYLOAD: Kernel Level Persistence</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Ring-0 rootkit with full process and file hiding capabilities. Allows any installed malware to become invisible to the OS. Survives reinstalls unless full disk wipe is performed. For advanced operators only.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 18 &nbsp;|&nbsp; Rating: ★★★★★ &nbsp;|&nbsp; Last updated: 2001-03-30</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$900 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 6 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">SpiderNet Botnet Starter</div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Botnet Client &nbsp;|&nbsp; PLATFORM: Win98/XP &nbsp;|&nbsp; PAYLOAD: DDoS / Spam / Mining</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Includes 1 botnet node license + IRC C2 server access. Deploy on infected machines and issue commands remotely. Includes DDoS module and spam relay. Comes with 100 proxies.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 77 &nbsp;|&nbsp; Rating: ★★★☆☆ &nbsp;|&nbsp; Last updated: 2001-02-02</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$175 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 7 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">EyeSpy Spyware Suite 2.0 <span class="virus-badge badge-new">NEW</span></div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Spyware &nbsp;|&nbsp; PLATFORM: Win98/2000/XP &nbsp;|&nbsp; PAYLOAD: Surveillance Package</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Complete surveillance toolkit. Monitors browser history, clipboard, typed text, and active windows. Logs are encrypted and sent via SMTP tunnel. Runs silently as a system service. Ideal for targeted attacks.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 53 &nbsp;|&nbsp; Rating: ★★★★☆ &nbsp;|&nbsp; Last updated: 2001-04-01</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$120 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- PRODUCT 8 -->
                    <div class="virus-card">
                        <table width="100%">
                            <tr>
                                <td>
                                    <div style="font-size:13px; font-weight:bold; color:#00ff00;">MailBlast Mass Mailer v4</div>
                                    <div style="color:#006600; font-size:10px; margin:4px 0;">TYPE: Social Engineering / Spreader &nbsp;|&nbsp; PLATFORM: Any &nbsp;|&nbsp; PAYLOAD: Email Worm Spreader</div>
                                    <div style="color:#00aa00; font-size:11px; margin-top:6px; line-height:1.5;">
                                        Generates mass emails with weaponized attachments. Uses harvested contact lists from compromised Outlook installations. Built-in sender spoofing and fake corporate templates included. Avg spread: 12,000 hosts / day.
                                    </div>
                                    <div style="font-size:10px; color:#555; margin-top:6px;">Sold: 321 &nbsp;|&nbsp; Rating: ★★★☆☆ &nbsp;|&nbsp; Last updated: 2001-01-15</div>
                                </td>
                                <td align="right" valign="top" style="min-width:110px; padding-left:15px;">
                                    <div style="color:#00ff00; font-size:15px; font-weight:bold; margin-bottom:8px;">$35 USD</div>
                                    <button class="virus-buy-btn" title="Coming soon">[BUY]</button>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align:center; color:#003300; font-size:10px; border-top:1px dashed #002200; padding-top:12px; margin-top:8px;">
                        // Showing 8 of 31 products // <span style="color:#006600; cursor:not-allowed;">[NEXT PAGE]</span> //
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background:#000900; border-top:2px double #003300; padding:10px 20px; font-size:9px; color:#003300; line-height:1.8;">
                © 1999–2001 V1RU5-M4RK3T. All transactions are anonymous and untraceable. By accessing this node you agree to our no-log policy. 
                Seller holds no liability. PGP public key: 4A9F-8B21-33DC-FFAB. &nbsp;|&nbsp; 
                Disputes: contact via secure drop only. &nbsp;|&nbsp; Powered by relay-9 anonymous infrastructure.
            </div>
        </div>
        `;

    } else if (url === 'http://dark.web/search' || url === 'dark.web/search') {
        darknetContent.innerHTML = `
            <div style="max-width:600px; margin:0 auto; padding:20px;">
                <div style="text-align:center; padding:30px 0 20px 0; border-bottom:1px solid #4a1515;">
                    <img src="assets/icon-darknet.svg" width="80" style="filter: drop-shadow(0 0 5px rgba(255,0,0,0.5));" alt="">
                    <h1 style="color:#d33c3c; font-size:36px; margin:10px 0 5px 0; text-shadow:1px 1px #000;">BloodHound Search</h1>
                    <p style="color:#a85b5b; font-size:12px;">Indexing 8,241 hidden nodes</p>
                </div>
                
                <!-- Search Bar inside the content -->
                <div style="margin:20px 0; display:flex; justify-content:center; gap:10px;">
                    <input type="text" placeholder="Search the unindexed web..." style="width:70%; padding:8px; border:1px solid #d33c3c; background:#2a0a0a; color:#fff; outline:none;">
                    <button style="background:#d33c3c; color:#fff; border:none; padding:8px 15px; cursor:pointer; font-weight:bold;">Search</button>
                </div>

                <h3 style="color:#d33c3c; border-bottom:1px dashed #d33c3c; padding-bottom:5px; margin-top:30px; font-size:14px;">Recent Directory Updates</h3>
                <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:15px; margin-top:15px;">
                    <li>
                        <a href="#" onclick="document.getElementById('darknet-url-bar').value='onion.web/v3_access'; document.getElementById('btn-darknet-go').click(); return false;" style="color:#ff6b6b; font-weight:bold; font-size:13px; text-decoration:none;">Laundering Gateway Access [V3]</a>
                        <p style="margin:2px 0 0 0; font-size:11px; color:#a85b5b;">onion.web/v3_access</p>
                        <p style="margin:4px 0 0 0; font-size:11px; color:#888;">Encrypted entry point for financial mixing services. Status: UNSTABLE.</p>
                    </li>
                    <li>
                        <a href="#" style="color:#ff6b6b; font-weight:bold; font-size:13px; text-decoration:none;">Unregistered Firearms & Ammunition</a>
                        <p style="margin:2px 0 0 0; font-size:11px; color:#a85b5b;">dark.node/weapons_2911</p>
                        <p style="margin:4px 0 0 0; font-size:11px; color:#888;">Quality surplus. No background checks required. Worldwide shipping.</p>
                    </li>
                    <li>
                        <a href="#" style="color:#ff6b6b; font-weight:bold; font-size:13px; text-decoration:none;">Stolen Identity Market</a>
                        <p style="margin:2px 0 0 0; font-size:11px; color:#a85b5b;">proxy.net/ids</p>
                        <p style="margin:4px 0 0 0; font-size:11px; color:#888;">Full profiles (SSN, DOB, Address). Clean history guarantee.</p>
                    </li>
                    <li>
                        <a href="#" style="color:#ff6b6b; font-weight:bold; font-size:13px; text-decoration:none;">Zero-Day Exploits Vault</a>
                        <p style="margin:2px 0 0 0; font-size:11px; color:#a85b5b;">shadow.net/exploits</p>
                        <p style="margin:4px 0 0 0; font-size:11px; color:#888;">Premium exploits for modern systems. Escalation privileges.</p>
                    </li>
                </ul>
            </div>
        `;
    } else {
        // Generic 404 for darknet
        darknetContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center;">
                <h1 style="color:#d33c3c; font-family:'Verdana', sans-serif; font-size:48px; margin-bottom:10px;">404 Node Offline</h1>
                <p style="color:#a85b5b; font-family:'Verdana', sans-serif; font-size:14px;">The specified hidden directory could not be reached or has been seized.</p>
            </div>
        `;
    }
    }, 500);
}

// Global hook for the button injected above
window.startAddonInstaller = function () {
    if (typeof openDesktopWindow === 'function') openDesktopWindow('installer');

    const pbar = document.getElementById('installer-progress-bar');
    const title = document.getElementById('installer-title');
    const desc = document.getElementById('installer-text');

    if (title) title.textContent = 'BlueCode Detected';
    if (desc) desc.textContent = 'Installing OnionWeb AddOn securely...';

    if (pbar) {
        pbar.style.width = '0%';
        pbar.style.transition = 'none';
        void pbar.offsetWidth;
        pbar.style.transition = 'width 6s linear';
        pbar.style.width = '100%';
    }

    setTimeout(() => {
        if (typeof closeDesktopWindow === 'function') closeDesktopWindow('installer');
        gameState.addonInstalled = true;

        // Return to home page in browser
        if (darknetContent) {
            darknetContent.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#d33c3c; font-family:'Verdana', sans-serif;">
                    <h2 style="color:#d33c3c; border-bottom:1px dashed #d33c3c; padding-bottom:10px;">INSTALLATION COMPLETE</h2>
                    <p style="color:#a85b5b; margin-top:20px;">OnionWeb Laundering tools unlocked.</p>
                </div>
            `;
        }

        if (typeof applyStoryState === 'function') applyStoryState();
        if (typeof saveGame === 'function') saveGame();
        playSuccessSound();
    }, 6100);
};
