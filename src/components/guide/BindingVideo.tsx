"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./binding-video.css";

/** Original Artwork#381 footage from multi-book.ru/video; loaded on request. */
export function BindingVideo({ priority = false }: { priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const play = useRef<HTMLButtonElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = player.current;
    if (!playing || !element) return;
    element.focus();
    void element.play().catch(() => {});
    return () => element.pause();
  }, [playing]);
  return (
    <div className="binding-video">
      <div className="binding-video-frame">
        {playing ? (
          <video ref={player} src="/media/disc-binding-original.mp4" aria-label="Видео Multibook: как работает переплёт Т-диск" controls playsInline autoPlay preload="metadata" />
        ) : (
          <button ref={play} type="button" className="binding-video-play" onClick={() => setPlaying(true)} aria-label="Смотреть видео: как работает переплёт Т-диск">
            <Image src="/guides/disc-binding.webp" alt="Настоящие листы Multibook: отверстия в бумаге и диски переплёта крупным планом" fill sizes="(max-width:760px) 100vw, 60vw" className="object-cover" unoptimized priority={priority} />
            <span className="binding-video-play-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7Z" /></svg></span>
            <span className="binding-video-caption">Смотреть, как работает переплёт</span>
          </button>
        )}
      </div>
      <div className="binding-video-links">
        {playing && <button type="button" onClick={() => { setPlaying(false); requestAnimationFrame(() => play.current?.focus()); }}>Закрыть видео</button>}
        <a href="https://vk.com/video-219099749_456239045" target="_blank" rel="noopener noreferrer">Открыть во ВКонтакте <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  );
}
