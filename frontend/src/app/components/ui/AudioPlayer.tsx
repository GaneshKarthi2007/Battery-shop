import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Clock } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
    label?: string;
    className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, label, className = "" }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };
        const onEnded = () => setIsPlaying(false);

        // More robust metadata loading
        if (audio.readyState >= 1) {
            updateDuration();
        }

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('loadeddata', updateDuration);
        audio.addEventListener('canplay', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('loadeddata', updateDuration);
            audio.removeEventListener('canplay', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.error("Playback failed", err));
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time) || !isFinite(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div 
            className={`group bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-4 transition-all duration-300 ${className}`}
        >
            <audio ref={audioRef} src={src} preload="metadata" />
            
            <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all outline-none"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 ml-1 fill-current" />
                    )}
                </button>

                {/* Progress & Info */}
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">
                            {label || "Voice Note"}
                        </span>
                        <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="relative group/slider flex items-center h-4">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none z-10"
                            style={{
                                background: `linear-gradient(to right, #4f46e5 ${progressPercentage}%, #f3f4f6 ${progressPercentage}%)`
                            }}
                        />
                        {/* Custom visualizer-like stripes (stabilized) */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-around px-2 opacity-5">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-[2px] bg-indigo-900 rounded-full transition-all duration-500" 
                                    style={{ 
                                        height: isPlaying 
                                            ? `${20 + (i % 5) * 15 + Math.random() * 10}%` 
                                            : '20%' 
                                    }} 
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0 hidden sm:block">
                    <div className={`p-2 rounded-xl transition-colors ${isPlaying ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300'}`}>
                        <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                    </div>
                </div>
            </div>
        </div>
    );
};
