const express = require('express');
const multer = require('multer');
const resumeController = require('../controllers/resumeController');

const router = express.Router();

// Configure multer for memory storage (for S3 upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT allowed.'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', upload.single('resume'), resumeController.uploadResume);
router.post('/analyze', resumeController.analyzeMatch);
router.get('/resumes', resumeController.listResumes);
router.delete('/resumes/:id', resumeController.deleteResume);
router.get('/resumes/:id/history', resumeController.getMatchHistory);

module.exports = router;
