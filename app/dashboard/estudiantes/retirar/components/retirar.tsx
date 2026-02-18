/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { UserX2 } from "lucide-react";
import type { InscripcionSeccion } from "@/interfaces/secciones.interface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { getCollection, updateDocument, getDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { RetirarEstudiante } from "./retirar-estudiante";
import { TableViewEstudiantesRetirar } from "./table-view-estudiante-retirar";
import { where } from "firebase/firestore";
import type { Secciones } from "@/interfaces/secciones.interface";

export default function RetirarEstudianteComponent() {
  const { user } = useUser();
  const [inscripcionesActivas, setInscripcionesActivas] = useState<InscripcionSeccion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getInscripcionesActivas = async () => {
    const path = `estudiantes_inscritos`;
    setIsLoading(true);
    try {
      const res = (await getCollection(path, [
        where("estado", "==", "activo")
      ])) as InscripcionSeccion[];
      setInscripcionesActivas(res);
    } catch (error) {
      showToast.error("Error al obtener estudiantes activos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getInscripcionesActivas();
  }, [user]);

  // ===== RETIRAR ESTUDIANTES ===== //
  const retirarEstudiantes = async (inscripcionesIds: string[]) => {
    setIsLoading(true);

    try {
      // Obtener las inscripciones que se van a retirar para extraer id_estudiante e id_seccion
      const inscripcionesARetirar = inscripcionesActivas.filter((insc) =>
        inscripcionesIds.includes(insc.id!)
      );

      // Agrupar por sección para actualizar cada sección una sola vez
      const seccionesMap: Record<string, string[]> = {};
      inscripcionesARetirar.forEach((insc) => {
        if (!seccionesMap[insc.id_seccion]) {
          seccionesMap[insc.id_seccion] = [];
        }
        seccionesMap[insc.id_seccion].push(insc.id_estudiante);
      });

      // Actualizar cada sección: eliminar estudiantes del array y restar cantidad
      const seccionUpdatePromises = Object.entries(seccionesMap).map(
        async ([seccionId, estudiantesIds]) => {
          // Obtener la sección actual
          const seccionData = (await getDocument(
            `secciones/${seccionId}`
          )) as Secciones;

          if (!seccionData) return;

          // Filtrar los estudiantes que NO están siendo retirados
          const nuevosEstudiantesIds = (seccionData.estudiantes_ids || []).filter(
            (estId) => !estudiantesIds.includes(estId)
          );

          // Calcular nueva cantidad de estudiantes inscritos
          const nuevaCantidad = Math.max(
            0,
            seccionData.estudiantes_inscritos - estudiantesIds.length
          );

          // Actualizar la sección
          await updateDocument(`secciones/${seccionId}`, {
            estudiantes_ids: nuevosEstudiantesIds,
            estudiantes_inscritos: nuevaCantidad,
          });
        }
      );

      // Actualizar estado de cada inscripción a "retirado"
      const inscripcionUpdatePromises = inscripcionesIds.map((inscripcionId) =>
        updateDocument(`estudiantes_inscritos/${inscripcionId}`, {
          estado: "retirado",
        })
      );

      // Ejecutar todas las actualizaciones en paralelo
      await Promise.all([...seccionUpdatePromises, ...inscripcionUpdatePromises]);

      showToast.success(
        `${inscripcionesIds.length} estudiante(s) retirado(s) exitosamente`
      );

      // Actualizar la lista
      const newInscripciones = inscripcionesActivas.filter(
        (item) => !inscripcionesIds.includes(item.id!)
      );
      setInscripcionesActivas(newInscripciones);
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Retirar Estudiantes</CardTitle>
            <RetirarEstudiante 
              getInscripcionesActivas={getInscripcionesActivas}
              retirarEstudiantes={retirarEstudiantes}
            >
              <Button variant="outline">
                Retirar Estudiantes
                <UserX2 className="ml-2 w-5" />
              </Button>
            </RetirarEstudiante>
          </div>
          <CardDescription>
            Gestiona el retiro de estudiantes inscritos actualmente
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TableViewEstudiantesRetirar
            inscripciones={inscripcionesActivas}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </>
  );
}
