const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const Resume = require("./models/Resume");
const multer = require("multer");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const app = express();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.log("MongoDB connection failed");
        console.log(error);
    });

app.get("/", (req, res) => {
    res.send("Backend is working!");
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post("/api/resumes", async (req, res) => {

    try {

        const resume = new Resume(req.body);

        const savedResume = await resume.save();

        res.status(201).json(savedResume);

    } catch (error) {

        res.status(500).json({
            message: "Failed to save resume"
        });
    }
});

function createChunks(text, chunkSize = 800) {

    const words = text.split(/\s+/);

    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {

        const chunk = words
            .slice(i, i + chunkSize)
            .join(" ");

        if (chunk.trim()) {
            chunks.push(chunk);
        }
    }

    return chunks;
}

async function createEmbedding(text) {

    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text
    });

    return response.embeddings[0].values;
}

async function createResumeEmbeddings(resume) {

    console.log("Creating resume chunks...");

    const chunks = createChunks(
        resume.resumeText
    );

    console.log(
        `Created ${chunks.length} chunks`
    );

    const embeddedChunks = [];

    for (const chunk of chunks) {

        console.log("Creating embedding...");

        const embedding = await createEmbedding(
            chunk
        );

        embeddedChunks.push({
            text: chunk,
            embedding: embedding
        });
    }

    resume.chunks = embeddedChunks;

    await resume.save();

    console.log("Resume embeddings saved successfully");

    return embeddedChunks.length;
}

app.post("/api/upload", upload.single("resume"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        const fileBuffer = fs.readFileSync(req.file.path);

        const parser = new PDFParse({
            data: fileBuffer
        });

        const pdfData = await parser.getText();

        const resumeText = pdfData.text;

        await parser.destroy();

        const resume = new Resume({
            resumeText: resumeText
        });

        const savedResume = await resume.save();

        console.log(
            "Resume saved with ID:",
            savedResume._id
        );

        console.log("Starting automatic RAG embedding...");

        const chunkCount = await createResumeEmbeddings(
            savedResume
        );

        res.json({
            message: "Resume uploaded and RAG embeddings created successfully",
            resumeId: savedResume._id,
            chunkCount: chunkCount
        });

    } catch (error) {

        console.log("UPLOAD ERROR:");
        console.log(error);

        res.status(500).json({
            message: "Resume upload or embedding failed",
            error: error.message
        });
    }
});

function cosineSimilarity(a, b) {

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {

        dotProduct += a[i] * b[i];

        magnitudeA += a[i] * a[i];

        magnitudeB += b[i] * b[i];
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct /
        (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

app.post("/api/embed/:id", async (req, res) => {

    try {

        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        if (!resume.resumeText) {
            return res.status(400).json({
                message: "Resume text not available"
            });
        }

        const chunkCount = await createResumeEmbeddings(
            resume
        );

        res.json({
            message: "Resume embeddings created successfully",
            chunkCount: chunkCount
        });

    } catch (error) {

        console.log("EMBEDDING ERROR:");
        console.log(error);

        res.status(500).json({
            message: "Failed to create resume embeddings",
            error: error.message
        });
    }
});

app.post("/api/chat/:id", async (req, res) => {

    try {

        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                message: "Question is required"
            });
        }

        if (!resume.chunks || resume.chunks.length === 0) {
            return res.status(400).json({
                message: "Resume embeddings not created yet"
            });
        }

        console.log("Creating question embedding...");

        const questionEmbedding = await createEmbedding(
            question
        );

        const scoredChunks = resume.chunks.map(
            (chunk) => {

                const score = cosineSimilarity(
                    questionEmbedding,
                    chunk.embedding
                );

                return {
                    text: chunk.text,
                    score: score
                };
            }
        );

        scoredChunks.sort((a, b) => {
            return b.score - a.score;
        });

        const topChunks = scoredChunks.slice(0, 3);

        console.log("Most relevant chunks:");
        console.log(topChunks);

        const context = topChunks
            .map((chunk) => chunk.text)
            .join("\n\n");

        const prompt = `
You are an AI assistant that answers questions about a user's resume.

Answer the user's question using ONLY the resume context provided below.

If the answer cannot be found in the resume context, say:

"I couldn't find that information in your resume."

Do not invent information.

Keep the answer clear and useful.

Resume Context:
${context}

User Question:
${question}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        res.json({
            message: "Answer generated successfully",
            answer: response.text
        });

    } catch (error) {

        console.log("CHAT ERROR:");
        console.log(error);

        res.status(500).json({
            message: "Failed to generate answer",
            error: error.message
        });
    }
});

app.get("/api/test-ai", async (req, res) => {

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Say hello and tell me you are working."
        });

        res.json({
            message: response.text
        });

    } catch (error) {

        console.log("GEMINI ERROR:");
        console.log(error);

        res.status(500).json({
            message: "Gemini API failed",
            error: error.message
        });
    }
});

app.post("/api/analyze/:id", async (req, res) => {

    try {

        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        const prompt = `
Analyze the following resume.

Return the result ONLY as valid JSON.

Use exactly this structure:

{
    "summary": "",
    "skills": [],
    "strengths": [],
    "missingSkills": [],
    "education": [],
    "experience": [],
    "projects": []
}

Resume:
${resume.resumeText}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        const aiText = response.text;

        console.log("AI RESPONSE:");
        console.log(aiText);

        const cleanText = aiText
            .replace("```json", "")
            .replace("```", "")
            .trim();

        const analysis = JSON.parse(cleanText);

        resume.skills = analysis.skills;
        resume.strengths = analysis.strengths;
        resume.missingSkills = analysis.missingSkills;
        resume.education = analysis.education;
        resume.experience = analysis.experience;
        resume.projects = analysis.projects;
        resume.summary = analysis.summary;

        await resume.save();

        res.json({
            message: "Resume analyzed successfully",
            analysis: analysis
        });

    } catch (error) {

        console.log("AI ANALYSIS ERROR:");
        console.log(error);

        res.status(500).json({
            message: "Resume analysis failed",
            error: error.message
        });
    }
});

app.post("/api/match/:id", async (req, res) => {

    try {

        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        const { jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required"
            });
        }

        const prompt = `
Compare this resume with the job description.

Return ONLY valid JSON.

Use exactly this structure:

{
    "matchScore": 0,
    "matchingSkills": [],
    "missingSkills": [],
    "recommendations": []
}

Resume:
${resume.resumeText}

Job Description:
${jobDescription}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        const aiText = response.text;

        console.log("MATCH RESULT:");
        console.log(aiText);

        const cleanText = aiText
            .replace("```json", "")
            .replace("```", "")
            .trim();

        const matchResult = JSON.parse(cleanText);

        res.json({
            message: "Resume matched successfully",
            result: matchResult
        });

    } catch (error) {

        console.log("MATCH ERROR:");
        console.log(error);

        res.status(500).json({
            message: "Resume matching failed",
            error: error.message
        });
    }
});

app.post("/api/preparation/:id", async (req, res) => {

    try {

        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        const {
            jobDescription,
            missingSkills
        } = req.body;

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required"
            });
        }

        const prompt = `
Create a practical preparation plan for this candidate.

Use the resume, missing skills and job description.

Return ONLY valid JSON.

Use exactly this structure:

{
    "overallAdvice": "",
    "skillsToLearn": [
        {
            "skill": "",
            "priority": "",
            "reason": "",
            "topics": []
        }
    ],
    "actionPlan": [
        {
            "step": "",
            "description": ""
        }
    ]
}

Resume:
${resume.resumeText}

Missing Skills:
${JSON.stringify(missingSkills || [])}

Job Description:
${jobDescription}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        const aiText = response.text;

        console.log("PREPARATION PLAN:");
        console.log(aiText);

        const start = aiText.indexOf("{");
        const end = aiText.lastIndexOf("}");

        if (start === -1 || end === -1) {
            throw new Error(
                "Gemini did not return valid JSON"
            );
        }

        const cleanText = aiText.substring(
            start,
            end + 1
        );

        const preparationPlan = JSON.parse(
            cleanText
        );

        res.json({
            message:
                "Preparation plan generated successfully",
            plan: preparationPlan
        });

    } catch (error) {

        console.log("PREPARATION ERROR:");
        console.log(error);

        res.status(500).json({
            message:
                "Failed to generate preparation plan",
            error: error.message
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});