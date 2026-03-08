import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Check, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
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
          type: mediaRecorderRef.current?.mimeType || 'audio/webm'
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(50); // Collect data frequently
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
        audioRef.current.currentTime = 0; // Reset to start
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [recordedAudio, isPlaying]);

  const confirmRecording = useCallback(() => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });
      const file = new File([audioBlob], `voice_note_${Date.now()}.${mediaRecorderRef.current?.mimeType?.includes('mp4') ? 'mp4' : 'webm'}`, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
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

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl && recordedAudio) {
      audioEl.load(); // Force browser to re-read the src stream
      audioEl.onended = () => setIsPlaying(false);
      audioEl.onpause = () => setIsPlaying(false);
      audioEl.onplay = () => setIsPlaying(true);
    }
    return () => {
      if (audioEl) {
        audioEl.onended = null;
        audioEl.onpause = null;
        audioEl.onplay = null;
      }
    };
  }, [recordedAudio]);

  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
    };
  }, [recordingInterval, recordedAudio]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden z-10 border border-white/20"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 to-blue-50/50 -z-10 rounded-t-[2rem]"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {recordedAudio ? 'Preview Audio' : 'Voice Explainer'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recording Interface */}
            {!recordedAudio ? (
              <div className="text-center space-y-8">
                {/* Visualizer / Mic Button */}
                <div className="relative flex justify-center items-center h-40">
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-70"></div>
                      <div className="absolute inset-4 rounded-full bg-red-200 animate-pulse opacity-50"></div>
                    </>
                  )}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-28 h-28 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${isRecording
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30 text-white'
                      : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/30 text-white'
                      }`}
                  >
                    {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
                  </button>
                </div>

                {/* Timer */}
                <div className="space-y-1">
                  <div className="text-4xl font-black font-mono tracking-tighter text-gray-800">
                    {formatTime(recordingTime)}
                  </div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                    {isRecording ? 'Recording...' : 'Tap to Start'}
                  </p>
                </div>
              </div>
            ) : (
              /* Preview Interface */
              <div className="text-center space-y-8">
                {/* Audio Player UI */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full mx-auto bg-gradient-to-br from-green-400 to-emerald-500 p-1 shadow-lg shadow-green-500/30">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <button
                        onClick={playRecording}
                        className="w-24 h-24 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors active:scale-95"
                      >
                        {isPlaying ? (
                          <Pause className="w-10 h-10 fill-current" />
                        ) : (
                          <Play className="w-10 h-10 ml-2 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={recordedAudio || undefined}
                    className="hidden"
                    preload="auto"
                    controls
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-black font-mono tracking-tight text-gray-800">
                    {formatTime(recordingTime)}
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-green-600">
                    Ready to Use
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={retakeRecording}
                    className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-95 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </button>
                  <button
                    onClick={confirmRecording}
                    className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-4 rounded-2xl font-bold shadow-xl shadow-black/10 transition-all active:scale-95 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Attach
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};