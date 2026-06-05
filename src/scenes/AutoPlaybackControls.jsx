export default function AutoPlaybackControls({ hasStarted, isPlaying, onPlay, onReplay, onStop }) {
  return (
    <div className="autoplay-controls" aria-label="自动播放控制">
      <button type="button" onClick={isPlaying ? onStop : onPlay}>
        {isPlaying ? "PAUSE" : hasStarted ? "RESUME" : "AUTO"}
      </button>
      <button type="button" onClick={onReplay}>
        REPLAY
      </button>
    </div>
  );
}
