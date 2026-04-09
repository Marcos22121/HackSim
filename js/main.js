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
    hashValueEl.textContent = gameState.balance.toFixed(2);
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
    
    if (gameState.cleanCash > 0) {
        transferBtn.removeAttribute('disabled');
    } else {
        transferBtn.setAttribute('disabled', 'true');
    }
    
    if (gameState.dirtyCash > 0 && !isLaundering) {
        processBtn.removeAttribute('disabled');
    } else {
        processBtn.setAttribute('disabled', 'true');
    }
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

const launderPanel     = document.getElementById('launder-panel');
const launderTitleBar  = document.getElementById('launder-title-bar');
const btnLaunderMax    = document.getElementById('btn-maximize-launder');

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

// ─── Sub-Window: Launder inside HackOS ───────────────────────────────────────
let launderState = 'hidden';
let launderNormalPos = { top: 120, left: 370, width: 400, height: 420 };

function applyLaunderNormalGeometry() {
    launderPanel.style.top    = launderNormalPos.top    + 'px';
    launderPanel.style.left   = launderNormalPos.left   + 'px';
    launderPanel.style.width  = launderNormalPos.width  + 'px';
    launderPanel.style.height = launderNormalPos.height + 'px';
}

function openLaunder() {
    if (launderState !== 'hidden') {
        if (launderState === 'minimized') restoreLaunderFromMinimize();
        return;
    }
    launderState = 'normal';
    launderPanel.classList.remove('is-maximized');
    launderPanel.style.display = 'flex';
    btnLaunderMax.setAttribute('aria-label', 'Maximize');
    applyLaunderNormalGeometry();
    updateLaunderDisplay();
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function closeLaunder() {
    launderState = 'hidden';
    launderPanel.style.display = 'none';
    launderPanel.classList.remove('is-maximized');
    removeInternalTaskbarTab('tab-launder');
    saveGame();
}

function minimizeLaunder() {
    if (launderState === 'hidden') return;
    if (launderState === 'normal') saveLaunderNormalGeometry();
    if (launderState === 'maximized') {
        launderPanel.classList.remove('is-maximized');
        btnLaunderMax.setAttribute('aria-label', 'Maximize');
    }
    launderState = 'minimized';
    launderPanel.style.display = 'none';
    addInternalTaskbarTab('tab-launder', 'OnionWash', restoreLaunderFromMinimize);
    saveGame();
}

function restoreLaunderFromMinimize() {
    removeInternalTaskbarTab('tab-launder');
    launderState = 'normal';
    launderPanel.classList.remove('is-maximized');
    launderPanel.style.display = 'flex';
    btnLaunderMax.setAttribute('aria-label', 'Maximize');
    applyLaunderNormalGeometry();
    if (document.activeElement) document.activeElement.blur();
    saveGame();
}

function toggleMaximizeLaunder() {
    if (launderState === 'maximized') {
        launderState = 'normal';
        launderPanel.classList.remove('is-maximized');
        btnLaunderMax.setAttribute('aria-label', 'Maximize');
        applyLaunderNormalGeometry();
    } else if (launderState === 'normal') {
        saveLaunderNormalGeometry();
        launderState = 'maximized';
        launderPanel.classList.add('is-maximized');
        btnLaunderMax.setAttribute('aria-label', 'Restore');
        launderPanel.style.top    = '0';
        launderPanel.style.left   = '0';
        launderPanel.style.width  = '100%';
        launderPanel.style.height = '100%';
    }
    saveGame();
}

function saveLaunderNormalGeometry() {
    launderNormalPos.top    = parseInt(launderPanel.style.top)    || 120;
    launderNormalPos.left   = parseInt(launderPanel.style.left)   || 370;
    launderNormalPos.width  = parseInt(launderPanel.style.width)  || 400;
    launderNormalPos.height = parseInt(launderPanel.style.height) || 420;
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
    gameState.dirtyCash += cashGained; // Funds go to marked money!
    // updateCashDisplay(); // Cash stays the same until laundered
    updateLaunderDisplay();
    saveGame();
    
    decodifyStatusText.textContent = `Success! $${cashGained.toFixed(2)} transfered to OnionWash gateway.`;
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

document.getElementById('btn-open-launder').addEventListener('click', openLaunder);
document.getElementById('btn-minimize-launder').addEventListener('click', minimizeLaunder);
document.getElementById('btn-maximize-launder').addEventListener('click', toggleMaximizeLaunder);
document.getElementById('btn-close-launder').addEventListener('click', closeLaunder);

// ─── Launder Panel Logic ──────────────────────────────────────────────────────────

let isLaundering = false;

function startLaunderSequence() {
    if (isLaundering || gameState.dirtyCash <= 0) return;
    isLaundering = true;
    
    const amountToLaunder = gameState.dirtyCash;
    gameState.dirtyCash = 0; // Lock funds
    updateLaunderDisplay();
    
    const pbar = document.getElementById('launder-progress-bar');
    const stext = document.getElementById('launder-status');
    const processBtn = document.getElementById('btn-launder-process');
    
    processBtn.setAttribute('disabled', 'true');
    pbar.style.width = '0%';
    stext.textContent = `Establishing onion routing connections...`;
    
    const totalTime = 12000; // 12 seconds
    let elapsedTime = 0;
    
    const timer = setInterval(() => {
        elapsedTime += 100;
        const progress = Math.min((elapsedTime / totalTime) * 100, 100);
        pbar.style.width = `${progress}%`;
        
        if (elapsedTime === 3000) stext.textContent = `Mixing funds through 72 nodes...`;
        if (elapsedTime === 8000) stext.textContent = `Bypassing trackers. Finalizing wash...`;
        
        if (elapsedTime >= totalTime) {
            clearInterval(timer);
            isLaundering = false;
            
            // 10% penalty
            const cleaned = amountToLaunder * 0.90;
            gameState.cleanCash += cleaned;
            updateLaunderDisplay();
            saveGame();
            
            pbar.style.width = '100%';
            stext.textContent = `Successfully washed $${cleaned.toFixed(2)}.`;
            playCashSound();
            
            setTimeout(() => {
                pbar.style.width = '0%';
                stext.textContent = `Idle.`;
            }, 3000);
        }
    }, 100);
}

function transferCleanFunds() {
    if (gameState.cleanCash <= 0) return;
    
    const amountTransferred = gameState.cleanCash;
    const sharedTransId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    gameState.cash += amountTransferred;
    gameState.cleanCash = 0;
    
    updateCashDisplay();
    updateLaunderDisplay();
    saveGame();
    playCashSound();
    
    // Send automated Receipt
    sendPallPayReceipt(amountTransferred, sharedTransId);
    
    // Store in internal transaction history
    gameState.transactions.unshift({
        id: 'PP-' + sharedTransId,
        amount: amountTransferred,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'OnionWeb Mixer'
    });
    if (gameState.transactions.length > 5) gameState.transactions.pop();
    updatePallPayActivity();
    
    const stext = document.getElementById('launder-status');
    stext.textContent = `Funds safely transferred to PallPay.`;
    setTimeout(() => { stext.textContent = 'Idle.'; }, 3000);
}

function sendPallPayReceipt(amount, transId) {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (!transId) transId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const receiptHtml = `
        <div style="background: #f7f9fc; border: 1px solid #d1d9e6; padding: 20px; border-radius: 4px; font-family: sans-serif; color: #333;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0070ba; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #0070ba; font-size: 20px;">PallPay Receipt</h2>
                <img src="assets/icon-pallpay.png" width="32" height="32" alt="">
            </div>
            
            <p style="font-size: 14px; margin-bottom: 20px;">Hello, you have received a new deposit in your account.</p>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                    <td style="padding: 8px 0; color: #666;">Source:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">OnionWeb Mixer Gateway</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
                    <td style="padding: 8px 0; text-align: right; font-family: monospace;">PP-${transId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; text-align: right;">${dateStr} ${timeStr}</td>
                </tr>
                <tr>
                    <td style="padding: 15px 0; color: #666; font-size: 16px; border-top: 1px solid #eee;">Amount Received:</td>
                    <td style="padding: 15px 0; text-align: right; font-size: 18px; font-weight: bold; color: #28a745; border-top: 1px solid #eee;">+$${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
            </table>
            
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 11px; color: #888; text-align: center;">
                This is an automated notification. Thank you for using PallPay Secure Payments.
            </div>
        </div>
    `;

    const newMail = {
        id: 'pp_' + Date.now(),
        sender: 'PallPay Service',
        date: dateStr,
        subject: `Payment received: $${amount.toFixed(2)}`,
        body: receiptHtml,
        unread: true,
        attachment: false
    };

    addEmailToList(newMail);
    
    // Visual Notification
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.style.borderLeft = '4px solid #0070ba';
    popup.innerHTML = `<img src="assets/icon-pallpay.png" width="24" height="24"> <div><strong>PallPay</strong><br>New deposit received!</div>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
}

document.getElementById('btn-launder-process').addEventListener('click', startLaunderSequence);
document.getElementById('btn-launder-transfer').addEventListener('click', transferCleanFunds);

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
document.getElementById('launder-title-bar').addEventListener('mousedown', e => startSubDrag(e, launderPanel, launderState, launderNormalPos));

document.addEventListener('mousemove', e => {
    if (!dragActive || !dragTarget) return;

    // Determine parent bounds
    let par;
    if (dragTarget === terminalPanel || dragTarget === walletPanel || dragTarget === decodifyPanel || dragTarget === launderPanel) {
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
    { top: 80, left: 200, width: 620, height: 550 });

const topmailWindow   = document.getElementById('topmail-window');
const topmailTitleBar = document.getElementById('topmail-title-bar');
registerDesktopWindow('topmail', topmailWindow, topmailTitleBar,
    { top: 60, left: 80, width: 700, height: 500 });
    
const documentsWindow = document.getElementById('documents-window');
const documentsTitleBar = document.getElementById('documents-title-bar');
registerDesktopWindow('documents', documentsWindow, documentsTitleBar,
    { top: 80, left: 140, width: 550, height: 400 });

const notepadWindow = document.getElementById('notepad-window');
const notepadTitleBar = document.getElementById('notepad-title-bar');
registerDesktopWindow('notepad', notepadWindow, notepadTitleBar,
    { top: 120, left: 200, width: 450, height: 350 });

const calcWindow = document.getElementById('calc-window');
const calcTitleBar = document.getElementById('calc-title-bar');
registerDesktopWindow('calc', calcWindow, calcTitleBar,
    { top: 150, left: 250, width: 250, height: 350 });
    
const installerWindow = document.getElementById('installer-window');
registerDesktopWindow('installer', installerWindow, installerWindow.querySelector('.title-bar'),
    { top: window.innerHeight/2 - 75, left: window.innerWidth/2 - 175, width: 350, height: 150 });

// Wire up title bar drag
hackosTitleBar.addEventListener('mousedown', e => initDesktopDrag('hackos', e));
pallpayDesktopTitleBar.addEventListener('mousedown', e => initDesktopDrag('pallpay-desktop', e));
topmailTitleBar.addEventListener('mousedown', e => initDesktopDrag('topmail', e));
documentsTitleBar.addEventListener('mousedown', e => initDesktopDrag('documents', e));
notepadTitleBar.addEventListener('mousedown', e => initDesktopDrag('notepad', e));

// Wire up window control buttons
document.getElementById('btn-hackos-minimize').addEventListener('click', () => minimizeDesktopWindow('hackos'));
document.getElementById('btn-hackos-maximize').addEventListener('click', () => toggleMaximizeDesktopWindow('hackos'));
document.getElementById('btn-hackos-close').addEventListener('click',    () => closeDesktopWindow('hackos'));

document.getElementById('btn-pallpay-desktop-minimize').addEventListener('click', () => minimizeDesktopWindow('pallpay-desktop'));
document.getElementById('btn-pallpay-desktop-maximize').addEventListener('click', () => toggleMaximizeDesktopWindow('pallpay-desktop'));
document.getElementById('btn-pallpay-desktop-close').addEventListener('click',    () => closeDesktopWindow('pallpay-desktop'));

document.getElementById('btn-topmail-minimize').addEventListener('click', () => minimizeDesktopWindow('topmail'));
document.getElementById('btn-topmail-maximize').addEventListener('click', () => toggleMaximizeDesktopWindow('topmail'));
document.getElementById('btn-topmail-close').addEventListener('click',    () => closeDesktopWindow('topmail'));

document.getElementById('btn-minimize-documents').addEventListener('click', () => minimizeDesktopWindow('documents'));
document.getElementById('btn-maximize-documents').addEventListener('click', () => toggleMaximizeDesktopWindow('documents'));
document.getElementById('btn-close-documents').addEventListener('click',    () => closeDesktopWindow('documents'));

document.getElementById('btn-minimize-notepad').addEventListener('click', () => minimizeDesktopWindow('notepad'));
document.getElementById('btn-maximize-notepad').addEventListener('click', () => toggleMaximizeDesktopWindow('notepad'));
document.getElementById('btn-close-notepad').addEventListener('click',    () => closeDesktopWindow('notepad'));

// Click on window body to focus
hackosWindow.addEventListener('mousedown', () => focusDesktopWindow('hackos'));
pallpayDesktopWindow.addEventListener('mousedown', () => focusDesktopWindow('pallpay-desktop'));
topmailWindow.addEventListener('mousedown', () => focusDesktopWindow('topmail'));
documentsWindow.addEventListener('mousedown', () => focusDesktopWindow('documents'));
notepadWindow.addEventListener('mousedown', () => focusDesktopWindow('notepad'));

// ─── Documents App Logic ──────────────────────────────────────────────────────
const documentDatabase = {
    'doc-tutorial': {
        title: 'HOW_TO_HACK.txt',
        content: `==== [ TERMINAL USAGE PROTOCOL ] ====
So you forgot how to use your terminal? Let me remind you:
1. Open the BlueCode app.
2. A random line of code will appear.
3. You MUST type the EXACT sequence of characters.
4. Pressing the correct keys progresses the sequence.
5. Completing a line grants you 'Hashes'.
6. Do NOT mess up. There is no backspace in this version.
7. Hashes = Money. 

Get to work. We need that $3,500 by next week.`
    }
};

function renderDocumentsList() {
    const list = document.getElementById('documents-list');
    list.innerHTML = '';
    gameState.documentsUnlocked.forEach(docId => {
        const doc = documentDatabase[docId];
        if (!doc) return;
        
        const docItem = document.createElement('div');
        docItem.className = 'document-item';
        docItem.innerHTML = `
            <img src="assets/icon-documents.svg" width="32" height="32" draggable="false" style="filter: hue-rotate(180deg) brightness(1.2);">
            <span style="font-size:11px; margin-top:2px; word-break:break-all;">${doc.title}</span>
        `;
        docItem.ondblclick = () => {
            openDesktopWindow('notepad');
            document.getElementById('notepad-title').textContent = `${doc.title} - Notepad`;
            document.getElementById('notepad-content').value = doc.content;
        };
        list.appendChild(docItem);
    });
}

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
        if (app === 'pallpay') {
            openDesktopWindow('pallpay-desktop');
            updatePallPayActivity();
        }
        if (app === 'topmail') openDesktopWindow('topmail');
        if (app === 'documents') {
            openDesktopWindow('documents');
            renderDocumentsList();
        }
        if (app === 'trash')   {} // trash does nothing
        if (app === 'darknet') {} // darknet does nothing yet
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
setInterval(updateClock, 30000); 
initPallPayTabs();

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
    closeStartMenu();
}

// ─── Start Menu Logic ─────────────────────────────────────────────────────────
const startMenu = document.getElementById('start-menu');

function toggleStartMenu() {
    if (startMenu.style.display === 'none') {
        startMenu.style.display = 'flex';
    } else {
        startMenu.style.display = 'none';
    }
}

function closeStartMenu() {
    if (startMenu) startMenu.style.display = 'none';
}

// Close start menu when clicking outside
document.addEventListener('click', e => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
        closeStartMenu();
    }
});

// ─── TopMail Logic ─────────────────────────────────────────────────────────────
function addEmailToList(email) {
    inboxEmails.unshift(email);
    // Limit to 50 emails, remove oldest
    if (inboxEmails.length > 50) {
        inboxEmails.pop();
    }
    renderInbox();
    saveGame();
}

let inboxEmails = [
    { id: 'm3', sender: 'Aiden', date: 'Oct 14, 2026', subject: 'When are you going to pay me back?', body: 'Man, I lent you that money a month ago. I really need it now. Dont make me come look for you. Pay up.', unread: false, attachment: false },
    { id: 'm2', sender: 'Bank of America', date: 'Oct 12, 2026', subject: 'Debts Due', body: 'Your credit card is maxed out. Immediate payment of $3,500 is required to avoid legal action.', unread: false, attachment: false },
    { id: 'm1', sender: 'Landlord', date: 'Oct 10, 2026', subject: 'Rent Due', body: 'You are two months behind on rent. Pay up this week or you are out on the street.', unread: false, attachment: false },
];

let selectedMailId = null;
const emailsContainer = document.getElementById('emails-container');
const mailViewSender = document.getElementById('mail-view-sender');
const mailViewDate = document.getElementById('mail-view-date');
const mailViewSubject = document.getElementById('mail-view-subject');
const mailViewBody = document.getElementById('mail-view-body');
const mailViewAttachBar = document.getElementById('mail-view-attachments-bar');

function renderInbox() {
    emailsContainer.innerHTML = '';
    inboxEmails.forEach(mail => {
        const div = document.createElement('div');
        div.className = `email-item ${mail.unread ? 'unread' : ''} ${selectedMailId === mail.id ? 'selected' : ''}`;
        div.onclick = () => selectMail(mail.id);
        div.innerHTML = `
            <img src="assets/icon-topmail.svg" class="email-icon" alt="">
            <div class="email-content">
                <div class="email-sender">${mail.sender}</div>
                <div class="email-subject">${mail.subject}</div>
            </div>
        `;
        emailsContainer.appendChild(div);
    });
    
    // Update notifications badge
    if (typeof renderNotificationPanel === 'function') {
        renderNotificationPanel();
    }
}

// ─── Calculator Logic ─────────────────────────────────────────────────────────
let calcDisplayValue = '0';
let calcFirstOperand = null;
let calcOperator = null;
let calcRestart = false;

function updateCalcDisplay() {
    document.getElementById('calc-display').textContent = calcDisplayValue;
}

function calcNum(n) {
    if (calcDisplayValue === '0' || calcRestart) {
        calcDisplayValue = String(n);
        calcRestart = false;
    } else {
        calcDisplayValue += String(n);
    }
    updateCalcDisplay();
}

function calcDot() {
    if (!calcDisplayValue.includes('.')) {
        calcDisplayValue += '.';
        updateCalcDisplay();
    }
}

function calcClear() {
    calcDisplayValue = '0';
    calcFirstOperand = null;
    calcOperator = null;
    calcRestart = false;
    updateCalcDisplay();
}

function calcClearEntry() {
    calcDisplayValue = '0';
    updateCalcDisplay();
}

function calcBackspace() {
    if (calcDisplayValue.length > 1) {
        calcDisplayValue = calcDisplayValue.slice(0, -1);
    } else {
        calcDisplayValue = '0';
    }
    updateCalcDisplay();
}

function calcOp(op) {
    if (calcOperator && !calcRestart) {
        calcEqual();
    }
    calcFirstOperand = parseFloat(calcDisplayValue);
    calcOperator = op;
    calcRestart = true;
}

function calcEqual() {
    if (calcOperator === null || calcRestart) return;
    const secondOperand = parseFloat(calcDisplayValue);
    let result = 0;
    switch (calcOperator) {
        case '+': result = calcFirstOperand + secondOperand; break;
        case '-': result = calcFirstOperand - secondOperand; break;
        case '*': result = calcFirstOperand * secondOperand; break;
        case '/': result = calcFirstOperand / secondOperand; break;
    }
    calcDisplayValue = String(Math.round(result * 100000000) / 100000000);
    calcOperator = null;
    calcRestart = true;
    updateCalcDisplay();
}

function updatePallPayActivity() {
    const shortLists = document.querySelectorAll('.pp-activity-short');
    const fullLists  = document.querySelectorAll('.pp-activity-full');
    
    const renderList = (container, limit) => {
        if (!container) return;
        container.innerHTML = '';
        const txs = gameState.transactions.slice(0, limit);
        
        if (txs.length === 0) {
            container.innerHTML = '<div style="font-size:11px; color:#888; text-align:center; padding:10px;">No recent transactions.</div>';
            return;
        }
        
        txs.forEach(t => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f2f2f2;';
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:24px; height:24px; background:#eef5fc; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#0070ba; font-weight:bold; font-size:10px;">OW</div>
                    <div>
                        <div style="font-size:11px; font-weight:bold; color:#333;">${t.source}</div>
                        <div style="font-size:9px; color:#999;">${t.date} • ${t.id}</div>
                    </div>
                </div>
                <div style="font-size:12px; font-weight:bold; color:#28a745;">+$${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            `;
            container.appendChild(item);
        });
    };

    shortLists.forEach(l => renderList(l, 5));
    fullLists.forEach(l => renderList(l, 15));
}

function initPallPayTabs() {
    document.addEventListener('click', e => {
        const tab = e.target.closest('.pp-tab');
        if (!tab) return;
        
        const container = tab.closest('.pallpay-app-container');
        if (!container) return;
        
        const target = tab.dataset.target;
        const sectionArea = container.querySelector('.pp-content-area');
        
        // Update active tab UI
        container.querySelectorAll('.pp-tab').forEach(t => {
            t.classList.remove('active');
            t.style.color = '#666';
            t.style.fontWeight = 'normal';
            t.style.borderBottom = 'none';
        });
        tab.classList.add('active');
        tab.style.color = '#0070ba';
        tab.style.fontWeight = 'bold';
        tab.style.borderBottom = '2px solid #0070ba';
        
        // Switch section
        renderPallPaySection(sectionArea, target);
    });
}

function renderPallPaySection(container, section) {
    if (section === 'summary') {
        const isDesktop = container.closest('#pallpay-desktop-window') !== null;
        container.innerHTML = `
            <div class="pp-section section-summary">
                <div style="background:#fff; border-radius:8px; border:1px solid #e0e0e0; padding:20px; box-shadow:0 2px 5px rgba(0,0,0,0.05); margin-bottom:20px;">
                    <div style="font-size:12px; color:#666; margin-bottom:5px; font-family:'Trebuchet MS', sans-serif;">
                        <span class="logo-pall" style="font-style:italic; font-weight:bold;">Pall</span><span class="logo-pay" style="font-style:italic; font-weight:bold;">Pay</span> balance
                    </div>
                    <div style="font-size:${isDesktop ? '32px' : '24px'}; color:#333; margin-bottom:${isDesktop ? '20px' : '10px'};">
                        $<span class="${isDesktop ? 'cash-sync-desktop' : 'cash-sync-internal'}">${gameState.cash.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="pp-btn" style="background:#0070ba; color:#fff; border:none; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:12px; cursor:pointer;">Transfer Funds</button>
                    </div>
                </div>
                <h4 style="margin:0 0 10px 0; font-size:13px; color:#333;">Recent Activity</h4>
                <div class="pp-activity-short" style="display:flex; flex-direction:column; gap:10px;"></div>
            </div>
        `;
    } else if (section === 'activity') {
        container.innerHTML = `
            <div class="pp-section section-activity">
                <h3 style="margin:0 0 15px 0; font-size:16px;">Transaction History</h3>
                <div class="pp-activity-full" style="display:flex; flex-direction:column; gap:8px;"></div>
            </div>
        `;
    } else if (section === 'send') {
        container.innerHTML = `
            <div class="pp-section section-send" style="padding:10px;">
                <h3 style="margin:0 0 15px 0; font-size:16px;">Send & Request</h3>
                <div style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px dashed #ccc; text-align:center;">
                    <p style="font-size:13px; color:#666;">Enter recipient email or mobile number</p>
                    <input type="text" placeholder="Email, name or number" style="width:100%; padding:10px; margin:10px 0; border:1px solid #ccc; border-radius:4px;">
                    <button class="pp-btn" style="background:#0070ba; color:#fff; border:none; padding:10px 25px; border-radius:20px; width:100%; font-weight:bold;">Next</button>
                </div>
            </div>
        `;
    } else if (section === 'help') {
        container.innerHTML = `
            <div class="pp-section section-help">
                <h3 style="margin:0 0 15px 0; font-size:16px;">Help Center</h3>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div style="border-bottom:1px solid #eee; padding-bottom:10px; cursor:pointer;" class="pp-nav-item">How do I withdraw money?</div>
                    <div style="border-bottom:1px solid #eee; padding-bottom:10px; cursor:pointer;" class="pp-nav-item">Is my account secure?</div>
                    <div style="border-bottom:1px solid #eee; padding-bottom:10px; cursor:pointer;" class="pp-nav-item">Common questions about transfers</div>
                </div>
            </div>
        `;
    }
    updatePallPayActivity();
}

function selectMail(id) {
    selectedMailId = id;
    const mail = inboxEmails.find(m => m.id === id);
    if (!mail) return;
    
    if (mail.unread) {
        mail.unread = false;
        saveGame();
    }
    
    mailViewSender.textContent = mail.sender;
    mailViewDate.textContent = mail.date;
    mailViewSubject.textContent = mail.subject;
    mailViewBody.innerHTML = mail.body;
    
    if (mail.attachment) {
        mailViewAttachBar.style.display = 'flex';
        document.getElementById('mail-view-attach-name').textContent = mail.attachName || 'attachment';
        document.getElementById('mail-view-attach-icon').src = mail.attachIcon || 'assets/icon-hackos.png';
    } else {
        mailViewAttachBar.style.display = 'none';
    }
    
    renderInbox();
}

function receiveStoryMail() {
    if (gameState.storyProgress !== 0) return;
    if (inboxEmails.find(m => m.id === 'm_story')) return;
    
    playSuccessSound(); 
    
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>New Email</strong><br>Unknown: Need money?</div>`;
    document.body.appendChild(popup);
    
    setTimeout(() => { popup.remove(); }, 6000);
    
    addEmailToList({
        id: 'm_story', sender: 'Unknown', date: 'Now', subject: 'Need money?',
        body: "I'll make it quick, if you need money, all you need are these two apps, with your skills, I'm sure you'll figure it out in no time, just get to work.",
        unread: true, attachment: true, attachName: 'tools.exe', attachIcon: 'assets/icon-hackos.png'
    });
}

function receiveTutorialMail() {
    if (gameState.documentsUnlocked.includes('doc-tutorial')) return;
    if (inboxEmails.find(m => m.id === 'm_tutorial')) return;
    
    playSuccessSound(); 
    
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>New Email</strong><br>Zero: Terminal Manual</div>`;
    document.body.appendChild(popup);
    
    setTimeout(() => { popup.remove(); }, 6000);
    
    addEmailToList({
        id: 'm_tutorial', sender: 'Zero', date: 'Now', subject: 'Terminal Manual',
        body: "I heard you had a system wipe and lost your skills. I've attached your old manual. Read it, then start making money. We have a debt to clear.",
        unread: true, attachment: true, attachName: 'how_to_hack.txt', attachIcon: 'assets/icon-documents.svg'
    });
}

// ─── Attachments & Installer Logic ───────────────────────────────────────────
document.getElementById('btn-attachment-download').addEventListener('click', () => {
    const mail = inboxEmails.find(m => m.id === selectedMailId);
    if (!mail) return;
    
    if (mail.id === 'm_story') {
        openDesktopWindow('installer');
        
        const pbar = document.getElementById('installer-progress-bar');
        pbar.style.width = '0%';
        pbar.style.transition = 'none';
        
        // Force reflow
        void pbar.offsetWidth;
        
        pbar.style.transition = 'width 5s linear';
        pbar.style.width = '100%';
        
        setTimeout(() => {
            closeDesktopWindow('installer');
            gameState.storyProgress = 1;
            applyStoryState();
            saveGame();
            playSuccessSound();
        }, 5100);
    } else if (mail.id === 'm_tutorial') {
        if (!gameState.documentsUnlocked.includes('doc-tutorial')) {
            gameState.documentsUnlocked.push('doc-tutorial');
            saveGame();
            playSuccessSound();
            
            // Visual feedback
            const popup = document.createElement('div');
            popup.className = 'mail-notification';
            popup.innerHTML = `<img src="assets/icon-documents.svg" width="24" height="24"> <div><strong>Download Complete</strong><br>HOW_TO_HACK.txt saved to Documents</div>`;
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 4000);
            
            // Refresh documents UI if it's open
            if (desktopWindows['documents'].state !== 'hidden') {
                renderDocumentsList();
            }
        } else {
            const popup = document.createElement('div');
            popup.className = 'mail-notification';
            popup.innerHTML = `<img src="assets/icon-documents.svg" width="24" height="24"> <div><strong>File Exists</strong><br>Already saved to Documents.</div>`;
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 3000);
        }
    }
});

// ─── Notification Panel ───────────────────────────────────────────────────────
const btnNotifications = document.getElementById('btn-notifications');
const notificationPanel = document.getElementById('notification-panel');
const notificationList = document.getElementById('notification-list');
const unreadBadge = document.getElementById('unread-count');

function renderNotificationPanel() {
    if (!notificationList) return;
    notificationList.innerHTML = '';
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
            selectMail(m.id);
            notificationPanel.style.display = 'none';
        };
        notificationList.appendChild(item);
    });

    if (unreadCount > 0) {
        unreadBadge.style.display = 'block';
        unreadBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
        unreadBadge.style.display = 'none';
    }
}

btnNotifications.addEventListener('click', (e) => {
    e.stopPropagation();
    if (notificationPanel.style.display === 'flex') {
        notificationPanel.style.display = 'none';
    } else {
        renderNotificationPanel();
        notificationPanel.style.display = 'flex';
    }
});

document.addEventListener('click', (e) => {
    if (!notificationPanel.contains(e.target) && e.target !== btnNotifications && !btnNotifications.contains(e.target)) {
        notificationPanel.style.display = 'none';
    }
});

renderInbox();

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
            
            // Queue emails if starting fresh
            if (gameState.storyProgress === 0) {
                setTimeout(receiveStoryMail, 4000); 
                setTimeout(receiveTutorialMail, 7000); 
            } else {
                // Ensure tutorial mail eventually gets sent if they skipped it but story is 1
                if (!gameState.documentsUnlocked.includes('doc-tutorial') && !inboxEmails.find(m => m.id === 'm_tutorial')) {
                    setTimeout(receiveTutorialMail, 2000);
                }
            }
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
        inboxEmails,
        desktopWindows: windowStates,
        ui: {
            terminalState,
            normalPos,
            walletState,
            walletNormalPos,
            decodifyState,
            decodifyNormalPos,
            launderState,
            launderNormalPos
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
            updateHashDisplay();
            updateCashDisplay();
            updateLaunderDisplay();
            updatePallPayActivity();
            applyStoryState();
        }

        // Restore emails
        if (data.inboxEmails) {
            inboxEmails = data.inboxEmails;
            renderInbox();
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
            
            launderNormalPos = data.ui.launderNormalPos || launderNormalPos;
            const savedLaunderState = data.ui.launderState;
            if (savedLaunderState === 'normal') {
                openLaunder();
            } else if (savedLaunderState === 'maximized') {
                openLaunder();
                toggleMaximizeLaunder();
            } else if (savedLaunderState === 'minimized') {
                openLaunder();
                minimizeLaunder();
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
