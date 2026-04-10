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
const BASE_DATE = new Date(2001, 4, 1); // month is 0-indexed

// ─── State ─────────────────────────────────────────────────────────────────────
let dayStartTimestamp = null;
let dayCycleInterval  = null;
let isNightLocked     = false;

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getGameDate(day) {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + (day - 1));
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

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

// ─── Lobby Screen ─────────────────────────────────────────────────────────────
function showLobby() {
    const lobbyEl       = document.getElementById('lobby-screen');
    const shutdownEl    = document.getElementById('shutdown-overlay');
    const loginEl       = document.getElementById('login-screen');
    const desktopEl     = document.getElementById('xp-desktop');

    if (shutdownEl)  shutdownEl.classList.remove('active');
    if (loginEl)     { loginEl.style.display = 'none'; loginEl.classList.remove('fade-out'); }
    if (desktopEl)   desktopEl.style.display = 'none';
    if (lobbyEl)     { lobbyEl.style.display = 'flex'; lobbyEl.style.opacity = '1'; }

    updateLobbyDisplay();
}

function updateLobbyDisplay() {
    const day  = (typeof gameState !== 'undefined') ? gameState.currentDay : 1;
    const dayEl  = document.getElementById('lobby-day-text');
    const dateEl = document.getElementById('lobby-date-text');
    if (dayEl)  dayEl.textContent  = `Day ${day}`;
    if (dateEl) dateEl.textContent = getGameDate(day);
}

// ─── Power On ─────────────────────────────────────────────────────────────────
function powerOnPC() {
    const flash   = document.getElementById('power-flash');
    const lobbyEl = document.getElementById('lobby-screen');

    // Play power-on sound
    try {
        const pcOnSound = new Audio('./SFX/pcON.mp3');
        pcOnSound.volume = 0.8;
        pcOnSound.play().catch(() => {});
    } catch(_) {}

    // Flash animation
    if (flash) {
        flash.classList.add('flash-on');
        setTimeout(() => {
            flash.classList.remove('flash-on');
        }, 200);
    }

    setTimeout(() => {
        // Hide lobby
        if (lobbyEl) {
            lobbyEl.style.opacity = '0';
            setTimeout(() => { lobbyEl.style.display = 'none'; }, 800);
        }

        // Start login sequence
        const loginEl = document.getElementById('login-screen');
        if (loginEl) {
            loginEl.style.display = 'flex';
            loginEl.style.opacity = '1';
        }

        // After login completes: start day cycle
        setTimeout(() => {
            if (typeof startLoginSequence === 'function') {
                startDayAfterLogin();
            }
        }, 100);
    }, 200);
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
    const { h, m, pct } = getInGameTime();

    // Update system clock to show in-game time
    const clockEl = document.getElementById('system-clock');
    if (clockEl) clockEl.textContent = formatInGameTime(h, m);

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
