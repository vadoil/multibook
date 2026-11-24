import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Корзина", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const u = await currentUser();
  // Вошедшему покупателю подставляем данные из кабинета.
  const profile = u
    ? { name: u.name ?? "", phone: u.phone ?? "", email: u.email, city: u.city ?? "", address: u.address ?? "" }
    : undefined;
  return (
    <div className="page-shell pt-8"><Breadcrumbs items={[{ label: "Корзина" }]} />
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Корзина</h1>
      <CartView profile={profile} />
    </div>
  );
}
