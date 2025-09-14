import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'abandoned'
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  totalScore: integer("total_score").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
  questions: jsonb("questions").notNull(), // Array of question objects
  responses: jsonb("responses").notNull().default([]), // Array of response objects
  evaluation: jsonb("evaluation"), // Overall evaluation results
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  startedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questionBank).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionBank.$inferSelect;

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
