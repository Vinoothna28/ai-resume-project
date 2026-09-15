# AI Resume & Job Match Assistant

An AI-powered resume intelligence platform built with the **MERN stack and Retrieval-Augmented Generation (RAG)**.

The application allows users to upload their resume, analyze their professional profile using Google Gemini, interact with their resume through an AI-powered chat assistant, and compare their resume with job descriptions to identify skill gaps and improve job readiness.

---

## 🚀 Features

### 📄 Resume Upload

* Upload resumes in PDF format
* Extract resume text automatically
* Store resume data in MongoDB
* Process resume content for AI analysis

### 🤖 AI Resume Analysis

Analyze the uploaded resume and extract:

* Professional summary
* Technical skills
* Strengths
* Missing skills
* Education
* Experience
* Projects

### 🧠 RAG-Powered Resume Chat

Ask questions about your resume using a context-aware AI assistant.

Example:

> "What technical skills do I have?"

> "What projects are mentioned in my resume?"

> "What technologies have I worked with?"

The system retrieves the most relevant sections of the resume before generating an answer.

### 🎯 Job Match

Compare a resume against a job description and generate:

* Match score
* Matching skills
* Missing skills
* Recommendations

### 📚 Preparation Plan

Generate a personalized preparation plan based on:

* Current resume
* Target job description
* Missing skills

---

# 🧠 How the RAG System Works

The application uses **Retrieval-Augmented Generation** to ground AI responses in the user's actual resume.

```text
                Resume PDF
                    │
                    ▼
             PDF Text Extraction
                    │
                    ▼
               Text Chunking
                    │
                    ▼
            Gemini Embeddings
                    │
                    ▼
              MongoDB Storage
                    │
                    │
              User Question
                    │
                    ▼
            Question Embedding
                    │
                    ▼
            Similarity Search
                    │
                    ▼
          Top Relevant Chunks
                    │
                    ▼
          Context + Question
                    │
                    ▼
               Gemini LLM
                    │
                    ▼
             AI Generated Answer
```

### Retrieval Process

1. The uploaded PDF is converted into text.
2. The extracted text is divided into smaller chunks.
3. Each chunk is converted into a vector embedding.
4. Embeddings are stored with the resume data in MongoDB.
5. When the user asks a question, the question is converted into an embedding.
6. Cosine similarity is used to compare the question with resume chunks.
7. The most relevant chunks are selected.
8. The retrieved context is sent to Google Gemini.
9. Gemini generates a context-aware response.

This allows the assistant to answer questions based on the user's actual resume rather than relying only on general LLM knowledge.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────┐
                         │       User       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ React Frontend   │
                         │     Netlify      │
                         └────────┬─────────┘
                                  │
                              REST API
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Node.js +        │
                         │ Express.js       │
                         │     Render       │
                         └───────┬──────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ▼               ▼               ▼
          ┌────────────┐  ┌─────────────┐  ┌──────────────┐
          │ PDF Parser │  │ MongoDB     │  │ Google       │
          │            │  │ Atlas       │  │ Gemini API   │
          └────────────┘  └─────────────┘  └──────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React.js
* JavaScript
* CSS
* Vite

## Backend

* Node.js
* Express.js
* Multer
* PDF parsing

## Database

* MongoDB
* MongoDB Atlas

## AI / RAG

* Google Gemini
* Gemini Embedding Model
* Vector embeddings
* Cosine similarity
* Retrieval-Augmented Generation

## Deployment

* Netlify — Frontend
* Render — Backend
* MongoDB Atlas — Database

## Version Control

* Git
* GitHub

---

# 📂 Project Structure

```text
ai-resume-project/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── models/
│   │   └── Resume.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

# 🔌 API Endpoints

| Method | Endpoint               | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| GET    | `/`                    | Check backend status                |
| POST   | `/api/resumes`         | Save resume metadata                |
| POST   | `/api/upload`          | Upload and process PDF resume       |
| POST   | `/api/embed/:id`       | Generate resume embeddings          |
| POST   | `/api/analyze/:id`     | Analyze resume using Gemini         |
| POST   | `/api/chat/:id`        | Ask questions about the resume      |
| POST   | `/api/match/:id`       | Match resume with a job description |
| POST   | `/api/preparation/:id` | Generate preparation plan           |
| GET    | `/api/test-ai`         | Test Gemini API connection          |

---

# ⚙️ Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/Vinoothna28/ai-resume-project.git
```

```bash
cd ai-resume-project
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Do not commit the `.env` file to GitHub.

---

## 4. Start the Backend

```bash
node server.js
```

The backend will run on:

```text
http://localhost:5000
```

---

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

---

## 6. Start the Frontend

```bash
npm run dev
```

The React application will be available through the Vite development server.

---

# 🔐 Environment Variables

The backend requires the following environment variables:

| Variable         | Purpose                         |
| ---------------- | ------------------------------- |
| `MONGO_URI`      | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key           |
| `PORT`           | Backend server port             |

### Security

API keys and database credentials should never be committed to GitHub.

The `.env` file is excluded using `.gitignore`.

---

# ☁️ Deployment

The application is deployed using separate frontend and backend services.

```text
GitHub
   │
   ├───────────────┐
   ▼               ▼
Netlify          Render
Frontend         Backend
                    │
                    ▼
              MongoDB Atlas
                    │
                    ▼
               Gemini API
```

### Frontend

The React frontend is deployed on **Netlify**.

### Backend

The Node.js + Express backend is deployed on **Render**.

### Database

MongoDB Atlas provides cloud-hosted MongoDB storage.

---

# 📊 Current Implementation

The current version implements:

* PDF resume upload
* PDF text extraction
* MongoDB resume storage
* Resume text chunking
* Gemini embeddings
* Vector embedding storage
* Cosine similarity retrieval
* RAG-based resume chat
* Gemini resume analysis
* Job description matching
* Skill-gap identification
* AI-generated preparation recommendations

---

# 🔮 Future Enhancements

The following improvements can be added in future versions:

### 🔐 Authentication

* User registration
* Login
* JWT authentication
* User-specific resumes

### 🔎 Advanced Retrieval

* MongoDB Vector Search
* Hybrid keyword + semantic search
* Improved semantic chunking
* Metadata filtering

### 📈 RAG Evaluation

Introduce evaluation frameworks such as Ragas to measure:

* Context relevance
* Context precision
* Context recall
* Faithfulness
* Answer relevance

### 💼 Job Recommendations

Automatically recommend relevant jobs based on:

* Skills
* Experience
* Technologies
* Job requirements

### 📚 Career Roadmap

Generate personalized learning and interview preparation roadmaps based on the candidate's skill gaps.

### 💬 Chat History

Store previous conversations so users can return to earlier resume discussions.

---

# 🧪 Testing

The application can be tested through the following workflow:

```text
Upload Resume
      ↓
Extract Resume Text
      ↓
Generate Embeddings
      ↓
Analyze Resume
      ↓
Ask Resume Questions
      ↓
Match Job Description
      ↓
Generate Preparation Plan
```

Testing should cover:

* Valid PDF uploads
* Invalid file uploads
* Resume extraction
* Embedding generation
* RAG retrieval
* AI response generation
* Job matching
* Error handling
* API communication

---

# ⚠️ Limitations

The current implementation has some limitations:

* Vector similarity is currently calculated at the application level.
* Embeddings are stored within MongoDB resume documents.
* The chunking strategy is relatively simple.
* Authentication is not currently implemented as a core feature.
* Production rate limiting should be added.
* AI availability and API quotas can affect generation.
* Automated RAG evaluation has not yet been implemented.

These areas provide opportunities for future development.

---

# 🎯 Project Goals

This project demonstrates practical implementation of:

```text
Full-Stack Development
        +
REST APIs
        +
MongoDB
        +
Document Processing
        +
Vector Embeddings
        +
Semantic Search
        +
Retrieval-Augmented Generation
        +
Large Language Models
```

The project is designed as a practical portfolio application demonstrating the integration of modern AI capabilities with a traditional MERN application.

---

# 👩‍💻 Author

**Vinoothna Vanimireddy**

B.Tech — Computer Science & Engineering

GitHub: [Vinoothna28](https://github.com/Vinoothna28)

---

# 📄 License

This project is developed for educational, portfolio, and demonstration purposes.
