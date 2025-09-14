import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Brain, Play, Video, MessageCircle, Sparkles, FileSpreadsheet, ChartBar, Download, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const features = [
    {
      icon: MessageCircle,
      title: "Voice & Text Interaction",
      description: "Speak naturally or type your responses. Our AI understands both and provides contextual follow-up questions.",
      color: "text-primary"
    },
    {
      icon: Brain,
      title: "Real-time Evaluation", 
      description: "Get instant feedback on your answers with detailed analysis of correctness, clarity, and completeness.",
      color: "text-emerald-400"
    },
    {
      icon: Camera,
      title: "Live Webcam View",
      description: "Practice your body language and presentation skills with our integrated webcam monitoring.",
      color: "text-orange-400"
    },
    {
      icon: FileSpreadsheet,
      title: "Excel Expertise",
      description: "Comprehensive coverage of Excel topics from basic formulas to advanced pivot tables and macros.",
      color: "text-purple-400"
    },
    {
      icon: ChartBar,
      title: "Detailed Reports",
      description: "Receive comprehensive performance reports with strengths, weaknesses, and actionable improvement suggestions.",
      color: "text-blue-400"
    },
    {
      icon: Download,
      title: "Export & Share",
      description: "Download your interview transcripts and performance reports as PDFs for future reference.",
      color: "text-pink-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-foreground">ExcelAI</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>
            
            <Button variant="outline" size="sm">
              Sign In
            </Button>
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
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20 inline-flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Interview Platform</span>
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-blue-400 bg-clip-text text-transparent leading-tight"
            >
              AI Excel Mock Interviewer
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed"
            >
              Master Excel interviews with our advanced AI interviewer. Get real-time feedback, 
              practice with voice interaction, and receive detailed performance reports.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="/interview">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  data-testid="start-interview-btn"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Start Interview
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 bg-card/50 hover:bg-card/80 backdrop-blur-sm"
              >
                <Video className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
            >
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
                <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-muted-foreground">Interviews Conducted</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
                <div className="text-3xl font-bold text-emerald-400 mb-2">95%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
                <div className="text-3xl font-bold text-orange-400 mb-2">4.9/5</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </motion.div>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose Our AI Interviewer?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of interview preparation with cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border hover:bg-card/80 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 bg-${feature.color.split('-')[1]}-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-12 rounded-2xl border border-primary/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Ace Your Excel Interview?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of professionals who have improved their Excel skills with our AI interviewer.
            </p>
            <Link href="/interview">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Your Free Interview
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
