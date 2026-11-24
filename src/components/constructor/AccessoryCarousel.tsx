"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { cart, MAX_QTY, useCart } from "@/lib/cart";
import { CategoryTabIcon } from "../store/StoreTab";
import { ChoiceCarousel } from "./ChoiceCarousel";
import { CarouselItem } from "./CarouselItem";
import accessoryPhotos from "./accessory-photos.json";
import { QuantityControl } from "./QuantityControl";

export type AccessoryOpt = { id: number; title: string; href: string; price: number; image: string | null; available: boolean };

export function AccessoryCarousel({ accessories }: { accessories: AccessoryOpt[] }) {
  const { lines } = useCart();
  return (
    <ChoiceCarousel label="Аксессуары" itemKeys={accessories.map(item => item.id)}>
      {accessories.map((item, index) => {
        const quantity = lines.find(line => line.productId === item.id && !line.bundle)?.qty ?? 0;
        return (
        <CarouselItem key={item.id} eager={index < 4}>{loadPhoto => (
          <div className="constructor-accessory-card" data-accessory-card={item.id}>
            <Link data-accessory={item.id} href={item.href} prefetch={false} className="constructor-accessory-link">
            <span className="constructor-accessory-photo">
              {item.image ? loadPhoto && <Image src={(accessoryPhotos as Record<string, string>)[item.image] ?? item.image} alt="" fill sizes="(max-width:760px) 60vw, 232px" className="object-contain" /> : <span className="constructor-no-photo"><CategoryTabIcon type="Аксессуары" /><span>Фото пока нет</span></span>}
            </span>
            <span className="constructor-cover-name">{item.title}</span>
            <b>{formatPrice(item.price)}</b>
            {!item.available && <span className="constructor-cover-note">Нет в наличии</span>}
            <span className="constructor-accessory-open">Подробнее <span aria-hidden="true">↗</span></span>
            </Link>
            <div className="constructor-accessory-controls">
              <span className="constructor-cover-note">В корзине</span>
              <QuantityControl value={quantity} min={0} max={item.available ? MAX_QTY : quantity} label={item.title} onChange={next => {
                if (next > quantity && item.available) cart.add(item.id);
                else if (next < quantity) cart.setQty(item.id, undefined, next);
              }} />
            </div>
          </div>
        )}</CarouselItem>
        );
      })}
    </ChoiceCarousel>
  );
}
