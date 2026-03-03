import React, { useRef, useState, useCallback } from 'react';
import { Mic, Square, Play, Pause, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface AudioRecorderProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onCapture,
  onClose,
  isOpen
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  }, [isRecording, recordingInterval]);

  const playRecording = useCallback(() => {
    if (audioRef.current && recordedAudio) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [recordedAudio, isPlaying]);

  const confirmRecording = useCallback(() => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });
      const file = new File([audioBlob], `audio_${Date.now()}.webm`, {
        type: 'audio/webm;codecs=opus'
      });
      onCapture(file);
      setRecordedAudio(null);
      setRecordingTime(0);
      onClose();
    }
  }, [onCapture, onClose]);

  const retakeRecording = useCallback(() => {
    setRecordedAudio(null);
    setRecordingTime(0);
    setIsPlaying(false);
    audioChunksRef.current = [];
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [recordedAudio]);

  React.useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
    };
  }, [recordingInterval, recordedAudio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 mx-4 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800">
            {recordedAudio ? 'Audio Preview' : 'Record Audio'}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Recording Interface */}
        {!recordedAudio ? (
          <div className="text-center">
            {/* Recording Animation */}
            <div className="relative mb-8">
              <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
              }`}>
                <Mic className={`w-16 h-16 ${isRecording ? 'text-white' : 'text-gray-600'}`} />
              </div>
              
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
              )}
            </div>

            {/* Timer */}
            <div className="text-2xl font-mono text-gray-800 mb-8">
              {formatTime(recordingTime)}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Preview Interface */
          <div className="text-center">
            {/* Audio Player */}
            <div className="mb-8">
              <div className="w-32 h-32 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                <Button
                  onClick={playRecording}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>
              
              <audio ref={audioRef} src={recordedAudio} className="hidden" />
              
              <p className="text-gray-600">
                Recording Duration: {formatTime(recordingTime)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={retakeRecording}
                variant="outline"
                className="flex items-center gap-2 px-6 py-3 rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </Button>
              <Button
                onClick={confirmRecording}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full"
              >
                <Check className="w-5 h-5" />
                Use Recording
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};