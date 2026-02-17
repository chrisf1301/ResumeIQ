# ResumeIQ

**AI-Powered Resume Matching Platform** - Intelligently match your resume to job descriptions with detailed feedback and actionable recommendations.

🌐 **Live Demo**: [www.smartresumes.org](https://www.smartresumes.org)

---

## Features

- **AI-Powered Analysis** - GPT-3.5 semantic matching with detailed feedback
- **File Upload** - Supports PDF, DOC, DOCX, TXT formats
- **Text Extraction** - Automatic text extraction from documents
- **Cloud Storage** - Resumes stored securely in AWS S3
- **Database** - Analysis history saved in PostgreSQL
- **Modern UI** - Clean, responsive design with dark theme

---

## Tech Stack

**Frontend:**
- Next.js 16 + React 19

**Backend:**
- Next.js API Routes (serverless)

**AI & Processing:**
- OpenAI GPT-3.5-turbo
- pdf-parse, mammoth

**Infrastructure:**
- AWS S3 (file storage)
- AWS RDS PostgreSQL (database)
- Vercel (hosting)

---

## Setup

### Environment Variables

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-2
S3_BUCKET_NAME=your-bucket
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
OPENAI_API_KEY=sk-... (optional)
```

### Installation

```bash
npm install
npm run dev
```

---

## Skills Demonstrated

- Full-Stack Development
- Cloud Architecture (AWS)
- AI/ML Integration
- Database Design
- API Development
- DevOps & Deployment
- Modern React Patterns

---

## License

ISC
