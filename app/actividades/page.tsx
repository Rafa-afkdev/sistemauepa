import { Metadata } from 'next'
import ActivadesComponents from './components/activades'

export const metadata: Metadata = {
  title: 'Actividades',
  description: 'Descubre las actividades extracurriculares, deportivas, culturales y espirituales que ofrecemos en la U.E.P Adventista Alejandro Oropeza Castillo para el desarrollo integral de nuestros estudiantes.',
  keywords: [
    'actividades escolares',
    'actividades extracurriculares',
    'deportes',
    'cultura',
    'eventos',
    'desarrollo estudiantil',
  ],
  openGraph: {
    title: 'Actividades | U.E.P Adventista Alejandro Oropeza Castillo',
    description: 'Conoce nuestras actividades extracurriculares, deportivas, culturales y espirituales.',
    url: 'https://uepaaoc.com/actividades',
  },
}

export default function ActivadesPage() {
  return (
    <ActivadesComponents />
  )
}
