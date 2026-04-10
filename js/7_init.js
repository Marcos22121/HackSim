/* =============================================
   7_init.js - Initialization & Login Sequence
   ============================================= */

'use strict';

function startLoginSequence() {
    // Show login screen for ~3 seconds, then transition to desktop
    setTimeout(() => {
        if (loginScreen) {
            loginScreen.classList.add('fade-out');

            setTimeout(() => {
                loginScreen.style.display = 'none';
                if (xpDesktop) xpDesktop.style.display = 'flex';
                // Try to play startup sound
                try {
                    const startupSound = new Audio('./SFX/startup.mp3');
                    startupSound.volume = 0.5;
                    startupSound.play().catch(() => {});
                } catch (_) {}
                
                // Queue emails if starting fresh
                if (typeof gameState !== 'undefined' && gameState.storyProgress === 0) {
                    if (typeof receiveStoryMail === 'function') setTimeout(receiveStoryMail, 4000); 
                    if (typeof receiveTutorialMail === 'function') setTimeout(receiveTutorialMail, 7000); 
                } else if (typeof gameState !== 'undefined') {
                    if (typeof inboxEmails !== 'undefined' && !gameState.documentsUnlocked.includes('doc-tutorial') && !inboxEmails.find(m => m.id === 'm_tutorial')) {
                        if (typeof receiveTutorialMail === 'function') setTimeout(receiveTutorialMail, 2000);
                    }
                }
            }, 800);
        }
    }, 3000);
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

// Load saved data first
if (typeof loadGame === 'function') loadGame();

// Check Main Menu before starting
if (!sessionStorage.getItem('mainMenuShown')) {
    const mmOverlay = document.getElementById('main-menu-overlay');
    if (mmOverlay) {
        mmOverlay.style.display = 'flex';
        
        const btnPlay = document.getElementById('btn-mm-play');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                sessionStorage.setItem('mainMenuShown', 'true');
                mmOverlay.style.display = 'none';
                
                // Play sound for opening/start if desired (optional)
                
                // Now proceed with normal start
                if (typeof showLobby === 'function') {
                    showLobby();
                } else {
                    startLoginSequence();
                }
            });
        }
    }
} else {
    // Start at lobby (not auto-login) normally
    if (typeof showLobby === 'function') {
        showLobby();
    } else {
        // Fallback: auto-start login if daycycle not loaded
        startLoginSequence();
    }
}

if (typeof gameState !== 'undefined') {
    console.log(`[HackOS] v${gameState.version} Day ${gameState.currentDay} initialized.`);
}

window.startLoginSequence = startLoginSequence;
window.showDesktop = showDesktop;
window.toggleStartMenu = toggleStartMenu;
window.closeStartMenu = closeStartMenu;

window.openMainMenuModal = function(id) {
    const el = document.getElementById(id);
    const blocker = document.getElementById('mm-blocker');
    if (blocker) blocker.style.display = 'block';
    if (el) el.style.display = 'block';
}

window.closeMainMenuModal = function(id) {
    const el = document.getElementById(id);
    const blocker = document.getElementById('mm-blocker');
    if (blocker) blocker.style.display = 'none';
    if (el) el.style.display = 'none';
}

window.openMainMenuSettings = function() {
    const blocker = document.getElementById('mm-blocker');
    if (blocker) blocker.style.display = 'block';
    const sw = document.getElementById('settings-window');
    if (sw) {
        sw.style.top = '50%';
        sw.style.left = '50%';
        sw.style.transform = 'translate(-50%, -50%)';
        sw.style.zIndex = '1000000';
        sw.style.display = 'flex';
        sw.style.position = 'fixed';
    }
}

window.closeMainMenuSettings = function() {
    const blocker = document.getElementById('mm-blocker');
    if (blocker) blocker.style.display = 'none';
    const sw = document.getElementById('settings-window');
    if (sw) sw.style.display = 'none';
}

window.openProfileManager = function() {
    const dialog = document.getElementById('mm-profile-dialog');
    const list = document.getElementById('mm-profiles-list');
    if (!dialog || !list) return;

    list.innerHTML = '';

    for (let i = 1; i <= 3; i++) {
        let rawData = localStorage.getItem(`hackOS_save_${i}`);
        if (!rawData && i === 1) {
            rawData = localStorage.getItem('hackOS_save'); // legacy fallback
        }

        let isCurrent = (window.CURRENT_SAVE_SLOT === i);
        let profileHtml = '';

        if (rawData) {
            try {
                const data = JSON.parse(rawData);
                const day = data?.gameState?.currentDay || 1;
                const cash = data?.gameState?.cash || 0;
                profileHtml = `
                    <div style="font-weight:bold; font-size:14px; color:#fff; text-shadow:1px 1px #003399;">Profile ${i} ${isCurrent ? '(Active)' : ''}</div>
                    <div style="font-size:11px; color:#cce0ff;">Day ${day} — Bank: $${parseFloat(cash).toFixed(2)}</div>
                `;
            } catch (e) {
                profileHtml = `
                    <div style="font-weight:bold; font-size:14px; color:#fff; text-shadow:1px 1px #003399;">Profile ${i} ${isCurrent ? '(Active)' : ''}</div>
                    <div style="font-size:11px; color:#ffcccc;">[Corrupted Data]</div>
                `;
            }
        } else {
            profileHtml = `
                <div style="font-weight:bold; font-size:14px; color:#fff; text-shadow:1px 1px #003399;">Profile ${i} ${isCurrent ? '(Active)' : ''}</div>
                <div style="font-size:11px; color:#cce0ff;">[ Empty Slot ]</div>
            `;
        }

        const item = document.createElement('div');
        item.style.cssText = `display:flex; align-items:center; background:${isCurrent ? '#4060b0' : '#4a75d1'}; border:1px solid ${isCurrent ? '#fff' : '#3a68ce'}; padding:10px; cursor:pointer; border-radius:3px; transition:background 0.1s;`;
        
        item.onmouseenter = () => { if(!isCurrent) item.style.backgroundColor = '#5382e8'; };
        item.onmouseleave = () => { if(!isCurrent) item.style.backgroundColor = '#4a75d1'; };
        
        item.innerHTML = `
            <img src="assets/icon-hackos.png" width="40" style="margin-right:12px; filter:${rawData ? 'none' : 'grayscale(1)'}; border-radius:5px; border:2px solid ${isCurrent ? '#fff' : 'transparent'};">
            <div style="flex:1;">${profileHtml}</div>
            <button style="min-width:60px; font-size:11px; font-family:'Tahoma'; color:#333; cursor:pointer;">${isCurrent ? 'Current' : 'Select'}</button>
        `;

        item.onclick = () => {
            if (!isCurrent) {
                window.CURRENT_SAVE_SLOT = i;
                if (typeof loadGame === 'function') loadGame();
                
                // Visual feedback inside Main Menu
                const sysInfoText = document.querySelector('.main-menu-window .status-bar-field');
                if (sysInfoText) sysInfoText.textContent = `Profile ${i} Ready`;

                if (typeof updateMainMenuSystemInfo === 'function') updateMainMenuSystemInfo();

                dialog.style.display = 'none';
                const blocker = document.getElementById('mm-blocker');
                if (blocker) blocker.style.display = 'none';
            }
        };

        list.appendChild(item);
    }
    const blocker = document.getElementById('mm-blocker');
    if (blocker) blocker.style.display = 'block';
    dialog.style.display = 'block';
};

window.updateMainMenuSystemInfo = function() {
    const slot = window.CURRENT_SAVE_SLOT;
    let rawData = localStorage.getItem(`hackOS_save_${slot}`);
    if (!rawData && slot === 1) {
        rawData = localStorage.getItem('hackOS_save');
    }

    const spanProfile = document.getElementById('mm-info-profile');
    const spanDay = document.getElementById('mm-info-day');
    const spanBank = document.getElementById('mm-info-bank');

    if (spanProfile) spanProfile.textContent = `Profile ${slot}`;
    
    if (rawData) {
        try {
            const data = JSON.parse(rawData);
            const day = data?.gameState?.currentDay || 1;
            const cash = data?.gameState?.cash || 0;
            if (spanDay) spanDay.textContent = `${day}`;
            if (spanBank) spanBank.textContent = `$${parseFloat(cash).toFixed(2)}`;
        } catch(e) {
            if (spanDay) spanDay.textContent = `Corrupted`;
            if (spanBank) spanBank.textContent = `---`;
        }
    } else {
        if (spanDay) spanDay.textContent = `1 (New Game)`;
        if (spanBank) spanBank.textContent = `$0.00`;
    }
};

// Initialize system info on load
if (typeof updateMainMenuSystemInfo === 'function') {
    updateMainMenuSystemInfo();
}

