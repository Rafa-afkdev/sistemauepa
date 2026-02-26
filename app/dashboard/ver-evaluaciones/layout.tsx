import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ver Evaluaciones | Dashboard Admin",
  description: "Consulta y edita las calificaciones de evaluaciones completadas",
};

export default function VerEvaluacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
