import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contáctanos',
  description: 'Ponte en contacto con la U.E.P Adventista Alejandro Oropeza Castillo. Estamos ubicados en Guarenas, Estado Miranda. Responderemos todas tus preguntas sobre inscripciones, programas educativos y más.',
  keywords: [
    'contacto colegio adventista',
    'contactar',
    'Guarenas',
    'Miranda',
    'información',
    'inscripciones',
    'admisiones',
  ],
  openGraph: {
    title: 'Contáctanos | U.E.P Adventista Alejandro Oropeza Castillo',
    description: 'Ponte en contacto con nosotros. Estamos aquí para responder tus preguntas.',
    url: 'https://uepaaoc.com/contactanos',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
