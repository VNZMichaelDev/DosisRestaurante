import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/store/cart";
import { ToastProvider } from "@/store/toast";
import { NotificationsProvider } from "@/store/notifications";
import WelcomeModal from "@/components/WelcomeModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Dosis — Cachapas, Burgers & Parrilla",
  description:
    "Cachapas, burgers y parrilla al momento. Pide en línea y paga con pago móvil.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Dosis",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#123825",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <ToastProvider>
          <CartProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </CartProvider>
        </ToastProvider>
        <WelcomeModal />
      </body>
    </html>
  );
}
