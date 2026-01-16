import { Metadata } from 'next'
import Galery from './components/galery'

export const metadata: Metadata = {
  title: 'Galería',
  description: 'Explora nuestra galería de fotos y conoce las instalaciones, actividades y eventos de la U.E.P Adventista Alejandro Oropeza Castillo en Guarenas, Estado Miranda.',
  keywords: [
    'galería colegio adventista',
    'fotos',
    'instalaciones',
    'eventos escolares',
    'actividades',
    'Guarenas',
  ],
  openGraph: {
    title: 'Galería | U.E.P Adventista Alejandro Oropeza Castillo',
    description: 'Explora nuestra galería de fotos con instalaciones, actividades y eventos escolares.',
    url: 'https://uepaaoc.com/galery',
  },
}

export default function GaleryPage() {
  return (
    <Galery/>
)
}
