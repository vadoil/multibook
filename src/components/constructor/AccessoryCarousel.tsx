"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { CategoryTabIcon } from "../store/StoreTab";
import { ChoiceCarousel } from "./ChoiceCarousel";
import accessoryPhotos from "./accessory-photos.json";

export type AccessoryOpt = { id: number; title: string; href: string; price: number; image: string | null; available: boolean };

export function AccessoryCarousel({ accessories }: { accessories: AccessoryOpt[] }) {
  return (
    <ChoiceCarousel label="Аксессуары" itemKeys={accessories.map(item => item.id)}>
      {accessories.map(item => (
        <li key={item.id}>
          <Link data-accessory={item.id} href={item.href} prefetch={false} className="constructor-accessory-card">
            <span className="constructor-accessory-photo">
              {item.image ? <Image src={(accessoryPhotos as Record<string, string>)[item.image] ?? item.image} alt="" fill sizes="(max-width:760px) 60vw, 232px" className="object-contain" /> : <span className="constructor-no-photo"><CategoryTabIcon type="Аксессуары" /><span>Фото пока нет</span></span>}
            </span>
            <span className="constructor-cover-name">{item.title}</span>
            <b>{formatPrice(item.price)}</b>
            {!item.available && <span className="constructor-cover-note">Нет в наличии</span>}
            <span className="constructor-accessory-open">Подробнее <span aria-hidden="true">↗</span></span>
          </Link>
        </li>
      ))}
    </ChoiceCarousel>
  );
}
