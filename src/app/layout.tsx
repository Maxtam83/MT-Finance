import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

// Police déclarée par maxime-tamarin.fr, hébergée avec l'application.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "MT Finance", template: "%s · MT Finance" },
  description: "Gestion de finances personnelles et de patrimoine.",
  applicationName: "MT Finance",
  appleWebApp: { capable: true, title: "MT Finance", statusBarStyle: "default" },
  // Application privée : pas d'indexation.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#06090d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
