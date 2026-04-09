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
                    // Ensure tutorial mail eventually gets sent if they skipped it but story is 1
                    if (typeof inboxEmails !== 'undefined' && !gameState.documentsUnlocked.includes('doc-tutorial') && !inboxEmails.find(m => m.id === 'm_tutorial')) {
                        if (typeof receiveTutorialMail === 'function') setTimeout(receiveTutorialMail, 2000);
                    }
                }
            }, 800); // matches CSS transition duration
        }
    }, 3000);
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

startLoginSequence();
if (typeof loadGame === 'function') loadGame();

if (typeof gameState !== 'undefined') {
    console.log(`[HackOS] v${gameState.version} initialized. Currency: ${gameState.currency}`);
}

window.startLoginSequence = startLoginSequence;
window.showDesktop = showDesktop;
window.toggleStartMenu = toggleStartMenu;
window.closeStartMenu = closeStartMenu;
