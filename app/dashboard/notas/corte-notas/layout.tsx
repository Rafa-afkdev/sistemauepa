
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corte de Notas | Colegio UEPA",
  description: "Generación de reporte de calificaciones por estudiante",
};

export default function CorteNotasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
