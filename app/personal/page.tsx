import { Metadata } from 'next'
import PersonalComponent from './components/personal'

export const metadata: Metadata = {
  title: 'Nuestro Personal',
  description: 'Conoce al equipo docente y administrativo de la U.E.P Adventista Alejandro Oropeza Castillo. Profesionales comprometidos con la educación integral y los valores cristianos.',
  keywords: [
    'personal docente',
    'profesores',
    'equipo administrativo',
    'docentes adventistas',
    'staff educativo',
  ],
  openGraph: {
    title: 'Nuestro Personal | U.E.P Adventista Alejandro Oropeza Castillo',
    description: 'Conoce a nuestro equipo docente y administrativo comprometido con la excelencia educativa.',
    url: 'https://uepaaoc.com/personal',
  },
}

export default function PersonalPage() {
  return (
   <PersonalComponent />
  )
}
