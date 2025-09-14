import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Send, Clock, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/use-speech';

import { ChatInterface } from '@/components/chat-interface';
import { Webcam } from '@/components/webcam';
import { VoiceRecorder } from '@/components/voice-recorder';
import { apiRequest } from '@/lib/queryClient';

import type { Interview, InterviewQuestion, ChatMessage } from '@/types/interview';

export default function InterviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/interviews/start');
      return response.json();
    },
    onSuccess: (interview: Interview) => {
      setInterviewId(interview.id);
      setStartTime(new Date());
      
      // Add welcome message
      setChatMessages([
        {
          id: '1',
          isAI: true,
          message: "Hello! I'm your AI interviewer today. I'll be asking you 10 Excel-related questions to assess your skills. You can answer by typing or speaking. Let's begin!",
          timestamp: new Date().toISOString()
        },
        {
          id: '2', 
          isAI: true,
          message: interview.questions[0].question,
          timestamp: new Date().toISOString()
        }
      ]);

      // Speak the welcome message
      setTimeout(() => {
        speak("Hello! I'm your AI interviewer today. I'll be asking you 10 Excel-related questions. Let's begin with the first question.");
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Failed to start interview",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Get interview data
  const { data: interview, isLoading } = useQuery({
    queryKey: ['/api/interviews', interviewId],
    enabled: !!interviewId,
    refetchInterval: false
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const response = await apiRequest('POST', `/api/interviews/${interviewId}/answer`, {
        questionId,
        answer,
        isVoiceAnswer: false
      });
      return response.json();
    },
    onSuccess: (result) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        isAI: false,
        message: currentAnswer,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, userMessage]);
      setCurrentAnswer('');
      setIsTyping(true);

      // Simulate AI thinking time
      setTimeout(() => {
        setIsTyping(false);
        
        // Add AI feedback
        const feedbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          isAI: true,
          message: result.evaluation.feedback,
          timestamp: new Date().toISOString(),
          score: result.evaluation.score,
          evaluation: result.evaluation.details
        };

        setChatMessages(prev => [...prev, feedbackMessage]);
        
        // Speak feedback
        speak(result.evaluation.feedback);

        // Add next question if available
        if (result.nextQuestion) {
          setTimeout(() => {
            const nextQuestionMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              isAI: true,
              message: result.nextQuestion.question,
              timestamp: new Date().toISOString()
            };

            setChatMessages(prev => [...prev, nextQuestionMessage]);
            speak(result.nextQuestion.question);
          }, 2000);
        } else {
          // Interview completed
          setTimeout(() => {
            setLocation('/results?id=' + interviewId);
          }, 3000);
        }
      }, 2000);

      // Update query cache
      queryClient.invalidateQueries({ queryKey: ['/api/interviews', interviewId] });
    },
    onError: () => {
      toast({
        title: "Failed to submit answer",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Timer effect
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Start interview on mount
  useEffect(() => {
    if (!interviewId) {
      startInterviewMutation.mutate();
    }
  }, []);

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim() || !interview) return;

    const currentQuestion = interview.questions[interview.currentQuestionIndex];
    if (!currentQuestion) return;

    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer: currentAnswer.trim()
    });
  };

  const handleVoiceTranscription = (text: string) => {
    setCurrentAnswer(prev => prev + ' ' + text);
  };

  const handleEndInterview = () => {
    if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
      setLocation('/results?id=' + interviewId);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || startInterviewMutation.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Starting your interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  const progress = (interview.currentQuestionIndex / interview.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Webcam */}
      <Webcam isEnabled={webcamEnabled} onToggle={() => setWebcamEnabled(!webcamEnabled)} />

      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="p-2"
                data-testid="back-to-home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Excel Interview Session</h1>
                <p className="text-sm text-muted-foreground">
                  Question {interview.currentQuestionIndex + 1} of {interview.questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-primary font-medium" data-testid="interview-timer">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndInterview}
                data-testid="end-interview"
              >
                End Interview
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="min-h-[60vh] mb-8">
          <ChatInterface messages={chatMessages} isTyping={isTyping} />
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border"
        >
          <div className="space-y-4">
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[100px] resize-none bg-transparent border-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              data-testid="answer-input"
            />
            
            <div className="flex items-center justify-between">
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                disabled={submitAnswerMutation.isPending}
              />
              
              <div className="flex items-center space-x-2">
                {isSpeaking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stop}
                    className="text-xs"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop Audio
                  </Button>
                )}
                
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim() || submitAnswerMutation.isPending}
                  className="px-6"
                  data-testid="send-answer-btn"
                >
                  {submitAnswerMutation.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
