import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RotateCcw, 
  Share2, 
  Home,
  Trophy,
  Target,
  TrendingUp,
  Brain,
  Zap,
  Award,
  Clock,
  MessageSquare,
  Mic,
  Star,
  ThumbsUp,
  ArrowRight,
  PieChart,
  BarChart3,
  Activity,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

import { generateInterviewReport } from '@/lib/pdf-generator';
import type { Interview, InterviewEvaluation, InterviewResponse } from '@/types/interview';

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get interview ID from URL
  const interviewId = new URLSearchParams(window.location.search).get('id');
  
  console.log('Results page - interviewId:', interviewId);

  const { data: interview, isLoading, error } = useQuery<Interview>({
    queryKey: [`/api/interviews/${interviewId}`],
    enabled: !!interviewId,
    retry: 3
  });

  // Handle error state
  React.useEffect(() => {
    if (error) {
      console.error('Failed to fetch interview:', error);
      toast({
        title: "Failed to load results",
        description: "Unable to load interview results. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Log successful data
  React.useEffect(() => {
    if (interview) {
      console.log('Successfully loaded interview:', interview);
      console.log('Interview evaluation:', interview.evaluation);
      console.log('Interview status:', interview.status);
      console.log('Interview responses:', interview.responses);
      console.log('Interview questions:', interview.questions);
    }
  }, [interview]);

  const handleDownloadReport = () => {
    if (!interview?.evaluation) return;
    
    try {
      generateInterviewReport(interview, interview.evaluation);
      toast({
        title: "Report Downloaded",
        description: "Your interview report has been saved as a PDF."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF report.",
        variant: "destructive"
      });
    }
  };

  const handleRetakeInterview = () => {
    setLocation('/interview');
  };

  const handleShare = async () => {
    if (navigator.share && interview?.evaluation) {
      try {
        await navigator.share({
          title: 'My Excel Interview Results',
          text: `I scored ${interview.evaluation.overallScore}/100 on my Excel interview!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Interview results link copied to clipboard."
      });
    }
  };

  if (isLoading) {
    console.log('Results page - showing loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    console.log('Results page - error or no interview found:', { error, interview });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load interview results. The interview may not be completed yet.
            </p>
            <Button onClick={() => setLocation('/')}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Results page - Raw interview data:', interview);
  console.log('Results page - interview.evaluation exists:', !!interview.evaluation);
  
  // Check if we have real evaluation data
  if (interview.evaluation) {
    console.log('Using real AI-generated evaluation:', interview.evaluation);
  } else {
    console.log('No evaluation found - this should not happen for completed interviews');
  }
  
  // Only use fallback if evaluation is completely missing (shouldn't happen with proper completion)
  const evaluation = interview.evaluation || {
    overallScore: 0,
    totalQuestions: Array.isArray(interview.questions) ? interview.questions.length : 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    strengths: ["Started the interview process"],
    improvements: ["Complete the full interview to get proper evaluation"],
    overallFeedback: "Interview was not completed properly. Please take the full interview to get detailed feedback.",
    categoryScores: {},
    recommendations: ["Take the complete interview", "Answer all Excel questions for detailed analysis"],
    duration: interview.duration || 0,
    completedAt: interview.completedAt || new Date().toISOString()
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  console.log('Results page - rendering main content with evaluation:', evaluation);

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="p-3 hover:bg-gray-100 rounded-xl"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Interview Results</h1>
                  <p className="text-sm text-gray-500">Complete Performance Analysis</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={() => setLocation('/interview')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Interview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-block mb-6"
          >
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br ${getScoreGradient(evaluation.overallScore)} shadow-2xl`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center"
            >
              <Star className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-extrabold mb-4"
          >
            <span className="bg-gradient-to-r from-gray-900 via-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Congratulations!
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            You've successfully completed your Excel interview. Here's your comprehensive performance analysis.
          </motion.p>
        </motion.div>

        {/* Modern Score Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="md:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    Overall Performance
                  </h3>
                  <Badge className={`${evaluation.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' : evaluation.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {evaluation.overallScore >= 80 ? 'Excellent' : evaluation.overallScore >= 60 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div className={`text-6xl font-black ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}
                  </div>
                  <div className="text-2xl font-semibold text-gray-400 mb-2">/100</div>
                </div>
                <Progress 
                  value={evaluation.overallScore} 
                  className="h-3 mb-4"
                />
                <p className="text-gray-600">
                  {evaluation.overallScore >= 80 ? 'Outstanding performance! You demonstrate excellent Excel skills.' :
                   evaluation.overallScore >= 60 ? 'Good work! You have solid Excel foundations.' :
                   'Keep practicing! There\'s room for improvement in your Excel skills.'}
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            </div>
          </motion.div>

          {/* Questions Answered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Accuracy</h4>
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {evaluation.correctAnswers}/{evaluation.totalQuestions}
            </div>
            <div className="text-sm text-gray-500 mb-3">Questions Correct</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">
                {Math.round((evaluation.correctAnswers / Math.max(evaluation.totalQuestions, 1)) * 100)}% Success Rate
              </span>
            </div>
          </motion.div>

          {/* Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Duration</h4>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {interview.duration ? Math.floor(interview.duration / 60) : 0}m
            </div>
            <div className="text-sm text-gray-500 mb-3">Total Time</div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                {interview.duration && interview.duration > 600 ? 'Thorough' : 'Efficient'}
              </span>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluation.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {evaluation.strengths.map((strength: string, index: number) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-muted-foreground">{strength}</p>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Keep practicing to develop your strengths!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  </div>
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluation.improvements.length > 0 ? (
                  <ul className="space-y-3">
                    {evaluation.improvements.map((improvement: string, index: number) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-muted-foreground">{improvement}</p>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Great job! No major areas for improvement identified.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Question Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <span>Question Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {interview.responses && interview.responses.length > 0 && interview.responses.map((response: InterviewResponse, index: number) => {
                  if (!response || !response.question) return null;

                  const score = response.score || 0;
                  const isGoodScore = score >= 7;
                  const evaluation = response.evaluation;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className={`p-6 rounded-lg border ${
                        isGoodScore 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-orange-500/5 border-orange-500/20'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              Question {index + 1}
                            </h3>
                            <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium">
                              {response.category?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                            <span className="px-2 py-1 bg-muted rounded-full text-xs">
                              {response.difficulty || 'intermediate'}
                            </span>
                          </div>
                          <p className="text-foreground font-medium">
                            {response.question}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className={`font-bold text-xl ${isGoodScore ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {score}/10
                          </div>
                          {isGoodScore ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                          )}
                        </div>
                      </div>

                      {/* Answer Transcript */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm">Your Answer:</h4>
                          {response.isVoiceAnswer && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                              Voice Answer
                            </span>
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 border">
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {response.answer || "No answer provided"}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Statistics */}
                      {(response.metrics || evaluation) && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-3">Performance Breakdown:</h4>
                          {response.metrics ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(response.metrics).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className="text-lg font-semibold text-primary">
                                    {value}/10
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  <Progress value={value * 10} className="h-1 mt-1" />
                                </div>
                              ))}
                            </div>
                          ) : evaluation && (
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-primary">
                                  {evaluation.correctness}/10
                                </div>
                                <div className="text-xs text-muted-foreground">Correctness</div>
                                <Progress value={evaluation.correctness * 10} className="h-1 mt-1" />
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-primary">
                                  {evaluation.clarity}/10
                                </div>
                                <div className="text-xs text-muted-foreground">Clarity</div>
                                <Progress value={evaluation.clarity * 10} className="h-1 mt-1" />
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-primary">
                                  {evaluation.completeness}/10
                                </div>
                                <div className="text-xs text-muted-foreground">Completeness</div>
                                <Progress value={evaluation.completeness * 10} className="h-1 mt-1" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Timestamp */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground">
                          Answered: {new Date(response.timestamp).toLocaleString()}
                        </p>
                      </div>

                      {/* Feedback */}
                      {response.feedback && (
                        <div className="bg-muted/30 rounded-lg p-4 border">
                          <h4 className="font-medium text-sm mb-2">AI Feedback:</h4>
                          <p className="text-sm text-muted-foreground">
                            {response.feedback}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {(!interview.responses || interview.responses.length === 0) && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Questions Answered</h3>
                    <p className="text-gray-500">
                      The interview was completed during the introduction phase. 
                      Take a full interview to see detailed question breakdown.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Button
            onClick={handleDownloadReport}
            className="bg-primary hover:bg-primary/90"
            data-testid="download-report"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF Report
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRetakeInterview}
            data-testid="retake-interview"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retake Interview
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            data-testid="share-results"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
