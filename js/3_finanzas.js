/* =============================================
   3_finanzas.js - Wallet, Decodifier & Launderer
   ============================================= */

'use strict';

// ─── DOM References ──────────────────────────────────────────────────────────
// (Panels are now referenced from 0_state.js as -window elements)

// ─── Sub-Window: Wallet ─────────────────────────────────────────
function openWallet() {
    if (typeof openDesktopWindow === 'function') openDesktopWindow('pallpay');
    updatePallPayActivity();
}

function closeWallet() {
    if (typeof closeDesktopWindow === 'function') closeDesktopWindow('pallpay');
}

function minimizeWallet() {
    if (typeof minimizeDesktopWindow === 'function') minimizeDesktopWindow('pallpay');
}


// ─── Sub-Window: Decodify ───────────────────────────────────────
function openDecodify() {
    if (typeof openDesktopWindow === 'function') openDesktopWindow('decodify');
}

function closeDecodify() {
    if (typeof closeDesktopWindow === 'function') closeDesktopWindow('decodify');
}

function minimizeDecodify() {
    if (typeof minimizeDesktopWindow === 'function') minimizeDesktopWindow('decodify');
}


// ─── Sub-Window: Launder ───────────────────────────────────────
function openLaunder() {
    if (typeof openDesktopWindow === 'function') openDesktopWindow('onionweb');
}

function closeLaunder() {
    if (typeof closeDesktopWindow === 'function') closeDesktopWindow('onionweb');
}

function minimizeLaunder() {
    if (typeof minimizeDesktopWindow === 'function') minimizeDesktopWindow('onionweb');
}


// ─── Decoding Logic ───────────────────────────────────────────────────────────
const decodifyAmountInput = document.getElementById('decodify-amount');
const projectedCashOutput = document.getElementById('projected-cash');
const decodifyProgressBar = document.getElementById('decodify-progress-bar');
const decodifyStatusText  = document.getElementById('decodify-status-text');
const btnStartDecodify    = document.getElementById('btn-start-decodify');

var isDecoding = false;
var decodifyTimer = null;

// Looping decode sound
const decodifySound = new Audio('./SFX/terminal/decodify.mp3');
decodifySound.loop = true;

if (decodifyAmountInput) {
    decodifyAmountInput.addEventListener('input', () => {
        if(isDecoding) return;
        const val = parseFloat(decodifyAmountInput.value) || 0;
        const proj = (val * 1.5).toFixed(2);
        if (projectedCashOutput) projectedCashOutput.textContent = proj;
    });
}

const btnDecodifyAll = document.getElementById('btn-decodify-all');
if (btnDecodifyAll) {
    btnDecodifyAll.addEventListener('click', () => {
        if (isDecoding) return;
        if (typeof playClick === 'function') playClick();
        if (typeof gameState !== 'undefined') {
            decodifyAmountInput.value = gameState.balance.toFixed(2);
            decodifyAmountInput.dispatchEvent(new Event('input')); // trigger projected cash update
        }
    });
}

function startDecodingSequence() {
    if(isDecoding) return;
    const val = parseFloat(decodifyAmountInput.value);
    
    if(isNaN(val) || val < 1) {
        if (decodifyStatusText) decodifyStatusText.textContent = "Error: Minimum 1 Hash required.";
        return;
    }
    if (val > gameState.balance) {
        if (decodifyStatusText) decodifyStatusText.textContent = "Error: Insufficient Hashes in inventory.";
        return;
    }

    // Deduct hash and start
    if (typeof addHash === 'function') addHash(-val);
    isDecoding = true;
    if (decodifyAmountInput) decodifyAmountInput.disabled = true;
    if (btnStartDecodify) btnStartDecodify.disabled = true;
    if (decodifyProgressBar) decodifyProgressBar.style.width = '0%';
    if (decodifyStatusText) decodifyStatusText.textContent = `Target locked. Decoding process started...`;

    // Start looping decode sound
    decodifySound.currentTime = 0;
    decodifySound.play().catch(() => {});

    const totalTime = 45000; // 45 seconds
    const intervalTime = 100;
    let elapsedTime = 0;

    decodifyTimer = setInterval(() => {
        elapsedTime += intervalTime;
        const progress = Math.min((elapsedTime / totalTime) * 100, 100);
        if (decodifyProgressBar) decodifyProgressBar.style.width = `${progress}%`;
        
        if(elapsedTime % 1000 === 0) {
            const left = Math.ceil((totalTime - elapsedTime)/1000);
            if (decodifyStatusText) decodifyStatusText.textContent = `Decoding in progress... ~${left}s remaining.`;
        }

        if(elapsedTime >= totalTime) {
            clearInterval(decodifyTimer);
            decodifyTimer = null;
            completeDecoding(val);
        }
    }, intervalTime);
}

function completeDecoding(hashAmount) {
    // Stop decode loop sound
    decodifySound.pause();
    decodifySound.currentTime = 0;

    if (typeof playCashSound === 'function') playCashSound();
    const cashGained = hashAmount * 1.5;
    gameState.dirtyCash += cashGained; 
    if (typeof updateLaunderDisplay === 'function') updateLaunderDisplay();
    if (typeof saveGame === 'function') saveGame();
    
    if (decodifyStatusText) decodifyStatusText.textContent = `Success! $${cashGained.toFixed(2)} transfered to OnionWash gateway.`;
    if (decodifyProgressBar) decodifyProgressBar.style.width = '100%';
    
    setTimeout(() => {
        isDecoding = false;
        if (decodifyAmountInput) {
            decodifyAmountInput.disabled = false;
            decodifyAmountInput.value = '';
        }
        if (btnStartDecodify) btnStartDecodify.disabled = false;
        if (decodifyProgressBar) decodifyProgressBar.style.width = '0%';
        if (projectedCashOutput) projectedCashOutput.textContent = '0.00';
    }, 4000);
}



// ─── Launder Panel Logic ──────────────────────────────────────────────────────────
var isLaundering = false;

function startLaunderSequence() {
    if (isLaundering || gameState.dirtyCash <= 0) return;
    isLaundering = true;
    
    const amountToLaunder = gameState.dirtyCash;
    gameState.dirtyCash = 0; // Lock funds
    if (typeof updateLaunderDisplay === 'function') updateLaunderDisplay();
    
    const pbar = document.getElementById('launder-progress-bar');
    const stext = document.getElementById('launder-status');
    const processBtn = document.getElementById('btn-launder-process');
    
    if (processBtn) processBtn.setAttribute('disabled', 'true');
    if (pbar) pbar.style.width = '0%';
    if (stext) stext.textContent = `Establishing onion routing connections...`;
    
    const totalTime = 12000; // 12 seconds
    let elapsedTime = 0;
    
    const timer = setInterval(() => {
        elapsedTime += 100;
        const progress = Math.min((elapsedTime / totalTime) * 100, 100);
        if (pbar) pbar.style.width = `${progress}%`;
        
        if (elapsedTime === 3000) { if (stext) stext.textContent = `Mixing funds through 72 nodes...`; }
        if (elapsedTime === 8000) { if (stext) stext.textContent = `Bypassing trackers. Finalizing wash...`; }
        
        if (elapsedTime >= totalTime) {
            clearInterval(timer);
            isLaundering = false;
            
            // 10% penalty
            const cleaned = amountToLaunder * 0.90;
            gameState.cleanCash += cleaned;
            if (typeof updateLaunderDisplay === 'function') updateLaunderDisplay();
            if (typeof saveGame === 'function') saveGame();
            if (typeof playCashSound === 'function') playCashSound();
            
            if (pbar) pbar.style.width = '100%';
            if (stext) stext.textContent = `Successfully washed $${cleaned.toFixed(2)}.`;
            
            setTimeout(() => {
                if (pbar) pbar.style.width = '0%';
                if (stext) stext.textContent = `Idle.`;
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
    
    if (typeof updateCashDisplay === 'function') updateCashDisplay();
    if (typeof updateLaunderDisplay === 'function') updateLaunderDisplay();
    if (typeof saveGame === 'function') saveGame();
    if (typeof playCashSound === 'function') playCashSound();
    
    // Send automated Receipt
    if (typeof sendPallPayReceipt === 'function') sendPallPayReceipt(amountTransferred, sharedTransId);
    
    const day = (typeof gameState !== 'undefined') ? (gameState.currentDay || 1) : 1;
    const dateStr = (typeof window.getInGameDateStr === 'function') ? window.getInGameDateStr(day) : `Day ${day}`;
    
    // Store in internal transaction history
    gameState.transactions.unshift({
        id: 'PP-' + sharedTransId,
        amount: amountTransferred,
        date: dateStr,
        source: 'OnionWeb Mixer'
    });
    if (gameState.transactions.length > 5) gameState.transactions.pop();
    updatePallPayActivity();
    
    const stext = document.getElementById('launder-status');
    if (stext) {
        stext.textContent = `Funds safely transferred to PallPay.`;
        setTimeout(() => { stext.textContent = 'Idle.'; }, 3000);
    }
}

function sendPallPayReceipt(amount, transId) {
    const day = (typeof gameState !== 'undefined') ? (gameState.currentDay || 1) : 1;
    const dateStr = (typeof window.getInGameDateStr === 'function') ? window.getInGameDateStr(day) : `Day ${day}`;
    
    let timeStr = "12:00";
    if (typeof window.getInGameTime === 'function' && typeof window.formatInGameTime === 'function') {
        const {h, m} = window.getInGameTime();
        timeStr = window.formatInGameTime(h, m);
    }
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
                    <td style="padding: 15px 0; text-align: right; font-size: 18px; font-weight: bold; color: #28a745; border-top: 1px solid #eee;">+$${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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

    if (typeof addEmailToList === 'function') addEmailToList(newMail);
    
    // Visual and Audio Notification
    if (typeof playMailSound === 'function') playMailSound();
    
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.style.borderLeft = '4px solid #0070ba';
    popup.innerHTML = `<img src="assets/icon-pallpay.png" width="24" height="24"> <div><strong>PallPay</strong><br>New deposit received!</div>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
}

// ─── PallPay Activity UI ─────────────────────────────────────────────────────
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
            const isSent = t.amount < 0;
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f2f2f2;';
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:24px; height:24px; background:${isSent ? '#fef3e8' : '#eef5fc'}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:${isSent ? '#d35400' : '#0070ba'}; font-weight:bold; font-size:10px;">${isSent ? '↑' : 'OW'}</div>
                    <div>
                        <div style="font-size:11px; font-weight:bold; color:#333;">${t.source}</div>
                        <div style="font-size:9px; color:#999;">${t.date} • ${t.id}</div>
                    </div>
                </div>
                <div style="font-size:12px; font-weight:bold; color:${isSent ? '#d00' : '#28a745'};">${isSent ? '-' : '+'}$${Math.abs(t.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
        const isDesktop = container.closest('#pallpay-window') !== null;
        container.innerHTML = `
            <div class="pp-section section-summary">
                <div style="background:#fff; border-radius:8px; border:1px solid #e0e0e0; padding:20px; box-shadow:0 2px 5px rgba(0,0,0,0.05); margin-bottom:20px;">
                    <div style="font-size:12px; color:#666; margin-bottom:5px; font-family:'Trebuchet MS', sans-serif;">
                        <span class="logo-pall" style="font-style:italic; font-weight:bold;">Pall</span><span class="logo-pay" style="font-style:italic; font-weight:bold;">Pay</span> balance
                    </div>
                    <div style="font-size:${isDesktop ? '32px' : '24px'}; color:#333; margin-bottom:${isDesktop ? '20px' : '10px'};">
                        $<span class="cash-sync-internal">${gameState.cash.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="pp-btn" onclick="const ppTabSend = this.closest('.pallpay-app-container').querySelector('.pp-tab[data-target=\\'send\\']'); if (ppTabSend) ppTabSend.click();" style="background:#0070ba; color:#fff; border:none; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:12px; cursor:pointer;">Transfer Funds</button>
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
                <h3 style="margin:0 0 15px 0; font-size:16px;">Send Money</h3>
                <div style="display:flex; flex-direction:column; gap:8px;" id="pp-contacts-list">
                </div>
            </div>
        `;
        renderPallPayContacts();
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
    } else if (section === 'loans') {
        const loan    = gameState.activeLoan;
        const day     = gameState.currentDay || 1;
        const hasActive = loan && !loan.paid;
        const hasCooldown = loan && loan.paid && day < (loan.dayTaken + 10);
        const eligible  = !hasActive && !hasCooldown;

        let statusHtml = '';
        let daysLeft = loan ? (loan.dueDateDay - day) : null;
        let cooldownLeft = loan && loan.paid ? ((loan.dayTaken + 10) - day) : 0;

        if (eligible) {
            statusHtml = `<div style="color:#006600;">✅ No active loan. You are eligible to apply.</div>`;
        } else if (hasCooldown) {
            statusHtml = `<div style="color:#555;">✅ Loan repaid. Cooldown: <strong>${cooldownLeft} day(s)</strong> remaining before next application.</div>`;
        } else if (hasActive) {
            const overdue = daysLeft < 0;
            statusHtml = overdue
                ? `<div style="color:#cc0000;">🚨 OVERDUE! Loan of <strong>$${loan.amount.toFixed(2)}</strong> was due on Day ${loan.dueDateDay}. Pay immediately!</div>`
                : `<div style="color:#884400;">⚠ Active loan: <strong>$${loan.amount.toFixed(2)}</strong> due on <strong>Day ${loan.dueDateDay}</strong> (${daysLeft} day(s) remaining).</div>`;
        }

        const repayDetailsHtml = hasActive ? `
            <div id="loan-repay-box" style="background:#fff; border:2px inset #ccc; padding:16px; margin-top:14px;">
                <div style="font-weight:bold; color:#cc0000; margin-bottom:10px; font-size:12px; border-bottom:1px solid #cc0000; padding-bottom:4px;">⚠ ACTIVE LOAN — REPAYMENT REQUIRED</div>
                <div style="font-size:11px; font-family:'Tahoma'; color:#333; margin-bottom:12px; line-height:1.7;">
                    Loan Amount: <strong>$${loan.amount.toFixed(2)}</strong><br>
                    Taken on: Day ${loan.dayTaken}<br>
                    Due on: Day ${loan.dueDateDay}<br>
                    Status: <strong style="color:${daysLeft < 0 ? '#cc0000' : '#884400'}">${daysLeft < 0 ? 'OVERDUE' : 'PENDING'}</strong><br><br>
                    Your current PallPay balance: <strong>$${(gameState.cash || 0).toFixed(2)}</strong>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <button id="btn-repay-loan" onclick="repayLoan()"
                        style="background:linear-gradient(180deg,#3d9b2f,#1e6b10); color:#fff; border:2px solid #155a08; padding:5px 22px; font-size:12px; font-family:'Tahoma'; font-weight:bold; cursor:pointer; border-radius:2px;">
                        💳 Pay Back Loan
                    </button>
                </div>
            </div>` : '';

        const formHtml = eligible ? `
            <div id="loan-form" style="background:#fff; border:2px inset #ccc; padding:16px; margin-top:14px;">
                <div style="font-weight:bold; color:#003080; margin-bottom:12px; font-size:12px; border-bottom:1px solid #3060c0; padding-bottom:4px;">💲 PERSONAL LOAN APPLICATION</div>
                <table style="width:100%; font-size:11px; font-family:'Tahoma'; border-collapse:collapse;">
                    <tr><td style="padding:6px 0; color:#444; width:45%;">Applicant Name:</td><td><strong class="os-username-text">BlueCode_Hacker</strong></td></tr>
                    <tr><td style="padding:6px 0; color:#444;">Repayment Period:</td><td style="color:#cc0000; font-weight:bold;">10 days from approval</td></tr>
                    <tr><td style="padding:6px 0; color:#444;">Amount Range:</td><td>$500 — $10,000</td></tr>
                </table>
                <div style="margin-top:14px;">
                    <label style="font-size:11px; font-weight:bold; color:#003080; font-family:'Tahoma'; display:block; margin-bottom:5px;">Requested Loan Amount ($):</label>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <input type="number" id="loan-amount-input" min="500" max="10000" value="500" step="100"
                            style="width:130px; padding:4px 6px; border:2px inset #aaa; font-size:13px; font-family:'Tahoma'; font-weight:bold; color:#003080;"
                            onchange="clampLoanAmount()" oninput="clampLoanAmount()">
                        <span style="font-size:10px; color:#666;">Min: $500 · Max: $10,000</span>
                    </div>
                </div>
                <div style="margin-top:10px; background:#fffbe6; border:1px solid #e0c040; padding:8px 10px; font-size:10px; color:#664400; font-family:'Tahoma';">
                    ⚠ By submitting this application you agree to repay the full principal within 10 days. Failure will result in account seizure and game over.
                </div>
                <div style="margin-top:14px; display:flex; justify-content:flex-end;">
                    <button id="btn-submit-loan" onclick="submitLoanRequest()"
                        style="background:linear-gradient(180deg,#4a90d9,#1a5fb4); color:#fff; border:2px solid #0a3f8a; padding:5px 22px; font-size:12px; font-family:'Tahoma'; font-weight:bold; cursor:pointer; border-radius:2px;">
                        📤 Submit Application
                    </button>
                </div>
            </div>` : '';

        container.innerHTML = `
            <div class="pp-section section-loans">
                <div style="background:linear-gradient(180deg,#1a3a6e,#0e234a); color:#fff; padding:14px 18px; border-radius:4px 4px 0 0; border:2px solid #0e234a; border-bottom:none;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="assets/icon-pallpay.png" width="26" height="26" style="filter:brightness(2);">
                        <div>
                            <div style="font-size:15px; font-weight:bold; letter-spacing:1px;">🏦 FirstNet Bank — Loan Services</div>
                            <div style="font-size:10px; color:#aac4ff;">Member FDIC · Est. 1984 · Serving online since 1999</div>
                        </div>
                    </div>
                </div>
                <div style="border:2px solid #0e234a; border-top:3px solid #4a90d9; background:#ece9d8; border-radius:0 0 4px 4px;">
                    <div style="background:#003080; color:#ffff88; font-size:10px; padding:3px 10px; font-family:'Courier New',monospace;">
                        ★ RATES AS LOW AS 8.9% APR ★ FAST APPROVAL ★ NO CREDIT CHECK REQUIRED ★ APPLY NOW ★
                    </div>
                    <div style="padding:16px 18px; display:flex; flex-direction:column; gap:0;">
                        <div style="background:#fff; border:2px inset #ccc; padding:12px; font-size:11px; font-family:'Tahoma';">
                            <div style="font-weight:bold; color:#003080; margin-bottom:6px; font-size:12px;">📋 ACCOUNT STATUS</div>
                            ${statusHtml}
                        </div>
                        ${repayDetailsHtml}
                        ${formHtml}
                    </div>
                </div>
                <div style="background:#d4d0c8; border:2px outset #fff; padding:5px 10px; font-size:9px; color:#555; font-family:'Tahoma'; margin-top:6px; text-align:center; border-radius:2px;">
                    FirstNet Bank · Member FDIC · Licensed Money Lender · 128-bit SSL Encryption · PallPay Partnership Program
                </div>
            </div>
        `;
    }
    updatePallPayActivity();
}


// ─── PallPay Contacts ────────────────────────────────────────────────────────

const pallpayContacts = [
    {
        id: 'landlord',
        name: 'Gerald M. (Landlord)',
        email: 'gerald.m@realtormail.com',
        avatar: '🏠',
        avatarBg: '#e8d5b7'
    }
];

function renderPallPayContacts() {
    const list = document.getElementById('pp-contacts-list');
    if (!list) return;

    list.innerHTML = '';
    pallpayContacts.forEach(contact => {
        const hasDebt = contact.id === 'landlord' && gameState.rentOwed > 0;
        const item = document.createElement('div');
        item.style.cssText = `display:flex; align-items:center; gap:12px; padding:12px; background:#fff; border:1px solid ${hasDebt ? '#f5c6cb' : '#e0e0e0'}; border-radius:8px; cursor:pointer; transition:all 0.15s;`;
        item.innerHTML = `
            <div style="width:40px; height:40px; background:${contact.avatarBg}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${contact.avatar}</div>
            <div style="flex:1; min-width:0;">
                <div style="font-size:13px; font-weight:bold; color:#333;">${contact.name}</div>
                <div style="font-size:10px; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${contact.email}</div>
                ${hasDebt ? `<div style="font-size:10px; color:#d00; font-weight:bold; margin-top:2px;">⚠ Rent due: $${gameState.rentOwed.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>` : ''}
            </div>
            <div style="font-size:18px; color:#0070ba;">›</div>
        `;
        
        if (contact.id === 'landlord' && (gameState.currentDay % 7 !== 0)) {
            item.style.opacity = '0.5';
            item.style.cursor = 'not-allowed';
            item.title = "Gerald only accepts payments on Day 7, 14, 21, etc.";
            item.onclick = null;
            item.onmouseenter = null;
            item.onmouseleave = null;
        } else {
            item.onmouseenter = () => { item.style.background = '#f0f7ff'; item.style.borderColor = '#0070ba'; };
            item.onmouseleave = () => { item.style.background = '#fff'; item.style.borderColor = hasDebt ? '#f5c6cb' : '#e0e0e0'; };
            item.onclick = () => openPaymentView(contact);
        }
        
        list.appendChild(item);
    });
}

function openPaymentView(contact) {
    const contentArea = document.querySelector('#pallpay-window .pp-content-area');
    if (!contentArea) return;

    const suggestedAmount = (contact.id === 'landlord' && gameState.rentOwed > 0) ? gameState.rentOwed : '';
    const debtWarning = (contact.id === 'landlord' && gameState.rentOwed > 0)
        ? `<div style="background:#fff3cd; border:1px solid #ffc107; border-radius:6px; padding:10px; margin-bottom:15px; font-size:11px; color:#856404;">
               <strong>⚠ Rent payment due:</strong> $${gameState.rentOwed.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
               <br><span style="font-size:10px;">Pay the full amount to clear your balance.</span>
           </div>`
        : '';

    contentArea.innerHTML = `
        <div class="pp-section section-send-detail" style="padding:10px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px;">
                <button class="pp-back-btn" style="background:none; border:none; font-size:18px; cursor:pointer; color:#0070ba; padding:0 5px;">←</button>
                <h3 style="margin:0; font-size:16px;">Send to ${contact.name}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:12px; padding:15px; background:#f7f9fc; border-radius:8px; margin-bottom:20px; border:1px solid #e0e0e0;">
                <div style="width:48px; height:48px; background:${contact.avatarBg}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px;">${contact.avatar}</div>
                <div>
                    <div style="font-weight:bold; color:#333;">${contact.name}</div>
                    <div style="font-size:11px; color:#888;">${contact.email}</div>
                </div>
            </div>
            ${debtWarning}
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:11px; color:#888; margin-bottom:5px;">Amount to send</div>
                <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                    <span style="font-size:32px; color:#333;">$</span>
                    <input type="number" id="pp-send-amount" min="0.01" step="0.01" placeholder="0.00" value="${suggestedAmount}"
                        style="font-size:32px; border:none; border-bottom:2px solid #0070ba; width:180px; text-align:center; outline:none; color:#333; background:transparent;">
                </div>
                <div style="font-size:10px; color:#999; margin-top:5px;">Available: $<span class="cash-sync-internal">${gameState.cash.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
            </div>
            <button id="btn-pp-send-money" data-contact="${contact.id}"
                style="width:100%; background:#0070ba; color:#fff; border:none; padding:12px; border-radius:25px; font-weight:bold; font-size:14px; cursor:pointer; transition:filter 0.15s;">
                Send Payment
            </button>
            <div id="pp-send-status" style="text-align:center; margin-top:10px; font-size:12px; min-height:18px;"></div>
        </div>
    `;

    // Wire back button
    const backBtn = contentArea.querySelector('.pp-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => renderPallPaySection(contentArea, 'send'));

    // Wire send button
    const sendBtn = document.getElementById('btn-pp-send-money');
    if (sendBtn) sendBtn.addEventListener('click', () => processPallPaySend(contact.id));

    // Hover effect
    if (sendBtn) {
        sendBtn.onmouseenter = () => sendBtn.style.filter = 'brightness(1.15)';
        sendBtn.onmouseleave = () => sendBtn.style.filter = '';
    }
}

function processPallPaySend(contactId) {
    const amountInput = document.getElementById('pp-send-amount');
    const statusEl = document.getElementById('pp-send-status');
    if (!amountInput || !statusEl) return;

    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        statusEl.textContent = '⚠ Enter a valid amount.';
        statusEl.style.color = '#d00';
        return;
    }
    if (amount > gameState.cash) {
        statusEl.textContent = '⚠ Insufficient funds.';
        statusEl.style.color = '#d00';
        return;
    }
    
    if (contactId === 'landlord' && (gameState.currentDay % 7 !== 0)) {
        statusEl.textContent = '⚠ Gerald only accepts payments on Day 7, 14, 21, etc.';
        statusEl.style.color = '#d00';
        return;
    }

    // Deduct cash
    gameState.cash -= amount;
    gameState.cash = Math.round(gameState.cash * 100) / 100;

    if (contactId === 'landlord') {
        if (gameState.rentOwed > 0) {
            const paid = Math.min(amount, gameState.rentOwed);
            gameState.rentOwed = Math.round((gameState.rentOwed - paid) * 100) / 100;
            if (gameState.rentOwed <= 0) {
                gameState.rentOwed = 0;
                gameState.lastRentPaidDay = gameState.currentDay;
                statusEl.innerHTML = '✅ <strong>Rent fully paid!</strong> Gerald will leave you alone... for now.';
                statusEl.style.color = '#28a745';
            } else {
                statusEl.innerHTML = `⚠ Partial payment. You still owe $${gameState.rentOwed.toFixed(2)}.`;
                statusEl.style.color = '#e67e00';
            }
        } else {
            statusEl.innerHTML = '✅ Payment sent to Gerald M.';
            statusEl.style.color = '#28a745';
        }
    } else {
        statusEl.innerHTML = '✅ Payment sent successfully.';
        statusEl.style.color = '#28a745';
    }

    // Record transaction
    const transId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const contact = pallpayContacts.find(c => c.id === contactId);
    const day = (typeof gameState !== 'undefined') ? (gameState.currentDay || 1) : 1;
    const dateStr = (typeof window.getInGameDateStr === 'function') ? window.getInGameDateStr(day) : `Day ${day}`;

    gameState.transactions.unshift({
        id: 'PP-' + transId,
        amount: -amount,
        date: dateStr,
        source: contact ? contact.name : 'Unknown'
    });
    if (gameState.transactions.length > 20) gameState.transactions.pop();

    if (typeof updateCashDisplay === 'function') updateCashDisplay();
    if (typeof playCashSound === 'function') playCashSound();
    if (typeof saveGame === 'function') saveGame();

    // Update available display
    amountInput.value = '';
}

// ─── Rent Calculation ────────────────────────────────────────────────────────

const BASE_RENT = 1000;

function getTotalUpgradeLevel() {
    let total = 0;
    for (const key in gameState.pcParts) {
        total += gameState.pcParts[key].level;
    }
    return total;
}

function calculateRent() {
    const totalLevels = getTotalUpgradeLevel();
    // Each component level adds 5% to rent.
    // 7 components × multiple levels = significant scaling.
    // At total level 10: $1500, level 20: $2000, level 30: $2500, etc.
    const rentMultiplier = 1 + (totalLevels * 0.05);
    return Math.round(BASE_RENT * rentMultiplier);
}

// ─── Landlord Email System ───────────────────────────────────────────────────

const landlordMessages = [
    "Hey, rent's due. You know the drill. Don't make me come knock on your door.",
    "It's that time again. Pay up or I swear I'm changing the locks this time.",
    "Rent. Now. I'm not running a charity here, you know.",
    "I got bills too, genius. Your rent is due. Wire it over.",
    "Before you forget AGAIN — your rent is due. Don't test me.",
    "Listen, I don't care what you do in there all day. Just pay your damn rent.",
    "Your rent is overdue the SECOND you open this email. Pay. Now.",
    "Another week, another reminder that you owe me money. Shocking.",
    "I can hear your PC running through the walls. Must be nice. Rent. Pay it.",
    "Hey. You. The one who's always home. Rent. Today. No excuses.",
    "Look, I like you, but not enough to let you live here for free. Pay up.",
    "Do I need to slide a note under your door again? Rent is DUE.",
];

const landlordElectricityComplaints = [
    "Also, whatever the hell you're doing with that PC of yours is driving the electric bill through the roof. I'm adding extra to cover it.",
    "P.S. Your electricity usage is insane. What are you running in there, a server farm? The extra cost is on you.",
    "And don't think I haven't noticed the power bill going up. That machine of yours is eating electricity like crazy.",
    "By the way, the power company called ME about YOUR unit. Whatever you upgraded in that computer, it's costing ME more. So now it costs YOU more.",
    "Also — the electric meter on your unit is spinning like a helicopter blade. I bumped the rent to cover it. Deal with it.",
    "Side note: your power usage doubled since last month. I don't know what kind of Frankenstein PC you built but YOU'RE paying for the extra juice.",
    "One more thing — the fuse on your floor keeps tripping. That PC is a monster. Extra charge for electricity, non-negotiable.",
    "P.S. The electrician says your unit alone pulls more power than the rest of the floor combined. Congratulations, your rent went up.",
];

function checkAndSendRentEmail() {
    const day = gameState.currentDay;

    // Only trigger on rent due days (every 7 days)
    if (day < gameState.rentDueDay) return;

    // Don't send duplicate for the same due day
    const rentMailId = `m_rent_day${gameState.rentDueDay}`;
    if (typeof inboxEmails !== 'undefined' && inboxEmails.find(m => m.id === rentMailId)) return;

    const rentAmount = calculateRent();
    gameState.rentOwed += rentAmount;
    gameState.rentDueDay = gameState.rentDueDay + 7; // Next due in 7 more days

    // Pick random message
    const baseMsg = landlordMessages[Math.floor(Math.random() * landlordMessages.length)];

    // Add electricity complaint if upgrades exist
    const totalLevels = getTotalUpgradeLevel();
    let electricityMsg = '';
    if (totalLevels >= 3) {
        electricityMsg = '<br><br>' + landlordElectricityComplaints[Math.floor(Math.random() * landlordElectricityComplaints.length)];
    }

    const rentFormatted = rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const emailBody = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <p>${baseMsg}</p>
            ${electricityMsg ? `<p style="color:#8b4513;">${electricityMsg}</p>` : ''}
            <div style="background:#f9f3e8; border:1px solid #d4a574; padding:15px; border-radius:6px; margin:15px 0;">
                <div style="font-size:11px; color:#8b6914; text-transform:uppercase; font-weight:bold; margin-bottom:5px;">RENT + UTILITIES</div>
                <div style="font-size:28px; font-weight:bold; color:#333;">$${rentFormatted}</div>
                ${totalLevels > 0 ? `<div style="font-size:10px; color:#999; margin-top:3px;">Includes $${Math.round(rentAmount - BASE_RENT).toLocaleString('en-US')} electricity surcharge</div>` : ''}
            </div>
            <button onclick="if(typeof openDesktopWindow==='function'){openDesktopWindow('pallpay');} setTimeout(function(){var tabs=document.querySelectorAll('.pp-tab');tabs.forEach(function(t){if(t.dataset.target==='send'){t.click();}});},300);"
                style="background:#0070ba; color:#fff; border:none; padding:10px 25px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:8px;">
                <img src="assets/icon-pallpay.png" width="16" height="16" style="vertical-align:middle;"> PallPay me the money
            </button>
            <p style="font-size:11px; color:#888; margin-top:15px;">— Gerald M., Unit Manager</p>
        </div>
    `;

    if (typeof playMailSound === 'function') playMailSound();

    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.style.borderLeft = '4px solid #d4a574';
    popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>Landlord</strong><br>Rent due: $${rentFormatted}</div>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 6000);

    if (typeof addEmailToList === 'function') {
        addEmailToList({
            id: rentMailId,
            sender: 'Gerald M. (Landlord)',
            date: typeof getGameDate === 'function' ? getGameDate(day) : 'Now',
            subject: `Rent Due — $${rentFormatted}`,
            body: emailBody,
            unread: true,
            attachment: false
        });
    }

    if (typeof saveGame === 'function') saveGame();
}

const landlordReminderMessages = [
    "Just a friendly reminder. Your rent is due at the end of the week. Have the money ready.",
    "Don't forget, rent day is coming up in a few days. Don't be short.",
    "Rent is due this weekend. I'm reminding you now so you can't say you forgot.",
    "Start gathering the cash. Rent is due soon. No delays.",
    "Consider this your mid-week reminder. Your rent is expected at the end of the week."
];

function checkAndSendRentReminderEmail() {
    const day = gameState.currentDay;
    
    // Trigger only on the 3rd day of the 7-day cycle (e.g. Day 3, 10, 17, 24...)
    if ((day % 7) !== 3) return;

    // Upcoming rent day will be in 4 days
    const upcomingRentDay = day + 4;
    const reminderMailId = `m_rent_reminder_day${upcomingRentDay}`;

    // Don't send reminder if already sent this cycle
    if (typeof inboxEmails !== 'undefined' && inboxEmails.find(m => m.id === reminderMailId)) return;

    const rentAmount = calculateRent(); // Retrieve projected rent
    const rentFormatted = rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const baseMsg = landlordReminderMessages[Math.floor(Math.random() * landlordReminderMessages.length)];

    const emailBody = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <p>${baseMsg}</p>
            <div style="background:#e8f4fc; border:1px solid #b6d4ea; padding:15px; border-radius:6px; margin:15px 0;">
                <div style="font-size:11px; color:#5a8ba8; text-transform:uppercase; font-weight:bold; margin-bottom:5px;">UPCOMING RENT ESTIMATE</div>
                <div style="font-size:24px; font-weight:bold; color:#333;">$${rentFormatted}</div>
                <div style="font-size:10px; color:#666; margin-top:3px;">Ensure you have this amount in PallPay by Day ${upcomingRentDay}.</div>
            </div>
            <p style="font-size:11px; color:#888; margin-top:15px;">— Gerald M., Unit Manager</p>
        </div>
    `;

    if (typeof playMailSound === 'function') playMailSound();

    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.style.borderLeft = '4px solid #b6d4ea';
    popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>Landlord</strong><br>Rent Reminder</div>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 6000);

    if (typeof addEmailToList === 'function') {
        addEmailToList({
            id: reminderMailId,
            sender: 'Gerald M. (Landlord)',
            date: typeof getGameDate === 'function' ? getGameDate(day) : 'Now',
            subject: `Reminder: Rent due soon ($${rentFormatted})`,
            body: emailBody,
            unread: true,
            attachment: false
        });
    }

    if (typeof saveGame === 'function') saveGame();
}

// ─── Wiring ──────────────────────────────────────────────────────────────────
const btnOpenWallet = document.getElementById('btn-open-wallet');
if (btnOpenWallet) btnOpenWallet.addEventListener('click', openWallet);

const btnOpenDec = document.getElementById('btn-open-decodify');
if (btnOpenDec) btnOpenDec.addEventListener('click', openDecodify);

if (btnStartDecodify) btnStartDecodify.addEventListener('click', startDecodingSequence);

const btnOpenLaunder = document.getElementById('btn-open-launder');
if (btnOpenLaunder) btnOpenLaunder.addEventListener('click', openLaunder);

const btnProcessLaunder = document.getElementById('btn-launder-process');
if (btnProcessLaunder) btnProcessLaunder.addEventListener('click', startLaunderSequence);
const btnTransferLaunder = document.getElementById('btn-launder-transfer');
if (btnTransferLaunder) btnTransferLaunder.addEventListener('click', transferCleanFunds);

initPallPayTabs();

// Export globals
window.checkAndSendRentEmail = checkAndSendRentEmail;
window.calculateRent = calculateRent;
window.openPaymentView = openPaymentView;
