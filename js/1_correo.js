/* =============================================
   1_correo.js - Email & Story System
   ============================================= */

'use strict';

const emailsContainer = document.getElementById('emails-container');
const mailViewSender = document.getElementById('mail-view-sender');
const mailViewDate = document.getElementById('mail-view-date');
const mailViewSubject = document.getElementById('mail-view-subject');
const mailViewBody = document.getElementById('mail-view-body');
const mailViewAttachBar = document.getElementById('mail-view-attachments-bar');

var inboxEmails = [
    { id: 'm3', sender: 'Aiden', date: 'Oct 14, 2026', subject: 'When are you going to pay me back?', body: 'Man, I lent you that money a month ago. I really need it now. Dont make me come look for you. Pay up.', unread: false, attachment: false },
    { id: 'm2', sender: 'Bank of America', date: 'Oct 12, 2026', subject: 'Debts Due', body: 'Your credit card is maxed out. Immediate payment of $3,500 is required to avoid legal action.', unread: false, attachment: false },
    { id: 'm1', sender: 'Landlord', date: 'Oct 10, 2026', subject: 'Rent Due', body: 'You are two months behind on rent. Pay up this week or you are out on the street.', unread: false, attachment: false },
];

var selectedMailId = null;

function addEmailToList(email) {
    inboxEmails.unshift(email);
    // Limit to 50 emails, remove oldest
    if (inboxEmails.length > 50) {
        inboxEmails.pop();
    }
    renderInbox();
    if (typeof saveGame === 'function') saveGame();
}

function renderInbox() {
    if (!emailsContainer) return;
    emailsContainer.innerHTML = '';
    inboxEmails.forEach(mail => {
        const div = document.createElement('div');
        div.className = `email-item ${mail.unread ? 'unread' : ''} ${selectedMailId === mail.id ? 'selected' : ''}`;
        div.onclick = () => selectMail(mail.id);
        div.innerHTML = `
            <img src="assets/icon-topmail.svg" class="email-icon" alt="">
            <div class="email-content">
                <div class="email-sender">${mail.sender}</div>
                <div class="email-subject">${mail.subject}</div>
            </div>
        `;
        emailsContainer.appendChild(div);
    });
    
    // Update notifications badge
    if (typeof renderNotificationPanel === 'function') {
        renderNotificationPanel();
    }
}

function selectMail(id) {
    selectedMailId = id;
    const mail = inboxEmails.find(m => m.id === id);
    if (!mail) return;
    
    if (mail.unread) {
        mail.unread = false;
        if (typeof saveGame === 'function') saveGame();
    }
    
    if (mailViewSender) mailViewSender.textContent = mail.sender;
    if (mailViewDate) mailViewDate.textContent = mail.date;
    if (mailViewSubject) mailViewSubject.textContent = mail.subject;
    if (mailViewBody) mailViewBody.innerHTML = mail.body;
    
    if (mail.attachment) {
        if (mailViewAttachBar) {
            mailViewAttachBar.style.display = 'flex';
            const attName = document.getElementById('mail-view-attach-name');
            const attIcon = document.getElementById('mail-view-attach-icon');
            if (attName) attName.textContent = mail.attachName || 'attachment';
            if (attIcon) attIcon.src = mail.attachIcon || 'assets/icon-hackos.png';
        }
    } else {
        if (mailViewAttachBar) mailViewAttachBar.style.display = 'none';
    }
    
    renderInbox();
}

function receiveStoryMail() {
    if (gameState.storyProgress !== 0) return;
    if (inboxEmails.find(m => m.id === 'm_story')) return;
    
    playMailSound(); 
    
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>New Email</strong><br>Unknown: Need money?</div>`;
    document.body.appendChild(popup);
    
    setTimeout(() => { popup.remove(); }, 6000);
    
    addEmailToList({
        id: 'm_story', sender: 'Unknown', date: 'Now', subject: 'Need money?',
        body: "I'll make it quick, if you need money, all you need are these two apps, with your skills, I'm sure you'll figure it out in no time, just get to work.",
        unread: true, attachment: true, attachName: 'tools.exe', attachIcon: 'assets/icon-hackos.png'
    });
}

function receiveTutorialMail() {
    if (gameState.documentsUnlocked.includes('doc-tutorial')) return;
    if (inboxEmails.find(m => m.id === 'm_tutorial')) return;
    
    playMailSound(); 
    
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>New Email</strong><br>Zero: Terminal Manual</div>`;
    document.body.appendChild(popup);
    
    setTimeout(() => { popup.remove(); }, 6000);
    
    addEmailToList({
        id: 'm_tutorial', sender: 'Zero', date: 'Now', subject: 'Terminal Manual',
        body: "I heard you had a system wipe and lost your skills. I've attached your old manual. Read it, then start making money. We have a debt to clear.",
        unread: true, attachment: true, attachName: 'how_to_hack.txt', attachIcon: 'assets/icon-documents.svg'
    });
}

// ─── Attachments & Installer Logic ───────────────────────────────────────────

function simulateDocumentDownload(filename, docId, callback) {
    const popup = document.createElement('div');
    popup.className = 'mail-notification';
    popup.style.flexDirection = 'column';
    popup.style.gap = '5px';
    popup.innerHTML = `
        <div style="display:flex; gap:12px; align-items:center; width:100%;">
            <img src="assets/icon-documents.svg" width="24" height="24">
            <div style="flex:1;">
                <strong>Downloading...</strong><br>
                <span id="dl-status-${docId}" style="color:#555;">0.0 / 12.4 KB</span>
            </div>
        </div>
        <div style="width:100%; height:10px; background:#e0dfdc; border:1px solid #999; border-right-color:#fff; border-bottom-color:#fff; margin-top:2px;">
            <div id="dl-bar-${docId}" style="width:0%; height:100%; background:#2b5cd7; transition: width 0.1s linear;"></div>
        </div>
    `;
    document.body.appendChild(popup);

    let progress = 0;
    const totalSize = (Math.random() * 15 + 5).toFixed(1); 
    const bar = document.getElementById(`dl-bar-${docId}`);
    const status = document.getElementById(`dl-status-${docId}`);

    const interval = setInterval(() => {
        progress += Math.random() * 20 + 10;
        if (progress >= 100) progress = 100;
        
        if (bar) bar.style.width = `${progress}%`;
        
        const currentSize = ((progress / 100) * totalSize).toFixed(1);
        if (status) status.textContent = `${currentSize} / ${totalSize} KB`;

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                popup.style.flexDirection = '';
                popup.innerHTML = `<img src="assets/icon-documents.svg" width="24" height="24"> <div><strong>Download Complete</strong><br>${filename} saved to Documents</div>`;
                if (typeof playSuccessSound === 'function') playSuccessSound();
                callback();
                setTimeout(() => popup.remove(), 4000);
            }, 400);
        }
    }, 150);
}

const btnAttachment = document.getElementById('btn-attachment-download');
if (btnAttachment) {
    btnAttachment.addEventListener('click', () => {
        const mail = inboxEmails.find(m => m.id === selectedMailId);
        if (!mail) return;
        
        if (mail.id === 'm_story') {
            if (typeof openDesktopWindow === 'function') openDesktopWindow('installer');
            
            const pbar = document.getElementById('installer-progress-bar');
            const title = document.getElementById('installer-title');
            const text = document.getElementById('installer-text');
            
            if (title) title.textContent = 'Installing components...';
            if (text) text.textContent = 'Extracting BlueCode and DarkNet.';

            if (pbar) {
                pbar.style.width = '0%';
                pbar.style.transition = 'none';
                void pbar.offsetWidth;
                pbar.style.transition = 'width 5s linear';
                pbar.style.width = '100%';
            }
            
            setTimeout(() => {
                if (typeof closeDesktopWindow === 'function') closeDesktopWindow('installer');
                gameState.storyProgress = 1;
                if (typeof applyStoryState === 'function') applyStoryState();
                if (typeof saveGame === 'function') saveGame();
                playSuccessSound();
            }, 5100);
        } else if (mail.id === 'm_tutorial') {
            if (!gameState.documentsUnlocked.includes('doc-tutorial')) {
                simulateDocumentDownload('HOW_TO_HACK.txt', 'doc-tutorial', () => {
                    gameState.documentsUnlocked.push('doc-tutorial');
                    if (typeof saveGame === 'function') saveGame();
                    
                    if (typeof desktopWindows !== 'undefined' && desktopWindows['documents'] && desktopWindows['documents'].state !== 'hidden') {
                        if (typeof renderDocumentsList === 'function') renderDocumentsList();
                    }
                });
            } else {
                const popup = document.createElement('div');
                popup.className = 'mail-notification';
                popup.innerHTML = `<img src="assets/icon-documents.svg" width="24" height="24"> <div><strong>File Exists</strong><br>Already saved to Documents.</div>`;
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 3000);
            }
        } else if (mail.id === 'm_darknet') {
            if (!gameState.documentsUnlocked.includes('doc-onionweb')) {
                simulateDocumentDownload('OnionWeb.txt', 'doc-onionweb', () => {
                    gameState.documentsUnlocked.push('doc-onionweb');
                    if (typeof saveGame === 'function') saveGame();
                    
                    if (typeof desktopWindows !== 'undefined' && desktopWindows['documents'] && desktopWindows['documents'].state !== 'hidden') {
                        if (typeof renderDocumentsList === 'function') renderDocumentsList();
                    }
                });
            } else {
                const popup = document.createElement('div');
                popup.className = 'mail-notification';
                popup.innerHTML = `<img src="assets/icon-documents.svg" width="24" height="24"> <div><strong>File Exists</strong><br>Already saved to Documents.</div>`;
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 3000);
            }
        }
    });
}

function receiveDarkNetMail() {
    if (gameState.darknetOpened) return; // Only trigger once
    gameState.darknetOpened = true;
    if (typeof saveGame === 'function') saveGame();

    if (inboxEmails.find(m => m.id === 'm_darknet')) return;
    
    // Simulate delay before email arrives so user is looking at darknet
    setTimeout(() => {
        playMailSound(); 
        
        const popup = document.createElement('div');
        popup.className = 'mail-notification';
        popup.innerHTML = `<img src="assets/icon-topmail.svg" width="24" height="24"> <div><strong>New Email</strong><br>Unknown: The Net that must not be named</div>`;
        document.body.appendChild(popup);
        
        setTimeout(() => { popup.remove(); }, 6000);
        
        addEmailToList({
            id: 'm_darknet', sender: 'Unknown', date: 'Now', subject: 'The Net that must not be named',
            body: "I noticed you turned on Dark Net. You are going to need this if you want to clean your money.\n\nOpen the attached file and put its contents in the search bar. Do not lose it.",
            unread: true, attachment: true, attachName: 'OnionWeb.txt', attachIcon: 'assets/icon-documents.svg'
        });
    }, 2000);
}

