"use client";

import { useEffect, useRef, useState } from "react";

/** A photographic demonstration; playback state never changes the shopping configuration. */
export function NotebookFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [manualPlayback, setManualPlayback] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (video.current) observer.observe(video.current);
    return () => {
      query.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  const stopped =
    paused || reduced || !visible || (!manualPlayback && (hovered || focused));
  const togglePlayback = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    setManualPlayback(!nextPaused);
    if (nextPaused) video.current?.pause();
    else void video.current?.play().catch(() => {});
  };
  useEffect(() => {
    if (!video.current) return;
    let cancelled = false;
    if (stopped) video.current.pause();
    else
      void video.current.play().catch((error: DOMException) => {
        if (!cancelled && error.name !== "AbortError") setPaused(true);
      });
    return () => {
      cancelled = true;
    };
  }, [stopped]);
  return (
    <div
      className="mc-notebook-film"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <video
        ref={video}
        src={reduced ? undefined : "/media/notebook-build.mp4"}
        loop
        muted
        playsInline
        preload="metadata"
        poster="/media/notebook-build-poster.jpg"
        aria-label="Сборка блокнота из настоящих листов, дисков и обложки. Лист снимается и возвращается на место."
        onError={() => setFailed(true)}
      ></video>
      <span className="mc-film-label">Листы. Диски. Ваш блокнот.</span>
      {!reduced && !failed && (
        <button
          type="button"
          className="mc-film-control"
          aria-label={
            paused
              ? "Продолжить сборку блокнота"
              : "Приостановить сборку блокнота"
          }
          aria-pressed={paused}
          onClick={togglePlayback}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {paused ? (
              <path d="m9 5 10 7-10 7Z" />
            ) : (
              <path d="M8 5v14M16 5v14" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
