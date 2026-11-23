import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DesignConcept,
  type ConceptName,
} from "@/components/design/DesignConcept";
import { listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Визуальные концепции",
  robots: { index: false, follow: false },
};

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!["paper", "journal", "play"].includes(concept)) notFound();
  const products = listProducts({ type: "Блокноты" });
  // Only existing catalogue fields and original product photos are used in these visual studies.
  const featured = ["БОТАНИКА", "Красные кони", "Весна", "Золотое время"]
    .map((title) => products.find((p) => p.title.includes(title)))
    .filter((p) => p !== undefined);
  return <DesignConcept concept={concept as ConceptName} products={featured} />;
}
