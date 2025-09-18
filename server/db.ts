import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// For development, create a mock database if no URL is provided
const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.DATABASE_URL) {
  if (isDevelopment) {
    console.warn('⚠️  DATABASE_URL not set. Using mock database for development.');
    console.warn('   Set DATABASE_URL in .env file to use a real database.');
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

// Mock database for development when no DATABASE_URL is provided
const mockDb = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
  delete: () => ({ where: () => Promise.resolve([]) }),
};

let db: any;

if (process.env.DATABASE_URL) {
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Use mock database for development
  db = mockDb;
}

export { db };