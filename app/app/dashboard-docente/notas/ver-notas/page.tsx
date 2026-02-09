"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ChevronLeft, Download, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { EvaluationDetails } from "./components/EvaluationDetails";
import { EvaluationSelector } from "./components/EvaluationSelector";
import { GradesStatistics } from "./components/GradesStatistics";
import { GradesTable } from "./components/GradesTable";
import { generarReportePDF } from "./utils/generateGradesPDF";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotaConEstudiante extends NotasEvaluacion {
  estudiante?: Estudiantes;
}

interface Estadisticas {
  promedio: string;
  notaMaxima: string;
  notaMinima: string;
  aprobados: number;
  reprobados: number;
  total: number;
}

export default function VerNotas() {
  const { user } = useUser();
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string>("");
  const [notas, setNotas] = useState<NotaConEstudiante[]>([]);
  const [notasFiltradas, setNotasFiltradas] = useState<NotaConEstudiante[]>([]);
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(true);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar evaluaciones completadas del docente
  useEffect(() => {
    if (user?.uid) {
      loadEvaluacionesCompletadas();
    }
  }, [user]);

  // Cargar notas cuando se selecciona una evaluación
  useEffect(() => {
    if (evaluacionSeleccionada) {
      loadNotas();
    } else {
      setNotas([]);
      setNotasFiltradas([]);
    }
  }, [evaluacionSeleccionada]);

  // Filtrar notas según el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setNotasFiltradas(notas);
    } else {
      const filtered = notas.filter((nota) => {
        const nombreCompleto = `${nota.estudiante?.nombres} ${nota.estudiante?.apellidos}`.toLowerCase();
        const cedula = nota.estudiante?.cedula?.toString().toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return nombreCompleto.includes(term) || cedula.includes(term);
      });
      setNotasFiltradas(filtered);
    }
  }, [searchTerm, notas]);

  const loadEvaluacionesCompletadas = async () => {
    if (!user?.uid) return;

    setIsLoadingEvaluaciones(true);
    try {
      const evaluacionesRef = collection(db, "evaluaciones");
      const q = query(
        evaluacionesRef,
        where("docente_id", "==", user.uid),
        where("status", "==", "EVALUADA")
      );

      const snapshot = await getDocs(q);
      const evaluacionesData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as EvaluacionConDetalles;

          // Obtener nombre de materia
          if (data.materia_id) {
            try {
              const materiaDoc = await getDoc(doc(db, "materias", data.materia_id));
              if (materiaDoc.exists()) {
                data.materia_nombre = materiaDoc.data().nombre;
              }
            } catch (error) {
              console.error("Error al obtener materia:", error);
            }
          }

          // Obtener nombre de sección
          if (data.seccion_id) {
            try {
              const seccionDoc = await getDoc(doc(db, "secciones", data.seccion_id));
              if (seccionDoc.exists()) {
                const seccionData = seccionDoc.data();
                data.seccion_nombre = `${seccionData.grado_año} "${seccionData.seccion}"`;
              }
            } catch (error) {
              console.error("Error al obtener sección:", error);
            }
          }

          return data;
        })
      );

      // Ordenar por fecha más reciente primero
      evaluacionesData.sort((a, b) => {
        if (a.fecha && b.fecha) {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        }
        return 0;
      });

      setEvaluaciones(evaluacionesData);
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      showToast.error("Error al cargar evaluaciones completadas");
    } finally {
      setIsLoadingEvaluaciones(false);
    }
  };

  const loadNotas = async () => {
    if (!evaluacionSeleccionada) return;

    setIsLoadingNotas(true);
    try {
      const notasRef = collection(db, "notas_evaluaciones");
      const q = query(notasRef, where("evaluacion_id", "==", evaluacionSeleccionada));
      const snapshot = await getDocs(q);

      const notasData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const notaData = { id: docSnap.id, ...docSnap.data() } as NotaConEstudiante;

          // Cargar datos del estudiante
          if (notaData.estudiante_id) {
            try {
              const estudianteDoc = await getDoc(doc(db, "estudiantes", notaData.estudiante_id));
              if (estudianteDoc.exists()) {
                notaData.estudiante = { id: estudianteDoc.id, ...estudianteDoc.data() } as Estudiantes;
              }
            } catch (error) {
              console.error("Error al cargar estudiante:", error);
            }
          }

          return notaData;
        })
      );

      // Ordenar por apellidos
      notasData.sort((a, b) => {
        const apellidoA = a.estudiante?.apellidos || "";
        const apellidoB = b.estudiante?.apellidos || "";
        return apellidoA.localeCompare(apellidoB);
      });

      setNotas(notasData);
      setNotasFiltradas(notasData);
    } catch (error) {
      console.error("Error al cargar notas:", error);
      showToast.error("Error al cargar las calificaciones");
    } finally {
      setIsLoadingNotas(false);
    }
  };

  const calcularEstadisticas = (): Estadisticas | null => {
    if (notasFiltradas.length === 0) return null;

    const notasDefinitivas = notasFiltradas.map((n) => n.nota_definitiva);
    const promedio = notasDefinitivas.reduce((sum, nota) => sum + nota, 0) / notasDefinitivas.length;
    const notaMaxima = Math.max(...notasDefinitivas);
    const notaMinima = Math.min(...notasDefinitivas);
    const aprobados = notasDefinitivas.filter((nota) => nota >= 10).length;
    const reprobados = notasDefinitivas.length - aprobados;

    return {
      promedio: promedio.toFixed(2),
      notaMaxima: notaMaxima.toFixed(2),
      notaMinima: notaMinima.toFixed(2),
      aprobados,
      reprobados,
      total: notasFiltradas.length,
    };
  };

  const handleSelectEvaluacion = (id: string) => {
    setEvaluacionSeleccionada(id);
    setSearchTerm(""); // Reset search
  };

  const handleExportPDF = async () => {
    if (!evaluacion || !estadisticas || notasFiltradas.length === 0) return;

    try {
      await generarReportePDF(evaluacion, notasFiltradas, estadisticas);
      showToast.success("Reporte PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast.error("Error al generar el reporte PDF");
    }
  };

  const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
  const estadisticas = calcularEstadisticas();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/app/dashboard-docente">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Ver Notas</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza las calificaciones de las evaluaciones completadas
          </p>
        </div>
      </div>

      {/* Selector de Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
          <CardDescription>
            Elige la evaluación completada para ver las calificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvaluationSelector
            evaluaciones={evaluaciones}
            evaluacionSeleccionada={evaluacionSeleccionada}
            onSelectEvaluacion={handleSelectEvaluacion}
            isLoading={isLoadingEvaluaciones}
          />

          {evaluacion && <EvaluationDetails evaluacion={evaluacion} />}
        </CardContent>
      </Card>

      {/* Estadísticas y Tabla de Notas */}
      {evaluacion && (
        <>
          {/* Barra de búsqueda y estadísticas */}
          {!isLoadingNotas && notas.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Calificaciones</CardTitle>
                    <CardDescription>
                      {notasFiltradas.length} de {notas.length} estudiante(s)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar estudiante o cédula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button onClick={handleExportPDF} variant="outline" className="shrink-0">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estadísticas */}
                {estadisticas && <GradesStatistics estadisticas={estadisticas} />}

                {/* Tabla de notas */}
                {notasFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron resultados" : "No hay calificaciones registradas"}
                  </div>
                ) : (
                  <GradesTable notas={notasFiltradas} evaluacion={evaluacion} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading state */}
          {isLoadingNotas && (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Cargando calificaciones...</span>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
