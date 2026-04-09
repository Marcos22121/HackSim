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
    applyDesktopWindowGeometry(appId);
    focusDesktopWindow(appId);
    addDesktopTaskbarTab(appId);

    if (appId === 'pallpay-desktop') {
        if (typeof updateCashDisplay === 'function') updateCashDisplay();
    }

    if (typeof saveGame === 'function') saveGame();
}

function closeDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win) return;

    if (appId === 'hackos') {
        if (typeof closeTerminal === 'function') closeTerminal();
        if (typeof closeWallet === 'function') closeWallet();
        if (typeof closeDecodify === 'function') closeDecodify();
        if (typeof closeLaunder === 'function') closeLaunder();
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
        win.windowEl.style.top    = '0';
        win.windowEl.style.left   = '0';
        win.windowEl.style.width  = '100%';
        win.windowEl.style.height = '100%';
    }
    focusDesktopWindow(appId);
    if (typeof saveGame === 'function') saveGame();
}

function applyDesktopWindowGeometry(appId) {
    const win = desktopWindows[appId];
    if (!win) return;
    win.windowEl.style.top    = win.normalPos.top    + 'px';
    win.windowEl.style.left   = win.normalPos.left   + 'px';
    win.windowEl.style.width  = win.normalPos.width  + 'px';
    win.windowEl.style.height = win.normalPos.height + 'px';
}

function saveDesktopWindowGeometry(appId) {
    const win = desktopWindows[appId];
    if (!win) return;
    win.normalPos.top    = parseInt(win.windowEl.style.top)    || win.normalPos.top;
    win.normalPos.left   = parseInt(win.windowEl.style.left)   || win.normalPos.left;
    win.normalPos.width  = parseInt(win.windowEl.style.width)  || win.normalPos.width;
    win.normalPos.height = parseInt(win.windowEl.style.height) || win.normalPos.height;
}

// ─── Desktop Taskbar Tabs ─────────────────────────────────────────────────────
const appTabConfig = {
    'hackos':           { label: 'BlueCode v0.1',  icon: './assets/icon-hackos.png' },
    'pallpay-desktop':  { label: 'PallPay',      icon: './assets/icon-pallpay.png' },
    'topmail':          { label: 'TopMail',      icon: './assets/icon-topmail.svg' },
    'documents':        { label: 'Documents',    icon: './assets/icon-documents.svg' },
    'notepad':          { label: 'Notepad',      icon: './assets/icon-documents.svg' },
};

function addDesktopTaskbarTab(appId) {
    const cfg = appTabConfig[appId];
    if (!cfg) return;
    if (document.getElementById('dtab-' + appId)) return;

    const tab = document.createElement('button');
    tab.id        = 'dtab-' + appId;
    tab.className = 'taskbar-app-tab active';
    tab.innerHTML = `<img src="${cfg.icon}" alt=""><span>${cfg.label}</span>`;
    tab.onclick   = () => {
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

// ─── Drag Logic (Mixed) ────────────────────────────────────────────────────────
var dragActive = false;
var dragTarget = null;
var dragState  = null;
var dragNormal = null;
var dragOffset = { x: 0, y: 0 };

function startSubDrag(e, panel, state, normalPosRef) {
    if (e.target.tagName === 'BUTTON') return;
    if (state !== 'normal') return;
    dragActive = true;
    dragTarget = panel;
    dragState  = state;
    dragNormal = normalPosRef;
    const rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
}

var desktopDragActive = false;
var desktopDragAppId  = null;
var desktopDragOffset = { x: 0, y: 0 };

function initDesktopDrag(appId, e) {
    const win = desktopWindows[appId];
    if (e.target.tagName === 'BUTTON') return;
    if (win.state !== 'normal') return;
    desktopDragActive = true;
    desktopDragAppId  = appId;
    const rect = win.windowEl.getBoundingClientRect();
    desktopDragOffset.x = e.clientX - rect.left;
    desktopDragOffset.y = e.clientY - rect.top;
    focusDesktopWindow(appId);
    e.preventDefault();
}

document.addEventListener('mousemove', e => {
    // Internal sub-window drag
    if (dragActive && dragTarget) {
        let par = hackosWindowBody.getBoundingClientRect();
        let newLeft = e.clientX - par.left - dragOffset.x;
        let newTop  = e.clientY - par.top  - dragOffset.y;
        newLeft = Math.max(0, Math.min(newLeft, par.width  - dragTarget.offsetWidth));
        newTop  = Math.max(0, Math.min(newTop,  par.height - dragTarget.offsetHeight));
        dragTarget.style.left = newLeft + 'px';
        dragTarget.style.top  = newTop  + 'px';
        if (dragNormal) { dragNormal.left = newLeft; dragNormal.top = newTop; }
    }
    // Desktop window drag
    if (desktopDragActive && desktopDragAppId) {
        const win = desktopWindows[desktopDragAppId];
        const par = windowContainer.getBoundingClientRect();
        let newLeft = e.clientX - par.left - desktopDragOffset.x;
        let newTop  = e.clientY - par.top  - desktopDragOffset.y;
        newLeft = Math.max(0, Math.min(newLeft, par.width  - win.windowEl.offsetWidth));
        newTop  = Math.max(0, Math.min(newTop,  par.height - win.windowEl.offsetHeight));
        win.windowEl.style.left = newLeft + 'px';
        win.windowEl.style.top  = newTop  + 'px';
        win.normalPos.left = newLeft;
        win.normalPos.top  = newTop;
    }
});

document.addEventListener('mouseup', () => {
    if (dragActive || desktopDragActive) {
        if (typeof saveGame === 'function') saveGame();
    }
    dragActive = false;
    dragTarget = null;
    dragState  = null;
    dragNormal = null;
    desktopDragActive = false;
    desktopDragAppId  = null;
});

// ─── Register Desktop Windows ─────────────────────────────────────────────────
const hackosWindow   = document.getElementById('hackos-window');
const hackosTitleBar = document.getElementById('hackos-title-bar');
if (hackosWindow && hackosTitleBar) {
    registerDesktopWindow('hackos', hackosWindow, hackosTitleBar,
        { top: 40, left: 60, width: Math.round(window.innerWidth * 0.85), height: Math.round(window.innerHeight * 0.80) });
    hackosTitleBar.addEventListener('mousedown', e => initDesktopDrag('hackos', e));
    hackosWindow.addEventListener('mousedown', () => focusDesktopWindow('hackos'));
}

const pallpayDesktopWindow   = document.getElementById('pallpay-desktop-window');
const pallpayDesktopTitleBar = document.getElementById('pallpay-desktop-title-bar');
if (pallpayDesktopWindow && pallpayDesktopTitleBar) {
    registerDesktopWindow('pallpay-desktop', pallpayDesktopWindow, pallpayDesktopTitleBar,
        { top: 80, left: 200, width: 620, height: 550 });
    pallpayDesktopTitleBar.addEventListener('mousedown', e => initDesktopDrag('pallpay-desktop', e));
    pallpayDesktopWindow.addEventListener('mousedown', () => focusDesktopWindow('pallpay-desktop'));
}

const topmailWindow   = document.getElementById('topmail-window');
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

const calcWindow = document.getElementById('calc-window');
const calcTitleBar = document.getElementById('calc-title-bar');
if (calcWindow && calcTitleBar) {
    registerDesktopWindow('calc', calcWindow, calcTitleBar,
        { top: 150, left: 250, width: 250, height: 350 });
}
    
const installerWindow = document.getElementById('installer-window');
if (installerWindow) {
    registerDesktopWindow('installer', installerWindow, installerWindow.querySelector('.title-bar'),
        { top: window.innerHeight/2 - 75, left: window.innerWidth/2 - 175, width: 350, height: 150 });
}

const bluemiumWindow   = document.getElementById('bluemium-window');
const bluemiumTitleBar = document.getElementById('bluemium-title-bar');
if (bluemiumWindow && bluemiumTitleBar) {
    registerDesktopWindow('bluemium', bluemiumWindow, bluemiumTitleBar,
        { top: 40, left: 80, width: 1000, height: 640 });
    bluemiumTitleBar.addEventListener('mousedown', e => initDesktopDrag('bluemium', e));
    bluemiumWindow.addEventListener('mousedown', () => focusDesktopWindow('bluemium'));
    bluemiumTitleBar.addEventListener('dblclick', () => toggleMaximizeDesktopWindow('bluemium'));
}

// Internal window drag wiring (needs items from terminal.js and finanzas.js)
const terminalTitleBar = document.getElementById('terminal-title-bar');
if (terminalTitleBar) terminalTitleBar.addEventListener('mousedown', e => startSubDrag(e, terminalPanel, terminalState, normalPos));
const walletTitleBarInternal = document.getElementById('wallet-title-bar');
if (walletTitleBarInternal) walletTitleBarInternal.addEventListener('mousedown', e => startSubDrag(e, walletPanel, walletState, walletNormalPos));
const decodifyTitleBarInternal = document.getElementById('decodify-title-bar');
if (decodifyTitleBarInternal) decodifyTitleBarInternal.addEventListener('mousedown', e => startSubDrag(e, decodifyPanel, decodifyState, decodifyNormalPos));
const launderTitleBarInternal = document.getElementById('launder-title-bar');
if (launderTitleBarInternal) launderTitleBarInternal.addEventListener('mousedown', e => startSubDrag(e, launderPanel, launderState, launderNormalPos));

// ─── Control Buttons ──────────────────────────────────────────────────────────
const controlMap = {
    'hackos-minimize':  () => minimizeDesktopWindow('hackos'),
    'hackos-maximize':  () => toggleMaximizeDesktopWindow('hackos'),
    'hackos-close':     () => closeDesktopWindow('hackos'),
    'pallpay-desktop-minimize': () => minimizeDesktopWindow('pallpay-desktop'),
    'pallpay-desktop-maximize': () => toggleMaximizeDesktopWindow('pallpay-desktop'),
    'pallpay-desktop-close':    () => closeDesktopWindow('pallpay-desktop'),
    'topmail-minimize': () => minimizeDesktopWindow('topmail'),
    'topmail-maximize': () => toggleMaximizeDesktopWindow('topmail'),
    'topmail-close':    () => closeDesktopWindow('topmail'),
    'minimize-documents': () => minimizeDesktopWindow('documents'),
    'maximize-documents': () => toggleMaximizeDesktopWindow('documents'),
    'close-documents':    () => closeDesktopWindow('documents'),
    'minimize-notepad':   () => minimizeDesktopWindow('notepad'),
    'maximize-notepad':   () => toggleMaximizeDesktopWindow('notepad'),
    'close-notepad':      () => closeDesktopWindow('notepad'),
    'bluemium-minimize':  () => minimizeDesktopWindow('bluemium'),
    'bluemium-maximize':  () => toggleMaximizeDesktopWindow('bluemium'),
    'bluemium-close':     () => closeDesktopWindow('bluemium'),
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
            if (app === 'hackos')  openDesktopWindow('hackos');
            if (app === 'pallpay') { openDesktopWindow('pallpay-desktop'); if (typeof updatePallPayActivity === 'function') updatePallPayActivity(); }
            if (app === 'topmail') openDesktopWindow('topmail');
            if (app === 'documents') { openDesktopWindow('documents'); if (typeof renderDocumentsList === 'function') renderDocumentsList(); }
            if (app === 'darknet')   openDesktopWindow('darknet');
            if (app === 'bluemium')  { openDesktopWindow('bluemium'); if (typeof browserNavigateTo === 'function') browserNavigateTo('newtab'); }
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
function updateClock() {
    if (!systemClock) return;
    const now = new Date();
    const h   = now.getHours();
    const m   = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    systemClock.textContent = `${h12}:${m} ${ampm}`;
}

updateClock();
setInterval(updateClock, 30000); 

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
const notificationList  = document.getElementById('notification-list');
const unreadBadge       = document.getElementById('unread-count');

function renderNotificationPanel() {
    if (!notificationList) return;
    notificationList.innerHTML = '';
    if (typeof inboxEmails === 'undefined') return;
    const recent = inboxEmails.slice(0, 5);
    let unreadCount = 0;
    
    recent.forEach(m => {
        if(m.unread) unreadCount++;
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
