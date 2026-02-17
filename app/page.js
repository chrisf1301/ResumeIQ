'use client';

'use client';

import { useState } from 'react';

export default function Home() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentResumeId, setCurrentResumeId] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [score, setScore] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = async (file) => {
        const validTypes = ['application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'text/plain'];
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
            alert('Please upload a PDF, DOC, DOCX, or TXT file.');
            return;
        }

        // Vercel has a 4.5MB limit for serverless functions
        if (file.size > 4.5 * 1024 * 1024) {
            alert('File size must be less than 4.5MB due to Vercel limits. Please compress your file or use a smaller version.');
            return;
        }

        setSelectedFile(file);

        try {
            const formData = new FormData();
            formData.append('resume', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Upload failed';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                setCurrentResumeId(data.resumeId);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            alert('Failed to upload resume: ' + error.message);
            setSelectedFile(null);
            setCurrentResumeId(null);
        }
    };

    const handleAnalyze = async () => {
        if (!currentResumeId || !jobDescription.trim()) return;

        setIsAnalyzing(true);
        setScore(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resumeId: currentResumeId,
                    jobDescription: jobDescription.trim()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Analysis failed';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                setScore(data.score);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            alert('Failed to analyze: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    return (
        <div className="container">
            <header>
                <h1 className="logo">Resume<span>IQ</span></h1>
                <p className="tagline">Smart resume-to-job matching powered by AI</p>
            </header>

            <div className="container" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%', maxWidth: '900px'}}>
                <div className="card">
                    <div className="card-header">
                        <div className="card-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </div>
                        <h2 className="card-title">Upload Resume</h2>
                    </div>
                    <div 
                        className={`upload-zone ${isDragging ? 'dragover' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('resumeInput').click()}
                    >
                        <input 
                            type="file" 
                            id="resumeInput" 
                            accept=".pdf,.doc,.docx,.txt"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleFileSelect(file);
                            }}
                        />
                        <svg className="upload-icon" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    <p className="upload-text">
                        <strong>Click to upload</strong> or drag and drop<br />
                        PDF, DOC, DOCX, or TXT (max 4.5MB)
                    </p>
                    </div>
                    {selectedFile && currentResumeId && (
                        <div className="file-info show">
                            <svg viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span className="file-name">{selectedFile.name}</span>
                            <button 
                                className="remove-file"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setCurrentResumeId(null);
                                    setScore(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-icon">
                            <svg viewBox="0 0 24 24">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        </div>
                        <h2 className="card-title">Job Description</h2>
                    </div>
                    <textarea 
                        id="jobDescription"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here...

Include requirements, qualifications, and responsibilities for the best matching results."
                    ></textarea>
                </div>

                <div className="submit-section">
                    <button 
                        className="submit-btn"
                        onClick={handleAnalyze}
                        disabled={!currentResumeId || !jobDescription.trim() || isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <svg className="spinner" viewBox="0 0 24 24" style={{animation: 'spin 1s linear infinite'}}>
                                    <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20"></circle>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                Analyze Match
                            </>
                        )}
                    </button>
                </div>

                {score !== null && (
                    <div className="result-section show">
                        <div className="result-card">
                            <h3 className="result-title">Match Score</h3>
                            <div className="score-display">{score}%</div>
                            <p className="score-label">Based on skills and requirements alignment</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
