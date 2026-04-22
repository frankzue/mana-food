import { Header } from "@/components/menu/Header";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { getSettings, getZonas, isDemoMode } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const [settings, zonas] = await Promise.all([getSettings(), getZonas()]);
  const demo = isDemoMode();

  return (
    <>
      <Header />
      {demo && <DemoBanner />}
      <main className="bg-mana-cream min-h-screen pb-20">
        <CheckoutForm
          zonas={zonas}
          tasaBs={settings.tasa_bs}
          ivaRate={settings.iva}
          demoMode={demo}
        />
      </main>
    </>
  );
}
