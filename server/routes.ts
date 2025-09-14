import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInterviewSchema } from "@shared/schema";
import { evaluateAnswer, transcribeAudio } from "./services/groq";
import multer from 'multer';

export async function registerRoutes(app: Express): Promise<Server> {
  
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
  
  // Start a new interview
  app.post("/api/interviews/start", async (req, res) => {
    try {
      // Get random questions for the interview
      const questions = await storage.getRandomQuestions(10);
      
      const interviewData = {
        status: "in_progress" as const,
        currentQuestionIndex: 0,
        totalScore: 0,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          maxScore: q.maxScore
        })),
        responses: [],
        userId: null, // For now, allow anonymous interviews
      };

      const interview = await storage.createInterview(interviewData);
      res.json(interview);
    } catch (error) {
      console.error("Failed to start interview:", error);
      res.status(500).json({ message: "Failed to start interview" });
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

  // Submit an answer
  app.post("/api/interviews/:id/answer", async (req, res) => {
    try {
      const { questionId, answer, isVoiceAnswer = false } = req.body;
      
      if (!answer || !questionId) {
        return res.status(400).json({ message: "Answer and question ID are required" });
      }

      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // Find the question
      const questions = interview.questions as any[];
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return res.status(400).json({ message: "Question not found" });
      }

      // Evaluate the answer using Groq API
      const evaluation = await evaluateAnswer(question.question, answer, question.category);

      // Create response object
      const response = {
        questionId,
        answer,
        isVoiceAnswer,
        timestamp: new Date().toISOString(),
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluation: evaluation.details
      };

      // Update interview with new response
      const responses = Array.isArray(interview.responses) ? interview.responses : [];
      responses.push(response);
      
      const newTotalScore = (interview.totalScore || 0) + evaluation.score;
      const newQuestionIndex = interview.currentQuestionIndex + 1;
      const isCompleted = newQuestionIndex >= questions.length;

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
        evaluation,
        nextQuestion: !isCompleted ? questions[newQuestionIndex] : null
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
      
      // Generate comprehensive evaluation
      const evaluation = {
        overallScore: interview.totalScore || 0,
        totalQuestions: questions.length,
        correctAnswers: responses.filter(r => (r as any).score >= 7).length,
        strengths: [] as string[],
        improvements: [] as string[],
        categoryScores: {} as Record<string, number>,
        recommendations: [] as string[]
      };

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

      Object.keys(categoryTotals).forEach(category => {
        evaluation.categoryScores[category] = Math.round(categoryTotals[category].total / categoryTotals[category].count);
      });

      // Generate strengths and improvements based on performance
      if (evaluation.overallScore >= 80) {
        evaluation.strengths.push("Excellent overall Excel knowledge");
      }
      if (evaluation.correctAnswers / evaluation.totalQuestions >= 0.8) {
        evaluation.strengths.push("Strong problem-solving abilities");
      }
      
      // Add category-specific feedback
      Object.entries(evaluation.categoryScores).forEach(([category, score]) => {
        if (score >= 8) {
          evaluation.strengths.push(`Excellent ${category} knowledge`);
        } else if (score < 6) {
          evaluation.improvements.push(`Review ${category} concepts`);
        }
      });

      const updatedInterview = await storage.updateInterview(req.params.id, {
        evaluation,
        status: "completed"
      });

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
        {
          question: "Can you explain the difference between VLOOKUP and HLOOKUP functions in Excel? When would you use each one?",
          category: "formulas",
          difficulty: "beginner",
          expectedAnswer: "VLOOKUP searches vertically, HLOOKUP searches horizontally",
          keywords: ["vlookup", "hlookup", "vertical", "horizontal", "lookup"],
          maxScore: 10
        },
        {
          question: "How do you create a pivot table in Excel and what are its main benefits?",
          category: "pivot_tables",
          difficulty: "intermediate",
          expectedAnswer: "Insert > PivotTable, drag fields to analyze data quickly",
          keywords: ["pivot", "table", "summarize", "data", "analysis"],
          maxScore: 10
        },
        {
          question: "Explain what a VBA macro is and provide a simple example of when you might use one.",
          category: "macros",
          difficulty: "advanced",
          expectedAnswer: "VBA macro automates repetitive tasks using programming",
          keywords: ["vba", "macro", "automation", "programming", "subroutine"],
          maxScore: 10
        },
        {
          question: "What is data validation in Excel and how would you set up a dropdown list?",
          category: "data_validation",
          difficulty: "intermediate",
          expectedAnswer: "Data validation restricts input, dropdown created via Data menu",
          keywords: ["validation", "dropdown", "list", "restrict", "input"],
          maxScore: 10
        },
        {
          question: "How would you use INDEX and MATCH functions together as an alternative to VLOOKUP?",
          category: "formulas",
          difficulty: "advanced",
          expectedAnswer: "INDEX returns value at position, MATCH finds position, more flexible than VLOOKUP",
          keywords: ["index", "match", "lookup", "flexible", "position"],
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

  const httpServer = createServer(app);
  return httpServer;
}
