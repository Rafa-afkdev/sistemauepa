import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ver Notas | Dashboard Docente",
  description: "Consulta y exporta las calificaciones de evaluaciones completadas",
};

export default function VerNotasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
