/* =============================================
   8_bluemium.js - Bluemium Browser Logic
   ============================================= */

'use strict';

// ─── Browser State ───────────────────────────────────────────────────────────
var browserCurrentPage = 'newtab';
var browserHistory     = ['newtab'];
var browserHistoryIdx  = 0;

// ─── Page Registry ───────────────────────────────────────────────────────────
const browserPages = {
    newtab: {
        url:   'bluemium://newtab',
        title: 'New Tab — Bluemium',
        el:    'browser-page-newtab',
    },
    shop: {
        url:   'www.techcore-shop.com/components',
        title: 'TechCore PC Parts Shop',
        el:    'browser-page-shop',
    },
    page404: {
        url:   '', // dynamic
        title: '404 Not Found',
        el:    'browser-page-404',
    },
    spoofed: {
        url:   'bluemium://connection-error',
        title: 'Connection Refused',
        el:    'browser-page-spoofed',
    }
};

// ─── Navigation Helpers ──────────────────────────────────────────────────────

function browserNavigateTo(pageId) {
    if (typeof gameState !== 'undefined' && gameState.isIPActive && pageId !== 'spoofed') {
        pageId = 'spoofed';
    }
    const page = browserPages[pageId];
    if (!page) return;

    // Hide all pages
    document.querySelectorAll('.browser-page').forEach(el => {
        el.style.display = 'none';
    });

    // Show target page
    const targetEl = document.getElementById(page.el);
    if (targetEl) targetEl.style.display = 'flex';

    // Update URL bar
    const urlInput = document.getElementById('bluemium-url-input');
    if (urlInput) urlInput.value = page.url;

    // Update status bar
    const statusEl = document.getElementById('bluemium-status-text');
    if (statusEl) statusEl.textContent = 'Done';

    browserCurrentPage = pageId;

    // Update nav buttons
    const backBtn    = document.getElementById('btn-browser-back');
    const fwdBtn     = document.getElementById('btn-browser-forward');
    if (backBtn)    backBtn.disabled    = (browserHistoryIdx <= 0);
    if (fwdBtn)     fwdBtn.disabled     = (browserHistoryIdx >= browserHistory.length - 1);
}

function browserShowLoading(pageName) {
    const statusEl  = document.getElementById('bluemium-status-text');
    const loadingEl = document.getElementById('browser-loading-icon');
    if (statusEl)  statusEl.textContent = `Loading ${pageName}...`;
    if (loadingEl) loadingEl.classList.add('loading');
    setTimeout(() => {
        if (loadingEl) loadingEl.classList.remove('loading');
    }, 700);
}

function browserPushHistory(pageId) {
    // Truncate forward history
    browserHistory = browserHistory.slice(0, browserHistoryIdx + 1);
    browserHistory.push(pageId);
    browserHistoryIdx = browserHistory.length - 1;
}

// ─── Public Navigation Functions (called from HTML) ──────────────────────────

function browserOpenShop() {
    browserShowLoading('TechCore');
    browserPushHistory('shop');
    setTimeout(() => browserNavigateTo('shop'), 500);
}

function browserGoHome() {
    browserShowLoading('New Tab');
    browserPushHistory('newtab');
    setTimeout(() => browserNavigateTo('newtab'), 300);
}

function browserGoBack() {
    if (browserHistoryIdx <= 0) return;
    browserHistoryIdx--;
    const pageId = browserHistory[browserHistoryIdx];
    browserShowLoading('');
    setTimeout(() => browserNavigateTo(pageId), 300);
}

function browserGoForward() {
    if (browserHistoryIdx >= browserHistory.length - 1) return;
    browserHistoryIdx++;
    const pageId = browserHistory[browserHistoryIdx];
    browserShowLoading('');
    setTimeout(() => browserNavigateTo(pageId), 300);
}

function browserRefresh() {
    browserShowLoading('');
    setTimeout(() => {
        const urlInput = document.getElementById('bluemium-url-input');
        if (urlInput && urlInput.value) {
            browserNavigate(true);
        } else {
            browserNavigateTo(browserCurrentPage);
        }
    }, 500);
}

function browserNavigate(isRefresh = false) {
    const urlInput = document.getElementById('bluemium-url-input');
    if (!urlInput) return;
    
    let targetUrl = urlInput.value.trim().toLowerCase();
    
    // Auto-prepend www. if they just typed techcore... etc.
    if (!targetUrl.startsWith('www.') && !targetUrl.startsWith('bluemium://') && targetUrl.includes('.')) {
        // Just optional UX logic, leave as is since user wants exactly what they type.
    }

    if (targetUrl === '') {
        browserGoHome();
        return;
    }

    // Find if the URL matches any of our registered pages
    let foundPageId = null;
    for (const [id, page] of Object.entries(browserPages)) {
        if (id === 'page404') continue; 
        if (page.url.toLowerCase() === targetUrl) {
            foundPageId = id;
            break;
        }
    }

    // Default to 404 if not found
    if (!foundPageId) {
        foundPageId = 'page404';
        browserPages['page404'].url = urlInput.value; // keep what they typed
    }

    browserShowLoading(foundPageId === 'page404' ? 'Site' : targetUrl);
    
    if (!isRefresh && foundPageId !== browserCurrentPage) {
        browserPushHistory(foundPageId);
    }
    
    setTimeout(() => browserNavigateTo(foundPageId), 500);
}

function getComponentCost(key) {
    const part = gameState.pcParts[key];
    if (!part) return 0;
    
    // En lugar de una curva exponencial (Math.pow), usamos una polinomial (^1.5)
    // Esto asegura que el precio suba progresivamente, pero sin volverse "imposible"
    // ya que la recolección de Hash del jugador crece de forma lineal.
    const scalingFactor = part.multiplier - 1; // ej: 1.30 pasa a ser 0.30
    return part.basePrice * (1 + scalingFactor * Math.pow(part.level, 1.5));
}

function renderShop() {
    if (!gameState.pcParts) return;

    for (let key in gameState.pcParts) {
        const part = gameState.pcParts[key];
        const cost = getComponentCost(key);
        
        const priceEl = document.getElementById(`shop-price-${key}`);
        const btnEl = document.getElementById(`btn-buy-${key}`);
        const nameEl = document.getElementById(`shop-name-${key}`);

        if (priceEl) {
            priceEl.textContent = cost.toFixed(2);
        }
        
        if (btnEl) {
            btnEl.textContent = `Buy ${part.name} Level ${part.level + 1}`;
            // If they don't have enough money, maybe grey it out? We can just do that on click though.
        }

        // Just as an extra visual touch, we could append [Lvl X] to the name:
        if (nameEl) {
            // Remove previous level text if any:
            let baseName = nameEl.getAttribute('data-basename');
            if (!baseName) {
                baseName = nameEl.textContent;
                nameEl.setAttribute('data-basename', baseName);
            }
            nameEl.textContent = `${baseName} [Lvl ${part.level}]`;
        }
    }
}

function buyComponent(key) {
    const part = gameState.pcParts[key];
    if (!part) return;

    if (key !== 'case') {
        const caseLevel = gameState.pcParts.case ? gameState.pcParts.case.level : 0;
        const maxLevel = 5 + (caseLevel * 5);
        if (part.level >= maxLevel) {
            const btnEl = document.getElementById(`btn-buy-${key}`);
            if (btnEl) {
                const originalText = btnEl.textContent;
                btnEl.textContent = "Upgrade Gabinete first";
                btnEl.style.background = "#d33c3c";
                setTimeout(() => {
                    btnEl.style.background = "";
                    btnEl.textContent = originalText;
                }, 1500);
            }
            return;
        }
    }

    const cost = getComponentCost(key);
    
    if (gameState.cash >= cost) {
        // Successful purchase
        gameState.cash -= cost;
        part.level++;
        
        playCashSound();
        if (typeof updateCashDisplay === 'function') updateCashDisplay();
        
        // Render updated shop prices
        renderShop();
        
        // Save state
        if (typeof saveGame === 'function') saveGame();

        // Show a temporary success style on the button
        const btnEl = document.getElementById(`btn-buy-${key}`);
        if (btnEl) {
            const originalText = btnEl.textContent;
            btnEl.textContent = "Purchased!";
            btnEl.style.background = "#28a745"; // green
            setTimeout(() => {
                btnEl.style.background = ""; // restore css hover
                renderShop();
            }, 1500);
        }
    } else {
        // Not enough money
        const btnEl = document.getElementById(`btn-buy-${key}`);
        if (btnEl) {
            const originalText = btnEl.textContent;
            btnEl.textContent = "Not Enough Cash";
            btnEl.style.background = "#555";
            setTimeout(() => {
                btnEl.style.background = "";
                btnEl.textContent = originalText;
            }, 1000);
        }
    }
}

// ─── Initialize new tab on first navigation ───────────────────────────────────
// Called from 4_desktop.js when the browser opens, or on page load.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        browserNavigateTo('newtab');
        renderShop();
    });
} else {
    browserNavigateTo('newtab');
    renderShop();
}
