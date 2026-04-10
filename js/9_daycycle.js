/* =============================================
   9_daycycle.js - Day System & In-Game Clock
   ============================================= */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
const REAL_DAY_MS        = 15 * 60 * 1000;   // 15 real minutes per day
const INGAME_START_HOUR  = 6;                  // 06:00 AM
const INGAME_END_HOUR    = 23;                 // 11:00 PM
const INGAME_HOURS_TOTAL = INGAME_END_HOUR - INGAME_START_HOUR; // 17 hours

// Base date: May 1st, 2001
const BASE_DATE = new Date(2001, 4, 1); // month is 0-indexed (actual day: Tuesday)

const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── State ─────────────────────────────────────────────────────────────────────
let dayStartTimestamp = null;
let dayCycleInterval  = null;
let isNightLocked     = false;

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getGameDateObj(day) {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + (day - 1));
    return d;
}

// Long format for whiteboard: "1 of May, 2001"
function getGameDate(day) {
    const d = getGameDateObj(day);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${d.getDate()} of ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

// Short XP tray format: "Tue 1 May (Day 1)"
function getInGameDateStr(day) {
    const d   = getGameDateObj(day);
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} (Day ${day})`;
}

// Exposed globally for emails, receipts, etc.
window.getInGameDateStr = getInGameDateStr;

function getInGameTime() {
    if (!dayStartTimestamp) return { h: INGAME_START_HOUR, m: 0, pct: 0 };
    const elapsed = Date.now() - dayStartTimestamp;
    const pct     = Math.min(elapsed / REAL_DAY_MS, 1);
    const totalMinutes = Math.floor(pct * INGAME_HOURS_TOTAL * 60);
    const h = INGAME_START_HOUR + Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { h, m, pct };
}

function formatInGameTime(h, m) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}


// ─── Transition Screen (New) ──────────────────────────────────────────────────
let pcTurningOnAudio = null;

function startDayTransition() {
    const bootScreen = document.getElementById('boot-screen');
    const bootTextContainer = document.getElementById('boot-text-container');
    const bootDayText = document.getElementById('boot-day-text');
    const bootDateText = document.getElementById('boot-date-text');
    const shutdownEl = document.getElementById('shutdown-overlay');
    const loginEl = document.getElementById('login-screen');
    const desktopEl = document.getElementById('xp-desktop');

    // Reset everything
    if (shutdownEl) shutdownEl.classList.remove('active');
    if (loginEl) { loginEl.style.display = 'none'; loginEl.style.opacity = '0'; }
    if (desktopEl) desktopEl.style.display = 'none';

    // Show black screen
    if (bootScreen) {
        bootScreen.classList.remove('fade-out');
        bootScreen.classList.add('active');
    }
    if (bootTextContainer) bootTextContainer.classList.remove('show');

    const day = (typeof gameState !== 'undefined') ? gameState.currentDay : 1;
    if (bootDayText) bootDayText.textContent = `Day ${day}`;
    if (bootDateText) bootDateText.textContent = getGameDate(day);

    // Sequence
    setTimeout(() => {
        // 2s after shutdown -> pcON
        const pcOnSound = new Audio('./SFX/pcON.mp3');
        pcOnSound.volume = 0.6;
        pcOnSound.play().catch(() => {
            // If blocked, we'll try to play it later or wait for interaction
        });

        // Shortly after -> pcTurningOn
        setTimeout(() => {
            if (!pcTurningOnAudio) {
                pcTurningOnAudio = new Audio('./SFX/pcTurningOn.mp3');
                pcTurningOnAudio.volume = 0.5;
                pcTurningOnAudio.loop = true;
            }
            pcTurningOnAudio.play().catch(() => {});
            
            // Show text when turning on starts
            if (bootTextContainer) bootTextContainer.classList.add('show');

            // Stay on black screen with text for 4 seconds
            setTimeout(() => {
                // Prepare login screen BEHIND the boot screen
                if (loginEl) {
                    loginEl.style.display = 'flex';
                    loginEl.style.opacity = '1';
                    loginEl.classList.remove('fade-out');
                    loginEl.classList.remove('fade-in'); // We'll reveal it via boot screen fade out
                }

                // Smoothly fade out the black boot screen to reveal login screen
                if (bootScreen) {
                    bootScreen.style.transition = "opacity 2s ease-in-out";
                    bootScreen.classList.add('fade-out');
                }
                
                setTimeout(() => {
                    if (bootScreen) bootScreen.classList.remove('active');
                    
                    // Start login sequence (which handles the desktop transition)
                    setTimeout(() => {
                        if (typeof startLoginSequence === 'function') {
                            startDayAfterLogin();
                        }
                        
                        // Stop pcTurningOn 1s after login starts
                        setTimeout(() => {
                            if (pcTurningOnAudio) {
                                let fadeInterval = setInterval(() => {
                                    if (pcTurningOnAudio.volume > 0.05) {
                                        pcTurningOnAudio.volume -= 0.05;
                                    } else {
                                        pcTurningOnAudio.pause();
                                        pcTurningOnAudio = null;
                                        clearInterval(fadeInterval);
                                    }
                                }, 100);
                            }
                        }, 1000);

                    }, 100);
                }, 2000); // Wait for the 2s fade out

            }, 4000);

        }, 500);

    }, 2000);
}

function showLobby() {
    // Repurposed to use the new transition
    startDayTransition();
}

// ─── Power On ─────────────────────────────────────────────────────────────────
function powerOnPC() {
    startDayTransition();
}

function startDayAfterLogin() {
    // Trigger the existing login sequence (which shows the desktop)
    if (typeof startLoginSequence === 'function') startLoginSequence();

    // Start the day clock after login animation (3s + 800ms fade = ~4s)
    setTimeout(() => {
        startDayCycle();

        // Check for loan default FIRST (before rent, before anything)
        if (typeof checkLoanDefault === 'function') checkLoanDefault();

        // Check for rent email 2 seconds after desktop appears
        setTimeout(() => {
            if (typeof checkAndSendRentEmail === 'function') checkAndSendRentEmail();
        }, 2000);
    }, 4000);
}

// ─── Day Cycle ────────────────────────────────────────────────────────────────
function startDayCycle() {
    stopDayCycle();
    isNightLocked    = false;
    dayStartTimestamp = Date.now();

    // Update clock immediately
    tickDayCycle();

    // Tick every 5 real seconds
    dayCycleInterval = setInterval(tickDayCycle, 5000);
}

function stopDayCycle() {
    if (dayCycleInterval) {
        clearInterval(dayCycleInterval);
        dayCycleInterval = null;
    }
}

function tickDayCycle() {
    const { h, m } = getInGameTime();
    const day = (typeof gameState !== 'undefined') ? (gameState.currentDay || 1) : 1;

    // Update system clock
    const clockEl = document.getElementById('system-clock');
    if (clockEl) clockEl.textContent = formatInGameTime(h, m);

    // Update system date label
    const dateEl = document.getElementById('system-date');
    if (dateEl) dateEl.textContent = getInGameDateStr(day);

    // Check for end of day
    if (h >= INGAME_END_HOUR && !isNightLocked) {
        triggerEndOfDay();
    }
}

// ─── End of Day ───────────────────────────────────────────────────────────────
function triggerEndOfDay() {
    isNightLocked = true;
    stopDayCycle();

    // Freeze clock at 23:00
    const clockEl = document.getElementById('system-clock');
    if (clockEl) clockEl.textContent = '23:00';

    // Show banner
    const banner = document.getElementById('day-end-banner');
    if (banner) banner.classList.add('visible');

    // Show turn-off button
    const turnOffBtn = document.getElementById('btn-turn-off-pc');
    if (turnOffBtn) turnOffBtn.classList.add('visible');

    // Disable illegal apps
    lockIllegalApps();

    // Close currently open illegal windows
    closeIllegalWindows();
}

// ─── App Locking ──────────────────────────────────────────────────────────────
const ILLEGAL_APPS     = ['hackos', 'darknet', 'decodify', 'onionweb'];
const SAFE_APPS        = ['topmail', 'documents', 'bluemium', 'pallpay'];

function lockIllegalApps() {
    // Disable desktop icons for illegal apps
    const illegalIconMap = {
        hackos:   'icon-hackos',
        darknet:  'icon-darknet',
    };

    for (const [app, iconId] of Object.entries(illegalIconMap)) {
        const icon = document.getElementById(iconId);
        if (icon) {
            icon.style.opacity = '0.35';
            icon.style.pointerEvents = 'none';
            icon.title = 'Offline – servers restore at 6:00 AM';
        }
    }

    // Disable taskbar open buttons inside HackOS
    const btnTerminal = document.getElementById('btn-open-terminal');
    const btnDecodify = document.getElementById('btn-open-decodify');
    const btnLaunder  = document.getElementById('btn-open-launder');

    if (btnTerminal) { btnTerminal.disabled = true; btnTerminal.title = 'Offline'; }
    if (btnDecodify) { btnDecodify.disabled = true; btnDecodify.title = 'Offline'; }
    if (btnLaunder)  { btnLaunder.disabled  = true; btnLaunder.title  = 'Offline'; }
}

function unlockAllApps() {
    const illegalIconMap = {
        hackos:  'icon-hackos',
        darknet: 'icon-darknet',
    };

    for (const [, iconId] of Object.entries(illegalIconMap)) {
        const icon = document.getElementById(iconId);
        if (icon) {
            icon.style.opacity = '';
            icon.style.pointerEvents = '';
            icon.title = '';
        }
    }

    const btnTerminal = document.getElementById('btn-open-terminal');
    const btnDecodify = document.getElementById('btn-open-decodify');
    const btnLaunder  = document.getElementById('btn-open-launder');

    if (btnTerminal) { btnTerminal.disabled = false; btnTerminal.title = ''; }
    if (btnDecodify) { btnDecodify.disabled = false; btnDecodify.title = ''; }
    if (btnLaunder)  { btnLaunder.disabled  = false; btnLaunder.title  = ''; }
}

function closeIllegalWindows() {
    ILLEGAL_APPS.forEach(appId => {
        if (typeof closeDesktopWindow === 'function') {
            closeDesktopWindow(appId);
        }
    });
}

// ─── Shutdown PC ──────────────────────────────────────────────────────────────
function shutdownPC() {
    const shutdownEl = document.getElementById('shutdown-overlay');
    const desktopEl  = document.getElementById('xp-desktop');
    const banner     = document.getElementById('day-end-banner');
    const turnOffBtn = document.getElementById('btn-turn-off-pc');

    // Hide banner/btn
    if (banner)     banner.classList.remove('visible');
    if (turnOffBtn) turnOffBtn.classList.remove('visible');

    // Show shutdown overlay
    if (shutdownEl) shutdownEl.classList.add('active');

    // After 3 seconds, advance day and show lobby
    setTimeout(() => {
        // Advance day
        if (typeof gameState !== 'undefined') {
            gameState.currentDay = (gameState.currentDay || 1) + 1;
            if (typeof saveGame === 'function') saveGame();
        }

        // Hide desktop
        if (desktopEl) desktopEl.style.display = 'none';

        // Reset illegal apps locks visually for next session
        unlockAllApps();

        // Reset clock
        const clockEl = document.getElementById('system-clock');
        if (clockEl) clockEl.textContent = '06:00';

        // Show lobby with updated day
        showLobby();

    }, 3200);
}

// ─── Global Exports ───────────────────────────────────────────────────────────
window.powerOnPC    = powerOnPC;
window.shutdownPC   = shutdownPC;
window.showLobby    = showLobby;
window.startDayCycle = startDayCycle;
