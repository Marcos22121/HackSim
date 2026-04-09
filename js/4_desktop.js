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
    'pallpay':          { label: 'PallPay',      icon: './assets/icon-pallpay.png' },
    'terminal':         { label: 'H. Terminal',   icon: './assets/icon-terminal.png' },
    'decodify':         { label: 'Decodifier',    icon: './assets/icon-hackos.png' },
    'onionweb':         { label: 'OnionWeb',      icon: './assets/icon-darknet.svg' },
    'darknet':          { label: 'Dark Net',      icon: './assets/icon-darknet.svg' },
    'topmail':          { label: 'TopMail',      icon: './assets/icon-topmail.svg' },
    'documents':        { label: 'Documents',    icon: './assets/icon-documents.svg' },
    'notepad':          { label: 'Notepad',      icon: './assets/icon-documents.svg' },
    'bluemium':         { label: 'Bluemium',      icon: './assets/icon-bluemium.png' },
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

// ─── Drag Logic ────────────────────────────────────────────────────────────────
var desktopDragActive = false;
var desktopDragAppId  = null;
var desktopDragOffset = { x: 0, y: 0 };

function initDesktopDrag(appId, e) {
    const win = desktopWindows[appId];
    if (!win) return;
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
    if (desktopDragActive) {
        if (typeof saveGame === 'function') saveGame();
    }
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

const pallpayWindow   = document.getElementById('pallpay-window');
const pallpayTitleBar = document.getElementById('pallpay-title-bar');
if (pallpayWindow && pallpayTitleBar) {
    registerDesktopWindow('pallpay', pallpayWindow, pallpayTitleBar,
        { top: 80, left: 200, width: 620, height: 550 });
    pallpayTitleBar.addEventListener('mousedown', e => initDesktopDrag('pallpay', e));
    pallpayWindow.addEventListener('mousedown', () => focusDesktopWindow('pallpay'));
}

const terminalWindow   = document.getElementById('terminal-window');
const terminalTitleBar = document.getElementById('terminal-title-bar');
if (terminalWindow && terminalTitleBar) {
    registerDesktopWindow('terminal', terminalWindow, terminalTitleBar,
        { top: 100, left: 100, width: 900, height: 450 });
    terminalTitleBar.addEventListener('mousedown', e => initDesktopDrag('terminal', e));
    terminalWindow.addEventListener('mousedown', () => focusDesktopWindow('terminal'));
}

const decodifyWindow   = document.getElementById('decodify-window');
const decodifyTitleBar = document.getElementById('decodify-title-bar');
if (decodifyWindow && decodifyTitleBar) {
    registerDesktopWindow('decodify', decodifyWindow, decodifyTitleBar,
        { top: 120, left: 300, width: 380, height: 400 });
    decodifyTitleBar.addEventListener('mousedown', e => initDesktopDrag('decodify', e));
    decodifyWindow.addEventListener('mousedown', () => focusDesktopWindow('decodify'));
}

const onionwebWindow   = document.getElementById('onionweb-window');
const onionwebTitleBar = document.getElementById('onionweb-title-bar');
if (onionwebWindow && onionwebTitleBar) {
    registerDesktopWindow('onionweb', onionwebWindow, onionwebTitleBar,
        { top: 140, left: 350, width: 380, height: 450 });
    onionwebTitleBar.addEventListener('mousedown', e => initDesktopDrag('onionweb', e));
    onionwebWindow.addEventListener('mousedown', () => focusDesktopWindow('onionweb'));
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


// ─── Control Buttons ──────────────────────────────────────────────────────────
const controlMap = {
    'hackos-minimize':  () => minimizeDesktopWindow('hackos'),
    'hackos-maximize':  () => toggleMaximizeDesktopWindow('hackos'),
    'hackos-close':     () => closeDesktopWindow('hackos'),
    'pallpay-minimize': () => minimizeDesktopWindow('pallpay'),
    'pallpay-maximize': () => toggleMaximizeDesktopWindow('pallpay'),
    'pallpay-close':    () => closeDesktopWindow('pallpay'),
    'terminal-minimize': () => minimizeDesktopWindow('terminal'),
    'terminal-maximize': () => toggleMaximizeDesktopWindow('terminal'),
    'terminal-close':    () => closeDesktopWindow('terminal'),
    'decodify-minimize': () => minimizeDesktopWindow('decodify'),
    'decodify-maximize': () => toggleMaximizeDesktopWindow('decodify'),
    'decodify-close':    () => closeDesktopWindow('decodify'),
    'onionweb-minimize': () => minimizeDesktopWindow('onionweb'),
    'onionweb-maximize': () => toggleMaximizeDesktopWindow('onionweb'),
    'onionweb-close':    () => closeDesktopWindow('onionweb'),
    'topmail-minimize': () => minimizeDesktopWindow('topmail'),
    'topmail-maximize': () => toggleMaximizeDesktopWindow('topmail'),
    'topmail-close':    () => closeDesktopWindow('topmail'),
    'minimize-documents': () => minimizeDesktopWindow('documents'),
    'maximize-documents': () => toggleMaximizeDesktopWindow('documents'),
    'close-documents':    () => closeDesktopWindow('documents'),
    'minimize-notepad':   () => minimizeDesktopWindow('notepad'),
    'maximize-notepad':   () => toggleMaximizeDesktopWindow('notepad'),
    'close-notepad':      () => closeDesktopWindow('notepad'),
    'darknet-minimize':   () => minimizeDesktopWindow('darknet'),
    'darknet-maximize':   () => toggleMaximizeDesktopWindow('darknet'),
    'darknet-close':      () => closeDesktopWindow('darknet'),
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

// ─── Dark Net Browser Logic ──────────────────────────────────────────────────
const darknetUrlBar = document.getElementById('darknet-url-bar');
const btnDarknetGo  = document.getElementById('btn-darknet-go');
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
    
    // Exact match for the hidden OnionWeb url
    if (url === 'http://onion.web/laundering_service' || url === 'onion.web/laundering_service') {
        if (gameState.addonInstalled) {
            darknetContent.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#fff; font-family:monospace;">
                    <h2 style="color:#0f0;">AddOn ALREADY INSTALLED</h2>
                    <p>Access the service from within BlueCode.</p>
                </div>
            `;
        } else {
            // Render Landing Page
            darknetContent.innerHTML = `
                <div class="darknet-addon-landing">
                    <img src="assets/icon-darknet.svg" width="80" alt="">
                    <h2>OnionWeb Laundering AddOn</h2>
                    <p>To access the untraceable laundering network, you must install the encrypted communication layer into your host system.</p>
                    <button class="btn-turbina-download" onclick="startAddonInstaller()">Download & Install</button>
                </div>
            `;
        }
    } else {
        // Generic 404 for darknet
        darknetContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center;">
                <h1 style="color:#f00; font-family:'Courier New', monospace; font-size:48px; margin-bottom:10px;">404</h1>
                <p style="color:#a00; font-family:monospace; font-size:14px;">Node undiscoverable or offline.</p>
            </div>
        `;
    }
}

// Global hook for the button injected above
window.startAddonInstaller = function() {
    if (typeof openDesktopWindow === 'function') openDesktopWindow('installer');
    
    const pbar = document.getElementById('installer-progress-bar');
    const title = document.getElementById('installer-title');
    const desc = document.getElementById('installer-desc');
    
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
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#fff; font-family:monospace;">
                    <h2 style="color:#0f0;">INSTALLATION COMPLETE</h2>
                    <p>OnionWeb Laundering tools unlocked.</p>
                </div>
            `;
        }
        
        if (typeof applyStoryState === 'function') applyStoryState();
        if (typeof saveGame === 'function') saveGame();
        playSuccessSound();
    }, 6100);
};
