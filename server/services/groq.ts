import Groq from "groq-sdk";
import { TypedInterview, AdaptiveQuestionRequest, DatabaseInterviewResponse, ConsistencyMetrics } from "@shared/schema";
import { db } from "../db";
import { evaluationHistory, calibrationBaselines } from "@shared/schema";
import { eq, and, avg, count } from "drizzle-orm";

export interface InterviewIntroduction {
  greeting: string;
  introductionRequest: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || (() => {
    console.error("GROQ_API_KEY environment variable is required");
    throw new Error("GROQ_API_KEY environment variable is required");
  })()
});

export interface AnswerEvaluation {
  score: number; // 0-10
  feedback: string;
  details: {
    correctness: number; // 0-10
    clarity: number; // 0-10
    completeness: number; // 0-10
  };
}



export interface EnhancedEvaluation extends AnswerEvaluation {
  consistency: ConsistencyMetrics;
  evaluationId: string;
  timestamp: string;
  benchmarkComparison?: {
    percentileRank: number; // 0-100 (compared to similar answers)
    categoryAverage: number; // average score for this category
    difficultyAverage: number; // average score for this difficulty
  };
}

export async function evaluateAnswer(
  question: string, 
  answer: string, 
  category: string
): Promise<AnswerEvaluation> {
  try {
    const prompt = `
You are an expert Excel interviewer evaluating a candidate's answer. Please evaluate the following:

Question: ${question}
Category: ${category}
Answer: ${answer}

Please provide a detailed evaluation in JSON format with:
1. score: Overall score from 0-10
2. feedback: Detailed feedback (2-3 sentences)
3. details: Object with correctness (0-10), clarity (0-10), and completeness (0-10)

Consider:
- Technical accuracy of the answer
- Clarity of explanation
- Completeness of the response
- Practical understanding demonstrated

Respond only with valid JSON.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    // Validate and ensure proper structure
    return {
      score: Math.max(0, Math.min(10, result.score || 0)),
      feedback: result.feedback || "Answer evaluated.",
      details: {
        correctness: Math.max(0, Math.min(10, result.details?.correctness || 0)),
        clarity: Math.max(0, Math.min(10, result.details?.clarity || 0)),
        completeness: Math.max(0, Math.min(10, result.details?.completeness || 0))
      }
    };
  } catch (error) {
    console.error("Groq evaluation error:", error);
    // Fallback evaluation
    return {
      score: 5,
      feedback: "Unable to evaluate answer at this time. Please try again.",
      details: {
        correctness: 5,
        clarity: 5,
        completeness: 5
      }
    };
  }
}

export async function generateInterviewFeedback(responses: any[]): Promise<{
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
}> {
  try {
    const responsesSummary = responses.map((r, i) => 
      `Q${i+1} [${r.category || 'general'}]: Score ${r.score}/10 - "${r.answer.substring(0, 150)}..."`
    ).join('\n');

    const isLimitedInterview = responses.length <= 2;
    const totalQuestions = responses.length;
    const averageScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length;

    const prompt = `
You are Sarah, an expert Excel interviewer. Analyze this interview performance:

Interview Summary:
- Questions answered: ${totalQuestions} 
- Average score: ${averageScore.toFixed(1)}/10
- Interview type: ${isLimitedInterview ? 'Brief assessment' : 'Full interview'}

Responses analyzed:
${responsesSummary}

${isLimitedInterview ? `
This was a brief interview with only ${totalQuestions} question(s) answered. Provide meaningful feedback based on what was demonstrated, acknowledging the limited scope but focusing on the quality of the response(s) provided.
` : `
This was a complete interview. Provide comprehensive feedback based on all responses.
`}

Provide thoughtful, personalized feedback with:
1. strengths: Array of 2-3 specific strengths demonstrated (be specific about what they did well)
2. improvements: Array of 2-3 concrete areas for growth (actionable suggestions)  
3. overallFeedback: 2-3 sentence summary acknowledging their effort and giving constructive guidance

Focus on what the candidate actually demonstrated rather than what they didn't cover.

Respond only with valid JSON.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert Excel interviewer providing constructive feedback. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
    return {
      strengths: Array.isArray(result.strengths) ? result.strengths : ["Completed the interview"],
      improvements: Array.isArray(result.improvements) ? result.improvements : ["Continue practicing"],
      overallFeedback: result.overallFeedback || "Good effort on the interview."
    };
  } catch (error) {
    console.error("Feedback generation error:", error);
    
    // Provide more personalized fallback based on responses
    const hasResponses = responses.length > 0;
    const averageScore = hasResponses ? responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length : 0;
    
    if (!hasResponses) {
      return {
        strengths: ["Initiated the interview process", "Engaged with the assessment"],
        improvements: ["Complete more questions for detailed feedback", "Try the full interview experience"],
        overallFeedback: "Thank you for starting the interview. To get comprehensive feedback on your Excel skills, please complete more questions in your next attempt."
      };
    }
    
    const isGoodPerformance = averageScore >= 7;
    
    return {
      strengths: hasResponses ? [
        `Completed ${responses.length} question${responses.length > 1 ? 's' : ''}`,
        isGoodPerformance ? "Demonstrated solid Excel knowledge" : "Showed engagement with the material",
        "Provided detailed responses"
      ] : ["Participated in the interview"],
      improvements: [
        isGoodPerformance ? "Continue building on your Excel foundation" : "Practice more Excel fundamentals",
        "Take the complete interview for comprehensive evaluation",
        "Review Excel best practices and advanced features"
      ],
      overallFeedback: `Thank you for participating in the interview${hasResponses ? ` and completing ${responses.length} question${responses.length > 1 ? 's' : ''} with an average score of ${averageScore.toFixed(1)}/10` : ''}. ${isGoodPerformance ? 'You showed good Excel knowledge.' : 'Keep practicing to improve your Excel skills.'} Consider taking the full interview for more detailed feedback.`
    };
  }
}

// Transcribe audio using Groq's Whisper model
export async function transcribeAudio(audioFile: Buffer, filename: string): Promise<string> {
  try {
    console.log(`Starting transcription for file: ${filename}, size: ${audioFile.length} bytes`);
    
    // Convert Buffer to Uint8Array for File creation
    const uint8Array = new Uint8Array(audioFile);
    
    // Determine the correct MIME type based on filename
    let mimeType = 'audio/webm';
    if (filename.endsWith('.mp3')) {
      mimeType = 'audio/mpeg';
    } else if (filename.endsWith('.wav')) {
      mimeType = 'audio/wav';
    } else if (filename.endsWith('.m4a')) {
      mimeType = 'audio/m4a';
    }
    
    console.log(`Using MIME type: ${mimeType}`);
    
    // Create a File object from Uint8Array
    const file = new File([uint8Array], filename, { type: mimeType });
    
    console.log(`File created successfully, calling GROQ Whisper API...`);
    
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      prompt: "This is an Excel interview session. The audio contains answers to Excel-related questions.",
      response_format: "text",
      language: "en",
      temperature: 0.0
    });

    console.log(`Transcription result:`, transcription);
    
    // When response_format is "text", the result is a string directly
    // When response_format is "json", the result has a .text property
    let result: string = "";
    
    if (typeof transcription === 'string') {
      result = transcription;
    } else if (transcription && typeof transcription === 'object' && 'text' in transcription) {
      result = transcription.text || "";
    } else {
      result = String(transcription || "");
    }
    
    console.log(`Final transcription text: "${result}"`);
    
    return result;
  } catch (error) {
    console.error("Groq transcription error:", error);
    // Return empty string instead of throwing to avoid breaking the flow
    return "";
  }
}

// Generate adaptive next question based on database interview data
// Generate interview introduction and ask candidate to introduce themselves
export async function generateInterviewIntroduction(): Promise<InterviewIntroduction> {
  try {
    const prompt = `
You are Sarah, a friendly and professional AI Excel Interview Specialist. Generate a natural, welcoming introduction for a new candidate starting their Excel skills assessment.

The introduction should:
1. Greet the candidate warmly and introduce yourself as Sarah
2. Briefly explain what the assessment will involve (adaptive Excel questions)
3. Ask the candidate to introduce themselves (name, experience level, background)
4. Be encouraging and professional but friendly
5. Keep it concise but personal

Respond with JSON:
{
  "greeting": "Your initial greeting and explanation",
  "introductionRequest": "Your request for them to introduce themselves"
}
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from Groq API");
    }

    return JSON.parse(result);
  } catch (error) {
    console.error("Failed to generate interview introduction:", error);
    // Fallback introduction
    return {
      greeting: "Hello! I'm Sarah, your AI Excel Interview Specialist. I'll be conducting a personalized Excel skills assessment with you today.",
      introductionRequest: "Before we begin, could you please introduce yourself? I'd love to know your name, your current experience level with Excel, and any background that might be relevant to our discussion."
    };
  }
}

export async function generateAdaptiveQuestionFromDB(
  interview: TypedInterview,
  storage?: any
): Promise<AdaptiveQuestionRequest> {
  try {
    // Extract context from database interview record
    const questions = Array.isArray(interview.questions) ? interview.questions : [];
    const responses = Array.isArray(interview.responses) ? interview.responses : [];
    const currentQuestionIndex = interview.currentQuestionIndex || 0;
    
    // Calculate performance metrics from database
    const totalScore = responses.reduce((sum: number, r: DatabaseInterviewResponse) => sum + (r.score || 0), 0);
    const averageScore = responses.length > 0 ? totalScore / responses.length : 5;
    
    // Enhanced category analysis with performance insights
    const categoryPerformance: Record<string, number[]> = {};
    const answeredCategories: string[] = [];
    const categoryMetrics: Record<string, { avgScore: number; attempts: number; trend: string }> = {};
    
    responses.forEach((response: DatabaseInterviewResponse) => {
      if (response.category) {
        answeredCategories.push(response.category);
        if (!categoryPerformance[response.category]) {
          categoryPerformance[response.category] = [];
        }
        categoryPerformance[response.category].push(response.score || 0);
      }
    });

    // Calculate detailed metrics for each category
    Object.entries(categoryPerformance).forEach(([category, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const lastTwo = scores.slice(-2);
      let trend = 'stable';
      if (lastTwo.length === 2) {
        trend = lastTwo[1] > lastTwo[0] ? 'improving' : lastTwo[1] < lastTwo[0] ? 'declining' : 'stable';
      }
      categoryMetrics[category] = {
        avgScore: Number(avgScore.toFixed(1)),
        attempts: scores.length,
        trend
      };
    });
    
    // Prioritize categories strategically
    const allCategories = ["vlookup", "formulas", "pivot_tables", "charts", "macros", "formatting", "data_analysis", "navigation", "security", "general"];
    const remainingCategories = allCategories.filter(cat => !answeredCategories.includes(cat));
    
    // Find struggling areas (categories with low performance that need reinforcement)
    const strugglingCategories = Object.entries(categoryMetrics)
      .filter(([_, metrics]) => metrics.avgScore < 6.0)
      .map(([category, _]) => category);
    
    // Find strong areas (categories performing well)
    const strongCategories = Object.entries(categoryMetrics)
      .filter(([_, metrics]) => metrics.avgScore >= 7.5)
      .map(([category, _]) => category);
    
    // Create context summary for AI
    const performanceSummary = responses.map((r: DatabaseInterviewResponse, i: number) => 
      `Q${i+1} [${r.category}]: "${r.answer?.substring(0, 50)}..." (Score: ${r.score}/10)`
    ).join('\n');
    
    const prompt = `
You are Sarah, an expert Excel interviewer conducting an adaptive interview. Based on the candidate's comprehensive performance data, generate the next strategic question.

Interview Progress:
- Question ${currentQuestionIndex + 1} of 10
- Average performance: ${averageScore.toFixed(1)}/10 (${averageScore < 5 ? 'Needs Support' : averageScore < 7 ? 'Developing' : averageScore < 8.5 ? 'Proficient' : 'Expert'})
- Total questions answered: ${responses.length}

Previous Q&A History:
${performanceSummary || 'No previous answers yet'}

Advanced Category Analysis:
- Covered categories (${answeredCategories.length}): ${answeredCategories.join(', ') || 'None yet'}
- Remaining categories (${remainingCategories.length}): ${remainingCategories.join(', ')}
- Category performance details: ${Object.entries(categoryMetrics).map(([cat, m]) => `${cat}: ${m.avgScore}/10 (${m.attempts} attempts, ${m.trend})`).join(', ')}

Strategic Recommendations:
- Struggling areas needing reinforcement: ${strugglingCategories.join(', ') || 'None identified'}
- Strong areas for advanced challenges: ${strongCategories.join(', ') || 'None yet'}
- Suggested focus: ${strugglingCategories.length > 0 ? 'Reinforce weak areas' : remainingCategories.length > 0 ? 'Explore new territory' : 'Advanced challenge'}

Generate a clean, professional Excel question that:
1. Difficulty Strategy: ${averageScore < 5 ? 'Focus on fundamentals, use encouraging beginner questions' : averageScore < 7 ? 'Build confidence with moderate challenges' : averageScore < 8.5 ? 'Provide appropriate intermediate/advanced challenges' : 'Present expert-level scenarios'}
2. Category Priority: ${strugglingCategories.length > 0 ? `Address struggling area: ${strugglingCategories[0]}` : remainingCategories.length > 0 ? `Explore new category: ${remainingCategories[0]}` : `Deepen expertise in: ${strongCategories[0] || 'general'}`}
3. Build on their demonstrated ${strongCategories.length > 0 ? `strengths in ${strongCategories.slice(0,2).join(' and ')}` : 'emerging competencies'}
4. Create realistic workplace scenarios that demonstrate practical value

IMPORTANT FORMATTING RULES:
- Write questions clearly and conversationally
- If mentioning data/tables, describe them in plain text, not ASCII tables
- Use bullet points or numbered lists for complex scenarios
- Make questions easy to read and understand
- Avoid messy formatting like |---|---|---|
- Present data in clear, readable format

Example good format:
"You have an employee database with the following information:
- Employee ID: E1234
- Name: John 
- Department: Sales

Another record shows:
- Employee ID: E5678
- Name: Jane
- Department: Marketing

How would you use VLOOKUP to find the department name for employee E1234?"

Respond with JSON:
{
  "question": "The question text (clean, readable format)",
  "category": "excel_category", 
  "difficulty": "beginner/intermediate/advanced"
}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Sarah, an expert Excel interviewer. Always respond with valid JSON containing an adaptive question based on candidate performance."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
    return {
      question: result.question || "Can you explain how you would use Excel in a typical work scenario?",
      category: result.category || "general",
      difficulty: result.difficulty || "intermediate"
    };
  } catch (error) {
    console.error("Adaptive question generation error:", error);
    console.log("Falling back to database questions...");
    
    try {
      if (!storage) {
        throw new Error("Storage not available for fallback");
      }
      // Get questions from database as fallback
      const questions = Array.isArray(interview.questions) ? interview.questions : [];
      const responses = Array.isArray(interview.responses) ? interview.responses : [];
      
      // Determine what categories have been covered
      const answeredCategories = responses.map((r: any) => r.category).filter(Boolean);
      const allCategories = ["vlookup", "formulas", "pivot_tables", "charts", "data_analysis", "formatting", "macros", "navigation"];
      const remainingCategories = allCategories.filter(cat => !answeredCategories.includes(cat));
      
      // Choose category strategically
      const targetCategory = remainingCategories.length > 0 ? remainingCategories[0] : allCategories[Math.floor(Math.random() * allCategories.length)];
      
      // Get questions from database
      let fallbackQuestions = await storage.getQuestionsByCategory(targetCategory, 5);
      
      if (fallbackQuestions.length === 0) {
        // If no questions in that category, get any random questions
        fallbackQuestions = await storage.getRandomQuestions(5);
      }
      
      if (fallbackQuestions.length > 0) {
        const selectedQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        console.log(`Using database fallback question from category: ${targetCategory}`);
        
        return {
          question: selectedQuestion.question,
          category: selectedQuestion.category,
          difficulty: selectedQuestion.difficulty
        };
      }
    } catch (dbError) {
      console.error("Database fallback also failed:", dbError);
    }
    
    // Ultimate fallback - hardcoded question
    return {
      question: "How would you use VLOOKUP to find specific data in a large spreadsheet? Please explain the syntax and when you would use it.",
      category: "vlookup", 
      difficulty: "beginner"
    };
  }
}

// Enhanced real-time answer evaluation with detailed metrics
// Calculate consistency metrics based on actual evaluation data
async function calculateConsistencyMetrics(
  currentScore: number,
  category: string,
  difficulty: string,
  answer: string,
  evaluationResult: any
): Promise<ConsistencyMetrics> {
  try {
    // Get historical data for this category/difficulty to calculate consistency
    const historicalEvals = await db
      .select()
      .from(evaluationHistory)
      .where(and(
        eq(evaluationHistory.category, category),
        eq(evaluationHistory.difficulty, difficulty)
      ))
      .limit(50); // Last 50 evaluations for this category/difficulty

    // Calculate evaluation consistency (how similar this score is to similar answers)
    const evaluationConsistency = calculateEvaluationConsistency(currentScore, historicalEvals);

    // Calculate difficulty calibration (whether score aligns with difficulty level)
    const difficultyCalibration = calculateDifficultyCalibration(currentScore, difficulty, historicalEvals);

    // Calculate category alignment (whether score fits category patterns)
    const categoryAlignment = calculateCategoryAlignment(currentScore, category, historicalEvals);

    // Calculate confidence level based on evaluation certainty factors
    const confidenceLevel = calculateConfidenceLevel(evaluationResult, answer.length);

    return {
      evaluationConsistency,
      difficultyCalibration,
      categoryAlignment,
      confidenceLevel,
      calibrationVersion: "v1.2.3"
    };
  } catch (error) {
    console.error("Error calculating consistency metrics:", error);
    // Return baseline metrics if calculation fails
    return {
      evaluationConsistency: 6.0,
      difficultyCalibration: 6.0,
      categoryAlignment: 6.0,
      confidenceLevel: 5.0,
      calibrationVersion: "v1.2.3"
    };
  }
}

// Helper function to calculate evaluation consistency
function calculateEvaluationConsistency(currentScore: number, historicalEvals: any[]): number {
  if (historicalEvals.length === 0) return 6.0; // Default if no history

  const scores = historicalEvals.map(e => e.aiScore);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  
  // Lower variance means more consistent scoring
  const consistencyScore = Math.max(0, Math.min(10, 10 - (variance * 2)));
  return Math.round(consistencyScore * 10) / 10;
}

// Helper function to calculate difficulty calibration
function calculateDifficultyCalibration(currentScore: number, difficulty: string, historicalEvals: any[]): number {
  const expectedRanges = {
    'beginner': { min: 7, max: 9 },
    'intermediate': { min: 5, max: 8 },
    'advanced': { min: 3, max: 7 }
  };

  const expected = expectedRanges[difficulty as keyof typeof expectedRanges] || { min: 5, max: 8 };
  
  // Score how well the current score fits the expected difficulty range
  if (currentScore >= expected.min && currentScore <= expected.max) {
    return Math.min(10, 8 + (historicalEvals.length / 10)); // Boost score with more data
  } else {
    const distance = Math.min(Math.abs(currentScore - expected.min), Math.abs(currentScore - expected.max));
    return Math.max(1, 8 - distance);
  }
}

// Helper function to calculate category alignment
function calculateCategoryAlignment(currentScore: number, category: string, historicalEvals: any[]): number {
  if (historicalEvals.length === 0) return 6.0;

  const categoryScores = historicalEvals.map(e => e.aiScore);
  const avgCategoryScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
  
  // Score aligns well if it's within 1.5 points of category average
  const distance = Math.abs(currentScore - avgCategoryScore);
  return Math.max(1, Math.min(10, 9 - distance));
}

// Helper function to calculate confidence level
function calculateConfidenceLevel(evaluationResult: any, answerLength: number): number {
  let confidence = 7.0; // Base confidence
  
  // Boost confidence for detailed evaluations
  if (evaluationResult.feedback && evaluationResult.feedback.length > 50) confidence += 0.5;
  
  // Boost confidence for comprehensive answers
  if (answerLength > 100) confidence += 0.5;
  
  // Boost confidence if evaluation has detailed metrics
  if (evaluationResult.details) {
    const metricsCount = Object.keys(evaluationResult.details).length;
    confidence += metricsCount * 0.3;
  }
  
  return Math.min(10, Math.max(1, confidence));
}

export async function evaluateAnswerRealtime(
  question: string,
  answer: string,
  category: string,
  difficulty: string,
  previousContext?: string,
  options?: {
    saveHistory?: boolean;
    interviewId?: string;
    questionId?: string;
  }
): Promise<{
  evaluation: EnhancedEvaluation;
  metrics: {
    technicalAccuracy: number;
    practicalApplication: number;
    communicationClarity: number;
    problemSolvingApproach: number;
  };
  followUpSuggestion?: string;
}> {
  try {
    const prompt = `
You are Sarah, an expert Excel interviewer evaluating a candidate's answer in real-time.

Question: ${question}
Category: ${category}
Difficulty: ${difficulty}
Candidate's Answer: ${answer}
${previousContext ? `Previous Context: ${previousContext}` : ''}

Provide a comprehensive evaluation with:

1. Overall score (0-10)
2. Detailed feedback (2-3 sentences, encouraging but honest)
3. Specific metrics breakdown:
   - technicalAccuracy (0-10): How correct is the technical information?
   - practicalApplication (0-10): How well would this work in practice?
   - communicationClarity (0-10): How clear and well-explained is the answer?
   - problemSolvingApproach (0-10): How good is their problem-solving methodology?
4. Optional follow-up suggestion for deeper exploration

Respond with JSON:
{
  "score": 8,
  "feedback": "Constructive feedback here...",
  "details": {
    "correctness": 8,
    "clarity": 7,
    "completeness": 8
  },
  "metrics": {
    "technicalAccuracy": 8,
    "practicalApplication": 7,
    "communicationClarity": 8,
    "problemSolvingApproach": 7
  },
  "followUpSuggestion": "Optional deeper question..."
}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Sarah, an expert Excel interviewer. Provide detailed, encouraging evaluation with specific metrics. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
    // Calculate consistency metrics based on actual evaluation data
    const consistency: ConsistencyMetrics = await calculateConsistencyMetrics(
      result.score || 5,
      category,
      difficulty,
      answer,
      result
    );

    // Validate and ensure proper structure
    const evaluation: EnhancedEvaluation = {
      score: Math.max(0, Math.min(10, result.score || 5)),
      feedback: result.feedback || "Thank you for your answer. Let's continue with the next question.",
      details: {
        correctness: Math.max(0, Math.min(10, result.details?.correctness || 5)),
        clarity: Math.max(0, Math.min(10, result.details?.clarity || 5)),
        completeness: Math.max(0, Math.min(10, result.details?.completeness || 5))
      },
      consistency,
      evaluationId: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    const metrics = {
      technicalAccuracy: Math.max(0, Math.min(10, result.metrics?.technicalAccuracy || 5)),
      practicalApplication: Math.max(0, Math.min(10, result.metrics?.practicalApplication || 5)),
      communicationClarity: Math.max(0, Math.min(10, result.metrics?.communicationClarity || 5)),
      problemSolvingApproach: Math.max(0, Math.min(10, result.metrics?.problemSolvingApproach || 5))
    };

    // Save evaluation history if requested
    if (options?.saveHistory) {
      await saveEvaluationHistory({
        evaluationId: evaluation.evaluationId,
        interviewId: options.interviewId,
        questionId: options.questionId,
        candidateAnswer: answer,
        aiScore: evaluation.score,
        category,
        difficulty,
        consistencyMetrics: evaluation.consistency,
        calibrationVersion: evaluation.consistency.calibrationVersion,
      });

      // Update system metrics
      const avgConsistency = (
        evaluation.consistency.evaluationConsistency +
        evaluation.consistency.difficultyCalibration +
        evaluation.consistency.categoryAlignment +
        evaluation.consistency.confidenceLevel
      ) / 4;
      
      const responseTime = Date.now(); // Will be calculated from request start time
      await updateSystemMetrics(1, avgConsistency, responseTime);
    }

    return {
      evaluation,
      metrics,
      followUpSuggestion: result.followUpSuggestion
    };
  } catch (error) {
    console.error("Real-time evaluation error:", error);
    // Fallback evaluation
    const fallbackConsistency: ConsistencyMetrics = {
      evaluationConsistency: 6.0,
      difficultyCalibration: 6.0,
      categoryAlignment: 6.0,
      confidenceLevel: 5.0, // Lower confidence for fallback
      calibrationVersion: "v1.2.3"
    };

    return {
      evaluation: {
        score: 6,
        feedback: "Thank you for your response. I'm having trouble processing the evaluation right now, but let's continue with the interview.",
        details: {
          correctness: 6,
          clarity: 6,
          completeness: 6
        },
        consistency: fallbackConsistency,
        evaluationId: `eval_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      },
      metrics: {
        technicalAccuracy: 6,
        practicalApplication: 6,
        communicationClarity: 6,
        problemSolvingApproach: 6
      }
    };
  }
}

// Function to save evaluation history for calibration tracking
export async function saveEvaluationHistory(
  evaluationData: {
    evaluationId: string;
    interviewId?: string;
    questionId?: string;
    candidateAnswer: string;
    aiScore: number;
    humanScore?: number;
    category: string;
    difficulty: string;
    consistencyMetrics: ConsistencyMetrics;
    calibrationVersion?: string;
  }
): Promise<void> {
  try {
    await db.insert(evaluationHistory).values({
      evaluationId: evaluationData.evaluationId,
      interviewId: evaluationData.interviewId,
      questionId: evaluationData.questionId,
      candidateAnswer: evaluationData.candidateAnswer,
      aiScore: evaluationData.aiScore,
      humanScore: evaluationData.humanScore,
      category: evaluationData.category,
      difficulty: evaluationData.difficulty,
      consistencyMetrics: evaluationData.consistencyMetrics,
      calibrationVersion: evaluationData.calibrationVersion || "v1.2.3",
    });

    console.log(`Evaluation history saved: ${evaluationData.evaluationId}`);
  } catch (error) {
    console.error("Failed to save evaluation history:", error);
    // Don't throw error to avoid breaking the evaluation flow
  }
}

// Function to get calibration baselines for a category and difficulty
export async function getCalibrationBaseline(
  category: string, 
  difficulty: string
): Promise<{ averageScore: number; consistency: number; sampleSize: number } | null> {
  try {
    // First, try to get from calibration baselines table
    const baseline = await db
      .select()
      .from(calibrationBaselines)
      .where(and(
        eq(calibrationBaselines.category, category),
        eq(calibrationBaselines.difficulty, difficulty)
      ))
      .limit(1);

    if (baseline.length > 0) {
      const data = baseline[0];
      return {
        averageScore: data.averageAiScore,
        consistency: data.confidenceLevel,
        sampleSize: data.sampleSize
      };
    }

    // If no baseline exists, calculate from evaluation history
    const evaluations = await db
      .select()
      .from(evaluationHistory)
      .where(and(
        eq(evaluationHistory.category, category),
        eq(evaluationHistory.difficulty, difficulty)
      ));

    if (evaluations.length === 0) {
      return null; // No data available
    }

    const scores = evaluations.map((e: any) => e.aiScore);
    const averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    
    // Calculate consistency from score variance
    const variance = scores.reduce((sum: number, score: number) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const consistency = Math.max(1, Math.min(10, 10 - variance));

    return {
      averageScore: Math.round(averageScore * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      sampleSize: evaluations.length
    };
  } catch (error) {
    console.error("Failed to get calibration baseline:", error);
    return null;
  }
}

// Function to update system performance metrics
export async function updateSystemMetrics(
  evaluationCount: number = 1,
  consistencyScore: number,
  responseTime: number
): Promise<void> {
  try {
    // In a real implementation, this would aggregate and store daily metrics
    // For now, just log the metrics
    console.log(`System metrics updated: evaluations=${evaluationCount}, consistency=${consistencyScore}, responseTime=${responseTime}ms`);
  } catch (error) {
    console.error("Failed to update system metrics:", error);
  }
}
