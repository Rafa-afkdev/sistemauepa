  import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import LayoutClient from "./components/LayoutClient";
import "./globals.css";

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  export const metadata: Metadata = {
    metadataBase: new URL('https://uepaaoc.com'),
    title: {
      default: "U.E.P Adventista Alejandro Oropeza Castillo",
      template: "%s | U.E.P Adventista Alejandro Oropeza Castillo"
    },
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
      "escuela adventista",
      "educación primaria",
      "educación secundaria",
    ],
    authors: [{ name: "U.E.P Adventista Alejandro Oropeza Castillo" }],
    creator: "U.E.P Adventista Alejandro Oropeza Castillo",
    publisher: "U.E.P Adventista Alejandro Oropeza Castillo",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "es_VE",
      url: "https://uepaaoc.com",
      siteName: "U.E.P Adventista Alejandro Oropeza Castillo",
      title: "U.E.P Adventista Alejandro Oropeza Castillo",
      description:
        "Formando estudiantes con valores cristianos y excelencia académica en Guarenas, Estado Miranda.",
      images: [
        {
          url: "/LOGO-COLEGIO.png",
          width: 1200,
          height: 630,
          alt: "Logo U.E.P Adventista Alejandro Oropeza Castillo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "U.E.P Adventista Alejandro Oropeza Castillo",
      description:
        "Formando estudiantes con valores cristianos y excelencia académica en Guarenas, Estado Miranda.",
      images: ["/LOGO-COLEGIO.png"],
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  export const viewport: Viewport = {
    themeColor: "#1e3a8a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="es" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'EducationalOrganization',
                name: 'U.E.P Adventista Alejandro Oropeza Castillo',
                alternateName: 'UEPA Alejandro Oropeza Castillo',
                description: 'Unidad Educativa Adventista Alejandro Oropeza Castillo en Guarenas, Estado Miranda. Formando estudiantes con valores cristianos y excelencia académica.',
                url: 'https://uepaaoc.com',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://uepaaoc.com/LOGO-COLEGIO.png',
                  width: 500,
                  height: 500,
                },
                image: {
                  '@type': 'ImageObject',
                  url: 'https://uepaaoc.com/LOGO-COLEGIO.png',
                  width: 1200,
                  height: 630,
                },
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Guarenas',
                  addressRegion: 'Miranda',
                  addressCountry: 'VE',
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'Admissions',
                  email: 'uep.adventista.aoc@gmail.com',
                  availableLanguage: 'Spanish',
                },
                sameAs: [
                  'https://uepaaoc.com',
                ],
              }),
            }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
          <LayoutClient>{children}</LayoutClient>
        </body>
      </html>
    );
  }
