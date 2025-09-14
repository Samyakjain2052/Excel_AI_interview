import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/use-speech';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled = false }: VoiceRecorderProps) {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  const handleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        onTranscription(transcript);
        resetTranscript();
      }
    } else {
      startListening();
    }
  };

  const handleVoiceInput = () => {
    if (!isSupported) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    handleSpeechRecognition();
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-muted-foreground">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleVoiceInput}
        disabled={disabled}
        className={`relative ${
          isListening 
            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
            : 'bg-primary/20 hover:bg-primary/30 text-primary'
        }`}
        data-testid="voice-record-btn"
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        
        {isListening && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </Button>
      
      {/* Voice status indicator */}
      {isListening && (
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400">Listening...</span>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}