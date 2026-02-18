import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subir Notas | Dashboard Docente",
  description: "Registra las calificaciones de tus estudiantes por evaluación",
};

export default function SubirNotasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
