import Groq from "groq-sdk";

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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert Excel interviewer. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    
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
      `Q${i+1}: Score ${r.score}/10 - ${r.answer.substring(0, 100)}...`
    ).join('\n');

    const prompt = `
Based on the interview responses below, provide comprehensive feedback:

${responsesSummary}

Generate:
1. strengths: Array of 3-4 specific strengths
2. improvements: Array of 2-3 areas for improvement
3. overallFeedback: 2-3 sentence summary

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
      model: "llama3-8b-8192",
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
    return {
      strengths: ["Participated in the interview", "Provided thoughtful responses"],
      improvements: ["Continue practicing Excel skills", "Review key concepts"],
      overallFeedback: "Thank you for completing the interview. Keep practicing to improve your Excel skills."
    };
  }
}

// Transcribe audio using Groq's Whisper model
export async function transcribeAudio(audioFile: Buffer, filename: string): Promise<string> {
  try {
    // Create a File object from the buffer
    const file = new File([audioFile], filename, { type: 'audio/webm' });
    
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      prompt: "This is an Excel interview session. The audio contains answers to Excel-related questions.",
      response_format: "text",
      language: "en",
      temperature: 0.2
    });

    return transcription || "";
  } catch (error) {
    console.error("Groq transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

// Generate follow-up questions based on context
export async function generateFollowUpQuestion(category: string, previousAnswer: string): Promise<string> {
  try {
    const prompt = `
You are an Excel interview expert. Generate relevant follow-up questions based on the candidate's previous answer.

Category: ${category}
Previous Answer: ${previousAnswer}

Generate a thoughtful follow-up question that builds on their answer. Keep it concise and relevant to Excel skills.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert Excel interviewer. Generate concise, relevant follow-up questions."
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 150
    });

    return chatCompletion.choices[0]?.message?.content || "Can you elaborate on that point further?";
  } catch (error) {
    console.error("Follow-up question generation error:", error);
    return "Can you provide more details about your approach?";
  }
}
