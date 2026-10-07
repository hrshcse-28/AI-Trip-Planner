import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
  BookOpen,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AudioGuideChapter } from '../types';
import { api } from '../lib/api';

interface TripAudioGuideProps {
  tripId: string;
  destination: string;
}

export const TripAudioGuide: React.FC<TripAudioGuideProps> = ({
  tripId,
  destination,
}) => {
  const [chapters, setChapters] = useState<AudioGuideChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Player State
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api.trips
      .getAudioGuide(tripId)
      .then((res) => {
        if (isMounted) {
          setChapters(res.chapters || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load audio guide:', err);
        if (isMounted) {
          setError('Could not load audio narration tracks for this destination.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      stopNarration();
    };
  }, [tripId]);

  const stopNarration = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const playChapter = (index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio is not supported in this browser.');
      return;
    }

    const chapter = chapters[index];
    if (!chapter) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chapter.narrativeScript);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      // Auto-advance to next chapter if available
      if (index + 1 < chapters.length) {
        setCurrentChapterIndex(index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS playback error:', e);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    setCurrentChapterIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayPause = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      playChapter(currentChapterIndex);
    }
  };

  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying) {
      // Restart current with new rate
      playChapter(currentChapterIndex);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (isPlaying) {
        playChapter(currentChapterIndex);
      }
    } else {
      setIsMuted(true);
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950/70 via-purple-950/50 to-indigo-950/60 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Headphones className="w-3.5 h-3.5 text-purple-400" />
                AI Landmark Audio Guide
              </span>
              <span className="text-xs text-slate-400">
                {chapters.length} Audio Chapters
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Immersive Narration Tour of {destination}
              <Sparkles className="w-5 h-5 text-purple-400" />
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Pop your headphones in and immerse yourself in captivating historical secrets, architectural marvels, and cultural folklore as you wander.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Composing landmark audio chapters for {destination}...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Audio Player Spotlight (5 cols on lg) */}
          {currentChapter && (
            <div className="lg:col-span-5 bg-slate-900/70 border border-purple-500/30 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between backdrop-blur-md">
              <div className="relative h-56 w-full overflow-hidden bg-slate-950">
                <img
                  src={currentChapter.photoUrl}
                  alt={currentChapter.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 text-purple-300 backdrop-blur-md border border-purple-500/30">
                    Chapter {currentChapterIndex + 1} of {chapters.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-purple-500/80 text-white backdrop-blur-md">
                    {currentChapter.category}
                  </span>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="absolute bottom-3 right-4 flex items-end gap-1 h-6">
                  {[40, 75, 100, 60, 90, 45, 80, 50, 95, 65, 85, 30].map((h, i) => (
                    <span
                      key={i}
                      style={{
                        height: isPlaying ? `${Math.max(15, (h * (i % 2 === 0 ? 0.9 : 1.1)) % 100)}%` : '20%',
                      }}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        isPlaying ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{currentChapter.location}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                    {currentChapter.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{currentChapter.durationMin} min listening time
                    </span>
                  </div>

                  {/* Trivia Callout */}
                  <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Did You Know? </strong>
                      {currentChapter.triviaFact}
                    </span>
                  </div>
                </div>

                {/* Player Controls Bar */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayPause}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 transition-transform hover:scale-105 active:scale-95"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => playChapter(currentChapterIndex)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Replay from start"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Speed Selector */}
                    <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                      {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changeRate(rate)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            playbackRate === rate
                              ? 'bg-purple-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {isPlaying && (
                    <div className="flex items-center gap-2 text-xs text-purple-300 font-medium animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Narrating Chapter {currentChapterIndex + 1}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chapter Playlist & Transcripts (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Tour Itinerary Chapters
            </h4>

            {chapters.map((chapter, idx) => {
              const isCurrent = idx === currentChapterIndex;
              const isExpanded = expandedChapterId === chapter.id;

              return (
                <div
                  key={chapter.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isCurrent
                      ? 'bg-slate-900/90 border-purple-500/50 shadow-md'
                      : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => {
                          if (isCurrent && isPlaying) {
                            togglePlayPause();
                          } else {
                            playChapter(idx);
                          }
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 ${
                          isCurrent && isPlaying
                            ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                            : 'bg-slate-800 text-purple-400 hover:bg-purple-500/20'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-purple-400 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-purple-400">
                            #{idx + 1}
                          </span>
                          <span className="text-xs text-slate-400 truncate">
                            {chapter.location}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate mt-0.5">
                          {chapter.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        {chapter.durationMin}m
                      </span>
                      <button
                        onClick={() =>
                          setExpandedChapterId(isExpanded ? null : chapter.id)
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title={isExpanded ? 'Hide Transcript' : 'Read Transcript'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Transcript Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/30">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        Narration Script Transcript
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {chapter.narrativeScript}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Category: <strong className="text-purple-300 capitalize">{chapter.category}</strong></span>
                        <button
                          onClick={() => {
                            playChapter(idx);
                          }}
                          className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-purple-400" />
                          Listen to this chapter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
