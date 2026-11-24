"use client";

import Image from "next/image";
import type { CoverOpt } from "../Constructor";
import { formatPrice } from "@/lib/money";
import { CategoryTabIcon } from "../store/StoreTab";
import { ChoiceCarousel } from "./ChoiceCarousel";
import { CarouselItem } from "./CarouselItem";
import { getCoverArtwork } from "./coverArt";

export function CoverCarousel({ covers, selectedId, side, onSelect }: {
  covers: CoverOpt[];
  selectedId?: number;
  side: "front" | "back";
  onSelect: (cover: CoverOpt) => void;
}) {
  return (
    <ChoiceCarousel label={side === "front" ? "Передние обложки" : "Задние обложки"} itemKeys={covers.map(cover => cover.id)} selectedKey={selectedId}>
      {covers.map((cover, index) => {
        const art = getCoverArtwork(cover.image);
        const image = side === "front" ? art?.front ?? cover.image : art?.back;
        const pair = side === "front" && cover.isSet && art?.back;
        return (
          <CarouselItem key={cover.id} eager={index < 4}>{loadPhoto => (
            <button type="button" data-cover={cover.id} onClick={() => onSelect(cover)} disabled={!cover.available} aria-pressed={selectedId === cover.id} className="constructor-cover-card">
              <span className={`constructor-cover-photo ${pair ? "constructor-cover-pair-photo" : ""}`}>
                {image ? <span className="constructor-cover-image">{loadPhoto && <Image src={image} alt="" fill sizes="(max-width:760px) 60vw, 232px" className="object-contain" />}</span> : <span className="constructor-no-photo"><CategoryTabIcon type="Обложки" /><span>Фото этой стороны нет</span></span>}
                {pair && <span className="constructor-cover-image">{loadPhoto && <Image src={pair} alt="" fill sizes="116px" className="object-contain" />}</span>}
                {selectedId === cover.id && <span className="constructor-cover-check" aria-hidden="true">✓</span>}
              </span>
              <span className="constructor-cover-name">{cover.title}</span>
              <span className="constructor-cover-note">{cover.isSet ? "Две обложки" : cover.note}</span>
              <b>{formatPrice(cover.price)}</b>
            </button>
          )}</CarouselItem>
        );
      })}
    </ChoiceCarousel>
  );
}
