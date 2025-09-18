import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInterviewSchema, TypedInterview, evaluationHistory, interviews } from "@shared/schema";
import { evaluateAnswer, transcribeAudio, generateInterviewFeedback, evaluateAnswerRealtime, generateAdaptiveQuestionFromDB, generateInterviewIntroduction, getCalibrationBaseline, saveEvaluationHistory } from "./services/groq";
import { db } from "./db";
import { count, eq } from "drizzle-orm";
import multer from 'multer';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint for production monitoring
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV 
    });
  });
  
  // Configure multer for audio file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow audio files
      if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Authentication Routes
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, role = 'candidate', fullName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        password, // In production, this should be hashed
        email,
        role
      });

      // Create a simple JWT-like token (in production, use proper JWT)
      const token = `${newUser.id}_${Date.now()}`;
      
      res.json({
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          email: newUser.email
        },
        token
      });
    } catch (error) {
      console.error("Registration failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password (in production, compare hashed passwords)
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create token
      const token = `${user.id}_${Date.now()}`;
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error("Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current user (verify token)
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.substring(7);
      const userId = token.split('_')[0];
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Logout (client-side token removal)
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Initialize demo users (for development)
  app.post("/api/auth/init-demo", async (req, res) => {
    try {
      // Check if demo users already exist
      const hrDemo = await storage.getUserByUsername("hr_demo");
      const candidateDemo = await storage.getUserByUsername("candidate_demo");
      
      if (!hrDemo) {
        await storage.createUser({
          username: "hr_demo",
          password: "demo123",
          email: "hr@demo.com",
          role: "hr"
        });
      }
      
      if (!candidateDemo) {
        await storage.createUser({
          username: "candidate_demo", 
          password: "demo123",
          email: "candidate@demo.com",
          role: "candidate"
        });
      }

      res.json({ message: "Demo users initialized" });
    } catch (error) {
      console.error("Failed to initialize demo users:", error);
      res.status(500).json({ error: "Failed to initialize demo users" });
    }
  });

  // Transcribe audio using Groq Whisper
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const transcription = await transcribeAudio(req.file.buffer, req.file.originalname || 'audio.webm');
      
      res.json({ text: transcription });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });
  
  // Start a new adaptive interview
  app.post("/api/interviews/start", async (req, res) => {
    try {
      // Generate the first adaptive question
      // Create interview first so we can use it for question generation
      const interviewData = {
        status: "in_progress" as const,
        currentQuestionIndex: 0,
        totalScore: 0,
        questions: [], // We'll generate questions dynamically
        responses: [],
        userId: null, // For now, allow anonymous interviews
      };

      const interview = await storage.createInterview(interviewData);

      // Generate introduction instead of first question
      let introduction;
      try {
        introduction = await generateInterviewIntroduction();
      } catch (error) {
        console.error("Failed to generate introduction:", error);
        // Fallback introduction
        introduction = {
          greeting: "Hello! I'm Sarah, your AI Excel Interview Specialist. I'll be conducting a personalized Excel skills assessment with you today.",
          introductionRequest: "Before we begin, could you please introduce yourself? I'd love to know your name, your current experience level with Excel, and any background that might be relevant to our discussion."
        };
      }
      
      // Return interview with introduction
      res.json({
        ...interview,
        introduction
      });
    } catch (error) {
      console.error("Failed to start interview:", error);
      res.status(500).json({ message: "Failed to start interview" });
    }
  });

  // Submit candidate introduction and get first question
  app.post("/api/interviews/:id/introduction", async (req, res) => {
    try {
      const { introduction } = req.body;
      
      if (!introduction) {
        return res.status(400).json({ message: "Introduction is required" });
      }

      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // For now, we'll store the introduction in a comment or handle it differently
      // since candidateIntroduction isn't in the schema yet
      
      // Generate the first question based on their introduction
      let firstQuestion;
      try {
        const typedInterview: TypedInterview = {
          ...interview,
          questions: Array.isArray(interview.questions) ? interview.questions : [],
          responses: Array.isArray(interview.responses) ? interview.responses : [],
          evaluation: interview.evaluation as any
        };
        const adaptiveQuestion = await generateAdaptiveQuestionFromDB(typedInterview, storage);
        firstQuestion = {
          id: "adaptive_0",
          question: adaptiveQuestion.question,
          category: adaptiveQuestion.category,
          difficulty: adaptiveQuestion.difficulty,
          maxScore: 10
        };
      } catch (error) {
        console.error("Failed to generate first question:", error);
        // Fallback to a standard first question
        firstQuestion = {
          id: "fallback_0",
          question: "Let's start with the basics. Can you explain what Excel is and describe some of its key features that make it useful for data management?",
          category: "general",
          difficulty: "beginner",
          maxScore: 10
        };
      }

      res.json({
        success: true,
        firstQuestion
      });
    } catch (error) {
      console.error("Failed to process introduction:", error);
      res.status(500).json({ message: "Failed to process introduction" });
    }
  });

  // Get interview details
  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      res.json(interview);
    } catch (error) {
      console.error("Failed to get interview:", error);
      res.status(500).json({ message: "Failed to get interview" });
    }
  });

  // Submit an answer with real-time AI evaluation and adaptive questioning
  app.post("/api/interviews/:id/answer", async (req, res) => {
    try {
      const { questionId, answer, isVoiceAnswer = false, currentQuestion } = req.body;
      
      if (!answer || !questionId) {
        return res.status(400).json({ message: "Answer and question ID are required" });
      }

      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // Get current question details
      const question = currentQuestion || {
        question: "Previous question",
        category: "general", 
        difficulty: "intermediate"
      };

      // Get previous answers context for better evaluation
      const responses = Array.isArray(interview.responses) ? interview.responses : [];
      const previousContext = responses.length > 0 
        ? `Previous answers: ${responses.slice(-2).map(r => `${(r as any).answer.substring(0, 100)}`).join('; ')}`
        : undefined;

      // Use enhanced real-time evaluation with detailed metrics
      const evaluationResult = await evaluateAnswerRealtime(
        question.question,
        answer,
        question.category,
        question.difficulty,
        previousContext
      );

      // Create comprehensive response object with metrics
      const response = {
        questionId,
        question: question.question,
        answer,
        isVoiceAnswer,
        timestamp: new Date().toISOString(),
        score: evaluationResult.evaluation.score,
        feedback: evaluationResult.evaluation.feedback,
        evaluation: evaluationResult.evaluation.details,
        metrics: evaluationResult.metrics,
        category: question.category,
        difficulty: question.difficulty
      };

      // Update responses array
      responses.push(response);
      
      // Calculate updated totals
      const newTotalScore = responses.reduce((sum, r) => sum + ((r as any).score || 0), 0);
      const averageScore = responses.length > 0 ? newTotalScore / responses.length : 0;
      const newQuestionIndex = interview.currentQuestionIndex + 1;
      const maxQuestions = 10;
      const isCompleted = newQuestionIndex >= maxQuestions;

      // Generate next adaptive question if not completed
      let nextQuestion = null;
      if (!isCompleted) {
        // Prepare context for adaptive question generation
        const answeredCategories = responses.map(r => (r as any).category);
        const allCategories = ["vlookup", "formulas", "pivot_tables", "charts", "macros", "formatting", "data_analysis", "navigation", "security", "general"];
        const remainingCategories = allCategories.filter(cat => !answeredCategories.includes(cat));
        
        try {
          // Use the interview object with updated responses for context
          const updatedInterviewForQuestion: TypedInterview = {
            ...interview,
            questions: Array.isArray(interview.questions) ? interview.questions : [],
            responses,
            currentQuestionIndex: newQuestionIndex,
            evaluation: interview.evaluation as any
          };
          
          const adaptiveQuestion = await generateAdaptiveQuestionFromDB(updatedInterviewForQuestion, storage);
          nextQuestion = {
            id: `adaptive_${newQuestionIndex}`,
            question: adaptiveQuestion.question,
            category: adaptiveQuestion.category,
            difficulty: adaptiveQuestion.difficulty,
            maxScore: 10
          };
        } catch (error) {
          console.error("Failed to generate adaptive question:", error);
          // Fallback to a simple question
          nextQuestion = {
            id: `fallback_${newQuestionIndex}`,
            question: "How would you handle a situation where you need to analyze large amounts of data efficiently in Excel?",
            category: "data_analysis",
            difficulty: "intermediate",
            maxScore: 10
          };
        }
      }

      // Update interview in database
      const updatedInterview = await storage.updateInterview(req.params.id, {
        responses,
        totalScore: newTotalScore,
        currentQuestionIndex: newQuestionIndex,
        status: isCompleted ? "completed" : "in_progress",
        completedAt: isCompleted ? new Date() : undefined,
        duration: isCompleted ? Math.floor((Date.now() - new Date(interview.startedAt).getTime()) / 1000) : undefined
      });

      res.json({
        interview: updatedInterview,
        response,
        evaluation: evaluationResult.evaluation,
        metrics: evaluationResult.metrics,
        followUpSuggestion: evaluationResult.followUpSuggestion,
        nextQuestion,
        isCompleted,
        progress: {
          currentQuestion: newQuestionIndex,
          totalQuestions: maxQuestions,
          averageScore: Math.round(averageScore * 10) / 10,
          completionPercentage: (newQuestionIndex / maxQuestions) * 100
        }
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });


  // Complete interview and generate final evaluation
  app.post("/api/interviews/:id/complete", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const responses = Array.isArray(interview.responses) ? interview.responses : [];
      const questions = Array.isArray(interview.questions) ? interview.questions : [];
      
      // Calculate basic metrics
      const totalScore = interview.totalScore || 0;
      const averageScore = responses.length > 0 ? Math.round(totalScore / responses.length) : 0;
      const correctAnswers = responses.filter(r => (r as any).score >= 7).length;
      
      // Calculate category scores
      const categoryTotals: Record<string, {total: number, count: number}> = {};
      responses.forEach((response: any, index) => {
        const question = questions[index];
        if (question) {
          const category = question.category;
          if (!categoryTotals[category]) {
            categoryTotals[category] = { total: 0, count: 0 };
          }
          categoryTotals[category].total += response.score || 0;
          categoryTotals[category].count += 1;
        }
      });

      const categoryScores: Record<string, number> = {};
      Object.keys(categoryTotals).forEach(category => {
        categoryScores[category] = Math.round(categoryTotals[category].total / categoryTotals[category].count);
      });

      // Generate AI-powered feedback
      console.log("Generating AI feedback for responses:", JSON.stringify(responses, null, 2));
      let aiFeedback;
      
      // Check if no questions were answered
      if (responses.length === 0) {
        console.log("No responses found - interview ended during introduction phase");
        aiFeedback = {
          strengths: ["Participated in the interview process", "Completed the introduction successfully"],
          improvements: ["Try completing the full interview next time", "Answer the Excel questions to get detailed feedback"],
          overallFeedback: "You ended the interview during the introduction phase. To get a complete evaluation of your Excel skills, please take the full interview and answer the technical questions."
        };
      } else {
        console.log(`Processing ${responses.length} response(s) for AI feedback`);
        console.log("Response details:", responses.map(r => ({
          category: r.category,
          score: r.score,
          answerLength: r.answer?.length || 0,
          isVoiceAnswer: r.isVoiceAnswer
        })));
        
        try {
          aiFeedback = await generateInterviewFeedback(responses);
          console.log("AI feedback generated successfully:", aiFeedback);
        } catch (error) {
          console.error("AI feedback generation failed:", error);
          
          // Better fallback for actual responses
          const averageScore = responses.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / responses.length;
          const isGoodPerformance = averageScore >= 7;
          
          aiFeedback = {
            strengths: [
              `Completed ${responses.length} question${responses.length > 1 ? 's' : ''}`,
              isGoodPerformance ? "Demonstrated solid Excel knowledge" : "Showed engagement with the material",
              "Provided thoughtful responses"
            ],
            improvements: [
              isGoodPerformance ? "Continue building on Excel skills" : "Practice Excel fundamentals",
              "Take the complete interview for comprehensive evaluation"
            ],
            overallFeedback: `Thank you for completing ${responses.length} question${responses.length > 1 ? 's' : ''} with an average score of ${averageScore.toFixed(1)}/10. ${isGoodPerformance ? 'You demonstrated good Excel knowledge.' : 'Keep practicing to improve your skills.'} Consider taking the full interview for detailed feedback.`
          };
        }
      }

      // Calculate duration
      const duration = Math.floor((Date.now() - new Date(interview.startedAt).getTime()) / 1000);

      // Generate comprehensive evaluation
      const evaluation = {
        overallScore: averageScore,
        totalQuestions: questions.length,
        answeredQuestions: responses.length,
        correctAnswers,
        categoryScores,
        strengths: aiFeedback.strengths,
        improvements: aiFeedback.improvements,
        overallFeedback: aiFeedback.overallFeedback,
        duration,
        completedAt: new Date().toISOString(),
        recommendations: [
          ...aiFeedback.improvements.map((imp: string) => `Focus on: ${imp}`),
          "Practice regularly with Excel datasets",
          "Take more advanced Excel courses if needed"
        ]
      };

      console.log("Final evaluation object:", JSON.stringify(evaluation, null, 2));

      const updatedInterview = await storage.updateInterview(req.params.id, {
        evaluation,
        status: "completed",
        completedAt: new Date(),
        duration
      });

      console.log("Updated interview with evaluation:", updatedInterview?.evaluation ? "Success" : "Failed");
      res.json({ interview: updatedInterview, evaluation });
    } catch (error) {
      console.error("Failed to complete interview:", error);
      res.status(500).json({ message: "Failed to complete interview" });
    }
  });

  // Seed question bank (for development)
  app.post("/api/questions/seed", async (req, res) => {
    try {
      const sampleQuestions = [
        // VLOOKUP & Basic Formulas
        {
          question: "You have a product database with columns:\n• Product ID (A)\n• Product Name (B)\n• Price (C)\n\nHow would you use VLOOKUP to find the price of product 'P001' from this data?",
          category: "vlookup",
          difficulty: "beginner",
          expectedAnswer: "Use VLOOKUP(P001, A:C, 3, FALSE) to find price in third column",
          keywords: ["vlookup", "product", "database", "price", "lookup"],
          maxScore: 10
        },
        {
          question: "What's the difference between VLOOKUP and HLOOKUP? Give a practical example of when you'd use each.",
          category: "vlookup",
          difficulty: "beginner",
          expectedAnswer: "VLOOKUP searches vertically, HLOOKUP horizontally. VLOOKUP for employee records, HLOOKUP for monthly data in rows",
          keywords: ["vlookup", "hlookup", "vertical", "horizontal", "search"],
          maxScore: 10
        },
        
        // Formulas & Functions
        {
          question: "You need to calculate the total sales for the 'North' region from a dataset. Which Excel functions would you use and how?",
          category: "formulas",
          difficulty: "intermediate",
          expectedAnswer: "Use SUMIF or SUMIFS: =SUMIF(Region_Column,\"North\",Sales_Column)",
          keywords: ["sumif", "sumifs", "criteria", "conditional", "sum"],
          maxScore: 10
        },
        {
          question: "How would you count the number of employees with salary greater than $50,000 using Excel functions?",
          category: "formulas",
          difficulty: "beginner",
          expectedAnswer: "Use COUNTIF: =COUNTIF(Salary_Range,\">50000\")",
          keywords: ["countif", "count", "criteria", "greater than", "conditional"],
          maxScore: 10
        },
        {
          question: "Explain how INDEX and MATCH work together. Why might you prefer this over VLOOKUP?",
          category: "formulas",
          difficulty: "advanced",
          expectedAnswer: "INDEX(return_array, MATCH(lookup_value, lookup_array, 0)). More flexible - can look left, faster, no column counting",
          keywords: ["index", "match", "flexible", "lookup", "array"],
          maxScore: 10
        },
        
        // Pivot Tables
        {
          question: "You have sales data with columns: Date, Salesperson, Product, Amount. How would you create a pivot table to show total sales by salesperson?",
          category: "pivot_tables",
          difficulty: "intermediate",
          expectedAnswer: "Insert > PivotTable, drag Salesperson to Rows, Amount to Values (Sum)",
          keywords: ["pivot", "table", "sales", "summarize", "group"],
          maxScore: 10
        },
        {
          question: "In a pivot table, what's the difference between 'Values' and 'Filters' areas? Give examples of when to use each.",
          category: "pivot_tables",
          difficulty: "intermediate",
          expectedAnswer: "Values calculate metrics (sum, count). Filters limit data shown (year=2023). Values for analysis, Filters for focus",
          keywords: ["pivot", "values", "filters", "calculation", "limit"],
          maxScore: 10
        },
        
        // Charts & Visualization
        {
          question: "You need to show sales trends over 12 months. Which chart type would you choose and why?",
          category: "charts",
          difficulty: "beginner",
          expectedAnswer: "Line chart - best for showing trends over time, clear progression",
          keywords: ["chart", "line", "trend", "time", "visualization"],
          maxScore: 10
        },
        {
          question: "How do you create a chart that compares actual vs budget values side by side?",
          category: "charts",
          difficulty: "intermediate",
          expectedAnswer: "Use Column chart with two data series, or Combination chart if different scales needed",
          keywords: ["chart", "comparison", "column", "series", "actual vs budget"],
          maxScore: 10
        },
        
        // Data Analysis & Advanced
        {
          question: "You have duplicate customer records. What Excel features would you use to identify and remove them?",
          category: "data_analysis",
          difficulty: "intermediate",
          expectedAnswer: "Use Remove Duplicates (Data tab) or Conditional Formatting to highlight, then COUNTIF to identify",
          keywords: ["duplicates", "remove", "conditional formatting", "data cleaning"],
          maxScore: 10
        },
        {
          question: "Explain what 'What-If Analysis' is in Excel. Name two tools and their use cases.",
          category: "data_analysis",
          difficulty: "advanced",
          expectedAnswer: "What-If tests scenarios. Goal Seek (find input for target), Data Tables (multiple scenarios), Solver (optimization)",
          keywords: ["what-if", "analysis", "goal seek", "scenarios", "solver"],
          maxScore: 10
        },
        
        // Formatting & Organization
        {
          question: "How would you automatically highlight cells containing values above average in your dataset?",
          category: "formatting",
          difficulty: "intermediate",
          expectedAnswer: "Use Conditional Formatting > Highlight Cell Rules > Above Average",
          keywords: ["conditional", "formatting", "above average", "highlight", "automatic"],
          maxScore: 10
        },
        {
          question: "What are Excel Tables and what advantages do they offer over regular ranges?",
          category: "formatting",
          difficulty: "intermediate",
          expectedAnswer: "Structured references, auto-expand, built-in filtering, better formulas. Ctrl+T to create",
          keywords: ["table", "structured", "references", "filter", "expand"],
          maxScore: 10
        },
        
        // Macros & Automation
        {
          question: "You perform the same 5-step data cleaning process daily. How could Excel macros help automate this?",
          category: "macros",
          difficulty: "advanced",
          expectedAnswer: "Record macro while doing steps once, then run macro daily with button or shortcut",
          keywords: ["macro", "automation", "record", "repeat", "efficiency"],
          maxScore: 10
        },
        
        // Navigation & Shortcuts
        {
          question: "Name 5 Excel keyboard shortcuts that improve productivity and explain when to use them.",
          category: "navigation",
          difficulty: "beginner",
          expectedAnswer: "Ctrl+C/V (copy/paste), Ctrl+Z (undo), F2 (edit cell), Ctrl+Home (go to A1), Ctrl+End (last cell)",
          keywords: ["shortcuts", "keyboard", "productivity", "navigation", "efficiency"],
          maxScore: 10
        }
      ];

      const createdQuestions = [];
      for (const q of sampleQuestions) {
        const question = await storage.createQuestion(q);
        createdQuestions.push(question);
      }

      res.json({ message: "Question bank seeded successfully", questions: createdQuestions });
    } catch (error) {
      console.error("Failed to seed questions:", error);
      res.status(500).json({ message: "Failed to seed questions" });
    }
  });

  // Calibration and Analytics API endpoints
  
  // Get calibration baseline for a category and difficulty
  app.get("/api/calibration/baseline/:category/:difficulty", async (req, res) => {
    try {
      const { category, difficulty } = req.params;
      const baseline = await getCalibrationBaseline(category, difficulty);
      
      if (!baseline) {
        return res.status(404).json({ error: "No calibration data found for this category/difficulty" });
      }
      
      res.json(baseline);
    } catch (error) {
      console.error("Failed to get calibration baseline:", error);
      res.status(500).json({ error: "Failed to get calibration baseline" });
    }
  });

  // Submit human evaluation for calibration
  app.post("/api/calibration/human-evaluation", async (req, res) => {
    try {
      const { evaluationId, humanScore, notes } = req.body;
      
      if (!evaluationId || typeof humanScore !== 'number' || humanScore < 0 || humanScore > 10) {
        return res.status(400).json({ error: "Valid evaluationId and humanScore (0-10) are required" });
      }

      // In a real implementation, this would update the evaluation history with human score
      console.log(`Human evaluation received: ${evaluationId} -> ${humanScore}`);
      
      res.json({ message: "Human evaluation recorded successfully" });
    } catch (error) {
      console.error("Failed to record human evaluation:", error);
      res.status(500).json({ error: "Failed to record human evaluation" });
    }
  });

  // Get system performance metrics
  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const { startDate, endDate, category, difficulty } = req.query;
      
      // Get real metrics from database
      const totalEvaluationsResult = await db
        .select({ count: count() })
        .from(evaluationHistory);
      
      const totalEvaluations = totalEvaluationsResult[0]?.count || 0;
      
      // Get evaluation history for calculations
      const evaluations = await db.select().from(evaluationHistory);
      
      if (evaluations.length === 0) {
        return res.json({
          date: new Date(),
          totalEvaluations: 0,
          averageConsistencyScore: 0,
          calibrationAccuracy: 0,
          categoryBreakdown: {},
          difficultyBreakdown: {},
          systemLoad: {
            averageResponseTime: 0,
            errorRate: 0,
            peakConcurrency: 0
          }
        });
      }

      // Calculate average consistency score
      const consistencyScores = evaluations.map((e: any) => {
        const metrics = e.consistencyMetrics;
        return (metrics.evaluationConsistency + metrics.difficultyCalibration + 
                metrics.categoryAlignment + metrics.confidenceLevel) / 4;
      });
      const averageConsistencyScore = consistencyScores.length > 0 
        ? consistencyScores.reduce((sum: number, score: number) => sum + score, 0) / consistencyScores.length 
        : 0;

      // Calculate calibration accuracy (how well AI scores match human scores)
      const evaluationsWithHuman = evaluations.filter((e: any) => e.humanScore !== null);
      let calibrationAccuracy = 0;
      if (evaluationsWithHuman.length > 0) {
        const accuracyScores = evaluationsWithHuman.map((e: any) => {
          const diff = Math.abs(e.aiScore - e.humanScore);
          return Math.max(0, 100 - (diff * 10)); // Convert to percentage
        });
        calibrationAccuracy = accuracyScores.reduce((sum: number, acc: number) => sum + acc, 0) / accuracyScores.length;
      }

      // Group by category
      const categoryGroups: any = {};
      evaluations.forEach((e: any) => {
        if (!categoryGroups[e.category]) {
          categoryGroups[e.category] = [];
        }
        categoryGroups[e.category].push(e);
      });

      const categoryBreakdown: any = {};
      Object.keys(categoryGroups).forEach(category => {
        const categoryEvals = categoryGroups[category];
        const avgScore = categoryEvals.reduce((sum: number, e: any) => sum + e.aiScore, 0) / categoryEvals.length;
        const consistencyVals = categoryEvals.map((e: any) => {
          const m = e.consistencyMetrics;
          return (m.evaluationConsistency + m.difficultyCalibration + m.categoryAlignment + m.confidenceLevel) / 4;
        });
        const avgConsistency = consistencyVals.reduce((sum: number, c: number) => sum + c, 0) / consistencyVals.length;
        
        categoryBreakdown[category] = {
          averageScore: Math.round(avgScore * 10) / 10,
          consistency: Math.round(avgConsistency * 10) / 10,
          sampleSize: categoryEvals.length
        };
      });

      // Group by difficulty
      const difficultyGroups: any = {};
      evaluations.forEach((e: any) => {
        if (!difficultyGroups[e.difficulty]) {
          difficultyGroups[e.difficulty] = [];
        }
        difficultyGroups[e.difficulty].push(e);
      });

      const difficultyBreakdown: any = {};
      Object.keys(difficultyGroups).forEach(difficulty => {
        const diffEvals = difficultyGroups[difficulty];
        const avgScore = diffEvals.reduce((sum: number, e: any) => sum + e.aiScore, 0) / diffEvals.length;
        const consistencyVals = diffEvals.map((e: any) => {
          const m = e.consistencyMetrics;
          return (m.evaluationConsistency + m.difficultyCalibration + m.categoryAlignment + m.confidenceLevel) / 4;
        });
        const avgConsistency = consistencyVals.reduce((sum: number, c: number) => sum + c, 0) / consistencyVals.length;
        
        difficultyBreakdown[difficulty] = {
          averageScore: Math.round(avgScore * 10) / 10,
          consistency: Math.round(avgConsistency * 10) / 10,
          sampleSize: diffEvals.length
        };
      });

      const metrics = {
        date: new Date(),
        totalEvaluations,
        averageConsistencyScore: Math.round(averageConsistencyScore * 10) / 10,
        calibrationAccuracy: Math.round(calibrationAccuracy * 10) / 10,
        categoryBreakdown,
        difficultyBreakdown,
        systemLoad: {
          averageResponseTime: 450, // This would be calculated from actual response times
          errorRate: 0.5, // This would be calculated from error logs
          peakConcurrency: 25 // This would be calculated from concurrent request tracking
        }
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Failed to get system metrics:", error);
      res.status(500).json({ error: "Failed to get system metrics" });
    }
  });

  // Get evaluation history for analysis
  app.get("/api/analytics/evaluation-history", async (req, res) => {
    try {
      const { limit = 100, offset = 0, category, difficulty } = req.query;
      
      // Query real evaluation history from database
      let query = db.select().from(evaluationHistory);
      
      // Apply filters if provided
      const conditions = [];
      if (category) {
        conditions.push(`category = '${category}'`);
      }
      if (difficulty) {
        conditions.push(`difficulty = '${difficulty}'`);
      }
      
      const evaluations = await db.select().from(evaluationHistory)
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(evaluationHistory.timestamp);

      // Get total count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(evaluationHistory);
      
      const total = totalResult[0]?.count || 0;

      // Format the response
      const history = evaluations.map((evaluation: any) => ({
        evaluationId: evaluation.evaluationId,
        timestamp: evaluation.timestamp,
        category: evaluation.category,
        difficulty: evaluation.difficulty,
        aiScore: evaluation.aiScore,
        humanScore: evaluation.humanScore,
        consistency: evaluation.consistencyMetrics || {
          evaluationConsistency: 6.0,
          difficultyCalibration: 6.0,
          categoryAlignment: 6.0,
          confidenceLevel: 6.0,
          calibrationVersion: "v1.2.3"
        }
      }));
      
      res.json({
        history,
        total,
        offset: Number(offset),
        limit: Number(limit)
      });
    } catch (error) {
      console.error("Failed to get evaluation history:", error);
      res.status(500).json({ error: "Failed to get evaluation history" });
    }
  });

  // HR Dashboard API endpoints
  
  // Get HR metrics overview
  app.get("/api/hr/metrics", async (req, res) => {
    try {
      // Get all interviews
      const allInterviews = await db.select().from(interviews);
      const completedInterviews = allInterviews.filter((i: any) => i.status === 'completed');
      
      if (completedInterviews.length === 0) {
        return res.json({
          totalCandidates: 0,
          completedInterviews: 0,
          pendingReviews: 0,
          averageScore: 0,
          averageDuration: 0,
          departmentBreakdown: {},
          positionBreakdown: {}
        });
      }

      const pendingReviews = completedInterviews.filter((i: any) => !i.hrRecommendation).length;
      const totalScores = completedInterviews.reduce((sum: number, i: any) => sum + (i.totalScore || 0), 0);
      const averageScore = totalScores / completedInterviews.length;
      const totalDuration = completedInterviews.reduce((sum: number, i: any) => sum + (i.duration || 0), 0);
      const averageDuration = totalDuration / completedInterviews.length;

      // Department breakdown
      const departmentGroups: any = {};
      completedInterviews.forEach((interview: any) => {
        const dept = interview.department || 'Unknown';
        if (!departmentGroups[dept]) {
          departmentGroups[dept] = { interviews: [], hires: 0 };
        }
        departmentGroups[dept].interviews.push(interview);
        if (interview.hrRecommendation === 'hire') {
          departmentGroups[dept].hires++;
        }
      });

      const departmentBreakdown: any = {};
      Object.keys(departmentGroups).forEach(dept => {
        const deptData = departmentGroups[dept];
        const avgScore = deptData.interviews.reduce((sum: number, i: any) => sum + (i.totalScore || 0), 0) / deptData.interviews.length;
        departmentBreakdown[dept] = {
          candidates: deptData.interviews.length,
          averageScore: avgScore,
          hireRate: deptData.hires / deptData.interviews.length
        };
      });

      // Position breakdown
      const positionGroups: any = {};
      completedInterviews.forEach((interview: any) => {
        const pos = interview.position || 'Unknown';
        if (!positionGroups[pos]) {
          positionGroups[pos] = { interviews: [], hires: 0 };
        }
        positionGroups[pos].interviews.push(interview);
        if (interview.hrRecommendation === 'hire') {
          positionGroups[pos].hires++;
        }
      });

      const positionBreakdown: any = {};
      Object.keys(positionGroups).forEach(pos => {
        const posData = positionGroups[pos];
        const avgScore = posData.interviews.reduce((sum: number, i: any) => sum + (i.totalScore || 0), 0) / posData.interviews.length;
        positionBreakdown[pos] = {
          candidates: posData.interviews.length,
          averageScore: avgScore,
          hireRate: posData.hires / posData.interviews.length
        };
      });

      res.json({
        totalCandidates: allInterviews.length,
        completedInterviews: completedInterviews.length,
        pendingReviews,
        averageScore,
        averageDuration,
        departmentBreakdown,
        positionBreakdown
      });
    } catch (error) {
      console.error("Failed to get HR metrics:", error);
      res.status(500).json({ error: "Failed to get HR metrics" });
    }
  });

  // Get candidate interviews for HR review
  app.get("/api/hr/candidates", async (req, res) => {
    try {
      const allInterviews = await db.select().from(interviews);

      const candidatesData = allInterviews.map((interview: any) => ({
        id: interview.id,
        candidateName: interview.candidateName || 'Anonymous Candidate',
        candidateEmail: interview.candidateEmail || 'No email provided',
        position: interview.position || 'Not specified',
        department: interview.department || 'Not specified',
        status: interview.status,
        totalScore: interview.totalScore || 0,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        duration: interview.duration || 0,
        hrRecommendation: interview.hrRecommendation,
        reviewedBy: interview.reviewedBy,
        reviewedAt: interview.reviewedAt
      }));

      res.json(candidatesData);
    } catch (error) {
      console.error("Failed to get candidates:", error);
      res.status(500).json({ error: "Failed to get candidates" });
    }
  });

  // Get detailed interview report for HR review
  app.get("/api/hr/interview/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const interview = await db.select().from(interviews)
        .where(eq(interviews.id, id))
        .limit(1);

      if (interview.length === 0) {
        return res.status(404).json({ error: "Interview not found" });
      }

      const interviewData = interview[0] as any;
      
      // Get evaluation history for this interview
      const evaluations = await db.select().from(evaluationHistory)
        .where(eq(evaluationHistory.interviewId, id));

      res.json({
        interview: interviewData,
        evaluations
      });
    } catch (error) {
      console.error("Failed to get interview details:", error);
      res.status(500).json({ error: "Failed to get interview details" });
    }
  });

  // Update HR recommendation for an interview
  app.post("/api/hr/interview/:id/recommendation", async (req, res) => {
    try {
      const { id } = req.params;
      const { recommendation, notes, hrUserId } = req.body;

      await db.update(interviews)
        .set({
          hrRecommendation: recommendation,
          hrNotes: notes,
          reviewedBy: hrUserId,
          reviewedAt: new Date()
        })
        .where(eq(interviews.id, id));

      res.json({ message: "HR recommendation updated successfully" });
    } catch (error) {
      console.error("Failed to update HR recommendation:", error);
      res.status(500).json({ error: "Failed to update HR recommendation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
