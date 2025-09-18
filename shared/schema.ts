import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("candidate"), // 'candidate', 'hr', 'admin'
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  candidateName: text("candidate_name"), // Candidate's full name
  candidateEmail: text("candidate_email"), // Candidate's email
  position: text("position"), // Position they're applying for
  department: text("department"), // Department/team
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'abandoned'
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  totalScore: integer("total_score").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
  questions: jsonb("questions").notNull(), // Array of question objects
  responses: jsonb("responses").notNull().default([]), // Array of response objects
  evaluation: jsonb("evaluation"), // Overall evaluation results
  hrRecommendation: text("hr_recommendation"), // HR's hiring recommendation
  hrNotes: text("hr_notes"), // HR's additional notes
  reviewedBy: varchar("reviewed_by"), // HR user who reviewed this interview
  reviewedAt: timestamp("reviewed_at"), // When it was reviewed by HR
});

export const questionBank = pgTable("question_bank", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  category: text("category").notNull(), // 'formulas', 'pivot_tables', 'vlookup', 'macros', etc.
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  expectedAnswer: text("expected_answer"),
  keywords: jsonb("keywords"), // Array of key terms expected in answer
  maxScore: integer("max_score").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
});

// Calibration and evaluation tracking tables
export const evaluationHistory = pgTable("evaluation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evaluationId: text("evaluation_id").notNull().unique(),
  interviewId: varchar("interview_id").references(() => interviews.id),
  questionId: varchar("question_id").references(() => questionBank.id),
  candidateAnswer: text("candidate_answer").notNull(),
  aiScore: integer("ai_score").notNull(), // AI-generated score (0-10)
  humanScore: integer("human_score"), // Human expert score for calibration (0-10)
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  consistencyMetrics: jsonb("consistency_metrics").notNull(), // ConsistencyMetrics interface
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  calibrationVersion: text("calibration_version").notNull().default("v1.2.3"),
});

export const calibrationBaselines = pgTable("calibration_baselines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  averageAiScore: integer("average_ai_score").notNull(), // Average AI score for this category/difficulty
  averageHumanScore: integer("average_human_score"), // Average human score for comparison
  scoreVariance: integer("score_variance").notNull(), // Variance in scoring
  sampleSize: integer("sample_size").notNull().default(0), // Number of evaluations in baseline
  confidenceLevel: integer("confidence_level").notNull(), // Statistical confidence (0-100)
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  calibrationVersion: text("calibration_version").notNull().default("v1.2.3"),
});

export const systemPerformanceMetrics = pgTable("system_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  totalEvaluations: integer("total_evaluations").notNull().default(0),
  averageConsistencyScore: integer("average_consistency_score"), // Average consistency across all evaluations
  calibrationAccuracy: integer("calibration_accuracy"), // How well AI scores match human scores (0-100)
  categoryBreakdown: jsonb("category_breakdown"), // Performance by category
  difficultyBreakdown: jsonb("difficulty_breakdown"), // Performance by difficulty
  systemLoad: jsonb("system_load"), // Response times, error rates, etc.
  calibrationVersion: text("calibration_version").notNull().default("v1.2.3"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  startedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questionBank).omit({
  id: true,
});

export const insertEvaluationHistorySchema = createInsertSchema(evaluationHistory).omit({
  id: true,
  timestamp: true,
});

export const insertCalibrationBaselineSchema = createInsertSchema(calibrationBaselines).omit({
  id: true,
  lastUpdated: true,
});

export const insertSystemPerformanceMetricsSchema = createInsertSchema(systemPerformanceMetrics).omit({
  id: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionBank.$inferSelect;

// Calibration and evaluation tracking types
export type InsertEvaluationHistory = z.infer<typeof insertEvaluationHistorySchema>;
export type EvaluationHistory = typeof evaluationHistory.$inferSelect;
export type InsertCalibrationBaseline = z.infer<typeof insertCalibrationBaselineSchema>;
export type CalibrationBaseline = typeof calibrationBaselines.$inferSelect;
export type InsertSystemPerformanceMetrics = z.infer<typeof insertSystemPerformanceMetricsSchema>;
export type SystemPerformanceMetrics = typeof systemPerformanceMetrics.$inferSelect;

// Interview types for frontend
export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  expectedAnswer?: string;
  keywords?: string[];
  maxScore: number;
}

export interface InterviewResponse {
  questionId: string;
  answer: string;
  isVoiceAnswer: boolean;
  timestamp: string;
  score?: number;
  feedback?: string;
  evaluation?: {
    correctness: number;
    clarity: number;
    completeness: number;
  };
}

export interface InterviewEvaluation {
  overallScore: number;
  totalQuestions: number;
  correctAnswers: number;
  strengths: string[];
  improvements: string[];
  categoryScores: Record<string, number>;
  recommendations: string[];
}

// Enhanced types for database-driven adaptive questioning
export interface DatabaseInterviewResponse {
  questionId: string;
  answer: string;
  isVoiceAnswer: boolean;
  timestamp: string;
  score: number;
  feedback: string;
  category: string;
  evaluation: {
    correctness: number;
    clarity: number;
    completeness: number;
  };
}

export interface DatabaseInterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedAnswer?: string;
  keywords?: string[];
  maxScore: number;
}

// Type for adaptive question generation
export interface AdaptiveQuestionRequest {
  question: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Enhanced Interview type with proper JSONB typing
export interface TypedInterview extends Omit<Interview, 'questions' | 'responses' | 'evaluation'> {
  questions: DatabaseInterviewQuestion[];
  responses: DatabaseInterviewResponse[];
  evaluation?: InterviewEvaluation;
}

// Calibration and consistency interfaces
export interface ConsistencyMetrics {
  evaluationConsistency: number; // 0-10 (how consistent are similar answers scored)
  difficultyCalibration: number; // 0-10 (are harder questions scored appropriately)
  categoryAlignment: number; // 0-10 (does scoring align with category expectations)
  confidenceLevel: number; // 0-10 (AI's confidence in the evaluation)
  calibrationVersion: string; // version of calibration data used
}

export interface CalibrationData {
  category: string;
  difficulty: string;
  averageAiScore: number;
  averageHumanScore?: number;
  scoreVariance: number;
  sampleSize: number;
  confidenceLevel: number;
  lastUpdated: Date;
}

export interface SystemMetrics {
  date: Date;
  totalEvaluations: number;
  averageConsistencyScore: number;
  calibrationAccuracy?: number;
  categoryBreakdown: Record<string, {
    averageScore: number;
    consistency: number;
    sampleSize: number;
  }>;
  difficultyBreakdown: Record<string, {
    averageScore: number;
    consistency: number;
    sampleSize: number;
  }>;
  systemLoad: {
    averageResponseTime: number;
    errorRate: number;
    peakConcurrency: number;
  };
}
