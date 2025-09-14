import { interviews, questionBank, users, type User, type InsertUser, type Interview, type InsertInterview, type Question, type InsertQuestion } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Interview methods
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterview(id: string): Promise<Interview | undefined>;
  updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined>;
  
  // Question methods
  getRandomQuestions(limit: number): Promise<Question[]>;
  getQuestionsByCategory(category: string, limit?: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values(interview)
      .returning();
    return newInterview;
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id));
    return interview || undefined;
  }

  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined> {
    const [updated] = await db
      .update(interviews)
      .set(updates)
      .where(eq(interviews.id, id))
      .returning();
    return updated || undefined;
  }

  async getRandomQuestions(limit: number = 10): Promise<Question[]> {
    return await db
      .select()
      .from(questionBank)
      .where(eq(questionBank.isActive, true))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async getQuestionsByCategory(category: string, limit: number = 5): Promise<Question[]> {
    return await db
      .select()
      .from(questionBank)
      .where(and(
        eq(questionBank.category, category),
        eq(questionBank.isActive, true)
      ))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questionBank)
      .values(question)
      .returning();
    return newQuestion;
  }
}

export const storage = new DatabaseStorage();
