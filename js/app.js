// API Base URL - automatically detect if running locally or on EB
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// DOM Elements
const resumeInput = document.getElementById('resumeInput');
const resumeZone = document.getElementById('resumeZone');
const resumeFileInfo = document.getElementById('resumeFileInfo');
const resumeFileName = document.getElementById('resumeFileName');
const removeResume = document.getElementById('removeResume');
const jobDescription = document.getElementById('jobDescription');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const scoreDisplay = document.getElementById('scoreDisplay');

let selectedFile = null;
let currentResumeId = null;

// File upload handling
resumeInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

// Drag and drop
resumeZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    resumeZone.classList.add('dragover');
});

resumeZone.addEventListener('dragleave', () => {
    resumeZone.classList.remove('dragover');
});

resumeZone.addEventListener('drop', (e) => {
    e.preventDefault();
    resumeZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

async function handleFileSelect(file) {
    const validTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file.');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
    }

    selectedFile = file;
    resumeFileName.textContent = 'Uploading...';
    resumeFileInfo.classList.add('show');

    // Upload to server
    try {
        const formData = new FormData();
        formData.append('resume', file);

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            currentResumeId = data.resumeId;
            resumeFileName.textContent = file.name;
            checkFormValidity();
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        alert('Failed to upload resume: ' + error.message);
        resetFileUpload();
    }
}

function resetFileUpload() {
    selectedFile = null;
    currentResumeId = null;
    resumeInput.value = '';
    resumeFileInfo.classList.remove('show');
    checkFormValidity();
}

removeResume.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileUpload();
});

// Job description input
jobDescription.addEventListener('input', checkFormValidity);

function checkFormValidity() {
    const isValid = currentResumeId && jobDescription.value.trim().length > 0;
    analyzeBtn.disabled = !isValid;
}

// Analyze button click
analyzeBtn.addEventListener('click', async () => {
    if (!currentResumeId || !jobDescription.value.trim()) return;

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
        </svg>
        Analyzing...
    `;

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeId: currentResumeId,
                jobDescription: jobDescription.value.trim()
            })
        });

        const data = await response.json();

        if (data.success) {
            scoreDisplay.textContent = data.score + '%';
            resultSection.classList.add('show');
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (error) {
        alert('Failed to analyze: ' + error.message);
    } finally {
        analyzeBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Analyze Match
        `;
        analyzeBtn.disabled = false;
    }
});
