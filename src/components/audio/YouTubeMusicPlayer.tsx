import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack } from '../../types';
import { CURATED_TRACKS } from '../../services/storageService';
import { Play, Pause, SkipForward, SkipBack, Volume2, Search, Music, ChevronUp, ChevronDown, Radio, ExternalLink } from 'lucide-react';

interface YouTubeMusicPlayerProps {
  currentTrack: MusicTrack;
  onTrackChange: (track: MusicTrack) => void;
  isCompact?: boolean;
}

// Global reference to window YouTube player
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: unknown) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  setVolume: (vol: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

export const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({
  currentTrack,
  onTrackChange,
  isCompact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerId = 'youtube-persistent-player';

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer(currentTrack.youtubeId);
      };
    } else {
      initPlayer(currentTrack.youtubeId);
    }

    return () => {
      // player persists in root
    };
  }, []);

  const initPlayer = (videoId: string) => {
    try {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(playerContainerId, {
          height: '1',
          width: '1',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              setPlayerReady(true);
              event.target.setVolume(volume);
            },
            onStateChange: (event: { data: number }) => {
              if (window.YT && window.YT.PlayerState) {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  if (event.data === window.YT.PlayerState.ENDED) {
                    handleNextTrack();
                  }
                }
              }
            },
          },
        });
      }
    } catch (e) {
      console.warn('YouTube API init notice:', e);
    }
  };

  // Change video when track changes
  useEffect(() => {
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.loadVideoById(currentTrack.youtubeId);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (err) {
        console.warn('YouTube play notice:', err);
      }
    }
  }, [currentTrack]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextTrack = () => {
    const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % CURATED_TRACKS.length;
    onTrackChange(CURATED_TRACKS[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + CURATED_TRACKS.length) % CURATED_TRACKS.length;
    onTrackChange(CURATED_TRACKS[prevIndex]);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
    }
  };

  // Search or custom track addition
  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let videoId = searchQuery.trim();
    if (searchQuery.includes('youtube.com/watch?v=')) {
      const match = searchQuery.match(/v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    } else if (searchQuery.includes('youtu.be/')) {
      const match = searchQuery.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    }

    const newCustomTrack: MusicTrack = {
      id: `custom-${Date.now()}`,
      title: searchQuery.length > 25 ? `${searchQuery.slice(0, 25)}...` : searchQuery,
      artist: 'YouTube Audio',
      duration: '4:00',
      youtubeId: videoId.length === 11 ? videoId : 'jfKfPfyJRdk',
      bpm: 165,
      category: 'High Energy Cardio',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId.length === 11 ? videoId : 'jfKfPfyJRdk'}/hqdefault.jpg`,
    };

    onTrackChange(newCustomTrack);
    setSearchQuery('');
  };

  const filteredTracks = CURATED_TRACKS.filter((t) => {
    const matchesCat = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && (searchQuery ? matchesSearch : true);
  });

  return (
    <div className="relative">
      {/* Hidden YouTube Iframe DOM holder */}
      <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none opacity-0">
        <div id={playerContainerId} />
      </div>

      {/* Main Player Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-3">
          
          {/* Track Info with animated visualizer */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-blue-600" />
              </div>
              
              {/* Dancing visualizer bars when playing */}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-end justify-center gap-0.5 pb-1">
                  <span className="w-1 bg-white h-3 animate-pulse rounded-full" />
                  <span className="w-1 bg-blue-400 h-5 animate-bounce rounded-full" />
                  <span className="w-1 bg-white h-2 animate-pulse rounded-full" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentTrack.title}
                </h4>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded font-mono-numbers shrink-0">
                  {currentTrack.bpm} BPM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentTrack.artist} · YouTube Running Audio
              </p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrevTrack}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleNextTrack}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume Popover on Desktop */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                aria-label="Volume"
              />
            </div>

            {/* Expand / Playlist Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
              aria-label="Toggle playlist drawer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Expanded Drawer with Playlists, Cadence Filter & Search */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Search or YouTube URL input */}
            <form onSubmit={handleCustomSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks or paste YouTube link / ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Load
              </button>
            </form>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', '170-180 BPM Cadence', 'Morning EDM', 'Sunrise Chill', 'High Energy Cardio', 'Lo-Fi Jog'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Track list */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredTracks.map((track) => {
                const isSelected = track.id === currentTrack.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      onTrackChange(track);
                      setIsPlaying(true);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {track.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {track.artist} · {track.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono-numbers text-slate-400 shrink-0">
                      <span>{track.bpm} BPM</span>
                      <span>{track.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
