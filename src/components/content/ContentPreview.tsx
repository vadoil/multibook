"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Scene = { seconds: number };
type Props = { id: number; kind: "post" | "carousel" | "reel"; count: number; v: number; scenes: Scene[] };

const frame = (id: number, n: number, v: number, q = "") => `/admin/content/${id}/frame/${n}?v=${v}${q}`;

/** Превью в рамке телефона: лента слайдов или плеер рилса с записью видео. */
export function ContentPreview(p: Props) {
  return (
    <div className="cf-phone">
      <div className="cf-phone-screen" data-kind={p.kind}>
        {p.kind === "reel" ? <ReelPlayer {...p} /> : <Slides {...p} />}
      </div>
    </div>
  );
}

function Slides({ id, count, v }: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const go = (n: number) => strip.current?.scrollTo({ left: n * strip.current.clientWidth, behavior: "smooth" });
  return (
    <>
      <div
        ref={strip}
        className="cf-strip"
        tabIndex={0}
        aria-label="Слайды"
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(Math.min(count - 1, at + 1));
          if (e.key === "ArrowLeft") go(Math.max(0, at - 1));
        }}
      >
        {Array.from({ length: count }, (_, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={frame(id, n, v, "&w=720")} alt={`Слайд ${n + 1}`} width={720} height={900} loading={n ? "lazy" : "eager"} />
        ))}
      </div>
      {count > 1 && (
        <div className="cf-dots">
          <button type="button" onClick={() => go(Math.max(0, at - 1))} disabled={at === 0} aria-label="Предыдущий слайд">‹</button>
          <span aria-live="polite">{at + 1} из {count}</span>
          <button type="button" onClick={() => go(Math.min(count - 1, at + 1))} disabled={at === count - 1} aria-label="Следующий слайд">›</button>
        </div>
      )}
    </>
  );
}

const W = 720;
const H = 1280;
const FADE = 0.45;

function ReelPlayer({ id, v, scenes }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<{ bg: HTMLImageElement; text: HTMLImageElement }[]>([]);
  const clock = useRef({ t: 0, last: 0, playing: false });
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rec, setRec] = useState<"" | "rec" | "done" | "unsupported">("");
  const recorder = useRef<MediaRecorder | null>(null);
  const total = scenes.reduce((s, x) => s + x.seconds, 0);

  const draw = useCallback(
    (t: number) => {
      const ctx = canvas.current?.getContext("2d");
      if (!ctx || !imgs.current.length) return;
      let start = 0;
      let i = 0;
      for (; i < scenes.length - 1 && t >= start + scenes[i].seconds; i++) start += scenes[i].seconds;
      const local = t - start;
      const layer = (k: number, lt: number, alpha: number) => {
        const im = imgs.current[k];
        if (!im) return;
        const z = 1 + 0.07 * Math.min(1, lt / scenes[k].seconds) * (k % 2 ? -1 : 1) + (k % 2 ? 0.07 : 0);
        ctx.globalAlpha = alpha;
        ctx.drawImage(im.bg, (W - W * z) / 2, (H - H * z) / 2, W * z, H * z);
        const a = Math.max(0, Math.min(1, (lt - 0.2) / 0.35));
        ctx.globalAlpha = alpha * a;
        ctx.drawImage(im.text, 0, (1 - a) * 18, W, H);
        ctx.globalAlpha = 1;
      };
      ctx.fillStyle = "#462c2b";
      ctx.fillRect(0, 0, W, H);
      if (i > 0 && local < FADE) layer(i - 1, scenes[i - 1].seconds + local, 1);
      layer(i, local, i > 0 ? Math.min(1, local / FADE) : 1);
    },
    [scenes],
  );

  useEffect(() => {
    let alive = true;
    setReady(false);
    const load = (src: string) =>
      new Promise<HTMLImageElement>((ok, fail) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = fail;
        im.src = src;
      });
    Promise.all(scenes.map(async (_, n) => ({ bg: await load(frame(id, n, v, "&layer=bg")), text: await load(frame(id, n, v, "&layer=text")) })))
      .then((r) => {
        if (!alive) return;
        imgs.current = r;
        clock.current.t = 0;
        setReady(true);
        draw(0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, v, scenes, draw]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const c = clock.current;
    c.last = performance.now();
    const tick = (now: number) => {
      c.t += (now - c.last) / 1000;
      c.last = now;
      if (c.t >= total) {
        if (recorder.current?.state === "recording") {
          draw(total - 0.01);
          recorder.current.stop();
          setPlaying(false);
          return;
        }
        c.t = 0;
      }
      draw(c.t);
      setProgress(c.t / total);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total, draw]);

  const record = () => {
    const cv = canvas.current;
    if (!cv || typeof MediaRecorder === "undefined") return setRec("unsupported");
    const type = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
    if (!type) return setRec("unsupported");
    const chunks: Blob[] = [];
    const r = new MediaRecorder(cv.captureStream(30), { mimeType: type, videoBitsPerSecond: 6_000_000 });
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(chunks, { type }));
      a.download = `multibook-reel-${id}.${type.includes("mp4") ? "mp4" : "webm"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      recorder.current = null;
      setRec("done");
    };
    recorder.current = r;
    clock.current.t = 0;
    draw(0);
    r.start();
    setRec("rec");
    setPlaying(true);
  };

  return (
    <>
      <canvas ref={canvas} width={W} height={H} className="cf-reel" aria-label="Превью рилса" />
      {!ready && <p className="cf-reel-wait">Собираем кадры…</p>}
      <div className="cf-reel-bar"><i style={{ width: `${progress * 100}%` }} /></div>
      <div className="cf-reel-controls">
        <button type="button" disabled={!ready || rec === "rec"} onClick={() => setPlaying((x) => !x)}>
          {playing && rec !== "rec" ? "Пауза" : "Смотреть"}
        </button>
        <button type="button" disabled={!ready || rec === "rec"} onClick={record}>
          {rec === "rec" ? `Запись… ${Math.round(progress * total)} из ${total} с` : "Скачать видео"}
        </button>
      </div>
      {rec === "done" && <p className="cf-reel-note">Видео сохранено. Музыку добавьте в редакторе соцсети.</p>}
      {rec === "unsupported" && <p className="cf-reel-note">Этот браузер не умеет записывать видео. Откройте в Chrome или скачайте архив с кадрами.</p>}
    </>
  );
}
