import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoloSpot | Autonomiczna Platforma E-Commerce Nowej Generacji",
  description: "SoloSpot — wielodostępowa platforma do tworzenia, hostowania i zarządzania produktami cyfrowego handlu. Twórz, wdrażaj i skaluj sklepy online z silnikiem wykonawczym i rynkiem szablonów.",
  robots: {
    index: true,
    follow: true,
  },
};

import { CSPostHogProvider } from "@/providers/posthog-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#0a0a0e] text-slate-200">
        <CSPostHogProvider>
          {children}
        </CSPostHogProvider>
      </body>
    </html>
  );
}
