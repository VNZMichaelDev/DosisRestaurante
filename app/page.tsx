import HomeContent from "@/components/HomeContent";
import { getProducts, getSettings } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);

  return <HomeContent products={products} settings={settings} />;
}
