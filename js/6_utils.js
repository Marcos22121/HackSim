/* =============================================
   6_utils.js - Utilities & Preview Animations
   ============================================= */

'use strict';

// ─── Utility Functions ────────────────────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomIP()     { return `${rand(1,254)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`; }
function randomPort()   { return [21,22,23,25,80,443,3306,5432,6379,8080,8443][rand(0,10)]; }
function randomHex(n)   { return [...Array(n)].map(() => Math.floor(Math.random()*16).toString(16)).join(''); }
function randomHash()   { return randomHex(64); }
function randomAddr()   { return randomHex(8).toUpperCase(); }
function randomResult() { return Math.random() > 0.25 ? 'SUCCESS' : 'FAILED'; }
function randomCVE()    { return `${rand(2018,2025)}-${rand(1000,99999)}`; }
function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ─── Mini Terminal Preview Animation ─────────────
const previewOutput  = document.getElementById('preview-output');
const PREVIEW_MAX    = 8;
const previewLines = [
    '> root.hack.id.843',
    '> ssh root@10.0.0.1',
    '> nmap -sV target',
    '> exploit.run',
    '> bypass.fw 443',
    '> inject.payload',
    '> trace --off',
    '> cat /etc/passwd',
    '> hashcat --mode=2',
    '> wget cdn.x/sh',
    '> chmod 777 run.sh',
    '> crack hash a3f9',
];

let previewIdx = 0;

function addPreviewLine() {
    if (!previewOutput) return;
    const line = document.createElement('div');
    line.className   = 'preview-line';
    line.textContent = previewLines[previewIdx % previewLines.length];
    previewIdx++;
    previewOutput.appendChild(line);
    while (previewOutput.childElementCount > PREVIEW_MAX) {
        previewOutput.removeChild(previewOutput.firstChild);
    }
}

// ─── Mini Decodify Preview Animation ──────────────────
const decodifyHexOutput = document.getElementById('decodify-hex-output');
const DECODIFY_MAX_LINES = 10;
let decodifyOffset = 0x0000;

function addDecodifyHexLine() {
    if (!decodifyHexOutput) return; 

    const line = document.createElement('div');
    line.className = 'hex-line';
    
    // Generate an offset like 0x00A0
    const offsetStr = '0x' + decodifyOffset.toString(16).toUpperCase().padStart(4, '0');
    decodifyOffset += 8;
    if (decodifyOffset > 0xFFFF) decodifyOffset = 0;
    
    // Generate 4 blocks of 2 random hex chars
    let dataStr = '';
    for(let i = 0; i < 4; i++) {
        dataStr += randomHex(2).toUpperCase() + ' ';
    }
    
    line.innerHTML = `<span class="offset">${offsetStr}</span><span class="data">${dataStr}</span>`;
    
    decodifyHexOutput.appendChild(line);
    while (decodifyHexOutput.childElementCount > DECODIFY_MAX_LINES) {
        decodifyHexOutput.removeChild(decodifyHexOutput.firstChild);
    }
}

// Export to window for global access
window.rand = rand;
window.randomIP = randomIP;
window.randomPort = randomPort;
window.randomHex = randomHex;
window.randomHash = randomHash;
window.randomAddr = randomAddr;
window.randomResult = randomResult;
window.randomCVE = randomCVE;
window.randomUUID = randomUUID;

// Start simple previews
if (previewOutput) {
    for (let i = 0; i < 4; i++) addPreviewLine();
    setInterval(addPreviewLine, 1400);
}
if (decodifyHexOutput) {
    for (let i = 0; i < DECODIFY_MAX_LINES; i++) addDecodifyHexLine();
    setInterval(addDecodifyHexLine, 120);
}
