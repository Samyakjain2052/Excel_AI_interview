import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, User, CheckCircle, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/interview';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function ChatInterface({ messages, isTyping }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score?: number) => {
    if (!score) return null;
    return score >= 6 ? CheckCircle : AlertCircle;
  };

  return (
    <div className="flex-1 space-y-6 pb-6" data-testid="chat-container">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex items-start space-x-3 ${
              message.isAI ? '' : 'justify-end'
            }`}
          >
            {message.isAI && (
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-lg p-4 rounded-2xl ${
                message.isAI
                  ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tl-sm'
                  : 'bg-accent text-accent-foreground rounded-tr-sm'
              }`}
            >
              <div className="font-medium mb-1 text-sm">
                {message.isAI ? 'AI Interviewer' : 'You'}
              </div>
              
              <div className="text-sm leading-relaxed">
                {message.message}
              </div>
              
              {/* Score and evaluation display */}
              {message.score !== undefined && message.evaluation && (
                <div className="mt-3 flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 ${getScoreColor(message.score)}`}>
                    {React.createElement(getScoreIcon(message.score) || CheckCircle, { 
                      className: 'w-4 h-4' 
                    })}
                    <span className="text-xs font-medium">
                      Score: {message.score}/10
                    </span>
                  </div>
                  
                  <div className="text-xs text-white/70">
                    Correctness: {message.evaluation.correctness}/10 |
                    Clarity: {message.evaluation.clarity}/10 |
                    Completeness: {message.evaluation.completeness}/10
                  </div>
                </div>
              )}
              
              <div className={`text-xs mt-2 ${
                message.isAI ? 'text-blue-100' : 'text-muted-foreground'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {!message.isAI && (
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-start space-x-3"
          data-testid="typing-indicator"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="bg-gradient-to-br from-primary to-blue-600 text-white p-4 rounded-2xl rounded-tl-sm max-w-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
