import { DesignConcept } from "@/components/design/DesignConcept";
import { listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function Home() {
  const products = listProducts({ type: "Блокноты" });
  const featured = ["БОТАНИКА", "Красные кони", "Весна", "Золотое время"]
    .map((title) => products.find((product) => product.title.includes(title)))
    .filter((product) => product !== undefined);
  return <DesignConcept concept="journal" products={featured} embedded />;
}
