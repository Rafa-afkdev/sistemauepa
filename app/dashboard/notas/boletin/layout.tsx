import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boletines de Calificaciones | Sistema UEPA",
  description: "Generación de boletines de calificaciones para los estudiantes.",
};

export default function BoletinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
