"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasCriterios, NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { ChevronLeft, FileText, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { EditGradeDialog } from "./components/EditGradeDialog";
import { EvaluationDetails } from "./components/EvaluationDetails";
import { EvaluationSelector } from "./components/EvaluationSelector";
import { GradesStatistics } from "./components/GradesStatistics";
import { GradesTable } from "./components/GradesTable";
import { SectionSelector } from "./components/SectionSelector";
import { generarReportePDF } from "./utils/generateGradesPDF";

interface Seccion {
  id: string;
  nombre: string;
  evaluacionesCount?: number;
}

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
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("");
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionesFiltradas, setEvaluacionesFiltradas] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string>("");
  const [notas, setNotas] = useState<NotaConEstudiante[]>([]);
  const [notasFiltradas, setNotasFiltradas] = useState<NotaConEstudiante[]>([]);
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(true);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [openSectionCombobox, setOpenSectionCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notaAEditar, setNotaAEditar] = useState<NotaConEstudiante | null>(null);

  // Cargar evaluaciones completadas del docente
  useEffect(() => {
    if (user?.uid) {
      loadEvaluacionesCompletadas();
    }
  }, [user]);

  // Filtrar evaluaciones cuando cambia la sección seleccionada
  useEffect(() => {
    if (seccionSeleccionada) {
      const filtradas = evaluaciones.filter((ev) => ev.seccion_id === seccionSeleccionada);
      setEvaluacionesFiltradas(filtradas);
      // Resetear evaluación seleccionada si no está en la nueva lista
      if (evaluacionSeleccionada && !filtradas.find((ev) => ev.id === evaluacionSeleccionada)) {
        setEvaluacionSeleccionada("");
      }
    } else {
      setEvaluacionesFiltradas([]);
      setEvaluacionSeleccionada("");
    }
  }, [seccionSeleccionada, evaluaciones]);

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

      // Extraer secciones únicas y contar evaluaciones por sección
      const seccionesMap = new Map<string, Seccion>();
      evaluacionesData.forEach((ev) => {
        if (ev.seccion_id && ev.seccion_nombre) {
          if (seccionesMap.has(ev.seccion_id)) {
            const seccion = seccionesMap.get(ev.seccion_id)!;
            seccion.evaluacionesCount = (seccion.evaluacionesCount || 0) + 1;
          } else {
            seccionesMap.set(ev.seccion_id, {
              id: ev.seccion_id,
              nombre: ev.seccion_nombre,
              evaluacionesCount: 1,
            });
          }
        }
      });

      // Ordenar secciones por grado y sección
      const seccionesOrdenadas = Array.from(seccionesMap.values()).sort((a, b) => {
        // Extraer grado y sección del nombre (ej: "1° \"A\"")
        const matchA = a.nombre.match(/(\d+)°\s*"([A-Z])"/);
        const matchB = b.nombre.match(/(\d+)°\s*"([A-Z])"/);
        
        if (matchA && matchB) {
          const gradoA = parseInt(matchA[1]);
          const gradoB = parseInt(matchB[1]);
          const seccionA = matchA[2];
          const seccionB = matchB[2];
          
          // Primero ordenar por grado
          if (gradoA !== gradoB) {
            return gradoA - gradoB;
          }
          // Si el grado es igual, ordenar por sección (A, B, C...)
          return seccionA.localeCompare(seccionB);
        }
        
        // Fallback: orden alfabético simple
        return a.nombre.localeCompare(b.nombre);
      });

      setSecciones(seccionesOrdenadas);
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
      // 1. Obtener la evaluación para saber la sección
      const evaluacion = evaluaciones.find(e => e.id === evaluacionSeleccionada);
      if (!evaluacion?.seccion_id) {
        setIsLoadingNotas(false);
        return;
      }

      // 2. Obtener estudiantes inscritos en la sección (ACTIVOS)
      const inscripcionesRef = collection(db, "estudiantes_inscritos");
      const qInscripciones = query(
        inscripcionesRef,
        where("id_seccion", "==", evaluacion.seccion_id),
        where("estado", "==", "activo")
      );
      const inscripcionesSnapshot = await getDocs(qInscripciones);
      const estudianteIds = inscripcionesSnapshot.docs.map(doc => doc.data().id_estudiante);

      // 3. Obtener datos de estudiantes
      const estudiantesRef = collection(db, "estudiantes");
      const estudiantesMap = new Map<string, Estudiantes>();
      
      // Fetch en lotes de 10
      for (let i = 0; i < estudianteIds.length; i += 10) {
        const batch = estudianteIds.slice(i, i + 10);
        if (batch.length === 0) continue;
        const qEstudiantes = query(estudiantesRef, where("__name__", "in", batch));
        const estudiantesSnapshot = await getDocs(qEstudiantes);
        estudiantesSnapshot.docs.forEach(doc => {
          estudiantesMap.set(doc.id, { id: doc.id, ...doc.data() } as Estudiantes);
        });
      }

      // 4. Obtener notas existentes
      const notasRef = collection(db, "notas_evaluaciones");
      const qNotas = query(notasRef, where("evaluacion_id", "==", evaluacionSeleccionada));
      const notasSnapshot = await getDocs(qNotas);
      const notasMap = new Map<string, NotasEvaluacion>();
      
      notasSnapshot.docs.forEach(doc => {
        const data = doc.data() as NotasEvaluacion;
        if (data.estudiante_id) {
          notasMap.set(data.estudiante_id, { id: doc.id, ...data });
        }
      });

      // 5. Combinar datos
      const listaFinal: NotaConEstudiante[] = [];
      
      estudiantesMap.forEach((estudiante, estudianteId) => {
        const notaExistente = notasMap.get(estudianteId);
        
        if (notaExistente) {
          listaFinal.push({
            ...notaExistente,
            estudiante
          });
        } else {
          // Crear placeholder para estudiante sin nota
          // Inicializar criterios con nota 0
          const notasCriteriosIniciales: NotasCriterios[] = evaluacion.criterios.map(c => ({
            criterio_numero: c.nro_criterio,
            criterio_nombre: c.nombre,
            ponderacion_maxima: c.ponderacion,
            nota_obtenida: 0
          }));

          listaFinal.push({
            id: "", // ID vacío indica que no existe en BD
            evaluacion_id: evaluacionSeleccionada,
            estudiante_id: estudianteId,
            notas_criterios: notasCriteriosIniciales,
            nota_definitiva: 0,
            observacion: "",
            estudiante,
            // Campos requeridos por la interfaz NotasEvaluacion
            estudiante_nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
            docente_id: user?.uid || "",
          });
        }
      });

      // Ordenar por apellidos
      listaFinal.sort((a, b) => {
        const apellidoA = a.estudiante?.apellidos || "";
        const apellidoB = b.estudiante?.apellidos || "";
        return apellidoA.localeCompare(apellidoB);
      });

      setNotas(listaFinal);
      setNotasFiltradas(listaFinal);
    } catch (error) {
      console.error("Error al cargar notas:", error);
      showToast.error("Error al cargar las calificaciones");
    } finally {
      setIsLoadingNotas(false);
    }
  };

  const calcularEstadisticas = (): Estadisticas | null => {
    if (notasFiltradas.length === 0) return null;

    // Solo considerar notas que tienen ID (ya guardadas) o que tienen nota > 0
    // O tal vez considerar todas ya que el estudiante pertenece a la sección
    // Vamos a considerar todas para reflejar la realidad del curso
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

  const handleEditGrade = (nota: NotaConEstudiante) => {
    setNotaAEditar(nota);
    setEditDialogOpen(true);
  };

  const handleSaveGrade = async (notaId: string, nuevasNotasCriterios: NotasCriterios[], motivo: string) => {
    if (!user?.uid) return;

    try {
      // Buscar la nota actual en el state (puede ser una nota existente o un placeholder)
      // Si notaId viene vacío, buscamos por estudiante_id en notaAEditar
      const notaActual = notas.find(n => n.id === notaId) || notaAEditar;
      
      if (!notaActual) {
        throw new Error("No se encontró la nota");
      }

      // Calcular la nueva nota definitiva
      const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
      if (!evaluacion) {
        throw new Error("No se encontró la evaluación");
      }

      let nuevaNotaDefinitiva = 0;
      evaluacion.criterios.forEach((criterio) => {
        const notaCriterio = nuevasNotasCriterios.find(nc => nc.criterio_numero === criterio.nro_criterio);
        const valor = notaCriterio?.nota_obtenida || 0;
        const porcentaje = criterio.ponderacion / evaluacion.criterios.reduce((sum, c) => sum + c.ponderacion, 0);
        nuevaNotaDefinitiva += valor * porcentaje;
      });

      // Si tiene ID, es actualización
      if (notaId && notaId !== "") {
        // Verificar si hubo cambios
        if (nuevaNotaDefinitiva !== notaActual.nota_definitiva) {
          // Crear entrada de historial
          const nuevoCambio = {
            fecha: Timestamp.now(),
            nota_anterior: notaActual.nota_definitiva,
            nota_nueva: nuevaNotaDefinitiva,
            motivo: motivo,
            usuario_id: user.uid,
          };

          // Obtener historial existente o crear uno nuevo
          const historialActual = notaActual.historial_cambios || [];

          // Actualizar en Firestore
          await updateDoc(doc(db, "notas_evaluaciones", notaId), {
            notas_criterios: nuevasNotasCriterios,
            nota_definitiva: nuevaNotaDefinitiva,
            historial_cambios: [...historialActual, nuevoCambio],
            updatedAt: serverTimestamp(),
            // Asegurar que updated_at también se actualice si se usa ese campo
            updated_at: serverTimestamp(),
          });

          showToast.success("Calificación actualizada correctamente");
        } else {
          showToast.info("No se detectaron cambios en la nota definitiva");
        }
      } else {
        // ES NUEVA NOTA
        await addDoc(collection(db, "notas_evaluaciones"), {
          evaluacion_id: evaluacionSeleccionada,
          estudiante_id: notaActual.estudiante_id, // Usar ID del estudiante del placeholder
          estudiante_nombre: `${notaActual.estudiante?.nombres} ${notaActual.estudiante?.apellidos}`,
          docente_id: user.uid,
          notas_criterios: nuevasNotasCriterios,
          nota_definitiva: nuevaNotaDefinitiva,
          observacion: "", // Opcional: permitir observación en el dialog
          historial_cambios: [], // Inicialmente vacío
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast.success("Calificación registrada correctamente");
      }
        
      // Recargar las notas
      await loadNotas();
      setEditDialogOpen(false); // Cerrar diálogo asegúrate
    } catch (error) {
      console.error("Error al guardar calificación:", error);
      showToast.error("Error al actualizar la calificación");
      throw error;
    }
  };

  const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
  const estadisticas = calcularEstadisticas();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard-docente">
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

      {/* Selector de Sección y Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
          <CardDescription>
            Primero elige la sección, luego la evaluación para ver las calificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Sección */}
          <div className="max-w-md">
            <SectionSelector
              secciones={secciones}
              seccionSeleccionada={seccionSeleccionada}
              onSelect={setSeccionSeleccionada}
              isLoading={isLoadingEvaluaciones}
              open={openSectionCombobox}
              setOpen={setOpenSectionCombobox}
            />
          </div>

          {/* Selector de Evaluación - Solo se muestra si hay sección seleccionada */}
          {seccionSeleccionada && (
            <div>
              <EvaluationSelector
                evaluaciones={evaluacionesFiltradas}
                evaluacionSeleccionada={evaluacionSeleccionada}
                onSelectEvaluacion={handleSelectEvaluacion}
                isLoading={isLoadingEvaluaciones}
              />
            </div>
          )}

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
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Planilla
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
                  <GradesTable notas={notasFiltradas} evaluacion={evaluacion} onEdit={handleEditGrade} />
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

      {/* Dialog de Edición */}
      <EditGradeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nota={notaAEditar}
        evaluacion={evaluacion!}
        onSave={handleSaveGrade}
      />
    </div>
  );
}
