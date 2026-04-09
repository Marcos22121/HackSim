/* =============================================
   2_terminal.js - Hacking Mechanic
   ============================================= */

'use strict';

// ─── Code Lines Pool ─────────────────────────────────────────────────────────
const codeLines = [
    { text: 'root.hack.id.843',      hash: 0.5 },
    { text: 'ping 192.168.1.1',      hash: 0.5 },
    { text: 'ssh root@target.net',   hash: 0.5 },
    { text: 'nmap -sV 10.0.0.1',     hash: 0.5 },
    { text: 'exploit.run --force',   hash: 0.5 },
    { text: 'inject.payload.x86',    hash: 0.5 },
    { text: 'trace --log off',       hash: 0.5 },
    { text: 'crack hash md5 a3f9',   hash: 0.5 },
    { text: 'bypass.fw port 443',    hash: 0.5 },
    { text: 'wget http://cdn.x/sh',  hash: 0.5 },
    { text: 'cat /etc/passwd',       hash: 0.5 },
    { text: 'chmod 777 run.sh',      hash: 0.5 },
];

const typedTextEl = document.getElementById('typed-text');
const ghostTextEl = document.getElementById('ghost-text');
const hashPopupEl = document.getElementById('hash-popup');

// ─── Typing State ────────────────────────────────────────────────────────────
var currentLine  = null;
var typedIndex   = 0;
var typingActive = false;
var lastLineIdx  = -1;

function pickLine() {
    let idx;
    do { idx = Math.floor(Math.random() * codeLines.length); }
    while (idx === lastLineIdx && codeLines.length > 1);
    lastLineIdx = idx;

    currentLine = codeLines[idx];
    typedIndex  = 0;
    if (typedTextEl) typedTextEl.textContent = '';
    if (ghostTextEl) ghostTextEl.textContent = currentLine.text;
}

function handleTyping(e) {
    if (!currentLine || !typingActive) return;
            
    // Prevent default for single character keys to avoid scrolling etc.
    if (e.key.length === 1) e.preventDefault();
    else return;

    if (e.key !== currentLine.text[typedIndex]) return;

    typedIndex++;
    if (typedTextEl) typedTextEl.textContent = currentLine.text.slice(0, typedIndex);
    if (ghostTextEl) ghostTextEl.textContent = currentLine.text.slice(typedIndex);

    if (typedIndex === currentLine.text.length) lineComplete();
}

function lineComplete() {
    const reward        = currentLine.hash;
    const completedText = currentLine.text;
    typingActive = false;

    if (typedTextEl) {
        typedTextEl.classList.add('line-complete-flash');
        setTimeout(() => {
            typedTextEl.classList.remove('line-complete-flash');
            addTerminalLine(`root@bluecode:~$ ${completedText}`);
            pickLine();
            typingActive = true;
        }, 380);
    }

    if (typeof addHash === 'function') addHash(reward);
}

function activateTyping() {
    typingActive = true;
    document.addEventListener('keydown', handleTyping);
}

function deactivateTyping() {
    typingActive = false;
    document.removeEventListener('keydown', handleTyping);
}

function showHashPopup(amount) {
    if (!hashPopupEl) return;
    hashPopupEl.textContent = `+${amount.toFixed(2)} Hash`;
    hashPopupEl.classList.remove('hash-popup-animate');
    void hashPopupEl.offsetWidth;
    hashPopupEl.classList.add('hash-popup-animate');
}

// ─── Terminal — Ambient stream ────────────────────────────────────────────────
const terminalOutput = document.getElementById('terminal-output');
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

var terminalInterval = null;

function addTerminalLine(text) {
    if (!terminalOutput) return;
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
const btnTermMax = document.getElementById('btn-maximize-terminal');

var terminalState = 'hidden';
var normalPos = { top: 30, left: 20, width: 900, height: Math.round(window.innerHeight * 0.45) };

function applyNormalGeometry() {
    if (!terminalPanel) return;
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
    if (terminalPanel) {
        terminalPanel.classList.remove('is-maximized');
        terminalPanel.style.display = 'flex';
        if (btnTermMax) btnTermMax.setAttribute('aria-label', 'Maximize');
        applyNormalGeometry();
    }

    if (terminalOutput) terminalOutput.innerHTML = '';
    if (typedTextEl) typedTextEl.textContent = '';
    if (ghostTextEl) ghostTextEl.textContent = '';
    if (hashPopupEl) {
        hashPopupEl.classList.remove('hash-popup-animate');
        hashPopupEl.textContent = '';
    }
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
            if (typeof saveGame === 'function') saveGame();
        }
    }, 110);
}

function closeTerminal() {
    terminalState = 'hidden';
    if (terminalPanel) {
        terminalPanel.style.display = 'none';
        terminalPanel.classList.remove('is-maximized');
    }
    stopAmbientStream();
    deactivateTyping();
    currentLine = null;
    if (typeof removeInternalTaskbarTab === 'function') removeInternalTaskbarTab('tab-terminal');
    if (typeof saveGame === 'function') saveGame();
}

function minimizeTerminal() {
    if (terminalState === 'hidden') return;
    if (terminalState === 'normal') saveNormalGeometry();
    if (terminalState === 'maximized') {
        if (terminalPanel) terminalPanel.classList.remove('is-maximized');
        if (btnTermMax) btnTermMax.setAttribute('aria-label', 'Maximize');
    }
    terminalState = 'minimized';
    if (terminalPanel) terminalPanel.style.display = 'none';
    if (typeof addInternalTaskbarTab === 'function') {
        addInternalTaskbarTab('tab-terminal', '>_ Hack Terminal', restoreFromMinimize);
    }
    if (typeof saveGame === 'function') saveGame();
}

function restoreFromMinimize() {
    if (typeof removeInternalTaskbarTab === 'function') removeInternalTaskbarTab('tab-terminal');
    terminalState = 'normal';
    if (terminalPanel) {
        terminalPanel.classList.remove('is-maximized');
        terminalPanel.style.display = 'flex';
        if (btnTermMax) btnTermMax.setAttribute('aria-label', 'Maximize');
        applyNormalGeometry();
    }
    if (hashPopupEl) {
        hashPopupEl.classList.remove('hash-popup-animate');
        hashPopupEl.textContent = '';
    }
    if (document.activeElement) document.activeElement.blur();
    if (typeof saveGame === 'function') saveGame();
}

function toggleMaximize() {
    if (terminalState === 'maximized') {
        terminalState = 'normal';
        if (terminalPanel) {
            terminalPanel.classList.remove('is-maximized');
            if (btnTermMax) btnTermMax.setAttribute('aria-label', 'Maximize');
            applyNormalGeometry();
        }
    } else if (terminalState === 'normal') {
        saveNormalGeometry();
        terminalState = 'maximized';
        if (terminalPanel) {
            terminalPanel.classList.add('is-maximized');
            if (btnTermMax) btnTermMax.setAttribute('aria-label', 'Restore');
            terminalPanel.style.top    = '0';
            terminalPanel.style.left   = '0';
            terminalPanel.style.width  = '100%';
            terminalPanel.style.height = '100%';
        }
    }
    if (typeof saveGame === 'function') saveGame();
}

function saveNormalGeometry() {
    if (!terminalPanel) return;
    normalPos.top    = parseInt(terminalPanel.style.top)    || 40;
    normalPos.left   = parseInt(terminalPanel.style.left)   || 20;
    normalPos.width  = parseInt(terminalPanel.style.width)  || 720;
    normalPos.height = parseInt(terminalPanel.style.height) || 440;
}

// ─── Events ──────────────────────────────────────────────────────────────────
const btnOpenTerm = document.getElementById('btn-open-terminal');
const btnMinTerm = document.getElementById('btn-minimize-terminal');
const btnCloseTerm = document.getElementById('btn-close-terminal');

if (btnOpenTerm) btnOpenTerm.addEventListener('click', openTerminal);
if (btnMinTerm) btnMinTerm.addEventListener('click', minimizeTerminal);
if (btnTermMax) btnTermMax.addEventListener('click', toggleMaximize);
if (btnCloseTerm) btnCloseTerm.addEventListener('click', closeTerminal);
