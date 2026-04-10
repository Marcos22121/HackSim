/* =============================================
   10_loans.js — PallPay Loan System
   ============================================= */

'use strict';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampLoanAmount() {
    const input = document.getElementById('loan-amount-input');
    if (!input) return;
    let v = parseFloat(input.value) || 500;
    if (v < 500)   v = 500;
    if (v > 10000) v = 10000;
    input.value = v;
}

// ─── UI Refresh ───────────────────────────────────────────────────────────────

function updateLoanUI() {
    const statusText  = document.getElementById('loan-status-text');
    const loanForm    = document.getElementById('loan-form');
    const repayBox    = document.getElementById('loan-repay-box');
    const repayDetails = document.getElementById('loan-repay-details');
    const submitBtn   = document.getElementById('btn-submit-loan');

    if (!statusText || !loanForm || !repayBox) return;

    const loan = gameState.activeLoan;
    const day  = gameState.currentDay || 1;

    if (!loan) {
        // No loan at all — fully eligible
        statusText.innerHTML = '✅ No active loan. You are eligible to apply.';
        statusText.style.color = '#006600';
        loanForm.style.display = 'block';
        repayBox.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    const daysTaken = day - loan.dayTaken;
    const daysLeft  = loan.dueDateDay - day;

    if (loan.paid) {
        // Paid but maybe not enough days yet for a new loan
        const cooldownDone = day >= (loan.dayTaken + 10);
        if (cooldownDone) {
            // Clear the loan and allow a new one
            gameState.activeLoan = null;
            if (typeof saveGame === 'function') saveGame();
            updateLoanUI();
            return;
        } else {
            const daysRemaining = (loan.dayTaken + 10) - day;
            statusText.innerHTML = `✅ Loan repaid. Cooldown: <strong>${daysRemaining} day(s)</strong> remaining before next application.`;
            statusText.style.color = '#555';
            loanForm.style.display = 'none';
            repayBox.style.display = 'none';
            return;
        }
    }

    // Active unpaid loan
    const overdue = daysLeft < 0;

    if (overdue) {
        statusText.innerHTML = `🚨 OVERDUE! Loan of <strong>$${loan.amount.toFixed(2)}</strong> was due on Day ${loan.dueDateDay}. Pay immediately!`;
        statusText.style.color = '#cc0000';
    } else {
        statusText.innerHTML = `⚠ Active loan: <strong>$${loan.amount.toFixed(2)}</strong> due on <strong>Day ${loan.dueDateDay}</strong> (${daysLeft} day(s) remaining).`;
        statusText.style.color = '#884400';
    }

    // Hide the application form, show repayment box
    loanForm.style.display = 'none';
    repayBox.style.display = 'block';

    if (repayDetails) {
        repayDetails.innerHTML =
            `Loan Amount: <strong>$${loan.amount.toFixed(2)}</strong><br>` +
            `Taken on: Day ${loan.dayTaken}<br>` +
            `Due on: Day ${loan.dueDateDay}<br>` +
            `Status: <strong style="color:${overdue ? '#cc0000' : '#884400'}">${overdue ? 'OVERDUE' : 'PENDING'}</strong><br><br>` +
            `Your current PallPay balance: <strong>$${(gameState.cash || 0).toFixed(2)}</strong>`;
    }

    // Disable new application
    if (submitBtn) submitBtn.disabled = true;
}

// ─── Loan Application Flow ────────────────────────────────────────────────────

function submitLoanRequest() {
    const loan = gameState.activeLoan;
    const day  = gameState.currentDay || 1;

    // Guard: active unpaid loan exists
    if (loan && !loan.paid) {
        alert('You already have an active loan. Please repay it first.');
        return;
    }

    // Guard: cooldown not done (paid but < 10 days)
    if (loan && loan.paid) {
        const cooldownDone = day >= (loan.dayTaken + 10);
        if (!cooldownDone) {
            const wait = (loan.dayTaken + 10) - day;
            alert(`You must wait ${wait} more day(s) before applying for a new loan.`);
            return;
        }
    }

    clampLoanAmount();
    const input  = document.getElementById('loan-amount-input');
    const amount = parseFloat(input ? input.value : 500) || 500;
    const dueDay = day + 10;

    // Populate confirm dialog
    const dialogText = document.getElementById('loan-dialog-text');
    if (dialogText) {
        dialogText.innerHTML =
            `FirstNet Bank will deposit <strong>$${amount.toFixed(2)}</strong> into your PallPay account.<br><br>` +
            `You must repay this full amount by <strong>Day ${dueDay}</strong> (${10} days from today).<br><br>` +
            `Failure to repay will result in <strong style="color:#8b0000;">account seizure and game over.</strong><br><br>` +
            `Do you wish to proceed?`;
    }

    // Store pending amount for confirm
    window._pendingLoanAmount = amount;

    // Show dialog
    const dlg = document.getElementById('loan-confirm-dialog');
    if (dlg) dlg.style.display = 'block';
}

function closeLoanDialog() {
    const dlg = document.getElementById('loan-confirm-dialog');
    if (dlg) dlg.style.display = 'none';
    window._pendingLoanAmount = null;
}

function confirmLoan() {
    // Grab amount BEFORE closing dialog (closeLoanDialog nullifies it)
    const amount = window._pendingLoanAmount;

    closeLoanDialog();

    if (!amount || amount <= 0) {
        console.warn('[Loans] confirmLoan: no pending amount', amount);
        return;
    }

    const day    = gameState.currentDay || 1;
    const dueDay = day + 10;

    // Record loan
    gameState.activeLoan = {
        amount:     amount,
        dayTaken:   day,
        dueDateDay: dueDay,
        paid:       false,
    };

    // Deposit money into PallPay (cash)
    gameState.cash = (gameState.cash || 0) + amount;
    console.log('[Loans] Cash after loan:', gameState.cash);

    // Update all cash displays
    if (typeof updateCashDisplay === 'function') updateCashDisplay();

    // Save
    if (typeof saveGame === 'function') saveGame();

    // Send email using the robust addEmailToList helper
    _sendLoanEmail(amount, dueDay);

    // Refresh the Loans tab UI
    const contentArea = document.querySelector('#pallpay-window .pp-content-area');
    if (contentArea) {
        if (typeof renderPallPaySection === 'function') {
            renderPallPaySection(contentArea, 'loans');
        }
    }

    // Play cash sound
    if (typeof playCashSound === 'function') playCashSound();
    
    window._pendingLoanAmount = null;
}

function _sendLoanEmail(amount, dueDay) {
    const mail = {
        id:          'm_loan_' + Date.now(),
        sender:      'FirstNet Bank <noreply@firstnetbank.com>',
        subject:     `Loan Approval — $${amount.toFixed(2)} Deposited`,
        date:        new Date().toLocaleDateString('es-AR'),
        body:
            `<p>Dear BlueCode_Hacker,</p>` +
            `<p>Your personal loan application has been <strong>approved and processed</strong>.</p>` +
            `<table style="border-collapse:collapse; width:100%; font-size:12px; font-family:Tahoma; margin:10px 0;">` +
            `<tr style="background:#1a3a6e; color:#fff;"><th style="padding:6px 10px; text-align:left;">Detail</th><th style="padding:6px 10px; text-align:right;">Amount</th></tr>` +
            `<tr style="background:#f0f4ff;"><td style="padding:6px 10px;">Loan Principal</td><td style="padding:6px 10px; text-align:right;"><strong>$${amount.toFixed(2)}</strong></td></tr>` +
            `<tr><td style="padding:6px 10px;">Deposited to PallPay</td><td style="padding:6px 10px; text-align:right; color:green;"><strong>$${amount.toFixed(2)}</strong></td></tr>` +
            `<tr style="background:#fff3cd;"><td style="padding:6px 10px; color:#8b0000; font-weight:bold;">Repayment Due</td><td style="padding:6px 10px; text-align:right; color:#8b0000; font-weight:bold;">Day ${dueDay}</td></tr>` +
            `</table>` +
            `<p>Please ensure the full amount of <strong>$${amount.toFixed(2)}</strong> is available in your PallPay account by <strong>Day ${dueDay}</strong>.</p>` +
            `<p style="color:#8b0000; font-weight:bold;">⚠ Failure to repay on time will result in immediate account suspension.</p>` +
            `<p>Thank you for banking with FirstNet Bank.</p>` +
            `<p style="color:#888; font-size:10px;">FirstNet Bank · Member FDIC · Est. 1984</p>`,
        read: false,
        unread: true,
        attachment: false,
    };

    // Use addEmailToList which handles render + save + notification
    if (typeof addEmailToList === 'function') {
        addEmailToList(mail);
    } else {
        // Fallback: push directly
        inboxEmails.unshift(mail);
    }
    
    if (typeof playMailSound === 'function') playMailSound();
    if (typeof renderNotificationPanel === 'function') renderNotificationPanel();
}

// ─── Repayment ────────────────────────────────────────────────────────────────

function repayLoan() {
    const loan = gameState.activeLoan;
    if (!loan || loan.paid) return;

    if ((gameState.cash || 0) < loan.amount) {
        // Not enough money
        const repayBtn = document.getElementById('btn-repay-loan');
        if (repayBtn) {
            const orig = repayBtn.textContent;
            repayBtn.textContent = `❌ Not enough cash! Need $${loan.amount.toFixed(2)}`;
            repayBtn.style.background = '#cc0000';
            setTimeout(() => {
                repayBtn.textContent = orig;
                repayBtn.style.background = '';
            }, 2000);
        }
        return;
    }

    // Deduct and mark paid
    gameState.cash -= loan.amount;
    gameState.activeLoan.paid = true;
    if (typeof updateCashDisplay === 'function') updateCashDisplay();
    if (typeof saveGame          === 'function') saveGame();

    // Send confirmation email
    _sendRepayEmail(loan.amount);

    // Play sound and refresh UI
    if (typeof playCashSound === 'function') playCashSound();
    updateLoanUI();
}

function _sendRepayEmail(amount) {
    if (typeof inboxEmails === 'undefined') return;
    const mail = {
        id:      'm_loan_repay_' + Date.now(),
        sender:  'FirstNet Bank <noreply@firstnetbank.com>',
        subject: `Loan Repayment Confirmed — $${amount.toFixed(2)}`,
        date:    new Date().toLocaleDateString('es-AR'),
        body:
            `<p>Dear BlueCode_Hacker,</p>` +
            `<p>We have received your repayment of <strong>$${amount.toFixed(2)}</strong>. Your loan has been <strong style="color:green;">fully paid off.</strong></p>` +
            `<p>Thank you for choosing FirstNet Bank. You may apply for a new loan after a 10-day cooldown period.</p>` +
            `<p style="color:#888; font-size:10px;">FirstNet Bank · Member FDIC · Est. 1984</p>`,
        read: false,
    };
    inboxEmails.unshift(mail);
    if (typeof renderInbox             === 'function') renderInbox();
    if (typeof playMailSound           === 'function') playMailSound();
    if (typeof renderNotificationPanel === 'function') renderNotificationPanel();
}

// ─── Day-Start Default Check (called from 9_daycycle.js on new day) ────────────

function checkLoanDefault() {
    const loan = gameState.activeLoan;
    if (!loan || loan.paid) return; // nothing to check

    const day = gameState.currentDay || 1;
    if (day > loan.dueDateDay) {
        // GAME OVER
        const dlg = document.getElementById('loan-gameover-dialog');
        if (dlg) dlg.style.display = 'block';
    }
}

function triggerGameOver() {
    // Reset save and reload
    localStorage.removeItem('hackOS_save');
    location.reload();
}

// ─── Expose ───────────────────────────────────────────────────────────────────
window.clampLoanAmount   = clampLoanAmount;
window.updateLoanUI      = updateLoanUI;
window.submitLoanRequest = submitLoanRequest;
window.closeLoanDialog   = closeLoanDialog;
window.confirmLoan       = confirmLoan;
window.repayLoan         = repayLoan;
window.checkLoanDefault  = checkLoanDefault;
window.triggerGameOver   = triggerGameOver;
