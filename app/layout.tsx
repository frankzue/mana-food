import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://manafood.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/pwa-180.png",
  },
  title: {
    default: `${BUSINESS.name} · Pide online`,
    template: `%s · ${BUSINESS.name}`,
  },
  description: `${BUSINESS.tagline}. ${BUSINESS.hours}. ${BUSINESS.address}. ${BUSINESS.services}.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: BUSINESS.name,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: BUSINESS.name,
    description: BUSINESS.tagline,
    type: "website",
    locale: "es_VE",
    images: [{ url: "/icons/pwa-512.png", width: 512, height: 512, alt: BUSINESS.name }],
  },
  twitter: {
    card: "summary",
    title: BUSINESS.name,
    description: BUSINESS.tagline,
    images: ["/icons/pwa-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#C8102E",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: BUSINESS.name,
  description: BUSINESS.tagline,
  servesCuisine: ["Fast Food", "Hamburguesas", "Hot Dogs"],
  priceRange: "$$",
  url: SITE_URL,
  image: `${SITE_URL}/icons/pwa-512.png`,
  telephone: "+58 412-0000000",
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.address,
    addressLocality: "Ciudad Bolívar",
    addressCountry: "VE",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "18:00",
      closes: "04:00",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
