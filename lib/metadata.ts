import { Metadata } from 'next'

export const siteConfig = {
  name: 'U.E.P Adventista Alejandro Oropeza Castillo',
  description: 'Unidad Educativa Adventista Alejandro Oropeza Castillo en Guarenas, Estado Miranda. Más de 40 años formando estudiantes con excelencia académica y valores cristianos. Educación integral: Mano, Mente y Corazón.',
  url: 'https://uepaaoc.com',
  ogImage: '/LOGO-COLEGIO.png',
  locale: 'es_VE',
  keywords: [
    'colegio adventista',
    'educación cristiana',
    'Guarenas',
    'Miranda',
    'Venezuela',
    'Alejandro Oropeza Castillo',
    'educación integral',
    'valores cristianos',
    'colegio privado',
    'escuela adventista',
    'educación primaria',
    'educación secundaria',
  ],
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/LOGO-COLEGIO.png`,
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
      // Add social media profiles here when available
    ],
  }
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'School',
    name: siteConfig.name,
    description: siteConfig.description,
    image: `${siteConfig.url}/LOGO-COLEGIO.png`,
    url: siteConfig.url,
    telephone: '+58-212-364-5678',
    email: 'uep.adventista.aoc@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Guarenas',
      addressLocality: 'Guarenas',
      addressRegion: 'Estado Miranda',
      addressCountry: 'VE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.4667,
      longitude: -66.6167,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '15:00',
    },
  }
}

export function createMetadata({
  title,
  description,
  image,
  url,
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  url?: string
  noIndex?: boolean
}): Metadata {
  const metadata: Metadata = {
    title: title || siteConfig.name,
    description: description || siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: url || siteConfig.url,
      title: title || siteConfig.name,
      description: description || siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: image || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title || siteConfig.name,
      description: description || siteConfig.description,
      images: [image || siteConfig.ogImage],
    },
  }

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    }
  }

  return metadata
}
