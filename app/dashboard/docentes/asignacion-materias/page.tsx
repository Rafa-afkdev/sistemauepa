import React from "react";
import AsignacionMateriasDocentes from "./components/asignacion-materias-docentes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asignación de Materias - Docentes",
};

export default function AsignacionMateriasPage() {
  return (
    <div>
      <AsignacionMateriasDocentes />
    </div>
  );
}

