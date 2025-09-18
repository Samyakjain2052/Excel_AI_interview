import "dotenv/config";
import { db } from "./server/db";
import { questionBank } from "./shared/schema";

const sampleQuestions = [
  {
    question: "What is the VLOOKUP function and how do you use it?",
    category: "vlookup",
    difficulty: "intermediate",
    expectedAnswer: "VLOOKUP searches for a value in the first column of a range and returns a value in the same row from another column.",
    keywords: ["vlookup", "lookup", "search", "table", "vertical"],
    maxScore: 10
  },
  {
    question: "How do you create a pivot table in Excel?",
    category: "pivot_tables", 
    difficulty: "intermediate",
    expectedAnswer: "Select data range, go to Insert > PivotTable, choose location, drag fields to appropriate areas.",
    keywords: ["pivot", "table", "insert", "data", "analysis"],
    maxScore: 10
  },
  {
    question: "What is the difference between SUMIF and SUMIFS functions?",
    category: "formulas",
    difficulty: "beginner",
    expectedAnswer: "SUMIF sums based on one criteria, SUMIFS sums based on multiple criteria.",
    keywords: ["sumif", "sumifs", "criteria", "conditional", "sum"],
    maxScore: 8
  },
  {
    question: "How do you freeze panes in Excel and why would you use it?",
    category: "navigation",
    difficulty: "beginner", 
    expectedAnswer: "View > Freeze Panes to keep rows/columns visible while scrolling through large datasets.",
    keywords: ["freeze", "panes", "view", "scroll", "headers"],
    maxScore: 6
  },
  {
    question: "Explain what a macro is and how to record one in Excel.",
    category: "macros",
    difficulty: "advanced",
    expectedAnswer: "A macro is recorded sequence of actions. Use Developer > Record Macro to automate repetitive tasks.",
    keywords: ["macro", "record", "automate", "developer", "vba"],
    maxScore: 12
  },
  {
    question: "What is conditional formatting and how do you apply it?",
    category: "formatting",
    difficulty: "beginner",
    expectedAnswer: "Conditional formatting changes cell appearance based on values. Home > Conditional Formatting.",
    keywords: ["conditional", "formatting", "appearance", "rules", "highlight"],
    maxScore: 8
  },
  {
    question: "How do you use INDEX and MATCH functions together?",
    category: "formulas",
    difficulty: "advanced",
    expectedAnswer: "INDEX returns value at intersection, MATCH finds position. Together they create flexible lookups.",
    keywords: ["index", "match", "lookup", "flexible", "position"],
    maxScore: 12
  },
  {
    question: "What are Excel charts and how do you create them?",
    category: "charts",
    difficulty: "beginner",
    expectedAnswer: "Charts visualize data. Select data range, Insert > Chart, choose chart type and customize.",
    keywords: ["chart", "visualize", "insert", "data", "graph"],
    maxScore: 8
  },
  {
    question: "How do you protect an Excel worksheet?",
    category: "security",
    difficulty: "intermediate", 
    expectedAnswer: "Review > Protect Sheet, set password and permissions to prevent unauthorized changes.",
    keywords: ["protect", "sheet", "password", "security", "permissions"],
    maxScore: 10
  },
  {
    question: "What is the difference between relative and absolute cell references?",
    category: "formulas",
    difficulty: "intermediate",
    expectedAnswer: "Relative references change when copied (A1), absolute references stay fixed ($A$1).",
    keywords: ["relative", "absolute", "references", "dollar", "fixed"],
    maxScore: 10
  }
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Insert sample questions
    for (const question of sampleQuestions) {
      await db.insert(questionBank).values(question);
      console.log(`✅ Added question: "${question.question.substring(0, 50)}..."`);
    }
    
    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();