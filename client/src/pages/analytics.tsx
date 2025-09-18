import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, AlertTriangle, CheckCircle, Activity, ArrowRight } from 'lucide-react';

interface SystemMetrics {
  date: Date;
  totalEvaluations: number;
  averageConsistencyScore: number;
  calibrationAccuracy?: number;
  categoryBreakdown: Record<string, {
    averageScore: number;
    consistency: number;
    sampleSize: number;
  }>;
  difficultyBreakdown: Record<string, {
    averageScore: number;
    consistency: number;
    sampleSize: number;
  }>;
  systemLoad: {
    averageResponseTime: number;
    errorRate: number;
    peakConcurrency: number;
  };
}

interface EvaluationHistory {
  evaluationId: string;
  timestamp: Date;
  category: string;
  difficulty: string;
  aiScore: number;
  humanScore?: number;
  consistency: {
    evaluationConsistency: number;
    difficultyCalibration: number;
    categoryAlignment: number;
    confidenceLevel: number;
    calibrationVersion: string;
  };
}

export default function Analytics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch system metrics
        const metricsResponse = await fetch('/api/analytics/metrics');
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);

        // Fetch evaluation history
        const historyResponse = await fetch('/api/analytics/evaluation-history?limit=50');
        const historyData = await historyResponse.json();
        setEvaluationHistory(historyData.history);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no metrics data
  if (!metrics || metrics.totalEvaluations === 0) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">AI Evaluation Analytics</h1>
                <p className="text-blue-100 text-lg">
                  Real-time insights into evaluation consistency, calibration accuracy, and system performance
                </p>
              </div>
              <div className="flex gap-3">
                <a href="/hr-dashboard" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                  HR Dashboard
                </a>
                <a href="/" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                  Home
                </a>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Evaluation Data Yet</h3>
              <p className="text-gray-600 mb-6">
                Start conducting interviews to see analytics data here. Once evaluations are completed, 
                this dashboard will show real performance metrics and insights.
              </p>
              <a 
                href="/interview" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Your First Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryData = Object.entries(metrics.categoryBreakdown).map(([category, data]) => ({
    category: category.replace(/_/g, ' ').toUpperCase(),
    averageScore: Math.round(data.averageScore * 10) / 10,
    consistency: Math.round(data.consistency * 10) / 10,
    sampleSize: data.sampleSize
  }));

  const difficultyData = Object.entries(metrics.difficultyBreakdown).map(([difficulty, data]) => ({
    difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    averageScore: Math.round(data.averageScore * 10) / 10,
    consistency: Math.round(data.consistency * 10) / 10,
    sampleSize: data.sampleSize
  }));

  const recentTrends = evaluationHistory.slice(0, 20).reverse().map((evaluation, index) => ({
    evaluation: index + 1,
    consistency: Math.round((evaluation.consistency.evaluationConsistency + evaluation.consistency.difficultyCalibration + evaluation.consistency.categoryAlignment + evaluation.consistency.confidenceLevel) / 4 * 10) / 10,
    aiScore: Math.round(evaluation.aiScore * 10) / 10,
    humanScore: evaluation.humanScore ? Math.round(evaluation.humanScore * 10) / 10 : null
  }));

  const calibrationData = evaluationHistory
    .filter(evaluation => evaluation.humanScore)
    .map((evaluation, index) => ({
      evaluation: index + 1,
      aiScore: Math.round(evaluation.aiScore * 10) / 10,
      humanScore: Math.round(evaluation.humanScore! * 10) / 10,
      difference: Math.round((Math.abs(evaluation.aiScore - evaluation.humanScore!) * 10)) / 10
    }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">AI Evaluation Analytics</h1>
              <p className="text-blue-100 text-lg">
                Real-time insights into evaluation consistency, calibration accuracy, and system performance
              </p>
            </div>
            <div className="flex gap-3">
              <a href="/hr-dashboard" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                HR Dashboard
              </a>
              <a href="/" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                Home
              </a>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvaluations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total evaluations processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Consistency</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageConsistencyScore * 10) / 10}/10</div>
              <Progress value={metrics.averageConsistencyScore * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calibration Accuracy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.calibrationAccuracy || 0)}%</div>
              <Badge 
                variant={
                  !metrics.calibrationAccuracy ? "outline" : 
                  metrics.calibrationAccuracy > 85 ? "default" : 
                  metrics.calibrationAccuracy > 70 ? "secondary" : "destructive"
                } 
                className="mt-2"
              >
                {!metrics.calibrationAccuracy ? "No Data" : 
                 metrics.calibrationAccuracy > 85 ? "Excellent" : 
                 metrics.calibrationAccuracy > 70 ? "Good" : "Needs Improvement"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.systemLoad.averageResponseTime)}ms</div>
              <p className="text-xs text-muted-foreground">
                Error rate: {Math.round(metrics.systemLoad.errorRate * 10) / 10}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="consistency">Consistency</TabsTrigger>
            <TabsTrigger value="calibration">Calibration</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consistency Trends</CardTitle>
                  <CardDescription>Recent evaluation consistency scores over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={recentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="evaluation" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="consistency" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Difficulty Distribution</CardTitle>
                  <CardDescription>Performance across difficulty levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={difficultyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="difficulty" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="averageScore" fill="#10B981" />
                      <Bar dataKey="consistency" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.round(metrics.systemLoad.averageResponseTime)}ms</div>
                    <p className="text-sm text-gray-600">Average Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{metrics.systemLoad.peakConcurrency}</div>
                    <p className="text-sm text-gray-600">Peak Concurrency</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(metrics.systemLoad.errorRate * 10) / 10}%</div>
                    <p className="text-sm text-gray-600">Error Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consistency Tab */}
          <TabsContent value="consistency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Consistency Metrics Breakdown</CardTitle>
                <CardDescription>Detailed view of evaluation consistency components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluationHistory.slice(0, 5).map((evaluation, index) => (
                    <div key={evaluation.evaluationId} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{evaluation.category.replace(/_/g, ' ').toUpperCase()}</Badge>
                        <Badge variant="secondary">{evaluation.difficulty}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Evaluation Consistency</p>
                          <p className="text-blue-600">{Math.round(evaluation.consistency.evaluationConsistency * 10) / 10}/10</p>
                        </div>
                        <div>
                          <p className="font-medium">Difficulty Calibration</p>
                          <p className="text-green-600">{Math.round(evaluation.consistency.difficultyCalibration * 10) / 10}/10</p>
                        </div>
                        <div>
                          <p className="font-medium">Category Alignment</p>
                          <p className="text-purple-600">{Math.round(evaluation.consistency.categoryAlignment * 10) / 10}/10</p>
                        </div>
                        <div>
                          <p className="font-medium">Confidence Level</p>
                          <p className="text-orange-600">{Math.round(evaluation.consistency.confidenceLevel * 10) / 10}/10</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calibration Tab */}
          <TabsContent value="calibration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI vs Human Scores</CardTitle>
                  <CardDescription>Comparison of AI and human expert evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={calibrationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="evaluation" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="aiScore" stroke="#3B82F6" strokeWidth={2} name="AI Score" />
                      <Line type="monotone" dataKey="humanScore" stroke="#10B981" strokeWidth={2} name="Human Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calibration Accuracy</CardTitle>
                  <CardDescription>Distribution of score differences</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={calibrationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="evaluation" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="difference" fill="#F59E0B" name="Score Difference" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Average scores by Excel skill category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="averageScore" fill="#3B82F6" />
                      <Bar dataKey="consistency" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Distribution</CardTitle>
                  <CardDescription>Number of evaluations per category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, sampleSize }) => `${category}: ${sampleSize}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sampleSize"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Category Statistics</CardTitle>
                <CardDescription>Comprehensive breakdown of category performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Avg Score</th>
                        <th className="text-right p-2">Consistency</th>
                        <th className="text-right p-2">Sample Size</th>
                        <th className="text-right p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryData.map((category) => (
                        <tr key={category.category} className="border-b">
                          <td className="p-2 font-medium">{category.category}</td>
                          <td className="p-2 text-right">{category.averageScore}/10</td>
                          <td className="p-2 text-right">{category.consistency}/10</td>
                          <td className="p-2 text-right">{category.sampleSize}</td>
                          <td className="p-2 text-right">
                            <Badge variant={
                              category.sampleSize === 0 ? "outline" :
                              category.consistency > 8 ? "default" : 
                              category.consistency > 7 ? "secondary" : "destructive"
                            }>
                              {category.sampleSize === 0 ? "No Data" :
                               category.consistency > 8 ? "Excellent" : 
                               category.consistency > 7 ? "Good" : "Needs Attention"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}