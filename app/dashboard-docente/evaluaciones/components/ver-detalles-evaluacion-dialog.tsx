"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasCriterios, NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EvaluationDetails } from "../../notas/ver-notas/components/EvaluationDetails";
import { GradesTable } from "../../notas/ver-notas/components/GradesTable";
import { useUser } from "@/hooks/use-user";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotaConEstudiante extends NotasEvaluacion {
  estudiante?: Estudiantes;
}

interface VerDetallesEvaluacionDialogProps {
  evaluacion: EvaluacionConDetalles | null;
  onClose: () => void;
}

export function VerDetallesEvaluacionDialog({
  evaluacion,
  onClose,
}: VerDetallesEvaluacionDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [notas, setNotas] = useState<NotaConEstudiante[]>([]);

  useEffect(() => {
    if (evaluacion) {
      setOpen(true);
      if (evaluacion.status === "EVALUADA") {
        cargarNotas(evaluacion);
      } else {
        setNotas([]);
      }
    } else {
      setOpen(false);
    }
  }, [evaluacion]);

  const cargarNotas = async (evalSeleccionada: EvaluacionConDetalles) => {
    setIsLoadingNotas(true);
    try {
      if (!evalSeleccionada?.seccion_id) {
        setIsLoadingNotas(false);
        return;
      }

      // 1. Obtener estudiantes inscritos en la sección (ACTIVOS)
      const inscripcionesRef = collection(db, "estudiantes_inscritos");
      const qInscripciones = query(
        inscripcionesRef,
        where("id_seccion", "==", evalSeleccionada.seccion_id),
        where("estado", "==", "activo")
      );
      const inscripcionesSnapshot = await getDocs(qInscripciones);
      const estudianteIds = inscripcionesSnapshot.docs.map(
        (doc) => doc.data().id_estudiante
      );

      // 2. Obtener datos de estudiantes
      const estudiantesRef = collection(db, "estudiantes");
      const estudiantesMap = new Map<string, Estudiantes>();

      for (let i = 0; i < estudianteIds.length; i += 10) {
        const batch = estudianteIds.slice(i, i + 10);
        if (batch.length === 0) continue;
        const qEstudiantes = query(
          estudiantesRef,
          where("__name__", "in", batch)
        );
        const estudiantesSnapshot = await getDocs(qEstudiantes);
        estudiantesSnapshot.docs.forEach((doc) => {
          estudiantesMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          } as Estudiantes);
        });
      }

      // 3. Obtener notas existentes
      const notasRef = collection(db, "notas_evaluaciones");
      const qNotas = query(
        notasRef,
        where("evaluacion_id", "==", evalSeleccionada.id)
      );
      const notasSnapshot = await getDocs(qNotas);
      const notasMap = new Map<string, NotasEvaluacion>();

      notasSnapshot.docs.forEach((doc) => {
        const data = doc.data() as NotasEvaluacion;
        if (data.estudiante_id) {
          notasMap.set(data.estudiante_id, { id: doc.id, ...data });
        }
      });

      // 4. Combinar datos
      const listaFinal: NotaConEstudiante[] = [];

      estudiantesMap.forEach((estudiante, estudianteId) => {
        const notaExistente = notasMap.get(estudianteId);

        if (notaExistente) {
          listaFinal.push({
            ...notaExistente,
            estudiante,
          });
        } else {
          const notasCriteriosIniciales: NotasCriterios[] =
            evalSeleccionada.criterios.map((c) => ({
              criterio_numero: c.nro_criterio,
              criterio_nombre: c.nombre,
              ponderacion_maxima: c.ponderacion,
              nota_obtenida: 0,
            }));

          listaFinal.push({
            id: "",
            evaluacion_id: evalSeleccionada.id!,
            estudiante_id: estudianteId,
            notas_criterios: notasCriteriosIniciales,
            nota_definitiva: 0,
            observacion: "",
            estudiante,
            estudiante_nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
            docente_id: user?.uid || "",
          });
        }
      });

      // Ordenar por cédula para consistencia
      listaFinal.sort((a, b) => {
        const cedulaA = a.estudiante?.cedula ? Number(a.estudiante.cedula) : 0;
        const cedulaB = b.estudiante?.cedula ? Number(b.estudiante.cedula) : 0;
        return cedulaA - cedulaB;
      });

      setNotas(listaFinal);
    } catch (error) {
      console.error("Error al cargar notas para detalles:", error);
    } finally {
      setIsLoadingNotas(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Detalles de Evaluación</DialogTitle>
          <DialogDescription>
            Toda la información y calificaciones asociadas a esta evaluación.
          </DialogDescription>
        </DialogHeader>

        {evaluacion && (
          <div className="flex flex-col gap-6">
            <EvaluationDetails evaluacion={evaluacion} />

            {evaluacion.status === "EVALUADA" && (
              <div className="border rounded-lg bg-card p-4 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Calificaciones Registradas</h3>
                {isLoadingNotas ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2">Cargando notas de la sección...</span>
                  </div>
                ) : (
                  <GradesTable notas={notas} evaluacion={evaluacion} />
                )}
              </div>
            )}
            
            {evaluacion.status !== "EVALUADA" && (
               <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-300">
                <span className="text-base">ℹ️</span>
                <span>Esta evaluación se encuentra <strong>POR EVALUAR</strong>. Aún no se han registrado calificaciones para esta sección.</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cerrar Detalles
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
