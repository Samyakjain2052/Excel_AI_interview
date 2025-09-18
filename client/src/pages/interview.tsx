import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Home, 
  Send, 
  Clock, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Zap,
  Target,
  Brain,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/use-speech';

import { ChatInterface } from '@/components/chat-interface';
import { Webcam } from '@/components/webcam';
import { VoiceRecorder, VoiceRecorderRef } from '@/components/voice-recorder';
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
  const [isIntroductionPhase, setIsIntroductionPhase] = useState(true);

  const voiceRecorderRef = useRef<VoiceRecorderRef>(null);
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/interviews/start');
      return response.json();
    },
    onSuccess: (result: any) => {
      setInterviewId(result.id);
      setStartTime(new Date());
      
      // Add AI-generated introduction messages
      setChatMessages([
        {
          id: '1',
          isAI: true,
          message: result.introduction.greeting,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          isAI: true,
          message: result.introduction.introductionRequest,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Speak both introduction messages sequentially
      setTimeout(() => {
        speak(result.introduction.greeting);
        // Speak the second message after the first one finishes
        setTimeout(() => {
          speak(result.introduction.introductionRequest);
        }, 3000); // Wait 3 seconds for first message to finish
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

  // Submit introduction and get first question
  const submitIntroductionMutation = useMutation({
    mutationFn: async (introduction: string) => {
      if (!interviewId) throw new Error('No interview ID');
      const response = await apiRequest('POST', `/api/interviews/${interviewId}/introduction`, {
        introduction
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      setIsIntroductionPhase(false);
      setCurrentQuestion(result.firstQuestion);
      
      // Add the first question to chat
      setChatMessages(prev => [
        ...prev,
        {
          id: 'q1',
          isAI: true,
          message: `**Question 1 of 10** (${result.firstQuestion.difficulty} level)\n\n${result.firstQuestion.question}`,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Speak the first question
      setTimeout(() => {
        speak(`Here's your first question: ${result.firstQuestion.question}`);
      }, 500);
    },
    onError: () => {
      toast({
        title: "Failed to submit introduction",
        description: "Please try again.",
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

  // Current question state
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  // Submit answer mutation with enhanced feedback
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const response = await apiRequest('POST', `/api/interviews/${interviewId}/answer`, {
        questionId,
        answer,
        isVoiceAnswer: false,
        currentQuestion
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

      // Simulate AI processing time for better UX
      setTimeout(() => {
        setIsTyping(false);
        
        // Add simple acknowledgment without showing scores (store evaluation in background)
        const acknowledmentMessages = [
          "Thank you for your answer. Let's move to the next question.",
          "Got it! Moving on to the next question.",
          "Thanks for sharing your thoughts. Here's the next question.",
          "Understood. Let's continue with the next question.",
          "Thank you. Moving forward to the next question."
        ];
        
        const randomAcknowledgment = acknowledmentMessages[Math.floor(Math.random() * acknowledmentMessages.length)];
        
        const feedbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          isAI: true,
          message: randomAcknowledgment,
          timestamp: new Date().toISOString(),
          score: result.evaluation.score, // Store silently for final report
          evaluation: result.evaluation.details
        };

        setChatMessages(prev => [...prev, feedbackMessage]);
        
        // Speak simple acknowledgment
        speak(randomAcknowledgment);

        // Add next adaptive question if available
        if (result.nextQuestion && !result.isCompleted) {
          setCurrentQuestion(result.nextQuestion);
          
          setTimeout(() => {
            const nextQuestionMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              isAI: true,
              message: `**Question ${result.progress.currentQuestion + 1} of ${result.progress.totalQuestions}** (${result.nextQuestion.difficulty} level)\n\n${result.nextQuestion.question}`,
              timestamp: new Date().toISOString()
            };

            setChatMessages(prev => [...prev, nextQuestionMessage]);
            speak(`Here's your next question: ${result.nextQuestion.question}`);
          }, 2500);
        } else if (result.isCompleted) {
          // Interview completed - trigger completion
          setTimeout(() => {
            if (interviewId) {
              completeInterviewMutation.mutate(interviewId);
            }
          }, 2000);
        }
      }, 1500);

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
    if (!currentAnswer.trim()) return;

    if (isIntroductionPhase) {
      // Add candidate's introduction to chat
      setChatMessages(prev => [
        ...prev,
        {
          id: `intro-${Date.now()}`,
          isAI: false,
          message: currentAnswer.trim(),
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Submit introduction and get first question
      submitIntroductionMutation.mutate(currentAnswer.trim());
      setCurrentAnswer('');
    } else {
      // Normal question answering
      if (!currentQuestion) return;
      
      submitAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answer: currentAnswer.trim()
      });
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setCurrentAnswer(prev => prev + ' ' + text);
  };

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Completing interview with ID:', id);
      const response = await apiRequest('POST', `/api/interviews/${id}/complete`);
      const result = await response.json();
      console.log('Interview completed successfully:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('Mutation success, result:', result);
      
      // Stop all ongoing activities immediately
      stop(); // Stop any speech synthesis
      setIsTyping(false);
      setCurrentAnswer('');
      
      toast({
        title: "Interview Completed",
        description: "Redirecting to your results..."
      });
      
      // Redirect immediately to results page
      const redirectUrl = `/results?id=${interviewId}`;
      console.log('Redirecting to:', redirectUrl);
      setLocation(redirectUrl);
    },
    onError: (error) => {
      console.error('Failed to complete interview:', error);
      toast({
        title: "Failed to complete interview",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleEndInterview = () => {
    if (confirm('Are you sure you want to end the interview? Your progress will be saved and evaluated.')) {
      console.log('User confirmed end interview, interviewId:', interviewId);
      
      // Immediately stop all ongoing activities
      stop(); // Stop any speech synthesis
      voiceRecorderRef.current?.stopRecording(); // Stop any ongoing recording
      
      // Clear any current answer
      setCurrentAnswer('');
      
      // Stop typing animation
      setIsTyping(false);
      
      if (interviewId) {
        console.log('Calling complete interview mutation...');
        completeInterviewMutation.mutate(interviewId);
      } else {
        console.error('No interview ID available for completion');
        toast({
          title: "Error",
          description: "No interview session found to complete.",
          variant: "destructive"
        });
      }
    } else {
      console.log('User cancelled end interview');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || startInterviewMutation.isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing Your Interview</h2>
            <p className="text-gray-600 mb-6">Setting up AI interviewer and loading questions...</p>
            
            <div className="space-y-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Initializing AI</span>
                <span>Loading Questions</span>
                <span>Ready to Start</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  const maxQuestions = 10;
  const currentIndex = (interview as any)?.currentQuestionIndex || 0;
  const progress = (currentIndex / maxQuestions) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Webcam */}
      <Webcam isEnabled={webcamEnabled} onToggle={() => setWebcamEnabled(!webcamEnabled)} />

      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="p-2"
                data-testid="back-to-home"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Excel Interview Session</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentIndex + 1} of {maxQuestions}
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
              
              {isSpeaking && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-700">AI Speaking</span>
                </div>
              )}
              
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

      {/* Simple Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 pb-32">
        {/* Chat Area - Full Width & Height */}
        <div className="min-h-[70vh] bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <ChatInterface messages={chatMessages} isTyping={isTyping} />
          </div>
        </div>

        {/* Sticky Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-10"
        >
          <div className="max-w-5xl mx-auto">
            <div className="space-y-4">
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={isSpeaking 
                ? "Please wait for AI to finish speaking..." 
                : isIntroductionPhase 
                  ? "Please introduce yourself here..." 
                  : "Type your answer here..."}
              className="min-h-[100px] resize-none bg-transparent border-none focus-visible:ring-0"
              disabled={isSpeaking || submitAnswerMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isSpeaking) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              data-testid="answer-input"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <VoiceRecorder
                  ref={voiceRecorderRef}
                  onTranscription={handleVoiceTranscription}
                  disabled={isSpeaking || submitAnswerMutation.isPending}
                />
                
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
              </div>
              
              <Button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim() || submitAnswerMutation.isPending || isSpeaking}
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
                    {isIntroductionPhase ? "Submit Introduction" : "Submit Answer"}
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
