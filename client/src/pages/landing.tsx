import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Zap, 
  ArrowRight, 
  Mic, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  Shield,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

export default function Landing() {
  const { user, logout, isAuthenticated, isHR } = useAuth();
  
  const features = [
    {
      icon: Mic,
      title: "Smart Voice Recognition",
      description: "Speak naturally or type your responses - our advanced AI understands both perfectly.",
      color: "from-blue-500 to-cyan-500",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
      icon: Target,
      title: "Real-Time Analysis", 
      description: "Get instant, detailed feedback with personalized improvement suggestions.",
      color: "from-emerald-500 to-teal-500",
      bgGradient: "bg-gradient-to-br from-emerald-50 to-teal-50"
    },
    {
      icon: BookOpen,
      title: "Expert-Level Questions",
      description: "Master Excel with interview questions used by top companies worldwide.",
      color: "from-purple-500 to-indigo-500",
      bgGradient: "bg-gradient-to-br from-purple-50 to-indigo-50"
    }
  ];



  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">ExcelMaster</span>
                <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
              </div>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">Analytics</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-indigo-700">Live AI Interview Coach</span>
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-gray-900 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                Master Excel
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Interviews
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto"
            >
              Land your dream job with our AI-powered Excel interview simulator. 
              <span className="font-semibold text-gray-800"> Real questions, instant feedback, proven results.</span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              {/* User Status & Actions */}
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Welcome User */}
                  <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                        {isHR ? <Shield className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Welcome back, {user?.username}!</p>
                        <p className="text-xs text-gray-600">{isHR ? 'HR Dashboard' : 'Candidate Portal'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link href={isHR ? "/hr-dashboard" : "/interview"}>
                      <Button
                        size="lg"
                        className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 text-white text-lg px-8 py-4 rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all duration-500 transform hover:scale-105 border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            {isHR ? <Shield className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />}
                          </div>
                          <span className="font-semibold">{isHR ? 'View Dashboard' : 'Start Interview'}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={logout}
                      className="bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-4 rounded-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 text-white text-lg px-10 py-4 rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all duration-500 transform hover:scale-105 border-0"
                      data-testid="login-btn"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                        <span className="font-semibold">Get Started - Login</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    </Button>
                  </Link>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Free registration • Secure login</span>
                  </div>
                  
                  {/* Demo Initialization Button - For Development */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        await fetch('/api/auth/init-demo', { method: 'POST' });
                        alert('Demo users initialized! Use hr_demo/demo123 or candidate_demo/demo123');
                      } catch (error) {
                        alert('Failed to initialize demo users');
                      }
                    }}
                    className="text-xs"
                  >
                    Initialize Demo Users
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}



          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 text-indigo-600 border-indigo-200">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade interview preparation with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 group hover:shadow-xl ${feature.bgGradient}`}
              >
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      

      {/* Final CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20">
                <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  Ready to Ace Your Interview?
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Join thousands who've already improved their Excel skills and landed their dream jobs.
                </p>
                <Link href="/interview">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden bg-white text-indigo-600 hover:text-indigo-700 text-lg px-10 py-4 rounded-full shadow-2xl hover:shadow-white/25 transition-all duration-500 transform hover:scale-105 border-0 font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <span>Start Your Free Interview Now</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-6 mt-8 text-blue-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Instant Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">100% Free</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
