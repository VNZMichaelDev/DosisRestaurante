import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/store/cart";
import { ToastProvider } from "@/store/toast";
import { NotificationsProvider } from "@/store/notifications";

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
      </body>
    </html>
  );
}
