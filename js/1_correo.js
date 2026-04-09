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
    
    playSuccessSound(); 
    
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
    
    playSuccessSound(); 
    
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
const btnAttachment = document.getElementById('btn-attachment-download');
if (btnAttachment) {
    btnAttachment.addEventListener('click', () => {
        const mail = inboxEmails.find(m => m.id === selectedMailId);
        if (!mail) return;
        
        if (mail.id === 'm_story') {
            if (typeof openDesktopWindow === 'function') openDesktopWindow('installer');
            
            const pbar = document.getElementById('installer-progress-bar');
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
                gameState.documentsUnlocked.push('doc-tutorial');
                if (typeof saveGame === 'function') saveGame();
                playSuccessSound();
                
                const popup = document.createElement('div');
                popup.className = 'mail-notification';
                popup.innerHTML = `<img src="assets/icon-documents.svg" width="24" height="24"> <div><strong>Download Complete</strong><br>HOW_TO_HACK.txt saved to Documents</div>`;
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 4000);
                
                if (typeof desktopWindows !== 'undefined' && desktopWindows['documents'] && desktopWindows['documents'].state !== 'hidden') {
                    if (typeof renderDocumentsList === 'function') renderDocumentsList();
                }
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
