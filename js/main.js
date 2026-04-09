/* =============================================
   BlueCode — Hacker Simulator
   Game Logic — XP Desktop Edition
   ============================================= */

'use strict';

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

// ─── Game State ──────────────────────────────────────────────────────────────
const gameState = {
    version:  '0.1.0',
    currency: 'Hash',
    balance:  0,
    cash:     0,
};

// ─── Displays ────────────────────────────────────────────────────────────
const hashValueEl   = document.getElementById('hash-value');
const cashValueEl   = document.getElementById('cash-value-display');
const cashDesktopEl = document.getElementById('cash-value-desktop-display');

function updateHashDisplay() {
    hashValueEl.textContent = gameState.balance.toFixed(2);
}

function updateCashDisplay() {
    if (cashValueEl)   cashValueEl.textContent   = gameState.cash.toFixed(1);
    if (cashDesktopEl) cashDesktopEl.textContent  = gameState.cash.toFixed(1);
}

function addHash(amount) {
    gameState.balance = Math.round((gameState.balance + amount) * 100) / 100;
    updateHashDisplay();
    showHashPopup(amount);
    playSuccessSound();
    saveGame();
}

// ─── Hash Earned Popup ───────────────────────────────────────────────────────
const hashPopupEl = document.getElementById('hash-popup');

function showHashPopup(amount) {
    hashPopupEl.textContent = `+${amount.toFixed(2)} Hash`;
    hashPopupEl.classList.remove('hash-popup-animate');
    void hashPopupEl.offsetWidth;
    hashPopupEl.classList.add('hash-popup-animate');
}

// ─── Code Lines Pool ─────────────────────────────────────────────────────────
const codeLines = [
    { text: 'root.hack.id.843',      hash: 0.1 },
    { text: 'ping 192.168.1.1',      hash: 0.1 },
    { text: 'ssh root@target.net',   hash: 0.1 },
    { text: 'nmap -sV 10.0.0.1',     hash: 0.1 },
    { text: 'exploit.run --force',   hash: 0.1 },
    { text: 'inject.payload.x86',    hash: 0.1 },
    { text: 'trace --log off',       hash: 0.1 },
    { text: 'crack hash md5 a3f9',   hash: 0.1 },
    { text: 'bypass.fw port 443',    hash: 0.1 },
    { text: 'wget http://cdn.x/sh',  hash: 0.1 },
    { text: 'cat /etc/passwd',       hash: 0.1 },
    { text: 'chmod 777 run.sh',      hash: 0.1 },
];

// ─── Typing State ────────────────────────────────────────────────────────────
let currentLine  = null;
let typedIndex   = 0;
let typingActive = false;
let lastLineIdx  = -1;

const typedTextEl = document.getElementById('typed-text');
const ghostTextEl = document.getElementById('ghost-text');

function pickLine() {
    let idx;
    do { idx = Math.floor(Math.random() * codeLines.length); }
    while (idx === lastLineIdx && codeLines.length > 1);
    lastLineIdx = idx;

    currentLine = codeLines[idx];
    typedIndex  = 0;
    typedTextEl.textContent = '';
    ghostTextEl.textContent = currentLine.text;
}

function handleTyping(e) {
    if (!currentLine || !typingActive) return;
    e.preventDefault();
    if (e.key.length > 1) return;

    if (e.key !== currentLine.text[typedIndex]) return;

    typedIndex++;
    typedTextEl.textContent = currentLine.text.slice(0, typedIndex);
    ghostTextEl.textContent = currentLine.text.slice(typedIndex);

    if (typedIndex === currentLine.text.length) lineComplete();
}

function lineComplete() {
    const reward        = currentLine.hash;
    const completedText = currentLine.text;
    typingActive = false;

    typedTextEl.classList.add('line-complete-flash');
    setTimeout(() => {
        typedTextEl.classList.remove('line-complete-flash');
        addTerminalLine(`root@bluecode:~$ ${completedText}`);
        pickLine();
        typingActive = true;
    }, 380);

    addHash(reward);
}

function activateTyping() {
    typingActive = true;
    document.addEventListener('keydown', handleTyping);
}

function deactivateTyping() {
    typingActive = false;
    document.removeEventListener('keydown', handleTyping);
}

// ─── Terminal — DOM refs ──────────────────────────────────────────────────────
const terminalPanel    = document.getElementById('terminal-panel');
const terminalTitleBar = document.getElementById('terminal-title-bar');
const terminalOutput   = document.getElementById('terminal-output');
const btnTermMax       = document.getElementById('btn-maximize-terminal');
const hackosWindowBody = document.getElementById('hackos-window-body');
const windowTaskbar    = document.getElementById('window-taskbar');

const walletPanel      = document.getElementById('wallet-panel');
const walletTitleBar   = document.getElementById('wallet-title-bar');
const btnWalletMax     = document.getElementById('btn-maximize-wallet');

const decodifyPanel    = document.getElementById('decodify-panel');
const decodifyTitleBar = document.getElementById('decodify-title-bar');
const btnDecodifyMax   = document.getElementById('btn-maximize-decodify');

let terminalInterval = null;

// ─── Terminal — Ambient stream ────────────────────────────────────────────────
const ambientLines = [
    () => `[SYS]    Scanning ${randomIP()} ... OPEN`,
    () => `[AUTH]   Brute-force port ${randomPort()} — ${randomResult()}`,
    () => `[NET]    Packet: ${randomHex(12)} → ${randomHex(12)}`,
    () => `[CRYPTO] Hash: ${randomHash()}`,
    () => `[FS]     /proc/uuid ... ${randomUUID()}`,
    () => `[SSH]    Connect ${randomIP()}:22 ... ${randomResult()}`,
    () => `[FW]     Bypass CVE-${randomCVE()}`,
    () => `[LOAD]   Shellcode @ 0x${randomAddr()} ... OK`,
    () => `[LOG]    Wipe ${randomHex(4)} /var/log/auth.log`,
    () => `[PROXY]  Node ${randomIP()} (${rand(8, 240)}ms)`,
    () => `[DB]     Dump users — ${rand(12, 4000)} rows`,
    () => `[KERN]   Escalation granted — UID 0`,
    () => `         > ${randomHex(40)}`,
];

function addTerminalLine(text) {
    const line = document.createElement('div');
    line.className    = 'terminal-line';
    line.textContent  = text;
    terminalOutput.appendChild(line);
    while (terminalOutput.childElementCount > 200) {
        terminalOutput.removeChild(terminalOutput.firstChild);
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function getBootSequence() {
    return [
        'BlueCode Terminal v0.1.0 — Initializing...',
        'Loading kernel modules........... OK',
        `Network interface eth0 — ${randomIP()}`,
        'Tor routing layer................. ACTIVE',
        'AES-256 encryption................ OK',
        '─────────────────────────────────────────',
        'Ready. Type the code to hack.',
        '',
    ];
}

function startAmbientStream() {
    if (terminalInterval) return;
    terminalInterval = setInterval(() => {
        const fn = ambientLines[rand(0, ambientLines.length - 1)];
        addTerminalLine(fn());
    }, rand(800, 1800));
}

function stopAmbientStream() {
    clearInterval(terminalInterval);
    terminalInterval = null;
}

// ─── Sub-Window State Machine (Terminal inside HackOS) ───────────────────────
let terminalState = 'hidden';
let normalPos = { top: 30, left: 20, width: 900, height: Math.round(window.innerHeight * 0.45) };

function applyNormalGeometry() {
    terminalPanel.style.top    = normalPos.top    + 'px';
    terminalPanel.style.left   = normalPos.left   + 'px';
    terminalPanel.style.width  = normalPos.width  + 'px';
    terminalPanel.style.height = normalPos.height + 'px';
}

function openTerminal() {
    if (terminalState !== 'hidden') {
        if (terminalState === 'minimized') restoreFromMinimize();
        return;
    }
    terminalState = 'normal';
    terminalPanel.classList.remove('is-maximized');
    terminalPanel.style.display = 'flex';
    btnTermMax.setAttribute('aria-label', 'Maximize');
    applyNormalGeometry();

    terminalOutput.innerHTML   = '';
    typedTextEl.textContent    = '';
    ghostTextEl.textContent    = '';
    hashPopupEl.classList.remove('hash-popup-animate');
    hashPopupEl.textContent    = '';
    if (document.activeElement) document.activeElement.blur();

    let i = 0;
    const seq = getBootSequence();
    const bootTimer = setInterval(() => {
        if (i < seq.length) {
            addTerminalLine(seq[i++]);
        } else {
            clearInterval(bootTimer);
            startAmbientStream();
            pickLine();
            activateTyping();
            saveGame();
        }
    }, 110);
}

function closeTerminal() {
    terminalState = 'hidden';
    terminalPanel.style.display = 'none';
    terminalPanel.classList.remove('is-maximized');
    stopAmbientStream();
    deactivateTyping();
    currentLine = null;
    removeInternalTaskbarTab('tab-terminal');
    saveGame();
}

function minimizeTerminal() {
    if (terminalState === 'hidden') return;
    if (terminalState === 'normal') saveNormalGeometry();
    if (terminalState === 'maximized') {
        terminalPanel.classList.remove('is-maximized');
        btnTermMax.setAttribute('aria-label', 'Maximize');
    }
    terminalState = 'minimized';
    terminalPanel.style.display = 'none';
    addInternalTaskbarTab('tab-terminal', '>_ Hack Terminal', restoreFromMinimize);
    saveGame();
}

function restoreFromMinimize() {
    removeInternalTaskbarTab('tab-terminal');
    terminalState = 'normal';
    terminalPanel.classList.remove('is-maximized');
    terminalPanel.style.display = 'flex';
    btnTermMax.setAttribute('aria-label', 'Maximize');
    applyNormalGeometry();
    hashPopupEl.classList.remove('hash-popup-animate');
    hashPopupEl.textContent = '';
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function toggleMaximize() {
    if (terminalState === 'maximized') {
        terminalState = 'normal';
        terminalPanel.classList.remove('is-maximized');
        btnTermMax.setAttribute('aria-label', 'Maximize');
        applyNormalGeometry();
    } else if (terminalState === 'normal') {
        saveNormalGeometry();
        terminalState = 'maximized';
        terminalPanel.classList.add('is-maximized');
        btnTermMax.setAttribute('aria-label', 'Restore');
        terminalPanel.style.top    = '0';
        terminalPanel.style.left   = '0';
        terminalPanel.style.width  = '100%';
        terminalPanel.style.height = '100%';
    }
    saveGame();
}

function saveNormalGeometry() {
    normalPos.top    = parseInt(terminalPanel.style.top)    || 40;
    normalPos.left   = parseInt(terminalPanel.style.left)   || 20;
    normalPos.width  = parseInt(terminalPanel.style.width)  || 720;
    normalPos.height = parseInt(terminalPanel.style.height) || 440;
}

// ─── Sub-Window: Wallet inside HackOS ─────────────────────────────────────────
let walletState = 'hidden';
let walletNormalPos = { top: 60, left: 100, width: 400, height: 300 };

function applyWalletNormalGeometry() {
    walletPanel.style.top    = walletNormalPos.top    + 'px';
    walletPanel.style.left   = walletNormalPos.left   + 'px';
    walletPanel.style.width  = walletNormalPos.width  + 'px';
    walletPanel.style.height = walletNormalPos.height + 'px';
}

function openWallet() {
    if (walletState !== 'hidden') {
        if (walletState === 'minimized') restoreWalletFromMinimize();
        return;
    }
    walletState = 'normal';
    walletPanel.classList.remove('is-maximized');
    walletPanel.style.display = 'flex';
    btnWalletMax.setAttribute('aria-label', 'Maximize');
    applyWalletNormalGeometry();
    updateCashDisplay();
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function closeWallet() {
    walletState = 'hidden';
    walletPanel.style.display = 'none';
    walletPanel.classList.remove('is-maximized');
    removeInternalTaskbarTab('tab-wallet');
    saveGame();
}

function minimizeWallet() {
    if (walletState === 'hidden') return;
    if (walletState === 'normal') saveWalletNormalGeometry();
    if (walletState === 'maximized') {
        walletPanel.classList.remove('is-maximized');
        btnWalletMax.setAttribute('aria-label', 'Maximize');
    }
    walletState = 'minimized';
    walletPanel.style.display = 'none';
    addInternalTaskbarTab('tab-wallet', '💳 PallPay', restoreWalletFromMinimize);
    saveGame();
}

function restoreWalletFromMinimize() {
    removeInternalTaskbarTab('tab-wallet');
    walletState = 'normal';
    walletPanel.classList.remove('is-maximized');
    walletPanel.style.display = 'flex';
    btnWalletMax.setAttribute('aria-label', 'Maximize');
    applyWalletNormalGeometry();
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function toggleMaximizeWallet() {
    if (walletState === 'maximized') {
        walletState = 'normal';
        walletPanel.classList.remove('is-maximized');
        btnWalletMax.setAttribute('aria-label', 'Maximize');
        applyWalletNormalGeometry();
    } else if (walletState === 'normal') {
        saveWalletNormalGeometry();
        walletState = 'maximized';
        walletPanel.classList.add('is-maximized');
        btnWalletMax.setAttribute('aria-label', 'Restore');
        walletPanel.style.top    = '0';
        walletPanel.style.left   = '0';
        walletPanel.style.width  = '100%';
        walletPanel.style.height = '100%';
    }
    saveGame();
}

function saveWalletNormalGeometry() {
    walletNormalPos.top    = parseInt(walletPanel.style.top)    || 60;
    walletNormalPos.left   = parseInt(walletPanel.style.left)   || 100;
    walletNormalPos.width  = parseInt(walletPanel.style.width)  || 400;
    walletNormalPos.height = parseInt(walletPanel.style.height) || 300;
}

// ─── Sub-Window: Decodify inside HackOS ───────────────────────────────────────
let decodifyState = 'hidden';
let decodifyNormalPos = { top: 70, left: 450, width: 380, height: 400 };

function applyDecodifyNormalGeometry() {
    decodifyPanel.style.top    = decodifyNormalPos.top    + 'px';
    decodifyPanel.style.left   = decodifyNormalPos.left   + 'px';
    decodifyPanel.style.width  = decodifyNormalPos.width  + 'px';
    decodifyPanel.style.height = decodifyNormalPos.height + 'px';
}

function openDecodify() {
    if (decodifyState !== 'hidden') {
        if (decodifyState === 'minimized') restoreDecodifyFromMinimize();
        return;
    }
    decodifyState = 'normal';
    decodifyPanel.classList.remove('is-maximized');
    decodifyPanel.style.display = 'flex';
    btnDecodifyMax.setAttribute('aria-label', 'Maximize');
    applyDecodifyNormalGeometry();
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function closeDecodify() {
    decodifyState = 'hidden';
    decodifyPanel.style.display = 'none';
    decodifyPanel.classList.remove('is-maximized');
    removeInternalTaskbarTab('tab-decodify');
    saveGame();
}

function minimizeDecodify() {
    if (decodifyState === 'hidden') return;
    if (decodifyState === 'normal') saveDecodifyNormalGeometry();
    if (decodifyState === 'maximized') {
        decodifyPanel.classList.remove('is-maximized');
        btnDecodifyMax.setAttribute('aria-label', 'Maximize');
    }
    decodifyState = 'minimized';
    decodifyPanel.style.display = 'none';
    addInternalTaskbarTab('tab-decodify', '🔐 Decodifier', restoreDecodifyFromMinimize);
    saveGame();
}

function restoreDecodifyFromMinimize() {
    removeInternalTaskbarTab('tab-decodify');
    decodifyState = 'normal';
    decodifyPanel.classList.remove('is-maximized');
    decodifyPanel.style.display = 'flex';
    btnDecodifyMax.setAttribute('aria-label', 'Maximize');
    applyDecodifyNormalGeometry();
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function toggleMaximizeDecodify() {
    if (decodifyState === 'maximized') {
        decodifyState = 'normal';
        decodifyPanel.classList.remove('is-maximized');
        btnDecodifyMax.setAttribute('aria-label', 'Maximize');
        applyDecodifyNormalGeometry();
    } else if (decodifyState === 'normal') {
        saveDecodifyNormalGeometry();
        decodifyState = 'maximized';
        decodifyPanel.classList.add('is-maximized');
        btnDecodifyMax.setAttribute('aria-label', 'Restore');
        decodifyPanel.style.top    = '0';
        decodifyPanel.style.left   = '0';
        decodifyPanel.style.width  = '100%';
        decodifyPanel.style.height = '100%';
    }
    saveGame();
}

function saveDecodifyNormalGeometry() {
    decodifyNormalPos.top    = parseInt(decodifyPanel.style.top)    || 70;
    decodifyNormalPos.left   = parseInt(decodifyPanel.style.left)   || 450;
    decodifyNormalPos.width  = parseInt(decodifyPanel.style.width)  || 380;
    decodifyNormalPos.height = parseInt(decodifyPanel.style.height) || 400;
}

// ─── Decoding Logic ───────────────────────────────────────────────────────────
const decodifyAmountInput = document.getElementById('decodify-amount');
const projectedCashOutput = document.getElementById('projected-cash');
const decodifyProgressBar = document.getElementById('decodify-progress-bar');
const decodifyStatusText  = document.getElementById('decodify-status-text');
const btnStartDecodify    = document.getElementById('btn-start-decodify');

let isDecoding = false;
let decodifyTimer = null;

decodifyAmountInput.addEventListener('input', () => {
    if(isDecoding) return;
    const val = parseFloat(decodifyAmountInput.value) || 0;
    const proj = (val * 1.5).toFixed(2);
    projectedCashOutput.textContent = proj;
});

function startDecodingSequence() {
    if(isDecoding) return;
    const val = parseFloat(decodifyAmountInput.value);
    
    if(isNaN(val) || val < 1) {
        decodifyStatusText.textContent = "Error: Minimum 1 Hash required.";
        return;
    }
    if (val > gameState.balance) {
        decodifyStatusText.textContent = "Error: Insufficient Hashes in inventory.";
        return;
    }

    // Deduct hash and start
    addHash(-val);
    isDecoding = true;
    decodifyAmountInput.disabled = true;
    btnStartDecodify.disabled = true;
    decodifyProgressBar.style.width = '0%';
    decodifyStatusText.textContent = `Target locked. Decoding process started...`;

    const totalTime = 45000; // 45 seconds
    const intervalTime = 100;
    let elapsedTime = 0;

    decodifyTimer = setInterval(() => {
        elapsedTime += intervalTime;
        const progress = Math.min((elapsedTime / totalTime) * 100, 100);
        decodifyProgressBar.style.width = `${progress}%`;
        
        if(elapsedTime % 1000 === 0) {
            const left = Math.ceil((totalTime - elapsedTime)/1000);
            decodifyStatusText.textContent = `Decoding in progress... ~${left}s remaining.`;
        }

        if(elapsedTime >= totalTime) {
            clearInterval(decodifyTimer);
            decodifyTimer = null;
            completeDecoding(val);
        }
    }, intervalTime);
}

function completeDecoding(hashAmount) {
    playCashSound();
    const cashGained = hashAmount * 1.5;
    gameState.cash += cashGained;
    updateCashDisplay();
    saveGame();
    
    decodifyStatusText.textContent = `Success! $${cashGained.toFixed(2)} Cash transferred to PallPay.`;
    decodifyProgressBar.style.width = '100%';
    
    setTimeout(() => {
        isDecoding = false;
        decodifyAmountInput.disabled = false;
        btnStartDecodify.disabled = false;
        decodifyProgressBar.style.width = '0%';
        decodifyAmountInput.value = '';
        projectedCashOutput.textContent = '0.00';
    }, 4000);
}

// ─── Internal Taskbar Tabs (inside HackOS window) ─────────────────────────────
function addInternalTaskbarTab(id, label, restoreFn) {
    if (document.getElementById(id)) return;
    const tab = document.createElement('button');
    tab.id        = id;
    tab.className = 'taskbar-tab';
    tab.textContent = label;
    tab.onclick   = restoreFn;
    windowTaskbar.appendChild(tab);
}

function removeInternalTaskbarTab(id) {
    const tab = document.getElementById(id);
    if (tab) tab.remove();
}

// ─── Wire up sub-window button events ─────────────────────────────────────────
document.getElementById('btn-open-terminal').addEventListener('click', openTerminal);
document.getElementById('btn-minimize-terminal').addEventListener('click', minimizeTerminal);
document.getElementById('btn-maximize-terminal').addEventListener('click', toggleMaximize);
document.getElementById('btn-close-terminal').addEventListener('click', closeTerminal);

document.getElementById('btn-open-wallet').addEventListener('click', openWallet);
document.getElementById('btn-minimize-wallet').addEventListener('click', minimizeWallet);
document.getElementById('btn-maximize-wallet').addEventListener('click', toggleMaximizeWallet);
document.getElementById('btn-close-wallet').addEventListener('click', closeWallet);

document.getElementById('btn-open-decodify').addEventListener('click', openDecodify);
document.getElementById('btn-minimize-decodify').addEventListener('click', minimizeDecodify);
document.getElementById('btn-maximize-decodify').addEventListener('click', toggleMaximizeDecodify);
document.getElementById('btn-close-decodify').addEventListener('click', closeDecodify);

document.getElementById('btn-start-decodify').addEventListener('click', startDecodingSequence);

// ─── Sub-Window Drag Logic ────────────────────────────────────────────────────
let dragActive = false;
let dragTarget = null;
let dragState  = null;
let dragNormal = null;
let dragOffset = { x: 0, y: 0 };

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

terminalTitleBar.addEventListener('mousedown', e => startSubDrag(e, terminalPanel, terminalState, normalPos));
walletTitleBar.addEventListener('mousedown', e => startSubDrag(e, walletPanel, walletState, walletNormalPos));
decodifyTitleBar.addEventListener('mousedown', e => startSubDrag(e, decodifyPanel, decodifyState, decodifyNormalPos));

document.addEventListener('mousemove', e => {
    if (!dragActive || !dragTarget) return;

    // Determine parent bounds
    let par;
    if (dragTarget === terminalPanel || dragTarget === walletPanel || dragTarget === decodifyPanel) {
        par = hackosWindowBody.getBoundingClientRect();
    } else {
        par = windowContainer.getBoundingClientRect();
    }

    let newLeft = e.clientX - par.left - dragOffset.x;
    let newTop  = e.clientY - par.top  - dragOffset.y;
    newLeft = Math.max(0, Math.min(newLeft, par.width  - dragTarget.offsetWidth));
    newTop  = Math.max(0, Math.min(newTop,  par.height - dragTarget.offsetHeight));

    dragTarget.style.left = newLeft + 'px';
    dragTarget.style.top  = newTop  + 'px';

    if (dragNormal) {
        dragNormal.left = newLeft;
        dragNormal.top  = newTop;
    }
});

document.addEventListener('mouseup', () => {
    if (dragActive) saveGame();
    dragActive = false;
    dragTarget = null;
    dragState  = null;
    dragNormal = null;
});

// ═══════════════════════════════════════════════════════════════════════════════
//  XP DESKTOP — Window Manager
// ═══════════════════════════════════════════════════════════════════════════════

const loginScreen    = document.getElementById('login-screen');
const xpDesktop      = document.getElementById('xp-desktop');
const windowContainer= document.getElementById('window-container');
const taskbarApps    = document.getElementById('taskbar-apps');
const systemClock    = document.getElementById('system-clock');

// ─── Desktop Windows Registry ────────────────────────────────────────────────
// Each app: { id, windowEl, titleBarEl, state, normalPos, taskbarTabEl }
const desktopWindows = {};
let topZIndex = 100;

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
    // Remove focused from all
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

    // App-specific init
    if (appId === 'hackos') {
        // Load saved sub-window states if any
    }
    if (appId === 'pallpay-desktop') {
        updateCashDisplay();
    }

    saveGame();
}

function closeDesktopWindow(appId) {
    const win = desktopWindows[appId];
    if (!win) return;

    if (appId === 'hackos') {
        closeTerminal();
        closeWallet();
        closeDecodify();
    }

    win.state = 'hidden';
    win.windowEl.style.display = 'none';
    win.windowEl.classList.remove('is-maximized');
    removeDesktopTaskbarTab(appId);
    saveGame();
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
    saveGame();
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
    saveGame();
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
    saveGame();
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
    taskbarApps.appendChild(tab);
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

// ─── Desktop Window Drag Logic ────────────────────────────────────────────────
let desktopDragActive = false;
let desktopDragAppId  = null;
let desktopDragOffset = { x: 0, y: 0 };

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
    if (!desktopDragActive || !desktopDragAppId) return;
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
});

document.addEventListener('mouseup', () => {
    if (desktopDragActive) saveGame();
    desktopDragActive = false;
    desktopDragAppId  = null;
});

// ─── Register Desktop Windows ─────────────────────────────────────────────────
const hackosWindow  = document.getElementById('hackos-window');
const hackosTitleBar = document.getElementById('hackos-title-bar');
registerDesktopWindow('hackos', hackosWindow, hackosTitleBar,
    { top: 40, left: 60, width: Math.round(window.innerWidth * 0.85), height: Math.round(window.innerHeight * 0.80) });

const pallpayDesktopWindow   = document.getElementById('pallpay-desktop-window');
const pallpayDesktopTitleBar = document.getElementById('pallpay-desktop-title-bar');
registerDesktopWindow('pallpay-desktop', pallpayDesktopWindow, pallpayDesktopTitleBar,
    { top: 80, left: 200, width: 420, height: 320 });

// Wire up title bar drag
hackosTitleBar.addEventListener('mousedown', e => initDesktopDrag('hackos', e));
pallpayDesktopTitleBar.addEventListener('mousedown', e => initDesktopDrag('pallpay-desktop', e));

// Wire up window control buttons
document.getElementById('btn-hackos-minimize').addEventListener('click', () => minimizeDesktopWindow('hackos'));
document.getElementById('btn-hackos-maximize').addEventListener('click', () => toggleMaximizeDesktopWindow('hackos'));
document.getElementById('btn-hackos-close').addEventListener('click',    () => closeDesktopWindow('hackos'));

document.getElementById('btn-pallpay-desktop-minimize').addEventListener('click', () => minimizeDesktopWindow('pallpay-desktop'));
document.getElementById('btn-pallpay-desktop-maximize').addEventListener('click', () => toggleMaximizeDesktopWindow('pallpay-desktop'));
document.getElementById('btn-pallpay-desktop-close').addEventListener('click',    () => closeDesktopWindow('pallpay-desktop'));

// Click on window body to focus
hackosWindow.addEventListener('mousedown', () => focusDesktopWindow('hackos'));
pallpayDesktopWindow.addEventListener('mousedown', () => focusDesktopWindow('pallpay-desktop'));

// ─── Desktop Icons — Double Click ─────────────────────────────────────────────
let lastClickTime = 0;
let lastClickTarget = null;

document.getElementById('desktop-icons').addEventListener('click', e => {
    const icon = e.target.closest('.desktop-icon');
    if (!icon) return;

    // Select icon
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');

    // Double-click detection (300ms window)
    const now = Date.now();
    if (lastClickTarget === icon && (now - lastClickTime) < 400) {
        const app = icon.dataset.app;
        if (app === 'hackos')  openDesktopWindow('hackos');
        if (app === 'pallpay') openDesktopWindow('pallpay-desktop');
        // 'trash' does nothing
        lastClickTime = 0;
        lastClickTarget = null;
    } else {
        lastClickTime = now;
        lastClickTarget = icon;
    }
});

// Deselect icons when clicking on desktop background
xpDesktop.addEventListener('click', e => {
    if (e.target === xpDesktop || e.target.id === 'desktop-icons') {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    }
});

// ─── System Clock ─────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const h   = now.getHours();
    const m   = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    systemClock.textContent = `${h12}:${m} ${ampm}`;
}

updateClock();
setInterval(updateClock, 30000); // update every 30 seconds

// ─── Show Desktop Toggle ──────────────────────────────────────────────────────
function showDesktop() {
    // Minimize all windows that aren't already hidden or minimized
    Object.keys(desktopWindows).forEach(appId => {
        const win = desktopWindows[appId];
        if (win.state === 'normal' || win.state === 'maximized') {
            minimizeDesktopWindow(appId);
        }
    });

    // Deselect desktop icons
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function startLoginSequence() {
    // Show login screen for ~3 seconds, then transition to desktop
    setTimeout(() => {
        loginScreen.classList.add('fade-out');

        setTimeout(() => {
            loginScreen.style.display = 'none';
            xpDesktop.style.display   = 'flex';
            // Try to play startup sound
            try {
                const startupSound = new Audio('./SFX/startup.mp3');
                startupSound.volume = 0.5;
                startupSound.play().catch(() => {});
            } catch (_) {}
        }, 800); // matches CSS transition duration
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function saveGame() {
    const windowStates = {};
    for (const [appId, win] of Object.entries(desktopWindows)) {
        windowStates[appId] = {
            state: win.state,
            normalPos: { ...win.normalPos },
        };
    }

    const saveData = {
        gameState,
        desktopWindows: windowStates,
        ui: {
            terminalState,
            normalPos,
            walletState,
            walletNormalPos,
            decodifyState,
            decodifyNormalPos
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
            updateHashDisplay();
            updateCashDisplay();
        }

        // Restore desktop window states
        if (data.desktopWindows) {
            for (const [appId, saved] of Object.entries(data.desktopWindows)) {
                const win = desktopWindows[appId];
                if (!win) continue;
                if (saved.normalPos) win.normalPos = { ...saved.normalPos };

                if (saved.state === 'normal') {
                    openDesktopWindow(appId);
                } else if (saved.state === 'maximized') {
                    openDesktopWindow(appId);
                    toggleMaximizeDesktopWindow(appId);
                } else if (saved.state === 'minimized') {
                    openDesktopWindow(appId);
                    minimizeDesktopWindow(appId);
                }
            }
        }

        // Restore sub-window states (inside HackOS)
        if (data.ui) {
            normalPos = data.ui.normalPos || normalPos;
            walletNormalPos = data.ui.walletNormalPos || walletNormalPos;
            decodifyNormalPos = data.ui.decodifyNormalPos || decodifyNormalPos;

            const savedTermState = data.ui.terminalState;
            if (savedTermState === 'normal') {
                openTerminal();
            } else if (savedTermState === 'maximized') {
                openTerminal();
                toggleMaximize();
            } else if (savedTermState === 'minimized') {
                openTerminal();
                minimizeTerminal();
            }

            const savedWalletState = data.ui.walletState;
            if (savedWalletState === 'normal') {
                openWallet();
            } else if (savedWalletState === 'maximized') {
                openWallet();
                toggleMaximizeWallet();
            } else if (savedWalletState === 'minimized') {
                openWallet();
                minimizeWallet();
            }
            
            const savedDecodifyState = data.ui.decodifyState;
            if (savedDecodifyState === 'normal') {
                openDecodify();
            } else if (savedDecodifyState === 'maximized') {
                openDecodify();
                toggleMaximizeDecodify();
            } else if (savedDecodifyState === 'minimized') {
                openDecodify();
                minimizeDecodify();
            }
        }
    } catch (e) {
        console.error("Failed to load game:", e);
    }
}

// ─── Utility Functions ────────────────────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomIP()     { return `${rand(1,254)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`; }
function randomPort()   { return [21,22,23,25,80,443,3306,5432,6379,8080,8443][rand(0,10)]; }
function randomHex(n)   { return [...Array(n)].map(() => Math.floor(Math.random()*16).toString(16)).join(''); }
function randomHash()   { return randomHex(64); }
function randomAddr()   { return randomHex(8).toUpperCase(); }
function randomResult() { return Math.random() > 0.25 ? 'SUCCESS' : 'FAILED'; }
function randomCVE()    { return `${rand(2018,2025)}-${rand(1000,99999)}`; }
function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ─── Init ──────────────────────────────────────────────────────────────────────
startLoginSequence();
loadGame();
console.log(`[HackOS] v${gameState.version} initialized. Currency: ${gameState.currency}`);

// ─── Mini Terminal Preview Animation (section card inside HackOS) ─────────────
const previewOutput  = document.getElementById('preview-output');
const PREVIEW_MAX    = 8;

const previewLines = [
    '> root.hack.id.843',
    '> ssh root@10.0.0.1',
    '> nmap -sV target',
    '> exploit.run',
    '> bypass.fw 443',
    '> inject.payload',
    '> trace --off',
    '> cat /etc/passwd',
    '> hashcat --mode=2',
    '> wget cdn.x/sh',
    '> chmod 777 run.sh',
    '> crack hash a3f9',
];

let previewIdx = 0;

function addPreviewLine() {
    const line = document.createElement('div');
    line.className   = 'preview-line';
    line.textContent = previewLines[previewIdx % previewLines.length];
    previewIdx++;
    previewOutput.appendChild(line);
    while (previewOutput.childElementCount > PREVIEW_MAX) {
        previewOutput.removeChild(previewOutput.firstChild);
    }
}

// Prime with a few lines immediately, then stream
for (let i = 0; i < 4; i++) addPreviewLine();
setInterval(addPreviewLine, 1400);

// ─── Mini Decodify Preview Animation (Hex scramble) ────────────────────────────
const decodifyHexOutput = document.getElementById('decodify-hex-output');
const DECODIFY_MAX_LINES = 10;
let decodifyOffset = 0x0000;

function addDecodifyHexLine() {
    if (!decodifyHexOutput) return; // safeguard if element is hidden/missing

    const line = document.createElement('div');
    line.className = 'hex-line';
    
    // Generate an offset like 0x00A0
    const offsetStr = '0x' + decodifyOffset.toString(16).toUpperCase().padStart(4, '0');
    decodifyOffset += 8;
    if (decodifyOffset > 0xFFFF) decodifyOffset = 0;
    
    // Generate 4 blocks of 2 random hex chars
    let dataStr = '';
    for(let i = 0; i < 4; i++) {
        dataStr += randomHex(2).toUpperCase() + ' ';
    }
    
    line.innerHTML = `<span class="offset">${offsetStr}</span><span class="data">${dataStr}</span>`;
    
    decodifyHexOutput.appendChild(line);
    while (decodifyHexOutput.childElementCount > DECODIFY_MAX_LINES) {
        decodifyHexOutput.removeChild(decodifyHexOutput.firstChild);
    }
}

// Prime the hex screen and set extremely fast interval for "decoding" effect
for (let i = 0; i < DECODIFY_MAX_LINES; i++) addDecodifyHexLine();
setInterval(addDecodifyHexLine, 120);
