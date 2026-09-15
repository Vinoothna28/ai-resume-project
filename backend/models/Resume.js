const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

    name: String,

    email: String,

    phone: String,

    resumeText: String,

    summary: String,

    skills: [String],

    strengths: [String],

    missingSkills: [String],

    education: [
        {
            degree: String,
            college: String,
            year: String
        }
    ],

    experience: [
        {
            company: String,
            role: String,
            duration: String
        }
    ],

    projects: [
        {
            title: String,
            description: String
        }
    ],

    chunks: [
        {
            text: String,
            embedding: [Number]
        }
    ]

});

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;