import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";

const SKIP = 5;

const BUTTON =
  "inline-flex h-9 shrink-0 items-center justify-center gap-0.5 border-2 border-transparent px-2 text-[#e9ebef] hover:border-spot hover:bg-spot hover:text-white";

const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const togglePlay = (video: HTMLVideoElement | null) => {
  if (!video) return;
  if (video.paused) void video.play();
  else video.pause();
};

const skip = (video: HTMLVideoElement | null, seconds: number) => {
  if (video) video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration || 0);
};

const toggleMute = (video: HTMLVideoElement | null) => {
  if (video) video.muted = !video.muted;
};

const toggleFullscreen = (frame: HTMLElement | null) => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void frame?.requestFullscreen();
};

interface Props {
  src: string;
  poster: string | null;
  title: string;
}

const VideoPlayer = ({ src, poster, title }: Props) => {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === " ") {
        event.preventDefault();
        togglePlay(video.current);
      }
      if (key === "j") skip(video.current, -SKIP);
      if (key === "l") skip(video.current, SKIP);
      if (key === "m") toggleMute(video.current);
      if (key === "f") toggleFullscreen(frame.current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={frame} className="flex max-h-full max-w-full flex-col border-[3px] border-[#e9ebef] bg-black">
      <video
        ref={video}
        src={src}
        poster={poster ?? undefined}
        aria-label={title}
        autoPlay
        playsInline
        preload="metadata"
        onClick={() => togglePlay(video.current)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        className="min-h-0 w-full flex-auto cursor-pointer object-contain"
      />
      <div className="flex items-center gap-1 border-t-[3px] border-[#e9ebef] bg-[#0d0f13] p-1.5">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => togglePlay(video.current)}
          className={BUTTON}
        >
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
        </button>
        <button
          type="button"
          aria-label={`Back ${SKIP} seconds`}
          onClick={() => skip(video.current, -SKIP)}
          className={BUTTON}
        >
          <RotateCcw className="size-4" strokeWidth={2.5} />
          <span className="font-mono text-[10px] font-bold">{SKIP}</span>
        </button>
        <button
          type="button"
          aria-label={`Forward ${SKIP} seconds`}
          onClick={() => skip(video.current, SKIP)}
          className={BUTTON}
        >
          <span className="font-mono text-[10px] font-bold">{SKIP}</span>
          <RotateCw className="size-4" strokeWidth={2.5} />
        </button>
        <span className="label ml-1 shrink-0 text-[#e9ebef] tabular-nums">{clock(time)}</span>
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(event) => {
            if (video.current) video.current.currentTime = Number(event.target.value);
          }}
          onPointerUp={(event) => event.currentTarget.blur()}
          className="mx-2 h-1 min-w-0 flex-1 cursor-pointer accent-spot"
        />
        <span className="label mr-1 shrink-0 text-[#e9ebef]/60 tabular-nums">{clock(duration)}</span>
        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => toggleMute(video.current)}
          className={BUTTON}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <button
          type="button"
          aria-label="Fullscreen"
          onClick={() => toggleFullscreen(frame.current)}
          className={BUTTON}
        >
          <Maximize className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
