import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historial de Cambios de Sección | Sistema UEPA",
  description: "Registro histórico de todos los cambios de sección de estudiantes del Colegio UEPA",
};

export default function HistorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
