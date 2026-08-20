import type { Metadata, Viewport } from "next";
import { Pacifico, Quicksand } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { FloatingBabySilhouettes } from "@/components/shared/FloatingBabySilhouettes";

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  fallback: ["cursive", "sans-serif"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "Baby Revela",
  description:
    "Revelación de sexo interactiva: vota si será niño o niña y descúbrelo en vivo con todos tus invitados.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baby Revela",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#a6d8f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${pacifico.variable} ${quicksand.variable}`}
    >
      <body className="relative font-sans antialiased">
        <FloatingBabySilhouettes />
        <div className="relative z-10">{children}</div>
        <PwaRegister />
      </body>
    </html>
  );
}
