import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CandidateInterviewView } from "@/components/candidate-interview-view";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter,
  FileText,
  TrendingUp,
  Award,
  Building2,
  Calendar,
  Eye
} from 'lucide-react';

interface CandidateInterview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  status: 'completed' | 'in_progress' | 'abandoned';
  totalScore: number;
  startedAt: Date;
  completedAt?: Date;
  duration: number;
  hrRecommendation?: 'hire' | 'reject' | 'pending';
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface HRMetrics {
  totalCandidates: number;
  completedInterviews: number;
  pendingReviews: number;
  averageScore: number;
  averageDuration: number;
  departmentBreakdown: Record<string, {
    candidates: number;
    averageScore: number;
    hireRate: number;
  }>;
  positionBreakdown: Record<string, {
    candidates: number;
    averageScore: number;
    hireRate: number;
  }>;
}

export default function HRDashboard() {
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [candidates, setCandidates] = useState<CandidateInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateInterview | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch HR metrics
        const metricsResponse = await fetch('/api/hr/metrics');
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);

        // Fetch candidate interviews
        const candidatesResponse = await fetch('/api/hr/candidates');
        const candidatesData = await candidatesResponse.json();
        setCandidates(candidatesData);
      } catch (error) {
        console.error('Failed to fetch HR data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || candidate.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || candidate.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'abandoned': return 'destructive';
      default: return 'outline';
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case 'hire': return 'default';
      case 'reject': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const handleViewDetails = (interviewId: string) => {
    setSelectedInterviewId(interviewId);
    setIsDetailModalOpen(true);
  };

  const handleRecommendationUpdate = async () => {
    // Refresh the data when a recommendation is updated
    try {
      const candidatesResponse = await fetch('/api/hr/candidates');
      const candidatesData = await candidatesResponse.json();
      setCandidates(candidatesData);
      
      const metricsResponse = await fetch('/api/hr/metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HR dashboard...</p>
        </div>
      </div>
    );
  }

  if (metrics.totalCandidates === 0) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
            <h1 className="text-4xl font-bold mb-2">HR Interview Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Manage candidate interviews, review evaluations, and track hiring metrics
            </p>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Candidate Interviews Yet</h3>
              <p className="text-gray-600 mb-6">
                When candidates complete interviews, their results will appear here for review and evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">HR Interview Dashboard</h1>
              <p className="text-blue-100 text-lg">
                Manage candidate interviews, review evaluations, and track hiring metrics
              </p>
            </div>
            <div className="flex gap-3">
              <a href="/analytics" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                Technical Analytics
              </a>
              <a href="/" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                Home
              </a>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">All interviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completedInterviews}</div>
              <p className="text-xs text-muted-foreground">Finished interviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Awaiting HR review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageScore.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageDuration / 60)}min</div>
              <p className="text-xs text-muted-foreground">Interview length</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="candidates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Search & Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or position..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {Object.keys(metrics.departmentBreakdown).map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Candidates Table */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Results ({filteredCandidates.length})</CardTitle>
                <CardDescription>Review and manage candidate interview evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Candidate</th>
                        <th className="text-left p-3">Position</th>
                        <th className="text-left p-3">Department</th>
                        <th className="text-center p-3">Score</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-center p-3">Recommendation</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-center p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{candidate.candidateName}</div>
                              <div className="text-gray-500 text-xs">{candidate.candidateEmail}</div>
                            </div>
                          </td>
                          <td className="p-3">{candidate.position}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {candidate.department}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-bold ${getScoreColor(candidate.totalScore)}`}>
                              {candidate.totalScore.toFixed(1)}/10
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={getStatusColor(candidate.status)}>
                              {candidate.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={getRecommendationColor(candidate.hrRecommendation)}>
                              {candidate.hrRecommendation || 'Pending'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {new Date(candidate.startedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(candidate.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Average scores by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(metrics.departmentBreakdown).map(([dept, data]) => ({
                      department: dept,
                      avgScore: Math.round(data.averageScore * 10) / 10,
                      candidates: data.candidates,
                      hireRate: Math.round(data.hireRate * 100)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgScore" fill="#3B82F6" name="Avg Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Position Analysis</CardTitle>
                  <CardDescription>Hiring success by position</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(metrics.positionBreakdown).map(([pos, data]) => ({
                      position: pos.length > 15 ? pos.substring(0, 15) + '...' : pos,
                      avgScore: Math.round(data.averageScore * 10) / 10,
                      candidates: data.candidates,
                      hireRate: Math.round(data.hireRate * 100)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="position" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hireRate" fill="#10B981" name="Hire Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Reports</CardTitle>
                <CardDescription>Export and analyze hiring data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Reports Feature</h3>
                  <p className="text-gray-600 mb-4">
                    Export interview data, generate hiring reports, and analyze recruitment metrics.
                  </p>
                  <Button variant="outline">
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Candidate Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterviewId && (
            <CandidateInterviewView 
              interviewId={selectedInterviewId} 
              onRecommendationUpdate={handleRecommendationUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}