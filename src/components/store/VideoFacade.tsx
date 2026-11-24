"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Видео VK загружается только после нажатия: до этого браузер посетителя ничего не отправляет
 * стороннему сервису и тот не ставит свои cookie.
 */
export function VideoFacade({ oid, id, poster, title }: { oid: string; id: string; poster: string; title: string }) {
  const [on, setOn] = useState(false);
  return (
    <figure className="video-facade">
      <div className="video-facade-frame">
        {on ? (
          <iframe
            src={`https://vkvideo.ru/video_ext.php?oid=${oid}&id=${id}&hd=2&autoplay=1`}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} aria-label={`Смотреть видео: ${title}`}>
            <Image src={poster} alt="" fill sizes="(max-width: 900px) 100vw, 900px" />
            <span className="video-facade-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </span>
          </button>
        )}
      </div>
      <figcaption>Видео откроется с сервиса VK Видео. После запуска он получит ваш IP-адрес и может использовать свои cookie.</figcaption>
    </figure>
  );
}
