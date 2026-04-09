/* =============================================
   0_state.js - Game State & Persistence
   ============================================= */

'use strict';

// ─── Core DOM Elements ───────────────────────────────────────────────────────
const xpDesktop         = document.getElementById('xp-desktop');
const loginScreen       = document.getElementById('login-screen');
const windowContainer   = document.getElementById('window-container');
const taskbarApps       = document.getElementById('taskbar-apps');
const systemClock       = document.getElementById('system-clock');
const windowTaskbar     = document.getElementById('window-taskbar');

// Panels
const terminalPanel     = document.getElementById('terminal-panel');
const walletPanel       = document.getElementById('wallet-panel');
const decodifyPanel     = document.getElementById('decodify-panel');
const launderPanel      = document.getElementById('launder-panel');
const hackosWindowBody  = document.getElementById('hackos-window-body');

// ─── Click Sound (all buttons) ───────────────────────────────────────────────
const clickSound = new Audio('./SFX/click.mp3');

function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
}

// ─── Hash Success & Cash Sounds ───────────────────────────────────────────────────
const successSounds = [
    new Audio('./SFX/terminal/success2.mp3'),
    new Audio('./SFX/terminal/success3.mp3'),
];

function playSuccessSound() {
    const snd = successSounds[Math.floor(Math.random() * successSounds.length)];
    snd.currentTime = 0;
    snd.play().catch(() => {});
}

const cashSound = new Audio('./SFX/cash.mp3');

function playCashSound() {
    cashSound.currentTime = 0;
    cashSound.play().catch(() => {});
}

document.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') playClick();
});

const gameState = {
    version:  '0.1.0',
    currency: 'Hash',
    balance:  0,
    cash:     0,
    dirtyCash: 0,
    cleanCash: 0,
    documentsUnlocked: [],
    transactions: [],
    storyProgress: 0, // 0 = Intro, 1 = Tools unlocked
    pcParts: {
        cpu:  { level: 0, basePrice: 25, multiplier: 1.30, name: "Processor" },
        gpu:  { level: 0, basePrice: 50, multiplier: 1.40, name: "Graphics Card" },
        ram1: { level: 0, basePrice: 15, multiplier: 1.20, name: "Memory Slot 1" },
        ram2: { level: 0, basePrice: 15, multiplier: 1.20, name: "Memory Slot 2" },
        psu:  { level: 0, basePrice: 20, multiplier: 1.25, name: "Power Supply" },
        mb:   { level: 0, basePrice: 35, multiplier: 1.35, name: "Motherboard" },
        case: { level: 0, basePrice: 10, multiplier: 1.15, name: "Gabinete" }
    }
};

function applyStoryState() {
    if (gameState.storyProgress >= 1) {
        document.getElementById('icon-hackos').style.display = 'flex';
        document.getElementById('icon-pallpay').style.display = 'flex';
        document.getElementById('icon-darknet').style.display = 'flex';
    } else {
        document.getElementById('icon-hackos').style.display = 'none';
        document.getElementById('icon-pallpay').style.display = 'none';
        document.getElementById('icon-darknet').style.display = 'none';
    }
}

// ─── Displays ────────────────────────────────────────────────────────────
const hashValueEl   = document.getElementById('hash-value');
const cashValueEl   = document.getElementById('cash-value-display');
const cashDesktopEl = document.getElementById('cash-value-desktop-display');

function updateHashDisplay() {
    if (hashValueEl) hashValueEl.textContent = gameState.balance.toFixed(2);
}

function updateCashDisplay() {
    const formatted = gameState.cash.toLocaleString(undefined, { minimumFractionDigits: 2 });
    
    // Legacy support
    if (cashValueEl)   cashValueEl.textContent   = formatted;
    if (cashDesktopEl) cashDesktopEl.textContent  = formatted;
    
    const v1 = document.getElementById('cash-value');
    if (v1) v1.textContent = formatted;

    // New sync classes (used in sections)
    document.querySelectorAll('.cash-sync-desktop').forEach(el => el.textContent = formatted);
    document.querySelectorAll('.cash-sync-internal').forEach(el => el.textContent = formatted);
}

function updateLaunderDisplay() {
    const dirtyEl = document.getElementById('launder-dirty-balance');
    const cleanEl = document.getElementById('launder-clean-balance');
    const transferBtn = document.getElementById('btn-launder-transfer');
    const processBtn = document.getElementById('btn-launder-process');
    
    if (dirtyEl) dirtyEl.textContent = gameState.dirtyCash.toFixed(2);
    if (cleanEl) cleanEl.textContent = gameState.cleanCash.toFixed(2);
    
    if (transferBtn) {
        if (gameState.cleanCash > 0) {
            transferBtn.removeAttribute('disabled');
        } else {
            transferBtn.setAttribute('disabled', 'true');
        }
    }
    
    if (processBtn) {
        // isLaundering is defined in finanzas.js
        if (gameState.dirtyCash > 0 && !(typeof isLaundering !== 'undefined' && isLaundering)) {
            processBtn.removeAttribute('disabled');
        } else {
            processBtn.setAttribute('disabled', 'true');
        }
    }
}

function addHash(amount) {
    gameState.balance = Math.round((gameState.balance + amount) * 100) / 100;
    updateHashDisplay();
    if (typeof showHashPopup === 'function') showHashPopup(amount);
    playSuccessSound();
    if (typeof saveGame === 'function') saveGame();
}

// ─── PERSISTENCE ───────────────────────────────────────────────────────────────

function saveGame() {
    // desktopWindows and terminalState are defined in other files
    const windowStates = {};
    if (typeof desktopWindows !== 'undefined') {
        for (const [appId, win] of Object.entries(desktopWindows)) {
            windowStates[appId] = {
                state: win.state,
                normalPos: { ...win.normalPos },
            };
        }
    }

    const saveData = {
        gameState,
        inboxEmails: typeof inboxEmails !== 'undefined' ? inboxEmails : [],
        desktopWindows: windowStates,
        ui: {
            terminalState: typeof terminalState !== 'undefined' ? terminalState : 'hidden',
            normalPos: typeof normalPos !== 'undefined' ? normalPos : null,
            walletState: typeof walletState !== 'undefined' ? walletState : 'hidden',
            walletNormalPos: typeof walletNormalPos !== 'undefined' ? walletNormalPos : null,
            decodifyState: typeof decodifyState !== 'undefined' ? decodifyState : 'hidden',
            decodifyNormalPos: typeof decodifyNormalPos !== 'undefined' ? decodifyNormalPos : null,
            launderState: typeof launderState !== 'undefined' ? launderState : 'hidden',
            launderNormalPos: typeof launderNormalPos !== 'undefined' ? launderNormalPos : null
        },
    };
    localStorage.setItem('hackOS_save', JSON.stringify(saveData));
}

function loadGame() {
    const rawData = localStorage.getItem('hackOS_save');
    if (!rawData) return;

    try {
        const data = JSON.parse(rawData);

        // Restore game data
        if (data.gameState) {
            gameState.balance = data.gameState.balance || 0;
            gameState.cash    = data.gameState.cash || 0;
            gameState.dirtyCash = data.gameState.dirtyCash || 0;
            gameState.cleanCash = data.gameState.cleanCash || 0;
            gameState.documentsUnlocked = data.gameState.documentsUnlocked || [];
            gameState.transactions = data.gameState.transactions || [];
            gameState.storyProgress = data.gameState.storyProgress || 0;
            if (data.gameState.pcParts) {
                // Merge loaded parts carefully to preserve structure if updates happen
                for (let key in data.gameState.pcParts) {
                    if (gameState.pcParts[key]) {
                        gameState.pcParts[key].level = data.gameState.pcParts[key].level || 0;
                    }
                }
            }
            updateHashDisplay();
            updateCashDisplay();
            updateLaunderDisplay();
            if (typeof updatePallPayActivity === 'function') updatePallPayActivity();
            applyStoryState();
        }

        // Restore emails
        if (data.inboxEmails && typeof inboxEmails !== 'undefined') {
            // Need to be careful here depends on how inboxEmails is declared
            // If it's a const, I can't reassign, but I can empty and push
            inboxEmails.length = 0;
            data.inboxEmails.forEach(e => inboxEmails.push(e));
            if (typeof renderInbox === 'function') renderInbox();
        }

        // Restore desktop window states
        if (data.desktopWindows && typeof desktopWindows !== 'undefined') {
            for (const [appId, saved] of Object.entries(data.desktopWindows)) {
                const win = desktopWindows[appId];
                if (!win) continue;
                if (saved.normalPos) win.normalPos = { ...saved.normalPos };

                if (saved.state === 'normal') {
                    if (typeof openDesktopWindow === 'function') openDesktopWindow(appId);
                } else if (saved.state === 'maximized') {
                    if (typeof openDesktopWindow === 'function') {
                        openDesktopWindow(appId);
                        if (typeof toggleMaximizeDesktopWindow === 'function') toggleMaximizeDesktopWindow(appId);
                    }
                } else if (saved.state === 'minimized') {
                    if (typeof openDesktopWindow === 'function') {
                        openDesktopWindow(appId);
                        if (typeof minimizeDesktopWindow === 'function') minimizeDesktopWindow(appId);
                    }
                }
            }
        }

        // Restore sub-window states (inside HackOS)
        if (data.ui) {
            // These would need to be in global scope to be assigned
            if (typeof normalPos !== 'undefined') window.normalPos = data.ui.normalPos || normalPos;
            if (typeof walletNormalPos !== 'undefined') window.walletNormalPos = data.ui.walletNormalPos || walletNormalPos;
            if (typeof decodifyNormalPos !== 'undefined') window.decodifyNormalPos = data.ui.decodifyNormalPos || decodifyNormalPos;
            if (typeof launderNormalPos !== 'undefined') window.launderNormalPos = data.ui.launderNormalPos || launderNormalPos;

            const savedTermState = data.ui.terminalState;
            if (savedTermState === 'normal') {
                if (typeof openTerminal === 'function') openTerminal();
            } else if (savedTermState === 'maximized') {
                if (typeof openTerminal === 'function') { openTerminal(); if (typeof toggleMaximize === 'function') toggleMaximize(); }
            } else if (savedTermState === 'minimized') {
                 if (typeof openTerminal === 'function') { openTerminal(); if (typeof minimizeTerminal === 'function') minimizeTerminal(); }
            }

            const savedWalletState = data.ui.walletState;
            if (savedWalletState === 'normal') {
                if (typeof openWallet === 'function') openWallet();
            } else if (savedWalletState === 'maximized') {
                if (typeof openWallet === 'function') { openWallet(); if (typeof toggleMaximizeWallet === 'function') toggleMaximizeWallet(); }
            } else if (savedWalletState === 'minimized') {
                if (typeof openWallet === 'function') { openWallet(); if (typeof minimizeWallet === 'function') minimizeWallet(); }
            }
            
            const savedDecodifyState = data.ui.decodifyState;
            if (savedDecodifyState === 'normal') {
                if (typeof openDecodify === 'function') openDecodify();
            } else if (savedDecodifyState === 'maximized') {
                if (typeof openDecodify === 'function') { openDecodify(); if (typeof toggleMaximizeDecodify === 'function') toggleMaximizeDecodify(); }
            } else if (savedDecodifyState === 'minimized') {
                if (typeof openDecodify === 'function') { openDecodify(); if (typeof minimizeDecodify === 'function') minimizeDecodify(); }
            }
            
            const savedLaunderState = data.ui.launderState;
            if (savedLaunderState === 'normal') {
                if (typeof openLaunder === 'function') openLaunder();
            } else if (savedLaunderState === 'maximized') {
                if (typeof openLaunder === 'function') { openLaunder(); if (typeof toggleMaximizeLaunder === 'function') toggleMaximizeLaunder(); }
            } else if (savedLaunderState === 'minimized') {
                if (typeof openLaunder === 'function') { openLaunder(); if (typeof minimizeLaunder === 'function') minimizeLaunder(); }
            }
        }
    } catch (e) {
        console.error("Failed to load game:", e);
    }
}
