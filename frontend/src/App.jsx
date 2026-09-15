
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./App.css";

const API_URL = "https://ai-resume-backend-d4ko.onrender.com";

function App() {
    const [activeSection, setActiveSection] = useState("dashboard");

    const [file, setFile] = useState(null);
    const [resumeId, setResumeId] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [matchResult, setMatchResult] = useState(null);

    const [jobDescription, setJobDescription] = useState("");

    const [uploadState, setUploadState] = useState("idle");
    const [analysisState, setAnalysisState] = useState("idle");
    const [matchState, setMatchState] = useState("idle");

    const [uploadProgress, setUploadProgress] = useState(0);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [isDragging, setIsDragging] = useState(false);

    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatState, setChatState] = useState("idle");

    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            return "Please select a file.";
        }

        if (selectedFile.type !== "application/pdf") {
            return "Only PDF resumes are supported.";
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            return "Resume must be smaller than 5 MB.";
        }

        return "";
    };

    const handleFileSelect = (selectedFile) => {
        setError("");
        setSuccessMessage("");

        const validationError = validateFile(selectedFile);

        if (validationError) {
            setError(validationError);
            return;
        }

        setFile(selectedFile);
        setUploadState("idle");
        setUploadProgress(0);
        setChatMessages([]);
    };

    const handleInputChange = (event) => {
        const selectedFile = event.target.files?.[0];

        if (selectedFile) {
            handleFileSelect(selectedFile);
        }

        event.target.value = "";
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);

        const droppedFile = event.dataTransfer.files?.[0];

        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const uploadResume = () => {
        if (!file) {
            setError("Select your resume before uploading.");
            return;
        }

        setError("");
        setSuccessMessage("");
        setUploadState("loading");
        setUploadProgress(0);

        const formData = new FormData();

        formData.append("resume", file);

        const xhr = new XMLHttpRequest();

        xhr.open(
            "POST",
            `${API_URL}/api/upload`
        );

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round(
                    (event.loaded / event.total) * 100
                );

                setUploadProgress(progress);
            }
        };

        xhr.onload = () => {
            try {
                const data = JSON.parse(
                    xhr.responseText
                );

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {
                    setResumeId(data.resumeId);
                    setUploadState("success");

                    setSuccessMessage(
                        "Resume uploaded successfully. You can now analyze it."
                    );
                } else {
                    setUploadState("error");

                    setError(
                        data.message ||
                        "Resume upload failed."
                    );
                }
            } catch {
                setUploadState("error");

                setError(
                    "The server returned an invalid response."
                );
            }
        };

        xhr.onerror = () => {
            setUploadState("error");

            setError(
                "Unable to connect to the backend. Make sure the server is running."
            );
        };

        xhr.send(formData);
    };

    const removeFile = () => {
        setFile(null);
        setResumeId("");
        setAnalysis(null);
        setMatchResult(null);

        setUploadState("idle");
        setUploadProgress(0);

        setChatMessages([]);

        setError("");
        setSuccessMessage("");
    };

    const analyzeResume = async () => {
        if (!resumeId) {
            setError(
                "Upload a resume before starting the analysis."
            );

            setActiveSection("resume");
            return;
        }

        setError("");
        setSuccessMessage("");
        setAnalysisState("loading");
        setActiveSection("analysis");

        try {
            const response = await fetch(
                `${API_URL}/api/analyze/${resumeId}`,
                {
                    method: "POST"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Resume analysis failed."
                );
            }

            setAnalysis(data.analysis);
            setAnalysisState("success");

            setSuccessMessage(
                "AI analysis completed successfully."
            );
        } catch (err) {
            console.error(err);

            setAnalysisState("error");

            setError(
                err.message ||
                "Something went wrong while analyzing your resume."
            );
        }
    };

    const openAnalysis = () => {
        if (!resumeId) {
            setActiveSection("resume");

            setError(
                "Upload your resume first to start AI analysis."
            );

            return;
        }

        if (analysis) {
            setActiveSection("analysis");
            return;
        }

        analyzeResume();
    };

    const matchResume = async () => {
        if (!resumeId) {
            setError(
                "Upload and analyze your resume first."
            );

            setActiveSection("resume");
            return;
        }

        if (!jobDescription.trim()) {
            setError(
                "Enter a job description before matching."
            );

            return;
        }

        setError("");
        setSuccessMessage("");
        setMatchState("loading");

        try {
            const response = await fetch(
                `${API_URL}/api/match/${resumeId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jobDescription
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Job matching failed."
                );
            }

            setMatchResult(data.result);
            setMatchState("success");

            setSuccessMessage(
                "Job match analysis completed."
            );
        } catch (err) {
            console.error(err);

            setMatchState("error");

            setError(
                err.message ||
                "Something went wrong while matching the resume."
            );
        }
    };

    const askAssistant = async () => {
        const question = chatInput.trim();

        if (!question) {
            return;
        }

        if (!resumeId) {
            setError(
                "Upload your resume before using the AI Assistant."
            );

            setActiveSection("resume");
            return;
        }

        setError("");
        setSuccessMessage("");

        const userMessage = {
            role: "user",
            content: question
        };

        setChatMessages((previous) => [
            ...previous,
            userMessage
        ]);

        setChatInput("");
        setChatState("loading");

        try {
            const response = await fetch(
                `${API_URL}/api/chat/${resumeId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Assistant failed to respond."
                );
            }

            const assistantMessage = {
                role: "assistant",
                content: data.answer
            };

            setChatMessages((previous) => [
                ...previous,
                assistantMessage
            ]);

            setChatState("success");
        } catch (err) {
            console.error(err);

            setChatState("error");

            setError(
                err.message ||
                "Something went wrong while asking the AI Assistant."
            );
        }
    };

    const handleChatKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            askAssistant();
        }
    };

    const changeSection = (section) => {
        setError("");
        setSuccessMessage("");
        setActiveSection(section);
    };

    const getInitials = () => {
        return "V";
    };

    return (
        <div className="app-shell">

            <aside className="sidebar">

                <div className="sidebar-brand">
                    <div className="brand-mark">
                        <span>R</span>
                    </div>

                    <div className="brand-copy">
                        <strong>ResumeAI</strong>
                        <span>Workspace</span>
                    </div>
                </div>

                <nav
                    className="sidebar-navigation"
                    aria-label="Primary navigation"
                >
                    <p className="navigation-label">
                        Workspace
                    </p>

                    <SidebarButton
                        icon="⌂"
                        label="Dashboard"
                        active={
                            activeSection === "dashboard"
                        }
                        onClick={() =>
                            changeSection("dashboard")
                        }
                    />

                    <SidebarButton
                        icon="▣"
                        label="Resume"
                        active={
                            activeSection === "resume"
                        }
                        onClick={() =>
                            changeSection("resume")
                        }
                    />

                    <SidebarButton
                        icon="✦"
                        label="AI Analysis"
                        active={
                            activeSection === "analysis"
                        }
                        loading={
                            analysisState === "loading"
                        }
                        onClick={openAnalysis}
                    />

                    <SidebarButton
                        icon="↗"
                        label="Job Match"
                        active={
                            activeSection === "match"
                        }
                        onClick={() =>
                            changeSection("match")
                        }
                    />

                    <SidebarButton
                        icon="◎"
                        label="AI Assistant"
                        active={
                            activeSection === "assistant"
                        }
                        onClick={() =>
                            changeSection("assistant")
                        }
                    />
                </nav>

                <div className="sidebar-bottom">

                    <div className="workspace-status">
                        <span className="status-dot"></span>

                        <div>
                            <strong>
                                Local workspace
                            </strong>

                            <span>
                                Backend connected
                            </span>
                        </div>
                    </div>

                    <div className="sidebar-user">

                        <div className="avatar">
                            {getInitials()}
                        </div>

                        <div className="user-details">
                            <strong>
                                My Workspace
                            </strong>

                            <span>
                                Personal account
                            </span>
                        </div>

                        <button
                            className="icon-button"
                            aria-label="Workspace options"
                        >
                            ⋯
                        </button>

                    </div>

                </div>

            </aside>

            <main className="main-content">

                <header className="topbar">

                    <div className="breadcrumb">
                        <span>
                            Workspace
                        </span>

                        <span className="breadcrumb-separator">
                            /
                        </span>

                        <strong>
                            {getSectionTitle(
                                activeSection
                            )}
                        </strong>
                    </div>

                    <div className="topbar-actions">

                        <button
                            className="topbar-button"
                            onClick={() =>
                                changeSection("resume")
                            }
                        >
                            <span>＋</span>
                            Upload resume
                        </button>

                        <div className="topbar-avatar">
                            V
                        </div>

                    </div>

                </header>

                <div className="content-container">

                    <AnimatePresence mode="wait">

                        {activeSection === "dashboard" && (
                            <motion.div
                                key="dashboard"
                                className="page"
                                initial={{
                                    opacity: 0,
                                    y: 8
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -8
                                }}
                                transition={{
                                    duration: 0.2
                                }}
                            >
                                <Dashboard
                                    resumeId={resumeId}
                                    file={file}
                                    analysis={analysis}
                                    matchResult={matchResult}
                                    changeSection={
                                        changeSection
                                    }
                                    openAnalysis={
                                        openAnalysis
                                    }
                                    uploadState={
                                        uploadState
                                    }
                                />
                            </motion.div>
                        )}

                        {activeSection === "resume" && (
                            <motion.div
                                key="resume"
                                className="page"
                                initial={{
                                    opacity: 0,
                                    y: 8
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -8
                                }}
                                transition={{
                                    duration: 0.2
                                }}
                            >
                                <ResumePage
                                    file={file}
                                    resumeId={resumeId}
                                    uploadState={
                                        uploadState
                                    }
                                    uploadProgress={
                                        uploadProgress
                                    }
                                    isDragging={
                                        isDragging
                                    }
                                    handleDragOver={
                                        handleDragOver
                                    }
                                    handleDragLeave={
                                        handleDragLeave
                                    }
                                    handleDrop={
                                        handleDrop
                                    }
                                    handleInputChange={
                                        handleInputChange
                                    }
                                    uploadResume={
                                        uploadResume
                                    }
                                    removeFile={
                                        removeFile
                                    }
                                    changeSection={
                                        changeSection
                                    }
                                />
                            </motion.div>
                        )}

                        {activeSection === "analysis" && (
                            <motion.div
                                key="analysis"
                                className="page"
                                initial={{
                                    opacity: 0,
                                    y: 8
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -8
                                }}
                                transition={{
                                    duration: 0.2
                                }}
                            >
                                <AnalysisPage
                                    analysis={analysis}
                                    state={
                                        analysisState
                                    }
                                    analyzeResume={
                                        analyzeResume
                                    }
                                    resumeId={resumeId}
                                />
                            </motion.div>
                        )}

                        {activeSection === "match" && (
                            <motion.div
                                key="match"
                                className="page"
                                initial={{
                                    opacity: 0,
                                    y: 8
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -8
                                }}
                                transition={{
                                    duration: 0.2
                                }}
                            >
                                <MatchPage
                                    jobDescription={
                                        jobDescription
                                    }
                                    setJobDescription={
                                        setJobDescription
                                    }
                                    matchResume={
                                        matchResume
                                    }
                                    matchResult={
                                        matchResult
                                    }
                                    state={
                                        matchState
                                    }
                                />
                            </motion.div>
                        )}

                        {activeSection === "assistant" && (
                            <motion.div
                                key="assistant"
                                className="page"
                                initial={{
                                    opacity: 0,
                                    y: 8
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -8
                                }}
                                transition={{
                                    duration: 0.2
                                }}
                            >
                                <AssistantPage
                                    resumeId={resumeId}
                                    messages={
                                        chatMessages
                                    }
                                    input={
                                        chatInput
                                    }
                                    setInput={
                                        setChatInput
                                    }
                                    askAssistant={
                                        askAssistant
                                    }
                                    handleKeyDown={
                                        handleChatKeyDown
                                    }
                                    state={
                                        chatState
                                    }
                                />
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {(error || successMessage) && (
                        <div
                            className={`global-message ${
                                error
                                    ? "message-error"
                                    : "message-success"
                            }`}
                            role="status"
                        >
                            <span className="message-icon">
                                {error ? "!" : "✓"}
                            </span>

                            <span>
                                {error ||
                                    successMessage}
                            </span>

                            <button
                                onClick={() => {
                                    setError("");
                                    setSuccessMessage("");
                                }}
                                aria-label="Dismiss message"
                            >
                                ×
                            </button>
                        </div>
                    )}

                </div>

            </main>

        </div>
    );
}

function SidebarButton({
    icon,
    label,
    active,
    onClick,
    loading
}) {
    return (
        <button
            className={`sidebar-button ${
                active ? "active" : ""
            }`}
            onClick={onClick}
            aria-current={
                active ? "page" : undefined
            }
            disabled={loading}
        >
            <span className="sidebar-icon">
                {loading ? (
                    <span className="mini-spinner"></span>
                ) : (
                    icon
                )}
            </span>

            <span>
                {label}
            </span>
        </button>
    );
}

function Dashboard({
    resumeId,
    file,
    analysis,
    matchResult,
    changeSection,
    openAnalysis,
    uploadState
}) {
    const hasResume = Boolean(resumeId);
    const hasAnalysis = Boolean(analysis);
    const hasMatch = Boolean(matchResult);

    return (
        <>
            <PageHeader
                eyebrow="Overview"
                title="Good to see you."
                description="Manage your resume, analyze your profile, and evaluate your fit against real job opportunities."
            />

            <section className="dashboard-grid">

                <MetricCard
                    label="Resume status"
                    value={
                        hasResume
                            ? "Ready"
                            : "Not uploaded"
                    }
                    detail={
                        hasResume
                            ? "Resume is available for analysis"
                            : "Upload a resume to begin"
                    }
                    icon="▣"
                    status={hasResume}
                />

                <MetricCard
                    label="AI analysis"
                    value={
                        hasAnalysis
                            ? "Completed"
                            : "Not analyzed"
                    }
                    detail={
                        hasAnalysis
                            ? "Profile insights are available"
                            : "Run your first analysis"
                    }
                    icon="✦"
                    status={hasAnalysis}
                />

                <MetricCard
                    label="Job matching"
                    value={
                        hasMatch
                            ? `${matchResult.matchScore}%`
                            : "—"
                    }
                    detail={
                        hasMatch
                            ? "Latest compatibility score"
                            : "No job analyzed yet"
                    }
                    icon="↗"
                    status={hasMatch}
                />

            </section>

            <section className="dashboard-main-grid">

                <div className="panel resume-overview-panel">

                    <PanelHeader
                        title="Current resume"
                        description="Your active resume workspace"
                    />

                    {file || hasResume ? (
                        <div className="resume-summary">

                            <div className="resume-file-icon">
                                PDF
                            </div>

                            <div className="resume-file-info">

                                <strong>
                                    {file?.name ||
                                        "Uploaded resume"}
                                </strong>

                                <span>
                                    {uploadState ===
                                    "success"
                                        ? "Successfully processed"
                                        : "Available in workspace"}
                                </span>

                            </div>

                            <div className="resume-state">
                                <span className="status-dot"></span>
                                Ready
                            </div>

                        </div>
                    ) : (
                        <EmptyState
                            icon="↑"
                            title="No resume yet"
                            description="Upload your PDF resume to unlock AI-powered analysis and job matching."
                            action="Upload resume"
                            onClick={() =>
                                changeSection(
                                    "resume"
                                )
                            }
                        />
                    )}

                    {hasResume && (
                        <div className="panel-actions">

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    changeSection(
                                        "resume"
                                    )
                                }
                            >
                                Manage resume
                            </button>

                            <button
                                className="primary-button"
                                onClick={
                                    openAnalysis
                                }
                            >
                                <span>✦</span>

                                {hasAnalysis
                                    ? "View analysis"
                                    : "Analyze resume"}
                            </button>

                        </div>
                    )}

                </div>

                <div className="panel quick-actions-panel">

                    <PanelHeader
                        title="Quick actions"
                        description="Continue where you left off"
                    />

                    <div className="quick-action-list">

                        <button
                            className="quick-action"
                            onClick={() =>
                                changeSection(
                                    "resume"
                                )
                            }
                        >
                            <span className="quick-action-icon">
                                ↑
                            </span>

                            <span>
                                <strong>
                                    Upload a resume
                                </strong>

                                <small>
                                    Add or replace your resume
                                </small>
                            </span>

                            <span>→</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={
                                openAnalysis
                            }
                        >
                            <span className="quick-action-icon">
                                ✦
                            </span>

                            <span>
                                <strong>
                                    AI analysis
                                </strong>

                                <small>
                                    Extract skills and insights
                                </small>
                            </span>

                            <span>→</span>
                        </button>

                        <button
                            className="quick-action"
                            onClick={() =>
                                changeSection(
                                    "match"
                                )
                            }
                        >
                            <span className="quick-action-icon">
                                ↗
                            </span>

                            <span>
                                <strong>
                                    Match a job
                                </strong>

                                <small>
                                    Compare against a job description
                                </small>
                            </span>

                            <span>→</span>
                        </button>

                    </div>

                </div>

            </section>

            <section className="panel activity-panel">

                <PanelHeader
                    title="Workspace activity"
                    description="Your latest ResumeAI activity"
                />

                <div className="activity-list">

                    <ActivityItem
                        active={hasResume}
                        icon="▣"
                        title={
                            hasResume
                                ? "Resume uploaded"
                                : "Resume upload pending"
                        }
                        description={
                            hasResume
                                ? "Your resume is ready for AI processing."
                                : "Upload a PDF to get started."
                        }
                    />

                    <ActivityItem
                        active={hasAnalysis}
                        icon="✦"
                        title={
                            hasAnalysis
                                ? "AI analysis completed"
                                : "AI analysis pending"
                        }
                        description={
                            hasAnalysis
                                ? "Your profile has been analyzed."
                                : "Run AI analysis after uploading."
                        }
                    />

                    <ActivityItem
                        active={hasMatch}
                        icon="↗"
                        title={
                            hasMatch
                                ? "Job match completed"
                                : "Job matching pending"
                        }
                        description={
                            hasMatch
                                ? "A job description has been evaluated."
                                : "Compare your resume with a target role."
                        }
                    />

                </div>

            </section>
        </>
    );
}

function ResumePage({
    file,
    resumeId,
    uploadState,
    uploadProgress,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    uploadResume,
    removeFile,
    changeSection
}) {
    return (
        <>
            <PageHeader
                eyebrow="Resume"
                title="Manage your resume"
                description="Upload a clean PDF resume and keep it as the source of truth for your AI workspace."
            />

            <div className="resume-layout">

                <section className="panel upload-panel">

                    <PanelHeader
                        title="Upload resume"
                        description="PDF files up to 5 MB"
                    />

                    {!file ? (
                        <label
                            className={`dropzone ${
                                isDragging
                                    ? "dragging"
                                    : ""
                            }`}
                            onDragOver={
                                handleDragOver
                            }
                            onDragLeave={
                                handleDragLeave
                            }
                            onDrop={
                                handleDrop
                            }
                        >
                            <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={
                                    handleInputChange
                                }
                            />

                            <div className="upload-icon">
                                ↑
                            </div>

                            <strong>
                                Drop your resume here
                            </strong>

                            <span>
                                or click to browse from your computer
                            </span>

                            <small>
                                PDF only · Maximum 5 MB
                            </small>
                        </label>
                    ) : (
                        <div className="selected-file">

                            <div className="selected-file-main">

                                <div className="resume-file-icon large">
                                    PDF
                                </div>

                                <div>
                                    <strong>
                                        {file.name}
                                    </strong>

                                    <span>
                                        {formatFileSize(
                                            file.size
                                        )}
                                    </span>
                                </div>

                            </div>

                            <button
                                className="remove-file"
                                onClick={
                                    removeFile
                                }
                                aria-label="Remove selected resume"
                            >
                                ×
                            </button>

                        </div>
                    )}

                    {uploadState === "loading" && (
                        <div className="upload-progress">

                            <div className="progress-header">
                                <span>
                                    Processing resume
                                </span>

                                <strong>
                                    {uploadProgress}%
                                </strong>
                            </div>

                            <div className="progress-track">
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${uploadProgress}%`
                                    }}
                                />
                            </div>

                            <span>
                                Uploading and extracting resume content...
                            </span>

                        </div>
                    )}

                    {file &&
                        uploadState !==
                            "loading" && (
                            <button
                                className="primary-button full-width"
                                onClick={
                                    uploadResume
                                }
                            >
                                {resumeId
                                    ? "Upload new version"
                                    : "Upload and process resume"}
                            </button>
                        )}

                </section>

                <aside className="panel resume-info-panel">

                    <PanelHeader
                        title="How it works"
                        description="Your resume powers the workspace"
                    />

                    <div className="workflow">

                        <WorkflowStep
                            number="01"
                            title="Upload"
                            description="We securely process your PDF and extract its text."
                            active
                        />

                        <WorkflowStep
                            number="02"
                            title="Analyze"
                            description="Gemini evaluates your profile, skills, education and experience."
                            active={
                                Boolean(resumeId)
                            }
                        />

                        <WorkflowStep
                            number="03"
                            title="Match"
                            description="Compare your profile against any target job description."
                            active={
                                Boolean(resumeId)
                            }
                        />

                    </div>

                    {resumeId && (
                        <button
                            className="secondary-button full-width"
                            onClick={() =>
                                changeSection(
                                    "analysis"
                                )
                            }
                        >
                            View resume workspace
                        </button>
                    )}

                </aside>

            </div>
        </>
    );
}

function AnalysisPage({
    analysis,
    state,
    analyzeResume,
    resumeId
}) {
    if (!resumeId) {
        return (
            <>
                <PageHeader
                    eyebrow="AI Analysis"
                    title="Resume intelligence"
                    description="AI-powered insights from your resume."
                />

                <EmptyState
                    icon="✦"
                    title="Upload a resume first"
                    description="Once your resume is uploaded, ResumeAI can extract your profile and generate actionable insights."
                />
            </>
        );
    }

    if (state === "loading") {
        return (
            <>
                <PageHeader
                    eyebrow="AI Analysis"
                    title="Analyzing your resume"
                    description="ResumeAI is extracting and evaluating your professional profile."
                />

                <AnalysisLoading />
            </>
        );
    }

    if (state === "error") {
        return (
            <>
                <PageHeader
                    eyebrow="AI Analysis"
                    title="Analysis unavailable"
                    description="We couldn't complete the analysis."
                />

                <ErrorState
                    title="Analysis failed"
                    description="The backend returned an error while processing your resume."
                    action="Try again"
                    onClick={
                        analyzeResume
                    }
                />
            </>
        );
    }

    if (!analysis) {
        return (
            <>
                <PageHeader
                    eyebrow="AI Analysis"
                    title="Resume intelligence"
                    description="Turn your resume into structured, actionable career insights."
                />

                <div className="analysis-start-card">

                    <div className="analysis-start-icon">
                        ✦
                    </div>

                    <div>
                        <h2>
                            Ready to analyze
                        </h2>

                        <p>
                            ResumeAI will identify your skills,
                            strengths, experience, education,
                            projects and improvement areas.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={
                            analyzeResume
                        }
                    >
                        Analyze resume
                    </button>

                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="AI Analysis"
                title="Resume intelligence"
                description="A structured view of what your resume communicates to recruiters and hiring systems."
            />

            <section className="analysis-summary-grid">

                <div className="analysis-summary-main panel">

                    <span className="eyebrow">
                        AI summary
                    </span>

                    <p className="analysis-summary-text">
                        {analysis.summary ||
                            "No summary was generated."}
                    </p>

                </div>

                <div className="analysis-score panel">

                    <span className="eyebrow">
                        Profile status
                    </span>

                    <div className="score-value">
                        {analysis.skills?.length ||
                            0}
                    </div>

                    <span>
                        detected skills
                    </span>

                </div>

            </section>

            <div className="analysis-grid">

                <AnalysisCard
                    title="Skills"
                    icon="◆"
                    items={
                        analysis.skills
                    }
                    emptyText="No skills detected."
                />

                <AnalysisCard
                    title="Strengths"
                    icon="✦"
                    items={
                        analysis.strengths
                    }
                    emptyText="No strengths detected."
                />

                <AnalysisCard
                    title="Missing skills"
                    icon="△"
                    items={
                        analysis.missingSkills
                    }
                    emptyText="No missing skills identified."
                />

            </div>

            <section className="panel detail-panel">

                <PanelHeader
                    title="Education"
                    description="Academic background detected from your resume"
                />

                {analysis.education?.length ? (
                    <div className="timeline-list">

                        {analysis.education.map(
                            (item, index) => (
                                <div
                                    className="timeline-item"
                                    key={index}
                                >
                                    <div className="timeline-marker">
                                        {index + 1}
                                    </div>

                                    <div>
                                        <strong>
                                            {item.degree ||
                                                "Degree"}
                                        </strong>

                                        <span>
                                            {item.college ||
                                                "Institution"}
                                        </span>

                                        <small>
                                            {item.year ||
                                                "Year not specified"}
                                        </small>
                                    </div>
                                </div>
                            )
                        )}

                    </div>
                ) : (
                    <EmptyInline text="No education information detected." />
                )}

            </section>

            <section className="panel detail-panel">

                <PanelHeader
                    title="Experience"
                    description="Professional experience detected from your resume"
                />

                {analysis.experience?.length ? (
                    <div className="experience-list">

                        {analysis.experience.map(
                            (item, index) => (
                                <div
                                    className="experience-item"
                                    key={index}
                                >
                                    <div className="experience-header">

                                        <div>
                                            <strong>
                                                {item.role ||
                                                    "Role"}
                                            </strong>

                                            <span>
                                                {item.company ||
                                                    "Company"}
                                            </span>
                                        </div>

                                        <small>
                                            {item.duration ||
                                                "Duration not specified"}
                                        </small>

                                    </div>
                                </div>
                            )
                        )}

                    </div>
                ) : (
                    <EmptyInline text="No experience information detected." />
                )}

            </section>

            <section className="panel detail-panel">

                <PanelHeader
                    title="Projects"
                    description="Projects identified from your resume"
                />

                {analysis.projects?.length ? (
                    <div className="project-list">

                        {analysis.projects.map(
                            (project, index) => (
                                <div
                                    className="project-item"
                                    key={index}
                                >
                                    <div className="project-number">
                                        0{index + 1}
                                    </div>

                                    <div>
                                        <strong>
                                            {project.title ||
                                                "Project"}
                                        </strong>

                                        <p>
                                            {project.description ||
                                                "No description available."}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}

                    </div>
                ) : (
                    <EmptyInline text="No projects detected." />
                )}

            </section>
        </>
    );
}

function MatchPage({
    jobDescription,
    setJobDescription,
    matchResume,
    matchResult,
    state
}) {
    return (
        <>
            <PageHeader
                eyebrow="Job Matching"
                title="Measure your fit"
                description="Paste a target job description and let AI identify alignment, gaps and opportunities."
            />

            <div className="match-layout">

                <section className="panel job-input-panel">

                    <PanelHeader
                        title="Target role"
                        description="Paste the complete job description"
                    />

                    <label
                        className="input-label"
                        htmlFor="job-description"
                    >
                        Job description
                    </label>

                    <textarea
                        id="job-description"
                        className="job-textarea"
                        placeholder="Paste the job description here..."
                        value={
                            jobDescription
                        }
                        onChange={(event) =>
                            setJobDescription(
                                event.target.value
                            )
                        }
                    />

                    <div className="textarea-footer">

                        <span>
                            {jobDescription.length}{" "}
                            characters
                        </span>

                        <button
                            className="primary-button"
                            onClick={
                                matchResume
                            }
                            disabled={
                                state ===
                                "loading"
                            }
                        >
                            {state ===
                            "loading"
                                ? "Analyzing..."
                                : "Analyze match"}
                        </button>

                    </div>

                </section>

                <section className="panel match-result-panel">

                    <PanelHeader
                        title="Match result"
                        description="AI compatibility analysis"
                    />

                    {state === "loading" ? (
                        <MatchLoading />
                    ) : matchResult ? (
                        <MatchResult
                            result={
                                matchResult
                            }
                        />
                    ) : (
                        <EmptyState
                            icon="↗"
                            title="No match yet"
                            description="Enter a job description to see how closely your resume matches the role."
                        />
                    )}

                </section>

            </div>
        </>
    );
}

function MatchResult({ result }) {
    const score = Number(
        result.matchScore || 0
    );

    return (
        <div className="match-result">

            <div className="match-score-container">

                <div
                    className="match-score-ring"
                    style={{
                        "--score": `${score * 3.6}deg`
                    }}
                >
                    <div>
                        <strong>
                            {score}
                        </strong>

                        <span>
                            %
                        </span>
                    </div>
                </div>

                <div>

                    <span className="eyebrow">
                        Compatibility
                    </span>

                    <h3>
                        {getMatchLabel(
                            score
                        )}
                    </h3>

                    <p>
                        Based on the skills and requirements
                        detected in the job description.
                    </p>

                </div>

            </div>

            <div className="match-columns">

                <MatchList
                    title="Matching skills"
                    items={
                        result.matchingSkills
                    }
                    type="success"
                />

                <MatchList
                    title="Missing skills"
                    items={
                        result.missingSkills
                    }
                    type="warning"
                />

            </div>

            <div className="recommendations">

                <span className="eyebrow">
                    Recommendations
                </span>

                {result.recommendations?.length ? (
                    result.recommendations.map(
                        (
                            recommendation,
                            index
                        ) => (
                            <div
                                className="recommendation"
                                key={index}
                            >
                                <span>
                                    {String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </span>

                                <p>
                                    {recommendation}
                                </p>
                            </div>
                        )
                    )
                ) : (
                    <EmptyInline text="No recommendations returned." />
                )}

            </div>

        </div>
    );
}

function AssistantPage({
    resumeId,
    messages,
    input,
    setInput,
    askAssistant,
    handleKeyDown,
    state
}) {
    const suggestions = [
        "What skills do I have?",
        "What are my strongest projects?",
        "What skills am I missing?",
        "Summarize my experience"
    ];

    return (
        <>
            <PageHeader
                eyebrow="AI Assistant"
                title="Your resume copilot"
                description="Ask questions about your resume and get contextual career guidance."
            />

            <section className="assistant-workspace">

                <div className="assistant-topbar">

                    <div className="assistant-identity">

                        <div className="assistant-mini-icon">
                            ✦
                        </div>

                        <div>
                            <strong>
                                ResumeAI
                            </strong>

                            <span>
                                {resumeId
                                    ? "Connected to your resume"
                                    : "Waiting for a resume"}
                            </span>
                        </div>

                    </div>

                    <div className="assistant-status">
                        <span className="status-dot"></span>
                        RAG enabled
                    </div>

                </div>

                {messages.length === 0 ? (
                    <div className="assistant-welcome">

                        <div className="assistant-welcome-icon">
                            ✦
                        </div>

                        <span className="eyebrow">
                            Resume intelligence
                        </span>

                        <h2>
                            Ask anything about your resume
                        </h2>

                        <p>
                            ResumeAI searches the relevant parts
                            of your uploaded resume before generating
                            an answer.
                        </p>

                        <div className="assistant-suggestions">

                            {suggestions.map(
                                (suggestion) => (
                                    <button
                                        key={suggestion}
                                        className="suggestion-chip"
                                        onClick={() => {
                                            if (!resumeId) {
                                                setInput(
                                                    suggestion
                                                );
                                                return;
                                            }

                                            setInput(
                                                suggestion
                                            );
                                        }}
                                        disabled={
                                            !resumeId
                                        }
                                    >
                                        <span>↗</span>
                                        {suggestion}
                                    </button>
                                )
                            )}

                        </div>

                        {!resumeId && (
                            <button
                                className="assistant-upload-link"
                                onClick={() => {
                                    window.scrollTo({
                                        top: 0,
                                        behavior: "smooth"
                                    });
                                }}
                            >
                                Upload your resume to start chatting
                            </button>
                        )}

                    </div>
                ) : (
                    <div className="chat-messages">

                        {messages.map(
                            (message, index) => (
                                <div
                                    key={index}
                                    className={`chat-row ${message.role}`}
                                >

                                    {message.role ===
                                        "assistant" && (
                                        <div className="chat-avatar assistant-avatar">
                                            ✦
                                        </div>
                                    )}

                                    <div className="chat-content">

                                        <div className="chat-role">
                                            {message.role ===
                                            "user"
                                                ? "You"
                                                : "ResumeAI"}
                                        </div>

                                        <div className="chat-text">
                                            {message.content}
                                        </div>

                                    </div>

                                    {message.role ===
                                        "user" && (
                                        <div className="chat-avatar user-avatar">
                                            V
                                        </div>
                                    )}

                                </div>
                            )
                        )}

                        {state === "loading" && (
                            <div className="chat-row assistant">

                                <div className="chat-avatar assistant-avatar">
                                    ✦
                                </div>

                                <div className="chat-content">

                                    <div className="chat-role">
                                        ResumeAI
                                    </div>

                                    <div className="chat-thinking">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>

                                </div>

                            </div>
                        )}

                    </div>
                )}

                <div className="assistant-composer">

                    <div className="composer-inner">

                        <textarea
                            value={input}
                            onChange={(event) =>
                                setInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            placeholder={
                                resumeId
                                    ? "Ask about your resume..."
                                    : "Upload your resume to start chatting..."
                            }
                            disabled={
                                !resumeId ||
                                state === "loading"
                            }
                            rows="1"
                        />

                        <button
                            className="chat-send-button"
                            onClick={askAssistant}
                            disabled={
                                !resumeId ||
                                !input.trim() ||
                                state === "loading"
                            }
                        >
                            {state === "loading" ? (
                                <span className="mini-spinner"></span>
                            ) : (
                                "↑"
                            )}
                        </button>

                        <div className="composer-meta">
                            <span>
                                {state === "loading"
                                    ? "ResumeAI is thinking..."
                                    : "Enter to send · Shift + Enter for a new line"}
                            </span>

                            <span>
                                {input.length}/1000
                            </span>
                        </div>

                    </div>

                </div>

                <div className="assistant-footer">
                    Gemini RAG · Responses are grounded in your uploaded resume
                </div>

            </section>
        </>
    );
}

function AnalysisLoading() {
    return (
        <div className="analysis-loading panel">

            <div className="loading-orb">
                ✦
            </div>

            <div>
                <h2>
                    Building your profile
                </h2>

                <p>
                    Gemini is analyzing your resume.
                    This may take a few seconds.
                </p>
            </div>

            <div className="analysis-progress">
                <LoadingStep text="Reading resume content" />
                <LoadingStep text="Extracting skills and experience" />
                <LoadingStep text="Generating profile insights" />
            </div>

        </div>
    );
}

function LoadingStep({ text }) {
    return (
        <div className="loading-step">

            <span className="loading-spinner"></span>

            <span>
                {text}
            </span>

        </div>
    );
}

function MatchLoading() {
    return (
        <div className="match-loading">

            <span className="loading-spinner large"></span>

            <strong>
                Comparing your profile
            </strong>

            <span>
                Evaluating skills and requirements...
            </span>

        </div>
    );
}

function AnalysisCard({
    title,
    icon,
    items,
    emptyText
}) {
    return (
        <section className="panel analysis-card">

            <div className="analysis-card-header">

                <div className="analysis-card-icon">
                    {icon}
                </div>

                <div>
                    <h3>
                        {title}
                    </h3>

                    <span>
                        {items?.length || 0} items
                    </span>
                </div>

            </div>

            {items?.length ? (
                <div className="tag-list">

                    {items.map(
                        (item, index) => (
                            <span
                                className="skill-tag"
                                key={index}
                            >
                                {item}
                            </span>
                        )
                    )}

                </div>
            ) : (
                <EmptyInline
                    text={emptyText}
                />
            )}

        </section>
    );
}

function MatchList({
    title,
    items,
    type
}) {
    return (
        <div className="match-list">

            <h4>
                {title}
            </h4>

            {items?.length ? (
                items.map(
                    (item, index) => (
                        <div
                            className={`match-list-item ${type}`}
                            key={index}
                        >
                            <span>
                                {type ===
                                "success"
                                    ? "✓"
                                    : "−"}
                            </span>

                            {item}
                        </div>
                    )
                )
            ) : (
                <EmptyInline text="None identified." />
            )}

        </div>
    );
}

function MetricCard({
    label,
    value,
    detail,
    icon,
    status
}) {
    return (
        <div className="metric-card">

            <div className="metric-header">

                <span>
                    {label}
                </span>

                <div className="metric-icon">
                    {icon}
                </div>

            </div>

            <strong className="metric-value">
                {value}
            </strong>

            <span
                className={
                    status
                        ? "metric-detail positive"
                        : "metric-detail"
                }
            >
                {status && (
                    <span className="status-dot"></span>
                )}

                {detail}
            </span>

        </div>
    );
}

function PageHeader({
    eyebrow,
    title,
    description
}) {
    return (
        <header className="page-header">

            <span className="eyebrow">
                {eyebrow}
            </span>

            <h1>
                {title}
            </h1>

            <p>
                {description}
            </p>

        </header>
    );
}

function PanelHeader({
    title,
    description
}) {
    return (
        <div className="panel-header">

            <div>

                <h2>
                    {title}
                </h2>

                {description && (
                    <p>
                        {description}
                    </p>
                )}

            </div>

        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
    action,
    onClick
}) {
    return (
        <div className="empty-state">

            <div className="empty-icon">
                {icon}
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {description}
            </p>

            {action && (
                <button
                    className="secondary-button"
                    onClick={onClick}
                >
                    {action}
                </button>
            )}

        </div>
    );
}

function ErrorState({
    title,
    description,
    action,
    onClick
}) {
    return (
        <div className="error-state">

            <div className="error-state-icon">
                !
            </div>

            <div>

                <h3>
                    {title}
                </h3>

                <p>
                    {description}
                </p>

            </div>

            {action && (
                <button
                    className="secondary-button"
                    onClick={onClick}
                >
                    {action}
                </button>
            )}

        </div>
    );
}

function EmptyInline({ text }) {
    return (
        <div className="empty-inline">
            {text}
        </div>
    );
}

function ActivityItem({
    active,
    icon,
    title,
    description
}) {
    return (
        <div
            className={`activity-item ${
                active
                    ? "completed"
                    : ""
            }`}
        >
            <div className="activity-icon">
                {icon}
            </div>

            <div>

                <strong>
                    {title}
                </strong>

                <span>
                    {description}
                </span>

            </div>

            <span className="activity-status">
                {active
                    ? "Complete"
                    : "Pending"}
            </span>

        </div>
    );
}

function WorkflowStep({
    number,
    title,
    description,
    active
}) {
    return (
        <div
            className={`workflow-step ${
                active
                    ? "active"
                    : ""
            }`}
        >
            <div className="workflow-number">
                {number}
            </div>

            <div>

                <strong>
                    {title}
                </strong>

                <p>
                    {description}
                </p>

            </div>

        </div>
    );
}

function getSectionTitle(section) {
    const titles = {
        dashboard: "Dashboard",
        resume: "Resume",
        analysis: "AI Analysis",
        match: "Job Match",
        assistant: "AI Assistant"
    };

    return (
        titles[section] ||
        "Dashboard"
    );
}

function getMatchLabel(score) {
    if (score >= 85) {
        return "Excellent match";
    }

    if (score >= 70) {
        return "Strong match";
    }

    if (score >= 50) {
        return "Moderate match";
    }

    return "Needs improvement";
}

function formatFileSize(bytes) {
    if (!bytes) {
        return "0 KB";
    }

    const mb =
        bytes /
        (1024 * 1024);

    if (mb >= 1) {
        return `${mb.toFixed(
            2
        )} MB`;
    }

    return `${Math.ceil(
        bytes / 1024
    )} KB`;
}

export default App;

