import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Star, User, Briefcase, Building2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface CandidateInterviewViewProps {
  interviewId: string;
  onRecommendationUpdate?: () => void;
}

interface InterviewDetails {
  interview: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    position: string;
    department: string;
    status: string;
    totalScore: number;
    startedAt: string;
    completedAt: string;
    duration: number;
    questions: any[];
    responses: any[];
    evaluation: any;
    hrRecommendation?: string;
    hrNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
  };
  evaluations: any[];
}

export function CandidateInterviewView({ interviewId, onRecommendationUpdate }: CandidateInterviewViewProps) {
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchInterviewDetails();
  }, [interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      const response = await fetch(`/api/hr/interview/${interviewId}`);
      if (response.ok) {
        const data = await response.json();
        setInterviewDetails(data);
        setRecommendation(data.interview.hrRecommendation || "");
        setNotes(data.interview.hrNotes || "");
      }
    } catch (error) {
      console.error("Failed to fetch interview details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecommendation = async () => {
    if (!recommendation) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/hr/interview/${interviewId}/recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recommendation,
          notes,
          hrUserId: "hr-user", // In a real app, this would come from auth context
        }),
      });

      if (response.ok) {
        await fetchInterviewDetails();
        onRecommendationUpdate?.();
      }
    } catch (error) {
      console.error("Failed to save recommendation:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "hire":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Hire</Badge>;
      case "reject":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Reject</Badge>;
      case "review":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertTriangle className="h-3 w-3 mr-1" />Needs Review</Badge>;
      default:
        return <Badge variant="outline">Pending Review</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!interviewDetails) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Interview not found.</p>
        </CardContent>
      </Card>
    );
  }

  const { interview, evaluations } = interviewDetails;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Candidate Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {interview.candidateName}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{interview.candidateEmail}</p>
            </div>
            <div className="text-right">
              {interview.hrRecommendation && getRecommendationBadge(interview.hrRecommendation)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{interview.position}</p>
                <p className="text-xs text-gray-500">Position</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{interview.department}</p>
                <p className="text-xs text-gray-500">Department</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{new Date(interview.startedAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">Interview Date</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{formatDuration(interview.duration)}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${getScoreColor(interview.totalScore)}`}>
              {interview.totalScore}/10
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    interview.totalScore >= 8 ? 'bg-green-500' :
                    interview.totalScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(interview.totalScore / 10) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Performance Level: {
                  interview.totalScore >= 8 ? 'Excellent' :
                  interview.totalScore >= 6 ? 'Good' : 'Needs Improvement'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question & Answer Details */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {interview.questions && interview.responses && interview.questions.map((question: any, index: number) => {
              const response = interview.responses[index];
              return (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="mb-2">
                    <p className="font-medium text-gray-900">Question {index + 1}</p>
                    <p className="text-gray-700">{question.question}</p>
                  </div>
                  <div className="mb-2">
                    <p className="font-medium text-gray-600">Candidate's Answer:</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded mt-1">
                      {response?.transcript || response?.answer || "No answer provided"}
                    </p>
                  </div>
                  {response?.score && (
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getScoreColor(response.score)}`}>
                        Score: {response.score}/10
                      </span>
                      {response.feedback && (
                        <span className="text-sm text-gray-600">• {response.feedback}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* HR Recommendation Section */}
      <Card>
        <CardHeader>
          <CardTitle>HR Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hiring Decision</label>
              <Select value={recommendation} onValueChange={setRecommendation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hire">Hire</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="review">Needs Further Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Additional Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional comments or observations about the candidate..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSaveRecommendation} 
              disabled={!recommendation || saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Recommendation"}
            </Button>

            {interview.reviewedBy && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Reviewed by: <span className="font-medium">{interview.reviewedBy}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Reviewed on: {new Date(interview.reviewedAt!).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}