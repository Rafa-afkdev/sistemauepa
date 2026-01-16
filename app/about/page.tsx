import { Metadata } from 'next'
import About from './components/about'

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'Conoce la historia de la U.E.P Adventista Alejandro Oropeza Castillo. Más de 40 años de trayectoria educativa formando estudiantes con valores cristianos y excelencia académica en Guarenas, Estado Miranda.',
  keywords: [
    'historia colegio adventista',
    'sobre nosotros',
    'educación adventista Venezuela',
    'Guarenas',
    'Miranda',
    'trayectoria educativa',
  ],
  openGraph: {
    title: 'Sobre Nosotros | U.E.P Adventista Alejandro Oropeza Castillo',
    description: 'Conoce nuestra historia y trayectoria de más de 40 años formando estudiantes con valores cristianos.',
    url: 'https://uepaaoc.com/about',
  },
}

export default function AboutPage() {
  return (
    <About/>
  )
}
