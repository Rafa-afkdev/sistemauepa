"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { NotasCriterios, NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { ChevronLeft, FileText, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { EditGradeDialog } from "../ver-notas/components/EditGradeDialog";
import { EvaluationDetails } from "../ver-notas/components/EvaluationDetails";
import { EvaluationSelector } from "../ver-notas/components/EvaluationSelector";
import { GradesStatistics } from "../ver-notas/components/GradesStatistics";
import { GradesTable } from "../ver-notas/components/GradesTable";
import { SectionSelector } from "../ver-notas/components/SectionSelector";
import { generarReportePDF } from "../ver-notas/utils/generateGradesPDF";

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

interface Seccion {
  id: string;
  nombre: string;
  evaluacionesCount?: number;
}

export default function VerEvaluacionesAdmin() {
  const { user } = useUser();

  // Filter states
  const [periodos, setPeriodos] = useState<{ id: string; nombre: string; status: string }[]>([]);
  const [periodoId, setPeriodoId] = useState<string>("");
  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([]);
  const [lapsoSeleccionado, setLapsoSeleccionado] = useState<string>("");
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("");

  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string>("");
  const [notas, setNotas] = useState<NotaConEstudiante[]>([]);
  const [notasFiltradas, setNotasFiltradas] = useState<NotaConEstudiante[]>([]);

  const [isLoadingFiltros, setIsLoadingFiltros] = useState(false);
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(false);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notaAEditar, setNotaAEditar] = useState<NotaConEstudiante | null>(null);

  const [openSectionCombobox, setOpenSectionCombobox] = useState(false);

  // Admin siempre puede editar
  const canEditGrades = true;

  // Cargar periodos al montar
  useEffect(() => {
    const loadPeriodos = async () => {
      setIsLoadingFiltros(true);
      try {
        const q = query(collection(db, "periodos_escolares"), orderBy("periodo", "desc"));
        const s = await getDocs(q);
        const periodosData = s.docs.map((d) => ({
          id: d.id,
          nombre: d.data().periodo,
          status: d.data().status,
        }));
        setPeriodos(periodosData);

        const active = periodosData.find((p) => p.status === "ACTIVO");
        if (active) {
          setPeriodoId(active.id);
        } else if (periodosData.length > 0) {
          setPeriodoId(periodosData[0].id);
        }
      } catch (e) {
        console.error("Error loading periods", e);
      } finally {
        setIsLoadingFiltros(false);
      }
    };
    loadPeriodos();
  }, []);

  // Cargar lapsos cuando cambia el periodo
  useEffect(() => {
    if (!periodoId) {
      setLapsos([]);
      setLapsoSeleccionado("");
      return;
    }

    const loadLapsos = async () => {
      setIsLoadingFiltros(true);
      try {
        const q = query(collection(db, "lapsos"), where("año_escolar", "==", periodoId));
        const s = await getDocs(q);
        const lapsosData = s.docs.map((d) => ({ id: d.id, ...d.data() } as LapsosEscolares));
        lapsosData.sort((a, b) => a.lapso.localeCompare(b.lapso));
        setLapsos(lapsosData);

        const activeLapso = lapsosData.find((l) => l.status === "ACTIVO");
        if (activeLapso) {
          setLapsoSeleccionado(activeLapso.id || "");
        } else if (lapsosData.length > 0) {
          setLapsoSeleccionado(lapsosData[0].id || "");
        } else {
          setLapsoSeleccionado("");
        }
      } catch (e) {
        console.error("Error loading lapsos", e);
      } finally {
        setIsLoadingFiltros(false);
      }
    };
    loadLapsos();
  }, [periodoId]);

  // Cargar evaluaciones cuando cambia periodo/lapso
  useEffect(() => {
    if (periodoId && lapsoSeleccionado) {
      loadEvaluacionesPeriodoLapso();
    } else {
      setEvaluaciones([]);
      setSecciones([]);
      setEvaluacionSeleccionada("");
      setSeccionSeleccionada("");
    }
  }, [periodoId, lapsoSeleccionado]);

  const loadEvaluacionesPeriodoLapso = async () => {
    setIsLoadingEvaluaciones(true);
    try {
      const evaluacionesRef = collection(db, "evaluaciones");
      const q = query(evaluacionesRef, where("periodo_escolar_id", "==", periodoId));
      const snapshot = await getDocs(q);

      // Traer solo EVALUADA que pertenezcan al LAPSO seleccionado
      const rawEvaluaciones = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as EvaluacionConDetalles))
        .filter((data) => {
          const coincideLapso = data.lapsop_id === lapsoSeleccionado;
          const coincideStatus = data.status === "EVALUADA";
          return coincideLapso && coincideStatus;
        });

      const evaluacionesData = await Promise.all(
        rawEvaluaciones.map(async (data) => {
          if (data.materia_id) {
            try {
              const materiaDoc = await getDoc(doc(db, "materias", data.materia_id));
              if (materiaDoc.exists()) {
                data.materia_nombre = materiaDoc.data().nombre;
              }
            } catch {
              /* silent */
            }
          }
          if (data.seccion_id) {
            try {
              const seccionDoc = await getDoc(doc(db, "secciones", data.seccion_id));
              if (seccionDoc.exists()) {
                const sd = seccionDoc.data();
                data.seccion_nombre = `${sd.grado_año} "${sd.seccion}"`;
              }
            } catch {
              /* silent */
            }
          }
          return data;
        })
      );

      evaluacionesData.sort((a, b) => {
        if (a.fecha && b.fecha) {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        }
        return 0;
      });

      setEvaluaciones(evaluacionesData);

      // Construir secciones únicas
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

      const seccionesOrdenadas = Array.from(seccionesMap.values()).sort((a, b) => {
        const matchA = a.nombre.match(/(\d+)°\s*"([A-Z])"/);
        const matchB = b.nombre.match(/(\d+)°\s*"([A-Z])"/);
        if (matchA && matchB) {
          const gradoA = parseInt(matchA[1]);
          const gradoB = parseInt(matchB[1]);
          if (gradoA !== gradoB) return gradoA - gradoB;
          return matchA[2].localeCompare(matchB[2]);
        }
        return a.nombre.localeCompare(b.nombre);
      });

      setSecciones(seccionesOrdenadas);
      setSeccionSeleccionada("");
      setEvaluacionSeleccionada("");
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      showToast.error("Error al cargar evaluaciones");
    } finally {
      setIsLoadingEvaluaciones(false);
    }
  };

  // Cargar notas cuando se selecciona una evaluación
  useEffect(() => {
    if (evaluacionSeleccionada) {
      loadNotas();
    } else {
      setNotas([]);
      setNotasFiltradas([]);
    }
  }, [evaluacionSeleccionada]);

  // Filtrar por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setNotasFiltradas(notas);
    } else {
      const filtered = notas.filter((nota) => {
        const nombreCompleto =
          `${nota.estudiante?.nombres} ${nota.estudiante?.apellidos}`.toLowerCase();
        const cedula = nota.estudiante?.cedula?.toString().toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return nombreCompleto.includes(term) || cedula.includes(term);
      });
      setNotasFiltradas(filtered);
    }
  }, [searchTerm, notas]);

  const loadNotas = async () => {
    if (!evaluacionSeleccionada) return;
    setIsLoadingNotas(true);
    try {
      const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
      if (!evaluacion?.seccion_id) {
        setIsLoadingNotas(false);
        return;
      }

      // Obtener estudiantes inscritos activos
      const inscripcionesRef = collection(db, "estudiantes_inscritos");
      const qInscripciones = query(
        inscripcionesRef,
        where("id_seccion", "==", evaluacion.seccion_id),
        where("estado", "==", "activo")
      );
      const inscripcionesSnapshot = await getDocs(qInscripciones);
      let estudianteIds = inscripcionesSnapshot.docs.map((d) => d.data().id_estudiante);

      if (estudianteIds.length === 0) {
        const seccionDoc = await getDoc(doc(db, "secciones", evaluacion.seccion_id));
        if (seccionDoc.exists() && seccionDoc.data().estudiantes_ids) {
          estudianteIds = seccionDoc.data().estudiantes_ids;
        }
      }

      const estudiantesRef = collection(db, "estudiantes");
      const estudiantesMap = new Map<string, Estudiantes>();

      for (let i = 0; i < estudianteIds.length; i += 10) {
        const batch = estudianteIds.slice(i, i + 10);
        if (batch.length === 0) continue;
        const qEstudiantes = query(estudiantesRef, where("__name__", "in", batch));
        const estudiantesSnapshot = await getDocs(qEstudiantes);
        estudiantesSnapshot.docs.forEach((d) => {
          estudiantesMap.set(d.id, { id: d.id, ...d.data() } as Estudiantes);
        });
      }

      // Obtener notas existentes
      const notasRef = collection(db, "notas_evaluaciones");
      const qNotas = query(notasRef, where("evaluacion_id", "==", evaluacionSeleccionada));
      const notasSnapshot = await getDocs(qNotas);
      const notasMap = new Map<string, NotasEvaluacion>();
      notasSnapshot.docs.forEach((d) => {
        const data = d.data() as NotasEvaluacion;
        if (data.estudiante_id) {
          notasMap.set(data.estudiante_id, { id: d.id, ...data });
        }
      });

      const listaFinal: NotaConEstudiante[] = [];
      estudiantesMap.forEach((estudiante, estudianteId) => {
        const notaExistente = notasMap.get(estudianteId);
        if (notaExistente) {
          listaFinal.push({ ...notaExistente, estudiante });
        } else {
          const notasCriteriosIniciales: NotasCriterios[] = evaluacion.criterios.map((c) => ({
            criterio_numero: c.nro_criterio,
            criterio_nombre: c.nombre,
            ponderacion_maxima: c.ponderacion,
            nota_obtenida: 0,
          }));
          listaFinal.push({
            id: "",
            evaluacion_id: evaluacionSeleccionada,
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
    const notasDefinitivas = notasFiltradas.map((n) => n.nota_definitiva);
    const promedio = notasDefinitivas.reduce((sum, nota) => sum + nota, 0) / notasDefinitivas.length;
    return {
      promedio: promedio.toFixed(2),
      notaMaxima: Math.max(...notasDefinitivas).toFixed(2),
      notaMinima: Math.min(...notasDefinitivas).toFixed(2),
      aprobados: notasDefinitivas.filter((nota) => nota >= 10).length,
      reprobados: notasDefinitivas.filter((nota) => nota < 10).length,
      total: notasFiltradas.length,
    };
  };

  const handleSelectEvaluacion = (id: string) => {
    setEvaluacionSeleccionada(id);
    setSearchTerm("");
  };

  const handleExportPDF = async () => {
    if (!evaluacion || !estadisticas || notasFiltradas.length === 0) return;
    try {
      await generarReportePDF(evaluacion, notasFiltradas, estadisticas);
      showToast.success("Planilla PDF generada exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast.error("Error al generar el reporte PDF");
    }
  };

  const handleEditGrade = (nota: NotaConEstudiante) => {
    setNotaAEditar(nota);
    setEditDialogOpen(true);
  };

  const handleSaveGrade = async (
    notaId: string,
    nuevasNotasCriterios: NotasCriterios[],
    motivo: string
  ) => {
    if (!user?.uid) return;

    try {
      const notaActual = notas.find((n) => n.id === notaId) || notaAEditar;
      if (!notaActual) throw new Error("No se encontró la nota");

      const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
      if (!evaluacion) throw new Error("No se encontró la evaluación");

      const totalPonderacion = evaluacion.criterios.reduce((sum, c) => sum + c.ponderacion, 0);
      let nuevaNotaDefinitiva = 0;
      evaluacion.criterios.forEach((criterio) => {
        const notaCriterio = nuevasNotasCriterios.find(
          (nc) => nc.criterio_numero === criterio.nro_criterio
        );
        const valor = notaCriterio?.nota_obtenida || 0;
        nuevaNotaDefinitiva += valor * (criterio.ponderacion / totalPonderacion);
      });

      if (notaId && notaId !== "") {
        if (nuevaNotaDefinitiva !== notaActual.nota_definitiva) {
          const nuevoCambio = {
            fecha: Timestamp.now(),
            nota_anterior: notaActual.nota_definitiva,
            nota_nueva: nuevaNotaDefinitiva,
            motivo,
            usuario_id: user.uid,
          };
          const historialActual = notaActual.historial_cambios || [];
          await updateDoc(doc(db, "notas_evaluaciones", notaId), {
            notas_criterios: nuevasNotasCriterios,
            nota_definitiva: nuevaNotaDefinitiva,
            historial_cambios: [...historialActual, nuevoCambio],
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          showToast.success("Calificación actualizada correctamente");
        } else {
          showToast.info("No se detectaron cambios en la nota definitiva");
        }
      } else {
        await addDoc(collection(db, "notas_evaluaciones"), {
          evaluacion_id: evaluacionSeleccionada,
          estudiante_id: notaActual.estudiante_id,
          estudiante_nombre: `${notaActual.estudiante?.nombres} ${notaActual.estudiante?.apellidos}`,
          docente_id: user.uid,
          notas_criterios: nuevasNotasCriterios,
          nota_definitiva: nuevaNotaDefinitiva,
          observacion: "",
          historial_cambios: [],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast.success("Calificación registrada correctamente");
      }

      await loadNotas();
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error al guardar calificación:", error);
      showToast.error("Error al actualizar la calificación");
      throw error;
    }
  };

  const evaluacionesFiltradasPorSeccion = evaluaciones.filter(
    (e) => e.seccion_id === seccionSeleccionada
  );
  const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
  const estadisticas = calcularEstadisticas();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Ver Evaluaciones</h1>
          <p className="text-muted-foreground mt-2">
            Consulta y edita las calificaciones de evaluaciones completadas
          </p>
        </div>
      </div>

      {/* Filtros de Periodo y Lapso */}
      <Card>
        <CardHeader>
          <CardTitle>Periodo y Lapso</CardTitle>
          <CardDescription>
            Selecciona el periodo escolar y el lapso para buscar las evaluaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periodo Escolar</Label>
              <Select value={periodoId} onValueChange={setPeriodoId} disabled={isLoadingFiltros}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.status === "ACTIVO" ? "(Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lapso</Label>
              <Select
                value={lapsoSeleccionado}
                onValueChange={setLapsoSeleccionado}
                disabled={!periodoId || isLoadingFiltros}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un lapso" />
                </SelectTrigger>
                <SelectContent>
                  {lapsos.map((l) => (
                    <SelectItem key={l.id} value={l.id || ""}>
                      {l.lapso} {l.status === "ACTIVO" ? "(Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Sección y Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
          <CardDescription>
            Elige la sección y luego la evaluación para ver y editar las calificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {seccionSeleccionada && (
            <div>
              <EvaluationSelector
                evaluaciones={evaluacionesFiltradasPorSeccion}
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
                {estadisticas && <GradesStatistics estadisticas={estadisticas} />}

                {notasFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron resultados" : "No hay calificaciones registradas"}
                  </div>
                ) : (
                  <GradesTable
                    notas={notasFiltradas}
                    evaluacion={evaluacion}
                    onEdit={handleEditGrade}
                  />
                )}
              </CardContent>
            </Card>
          )}

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
