import { Metadata } from 'next'
import AsistenciaPage from './components/asistencia'

export const metadata: Metadata = {
  title: "Registro de Asistencia | Colegio UEPA",
  description: "Módulo de gestión de asistencia estudiantil para docentes.",
}

export default function page() {
  return (
    <AsistenciaPage />
  )
}
