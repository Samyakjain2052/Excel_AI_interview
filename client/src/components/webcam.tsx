import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebcamProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export function Webcam({ isEnabled, onToggle }: WebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isEnabled]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 200 },
          height: { ideal: 150 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed bottom-5 right-5 w-52 h-40 bg-card border border-border rounded-xl flex items-center justify-center z-50">
        <div className="text-center text-sm">
          <CameraOff className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Camera access denied</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-52 h-40 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-lg">
      <div className="relative w-full h-full">
        {isEnabled && hasPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            data-testid="webcam-video"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Webcam Off</p>
            </div>
          </div>
        )}
        
        {/* Recording indicator */}
        {isEnabled && hasPermission && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="absolute bottom-2 left-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
          data-testid="webcam-toggle"
        >
          {isEnabled ? (
            <Camera className="w-4 h-4" />
          ) : (
            <CameraOff className="w-4 h-4" />
          )}
        </Button>
        
        {/* Label */}
        <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
          {isEnabled ? 'Live' : 'Off'}
        </div>
      </div>
    </div>
  );
}
