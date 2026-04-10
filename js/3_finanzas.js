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
    if (stext) {
        stext.textContent = `Funds safely transferred to PallPay.`;
        setTimeout(() => { stext.textContent = 'Idle.'; }, 3000);
    }
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
        const isDesktop = container.closest('#pallpay-window') !== null;
        container.innerHTML = `
            <div class="pp-section section-summary">
                <div style="background:#fff; border-radius:8px; border:1px solid #e0e0e0; padding:20px; box-shadow:0 2px 5px rgba(0,0,0,0.05); margin-bottom:20px;">
                    <div style="font-size:12px; color:#666; margin-bottom:5px; font-family:'Trebuchet MS', sans-serif;">
                        <span class="logo-pall" style="font-style:italic; font-weight:bold;">Pall</span><span class="logo-pay" style="font-style:italic; font-weight:bold;">Pay</span> balance
                    </div>
                    <div style="font-size:${isDesktop ? '32px' : '24px'}; color:#333; margin-bottom:${isDesktop ? '20px' : '10px'};">
                        $<span class="cash-sync-internal">${gameState.cash.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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
