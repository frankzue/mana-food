import { Header } from "@/components/menu/Header";
import { PromoSlider } from "@/components/menu/PromoSlider";
import { CategoryStrip } from "@/components/menu/CategoryStrip";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuSections } from "@/components/menu/MenuSections";
import { Footer } from "@/components/menu/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartFloatingBar } from "@/components/cart/CartFloatingBar";
import { DemoBanner } from "@/components/shared/DemoBanner";
import {
  getCategorias,
  getProductos,
  getSettings,
  isDemoMode,
} from "@/lib/queries";

export const revalidate = 60;

export default async function MenuPage() {
  const [settings, categorias, productos] = await Promise.all([
    getSettings(),
    getCategorias(),
    getProductos(),
  ]);
  const demo = isDemoMode();

  const destacados = productos
    .filter((p) =>
      ["cat-1", "cat-2", "cat-4", "cat-6"].includes(p.categoria_id)
    )
    .sort((a, b) => b.precio_usd - a.precio_usd)
    .slice(0, 8);

  return (
    <>
      <Header />
      {demo && <DemoBanner />}

      <PromoSlider />

      <CategoryStrip categorias={categorias} />

      <CategoryTabs categorias={categorias} />

      <MenuSections
        categorias={categorias}
        productos={productos}
        destacados={destacados}
        tasaBs={settings.tasa_bs}
      />

      <Footer
        horario={settings.horario}
        direccion={settings.direccion}
        ciudad={settings.ciudad}
        nombre={settings.nombre_negocio}
      />

      <CartFloatingBar tasaBs={settings.tasa_bs} />
      <CartDrawer tasaBs={settings.tasa_bs} ivaRate={settings.iva} />
    </>
  );
}
