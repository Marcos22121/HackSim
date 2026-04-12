/* =============================================
   5_apps.js - Documents, Notepad & Calculator
   ============================================= */

'use strict';

// ─── Documents Database ──────────────────────────────────────────────────────
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
    },
    'doc-onionweb': {
        title: 'OnionWeb.txt',
        content: `Put this in the net that must not be named:\n\nhttp://onion.web/laundering_service`
    },
    'doc-weird-link': {
        title: 'SECRET_LINK.txt',
        content: `I don't know who you are, but I found this hidden node. It looks like it's still being built or protected. \n\nLink: 9fd8vgdf9.5333.bg \n\nBe careful.`
    }
};

function renderDocumentsList() {
    const list = document.getElementById('documents-list');
    if (!list) return;
    list.innerHTML = '';
    if (typeof gameState === 'undefined') return;
    
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
            if (typeof openDesktopWindow === 'function') {
                openDesktopWindow('notepad');
                const title = document.getElementById('notepad-title');
                const content = document.getElementById('notepad-content');
                if (title) title.textContent = `${doc.title} - Notepad`;
                if (content) content.value = doc.content;
            }
        };
        list.appendChild(docItem);
    });
}

// ─── Calculator Logic ─────────────────────────────────────────────────────────
var calcDisplayValue = '0';
var calcFirstOperand = null;
var calcOperator = null;
var calcRestart = false;

function updateCalcDisplay() {
    const display = document.getElementById('calc-display');
    if (display) display.textContent = calcDisplayValue;
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

// Ensure calculator functions are global for HTML onclicks
window.calcNum = calcNum;
window.calcDot = calcDot;
window.calcClear = calcClear;
window.calcClearEntry = calcClearEntry;
window.calcBackspace = calcBackspace;
window.calcOp = calcOp;
window.calcEqual = calcEqual;
window.updateCalcDisplay = updateCalcDisplay;
window.renderDocumentsList = renderDocumentsList;

// ─── IP Spoofer Logic ──────────────────────────────────────────────────────────
function toggleIPChanger() {
    if (typeof gameState === 'undefined') return;

    const statusEl = document.getElementById('ipchanger-status');
    const btnEl = document.getElementById('btn-toggle-ip');
    if (!statusEl || !btnEl) return;

    const targetState = !gameState.isIPActive;
    btnEl.disabled = true;

    if (targetState) {
        statusEl.textContent = 'CONNECTING...';
        statusEl.style.color = '#d39800';
    } else {
        statusEl.textContent = 'DISCONNECTING...';
        statusEl.style.color = '#d39800';
    }

    setTimeout(() => {
        gameState.isIPActive = targetState;
        btnEl.disabled = false;

        const pallpayOverlay = document.getElementById('pallpay-blocking-overlay');

        if (gameState.isIPActive) {
            statusEl.textContent = 'CONNECTED (Spoofed)';
            statusEl.style.color = '#1a6b0a';
            btnEl.textContent = 'Disconnect IP';

            // Block Bluemium if it's open
            if (typeof browserCurrentPage !== 'undefined' && browserCurrentPage !== 'spoofed') {
                if (typeof browserNavigateTo === 'function') browserNavigateTo('spoofed');
            }
            
            // Show PallPay blocking overlay
            if (pallpayOverlay) pallpayOverlay.style.display = 'flex';

        } else {
            statusEl.textContent = 'Disconnected';
            statusEl.style.color = '#d33c3c';
            btnEl.textContent = 'Activate IP';

            // Restore Bluemium if it was blocked
            if (typeof browserCurrentPage !== 'undefined' && browserCurrentPage === 'spoofed') {
                if (typeof browserNavigateTo === 'function') browserNavigateTo('newtab');
            }

            // Hide PallPay blocking overlay
            if (pallpayOverlay) pallpayOverlay.style.display = 'none';
        }
        if (typeof saveGame === 'function') saveGame();
    }, 1200);
}

window.toggleIPChanger = toggleIPChanger;
