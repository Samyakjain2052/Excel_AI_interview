export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
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

export interface Interview {
  id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  totalScore: number;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  evaluation?: InterviewEvaluation;
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

export interface ChatMessage {
  id: string;
  isAI: boolean;
  message: string;
  timestamp: string;
  score?: number;
  evaluation?: {
    correctness: number;
    clarity: number;
    completeness: number;
  };
}
