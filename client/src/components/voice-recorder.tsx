import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export interface VoiceRecorderRef {
  stopRecording: () => void;
}

export const VoiceRecorder = forwardRef<VoiceRecorderRef, VoiceRecorderProps>(
  ({ onTranscription, disabled = false }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Expose stopRecording method to parent component
  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      
      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }));

  const startRecording = async () => {
    try {
      setError(null);
      
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder with fallback MIME types
      let mediaRecorder;
      try {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
          });
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/mp4'
          });
        } else {
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (err) {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // Determine the MIME type and extension based on what was recorded
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      let extension = 'webm';
      let filename = 'recording.webm';
      
      if (mimeType.includes('mp4')) {
        extension = 'mp4';
        filename = 'recording.mp4';
      } else if (mimeType.includes('webm')) {
        extension = 'webm';
        filename = 'recording.webm';
      }
      
      console.log(`Processing audio: ${mimeType}, file: ${filename}`);
      
      // Create audio blob
      const audioBlob = new Blob(chunksRef.current, { type: mimeType });
      
      console.log(`Audio blob size: ${audioBlob.size} bytes`);
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);

      // Send to backend for transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      console.log('Transcription response:', result);
      
      if (result.text) {
        console.log(`Received transcription: "${result.text}"`);
        if (result.text.trim()) {
          onTranscription(result.text.trim());
        } else {
          console.log('Transcription was empty or only whitespace');
          setError('No speech detected. Please try speaking more clearly.');
        }
      } else {
        console.log('No text property in transcription result');
        setError('No transcription received from server');
      }
      
    } catch (err) {
      console.error('Error processing recording:', err);
      setError('Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
      chunksRef.current = [];
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isSupported = 'MediaRecorder' in window && 'getUserMedia' in navigator.mediaDevices;

  if (!isSupported) {
    return (
      <div className="text-xs text-muted-foreground">
        Audio recording not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleRecording}
        disabled={disabled || isProcessing}
        className={`relative ${
          isRecording 
            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
            : 'bg-primary/20 hover:bg-primary/30 text-primary'
        }`}
        data-testid="voice-record-btn"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </Button>
      
      {/* Voice status indicator */}
      {isRecording && (
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400">Recording...</span>
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          <span className="text-primary">Transcribing...</span>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
});