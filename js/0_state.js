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

// Windows
const terminalPanel     = document.getElementById('terminal-window');
const walletPanel       = document.getElementById('pallpay-window');
const decodifyPanel     = document.getElementById('decodify-window');
const launderPanel      = document.getElementById('onionweb-window');
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

const mailSound = new Audio('./SFX/correo/noticorreo.mp3');

function playMailSound() {
    mailSound.currentTime = 0;
    mailSound.play().catch(() => {});
}

document.addEventListener('click', e => {
    if (e.target.closest('button')) playClick();
});

const gameState = {
    version:  '0.1.0',
    currency: 'Hash',
    balance:  0,
    cash:     0,
    dirtyCash: 0,
    cleanCash: 0,
    currentDay: 1,
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
    },
    // Rent system
    lastRentPaidDay: 0,    // Day when rent was last paid
    rentDueDay: 7,         // Next day rent is due
    rentOwed: 0,           // Current unpaid rent amount
};

function applyStoryState() {
    if (gameState.storyProgress >= 1) {
        let el = document.getElementById('icon-hackos'); if(el) el.style.display = 'flex';
        el = document.getElementById('icon-pallpay'); if(el) el.style.display = 'flex';
        el = document.getElementById('icon-darknet'); if(el) el.style.display = 'flex';
    } else {
        let el = document.getElementById('icon-hackos'); if(el) el.style.display = 'none';
        el = document.getElementById('icon-pallpay'); if(el) el.style.display = 'none';
        el = document.getElementById('icon-darknet'); if(el) el.style.display = 'none';
    }

    const launderBtn = document.getElementById('btn-open-launder');
    const launderLbl = document.getElementById('launder-label');
    const launderIcn = document.getElementById('launder-icon-container');
    const iconOnionWeb = document.getElementById('icon-onionweb');

    if (gameState.addonInstalled) {
        if (launderBtn) launderBtn.removeAttribute('disabled');
        if (iconOnionWeb) iconOnionWeb.style.display = 'flex';
        if (launderLbl) {
            launderLbl.textContent = 'OnionWeb - Launder';
            launderLbl.style.color = '#d33c3c';
        }
        if (launderIcn) {
            launderIcn.style.opacity = '1';
            const img = launderIcn.querySelector('img');
            if (img) img.style.filter = 'none';
        }
    } else {
        if (launderBtn) launderBtn.setAttribute('disabled', 'true');
        if (iconOnionWeb) iconOnionWeb.style.display = 'none';
        if (launderLbl) {
            launderLbl.textContent = 'Must Install AddOn';
            launderLbl.style.color = '#888';
        }
        if (launderIcn) {
            launderIcn.style.opacity = '0.4';
            const img = launderIcn.querySelector('img');
            if (img) img.style.filter = 'grayscale(1)';
        }
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
        desktopWindows: windowStates
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
            gameState.currentDay    = data.gameState.currentDay    || 1;
            gameState.lastRentPaidDay = data.gameState.lastRentPaidDay || 0;
            gameState.rentDueDay    = data.gameState.rentDueDay    || 7;
            gameState.rentOwed      = data.gameState.rentOwed      || 0;
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

        // Sub-windows have been merged natively into desktopWindows!
    } catch (e) {
        console.error("Failed to load game:", e);
    }
}
