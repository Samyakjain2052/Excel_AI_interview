import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { CheckCircle, AlertTriangle, Download, RotateCcw, Share2, List, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

import { generateInterviewReport } from '@/lib/pdf-generator';
import type { Interview, InterviewEvaluation } from '@/types/interview';

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get interview ID from URL
  const interviewId = new URLSearchParams(window.location.search).get('id');

  const { data: interview, isLoading, error } = useQuery({
    queryKey: ['/api/interviews', interviewId],
    enabled: !!interviewId,
  });

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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const evaluation = interview.evaluation;
  if (!evaluation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Interview still in progress...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${getScoreGradient(evaluation.overallScore)}`}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Interview Complete!</h1>
          <p className="text-muted-foreground text-lg">Here's your detailed performance report</p>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(evaluation.overallScore)}`}>
                {evaluation.overallScore}
              </div>
              <div className="text-muted-foreground mb-3">Overall Score</div>
              <Progress 
                value={evaluation.overallScore} 
                className="h-2"
              />
              <div className="text-sm text-muted-foreground mt-2">
                {evaluation.overallScore >= 80 ? 'Excellent' : evaluation.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {evaluation.correctAnswers}/{evaluation.totalQuestions}
              </div>
              <div className="text-muted-foreground mb-3">Questions Correct</div>
              <div className="text-sm text-emerald-400">
                {Math.round((evaluation.correctAnswers / evaluation.totalQuestions) * 100)}% Success Rate
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {interview.duration ? Math.floor(interview.duration / 60) : 0}m
              </div>
              <div className="text-muted-foreground mb-3">Duration</div>
              <div className="text-sm text-muted-foreground">
                {interview.duration && interview.duration > 600 ? 'Take your time' : 'Good pace'}
              </div>
            </CardContent>
          </Card>
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
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluation.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {evaluation.strengths.map((strength, index) => (
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
                    {evaluation.improvements.map((improvement, index) => (
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
                <List className="w-5 h-5" />
                <span>Question Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interview.responses.map((response, index) => {
                  const question = interview.questions[index];
                  if (!question) return null;

                  const score = response.score || 0;
                  const isGoodScore = score >= 7;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isGoodScore 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-orange-500/5 border-orange-500/20'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium mb-1">
                          Question {index + 1}: {question.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {question.question}
                        </p>
                        {response.feedback && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {response.feedback}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className={`font-semibold ${isGoodScore ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {score}/10
                        </div>
                        {isGoodScore ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
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
