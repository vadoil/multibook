"use client";

import { useEffect, useState } from "react";
import { NotebookPreview, type NotebookLook } from "./NotebookPreview";

/** Блокнот на первом экране сам «пересобирается»: показывает, что части меняются. */
const LOOKS: NotebookLook[] = [
  { front: { hex: "#c9a24e" }, back: { hex: "#6c7143" }, discs: { hex: "#c8302a", diameter: 24 }, sheets: 56, paper: "white" },
  { front: { hex: "#1f1f20" }, back: { hex: "#1f1f20" }, discs: { hex: "#c3c5c7", diameter: 24, metal: true }, sheets: 112, paper: "cream" },
  { front: { hex: "#d4622a" }, back: { hex: "#d8c4a3" }, discs: { hex: "#3fb3ad", diameter: 18 }, sheets: 52, paper: "white" },
  { front: { hex: "#2e2b29", print: true }, back: { hex: "#2e2b29" }, discs: { hex: "#c9a24e", diameter: 24, metal: true }, sheets: 80, paper: "cream" },
  { front: { hex: "#6c7143" }, back: { hex: "#c69a3c" }, discs: { hex: "#1f1f20", diameter: 18 }, sheets: 40, paper: "white" },
];

export function HeroNotebook() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % LOOKS.length), 2600);
    return () => clearInterval(id);
  }, [paused]);
  return (
    <div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <NotebookPreview look={LOOKS[i]} className="w-full" label="Блокнот Multibook меняет обложку, диски и блок" />
    </div>
  );
}
