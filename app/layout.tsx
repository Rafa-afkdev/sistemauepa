  import React from "react";
  import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  import LayoutClient from "./components/LayoutClient";

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  export const metadata: Metadata = {
    title: "U.E.P Adventista Alejandro Oropeza Castillo",
    description:
      "Unidad Educativa Adventista Alejandro Oropeza Castillo en Guarenas, Estado Miranda. Más de 40 años formando estudiantes con excelencia académica y valores cristianos. Educación integral: Mano, Mente y Corazón.",
    keywords: [
      "colegio adventista",
      "educación cristiana",
      "Guarenas",
      "Miranda",
      "Venezuela",
      "Alejandro Oropeza Castillo",
      "educación integral",
      "valores cristianos",
      "colegio privado",
    ],
    authors: [{ name: "U.E.P Adventista Alejandro Oropeza Castillo" }],
    openGraph: {
      type: "website",
      title: "U.E.P Adventista Alejandro Oropeza Castillo",
      description:
        "Formando estudiantes con valores cristianos y excelencia académica en Guarenas, Estado Miranda.",
      images: ["/og-image.jpg"],
      locale: "es_VE",
    },
    twitter: {
      card: "summary_large_image",
      title: "U.E.P Adventista Alejandro Oropeza Castillo",
      description:
        "Formando estudiantes con valores cristianos y excelencia académica en Guarenas, Estado Miranda.",
      images: ["/og-image.jpg"],
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    themeColor: "#1e3a8a",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="es" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
          <LayoutClient>{children}</LayoutClient>
        </body>
      </html>
    );
  }
