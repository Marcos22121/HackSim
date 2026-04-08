/* =============================================
   HackOS — Hacker Simulator
   Game Logic Entry Point
   ============================================= */

'use strict';

// ─── Click Sound (all buttons) ───────────────────────────────────────────────
const clickSound = new Audio('./SFX/click.mp3');

function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
}

// ─── Hash Success Sounds ──────────────────────────────────────────────────────
const successSounds = [
    new Audio('./SFX/terminal/success2.mp3'),
    new Audio('./SFX/terminal/success3.mp3'),
];

function playSuccessSound() {
    const snd = successSounds[Math.floor(Math.random() * successSounds.length)];
    snd.currentTime = 0;
    snd.play().catch(() => {});
}

document.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') playClick();
});

// ─── Window Button Guards (main window – decorative only) ────────────────────
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose    = document.getElementById('btn-close');

function blockAction(e) { e.preventDefault(); e.stopPropagation(); }

btnMinimize.addEventListener('click', blockAction);
btnMaximize.addEventListener('click', blockAction);
btnClose.addEventListener('click', blockAction);

// ─── Game State ──────────────────────────────────────────────────────────────
const gameState = {
    version:  '0.1.0',
    currency: 'Hash',
    balance:  0,
};

// ─── Hash Display ────────────────────────────────────────────────────────────
const hashValueEl = document.getElementById('hash-value');

function updateHashDisplay() {
    hashValueEl.textContent = gameState.balance.toFixed(2);
}

function addHash(amount) {
    gameState.balance = Math.round((gameState.balance + amount) * 100) / 100;
    updateHashDisplay();
    showHashPopup(amount);
    playSuccessSound();
}

// ─── Hash Earned Popup ───────────────────────────────────────────────────────
const hashPopupEl = document.getElementById('hash-popup');

function showHashPopup(amount) {
    hashPopupEl.textContent = `+${amount.toFixed(2)} Hash`;
    hashPopupEl.classList.remove('hash-popup-animate');
    void hashPopupEl.offsetWidth;           // force reflow to re-trigger animation
    hashPopupEl.classList.add('hash-popup-animate');
}

// ─── Code Lines Pool ─────────────────────────────────────────────────────────
// Each entry: { text, hash }. Future tiers will have harder lines + more hash.
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
    e.preventDefault();                             // block all browser key defaults
    if (e.key.length > 1) return;                  // skip modifier keys

    if (e.key !== currentLine.text[typedIndex]) return; // wrong char → nothing

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
        addTerminalLine(`root@hackos:~$ ${completedText}`);
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
const terminalPanel   = document.getElementById('terminal-panel');
const terminalTitleBar = document.getElementById('terminal-title-bar');
const terminalOutput  = document.getElementById('terminal-output');
const btnTermMax      = document.getElementById('btn-maximize-terminal');
const mainWindowBody  = document.getElementById('main-window-body');
const windowTaskbar   = document.getElementById('window-taskbar');

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
        'HackOS Terminal v0.1.0 — Initializing...',
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

// ─── Window State Machine ─────────────────────────────────────────────────────
// States: 'hidden' | 'normal' | 'maximized' | 'minimized'
let terminalState = 'hidden';

// Saved normal geometry (updated while dragging or before maximizing)
// Matches the CSS defaults: width:900px, height:45vh, top:30px, left:20px
let normalPos = { top: 30, left: 20, width: 900, height: Math.round(window.innerHeight * 0.45) };

// Apply normal position/size to the panel
function applyNormalGeometry() {
    terminalPanel.style.top    = normalPos.top    + 'px';
    terminalPanel.style.left   = normalPos.left   + 'px';
    terminalPanel.style.width  = normalPos.width  + 'px';
    terminalPanel.style.height = normalPos.height + 'px';
}

// ── Open (from section button) ────────────────────────────────────────────────
function openTerminal() {
    if (terminalState !== 'hidden') {
        // If minimized, just restore it
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
        }
    }, 110);
}

// ── Close ─────────────────────────────────────────────────────────────────────
function closeTerminal() {
    terminalState = 'hidden';
    terminalPanel.style.display = 'none';
    terminalPanel.classList.remove('is-maximized');
    stopAmbientStream();
    deactivateTyping();
    currentLine = null;
    removeTaskbarTab();
}

// ── Minimize → becomes a tab in the taskbar ───────────────────────────────────
function minimizeTerminal() {
    if (terminalState === 'hidden') return;
    // Save position if currently normal
    if (terminalState === 'normal') saveNormalGeometry();
    // If maximized, restore button label for later
    if (terminalState === 'maximized') {
        terminalPanel.classList.remove('is-maximized');
        btnTermMax.setAttribute('aria-label', 'Maximize');
    }
    terminalState = 'minimized';
    terminalPanel.style.display = 'none';
    addTaskbarTab();
}

function restoreFromMinimize() {
    removeTaskbarTab();
    terminalState = 'normal';
    terminalPanel.classList.remove('is-maximized');
    terminalPanel.style.display = 'flex';
    btnTermMax.setAttribute('aria-label', 'Maximize');
    applyNormalGeometry();
    if (document.activeElement) document.activeElement.blur();
}

// ── Maximize / Restore toggle ──────────────────────────────────────────────────
function toggleMaximize() {
    if (terminalState === 'maximized') {
        // → Restore to normal
        terminalState = 'normal';
        terminalPanel.classList.remove('is-maximized');
        btnTermMax.setAttribute('aria-label', 'Maximize');
        applyNormalGeometry();
    } else if (terminalState === 'normal') {
        // → Maximize
        saveNormalGeometry();
        terminalState = 'maximized';
        terminalPanel.classList.add('is-maximized');
        btnTermMax.setAttribute('aria-label', 'Restore');
        terminalPanel.style.top    = '0';
        terminalPanel.style.left   = '0';
        terminalPanel.style.width  = '100%';
        terminalPanel.style.height = '100%';
    }
}

function saveNormalGeometry() {
    normalPos.top    = parseInt(terminalPanel.style.top)    || 40;
    normalPos.left   = parseInt(terminalPanel.style.left)   || 20;
    normalPos.width  = parseInt(terminalPanel.style.width)  || 720;
    normalPos.height = parseInt(terminalPanel.style.height) || 440;
}

// ─── Taskbar Tab ──────────────────────────────────────────────────────────────
function addTaskbarTab() {
    if (document.getElementById('tab-terminal')) return;
    const tab = document.createElement('button');
    tab.id        = 'tab-terminal';
    tab.className = 'taskbar-tab';
    tab.textContent = '>_ Hack Terminal';
    tab.onclick = restoreFromMinimize;
    windowTaskbar.appendChild(tab);
}

function removeTaskbarTab() {
    const tab = document.getElementById('tab-terminal');
    if (tab) tab.remove();
}

// ─── Drag Logic ───────────────────────────────────────────────────────────────
let dragActive = false;
let dragOffset = { x: 0, y: 0 };

terminalTitleBar.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;   // don't drag when clicking buttons
    if (terminalState !== 'normal') return;       // no drag when maximized/minimized
    dragActive   = true;
    const rect   = terminalPanel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
});

document.addEventListener('mousemove', e => {
    if (!dragActive) return;
    const par    = mainWindowBody.getBoundingClientRect();
    let newLeft  = e.clientX - par.left - dragOffset.x;
    let newTop   = e.clientY - par.top  - dragOffset.y;
    // Clamp inside the main window body
    newLeft = Math.max(0, Math.min(newLeft, par.width  - terminalPanel.offsetWidth));
    newTop  = Math.max(0, Math.min(newTop,  par.height - terminalPanel.offsetHeight));
    terminalPanel.style.left = newLeft + 'px';
    terminalPanel.style.top  = newTop  + 'px';
    // Keep normalPos in sync so restore goes back to dragged position
    normalPos.left = newLeft;
    normalPos.top  = newTop;
});

document.addEventListener('mouseup', () => { dragActive = false; });

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
console.log(`[HackOS] v${gameState.version} initialized. Currency: ${gameState.currency}`);

// ─── Mini Terminal Preview Animation (section card) ───────────────────────────
const previewOutput  = document.getElementById('preview-output');
const PREVIEW_MAX    = 8; // max visible lines in the tiny panel

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
    // Keep only the last PREVIEW_MAX lines
    while (previewOutput.childElementCount > PREVIEW_MAX) {
        previewOutput.removeChild(previewOutput.firstChild);
    }
}

// Prime with a few lines immediately, then stream
for (let i = 0; i < 4; i++) addPreviewLine();
setInterval(addPreviewLine, 1400);
