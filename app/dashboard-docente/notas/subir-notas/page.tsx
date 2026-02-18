"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasCriterios, NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { CompletionDialog } from "./components/CompletionDialog";
import { EvaluationInfo } from "./components/EvaluationInfo";
import { EvaluationSelector } from "./components/EvaluationSelector";
import { GradesInputTable } from "./components/GradesInputTable";
import { SectionSelector } from "./components/SectionSelector";

interface Seccion {
  id: string;
  nombre: string;
  evaluacionesCount?: number;
}

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotasEstudiante {
  estudiante_id: string;
  notas_criterios: { [key: string]: number };
  nota_definitiva: number;
  observacion: string;
}

export default function SubirNotas() {
  const { user } = useUser();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("");
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionesFiltradas, setEvaluacionesFiltradas] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string>("");
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [notasEstudiantes, setNotasEstudiantes] = useState<{ [key: string]: NotasEstudiante }>({});
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(true);
  const [openSectionCombobox, setOpenSectionCombobox] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false);
  const [dialogCompletarOpen, setDialogCompletarOpen] = useState(false);
  const [completandoEvaluacion, setCompletandoEvaluacion] = useState(false);
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  // Cargar evaluaciones pendientes del docente
  useEffect(() => {
    if (user?.uid) {
      loadEvaluacionesPendientes();
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

  // Cargar estudiantes cuando se selecciona una evaluación
  useEffect(() => {
    if (evaluacionSeleccionada) {
      loadEstudiantes();
      loadNotasExistentes();
    } else {
      setEstudiantes([]);
      setNotasEstudiantes({});
    }
  }, [evaluacionSeleccionada]);

  const loadEvaluacionesPendientes = async () => {
    if (!user?.uid) return;

    setIsLoadingEvaluaciones(true);
    try {
      const evaluacionesRef = collection(db, "evaluaciones");
      const q = query(
        evaluacionesRef,
        where("docente_id", "==", user.uid),
        where("status", "==", "POR EVALUAR")
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
                data.materia_nombre = materiaDoc.data()?.nombre || "";
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
                data.seccion_nombre = `${seccionData?.grado_año || ""} "${seccionData?.seccion || ""}"`;
              }
            } catch (error) {
              console.error("Error al obtener sección:", error);
            }
          }

          return data;
        })
      );

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
        // Extraer grado y sección del nombre (ej: "1 \"A\"")
        const matchA = a.nombre.match(/(\d+)(?:°)?\s*"([A-Z])"/);
        const matchB = b.nombre.match(/(\d+)(?:°)?\s*"([A-Z])"/);
        
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
      showToast.error("Error al cargar evaluaciones pendientes");
    } finally {
      setIsLoadingEvaluaciones(false);
    }
  };

  const loadEstudiantes = async () => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion?.seccion_id) return;

    setIsLoadingEstudiantes(true);
    try {
      // Primero, obtener IDs de estudiantes inscritos en esta sección
      const inscripcionesRef = collection(db, "estudiantes_inscritos");
      const qInscripciones = query(
        inscripcionesRef,
        where("id_seccion", "==", evaluacion.seccion_id),
        where("estado", "==", "activo")
      );

      const inscripcionesSnapshot = await getDocs(qInscripciones);
      const estudianteIds = inscripcionesSnapshot.docs.map(doc => doc.data().id_estudiante);

      if (estudianteIds.length === 0) {
        setEstudiantes([]);
        setNotasEstudiantes({});
        setIsLoadingEstudiantes(false);
        return;
      }

      // Luego, obtener los datos completos de esos estudiantes
      const estudiantesRef = collection(db, "estudiantes");
      const estudiantesData: Estudiantes[] = [];

      // Fetch en lotes de 10 (límite de Firestore para 'in')
      for (let i = 0; i < estudianteIds.length; i += 10) {
        const batch = estudianteIds.slice(i, i + 10);
        const qEstudiantes = query(
          estudiantesRef,
          where("__name__", "in", batch)
        );
        const estudiantesSnapshot = await getDocs(qEstudiantes);
        estudiantesSnapshot.docs.forEach(doc => {
          estudiantesData.push({ id: doc.id, ...doc.data() } as Estudiantes);
        });
      }

      // Ordenar por apellidos
      const estudiantesOrdenados = estudiantesData.sort((a, b) => 
        a.apellidos.localeCompare(b.apellidos)
      );

      setEstudiantes(estudiantesOrdenados);

      // Inicializar notas vacías para cada estudiante
      const notasIniciales: { [key: string]: NotasEstudiante } = {};
      estudiantesOrdenados.forEach((est) => {
        if (est.id) {
          const notasCriterios: { [key: string]: number } = {};
          evaluacion.criterios.forEach((criterio) => {
            notasCriterios[criterio.nro_criterio] = 0;
          });
          notasIniciales[est.id] = {
            estudiante_id: est.id,
            notas_criterios: notasCriterios,
            nota_definitiva: 0,
            observacion: "",
          };
        }
      });
      setNotasEstudiantes(notasIniciales);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      showToast.error("Error al cargar estudiantes");
    } finally {
      setIsLoadingEstudiantes(false);
    }
  };

  const loadNotasExistentes = async () => {
    if (!evaluacionSeleccionada) return;

    try {
      const notasRef = collection(db, "notas_evaluaciones");
      const q = query(
        notasRef,
        where("evaluacion_id", "==", evaluacionSeleccionada)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      const notasActualizadas = { ...notasEstudiantes };

      snapshot.docs.forEach((docSnap) => {
        const nota = docSnap.data() as NotasEvaluacion;
        if (nota.estudiante_id && notasActualizadas[nota.estudiante_id]) {
          const notasCriterios: { [key: string]: number } = {};
          nota.notas_criterios.forEach((nc) => {
            notasCriterios[nc.criterio_numero] = nc.nota_obtenida;
          });

          notasActualizadas[nota.estudiante_id] = {
            estudiante_id: nota.estudiante_id,
            notas_criterios: notasCriterios,
            nota_definitiva: nota.nota_definitiva,
            observacion: nota.observacion || "",
          };
        }
      });

      setNotasEstudiantes(notasActualizadas);
    } catch (error) {
      console.error("Error al cargar notas existentes:", error);
    }
  };

  const handleObservacionChange = (estudianteId: string, valor: string) => {
    setNotasEstudiantes((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], observacion: valor },
    }));
  };

  const handleNotaChange = (estudianteId: string, criterioNumero: string, valor: string) => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion) return;

    const valorNumerico = parseFloat(valor) || 0;
    const criterio = evaluacion.criterios.find((c) => c.nro_criterio === criterioNumero);

    if (!criterio) return;

    // Validar que la nota no exceda la ponderación del criterio
    const notaValidada = Math.min(Math.max(valorNumerico, 0), criterio.ponderacion);

    setNotasEstudiantes((prev) => {
      const nuevasNotasCriterios = {
        ...prev[estudianteId].notas_criterios,
        [criterioNumero]: notaValidada,
      };

      // Calcular nota definitiva (suma simple de todas las notas)
      let notaDefinitiva = 0;
      evaluacion.criterios.forEach((crit) => {
        const notaCriterio = nuevasNotasCriterios[crit.nro_criterio] || 0;
        const porcentajeCriterio = crit.ponderacion / evaluacion.criterios.reduce((sum, c) => sum + c.ponderacion, 0);
        notaDefinitiva += notaCriterio * porcentajeCriterio;
      });

      return {
        ...prev,
        [estudianteId]: {
          ...prev[estudianteId],
          notas_criterios: nuevasNotasCriterios,
          nota_definitiva: notaDefinitiva,
        },
      };
    });
  };

  const handleGuardarNota = async (estudianteId: string) => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion || !evaluacionSeleccionada) return;

    const notasEst = notasEstudiantes[estudianteId];
    if (!notasEst) return;

    try {
      const notasCriteriosArray: NotasCriterios[] = evaluacion.criterios.map((criterio) => ({
        criterio_numero: criterio.nro_criterio,
        criterio_nombre: criterio.nombre,
        ponderacion_maxima: criterio.ponderacion,
        nota_obtenida: notasEst.notas_criterios[criterio.nro_criterio] || 0,
      }));

      // Verificar si ya existe una nota
      const notasRef = collection(db, "notas_evaluaciones");
      const q = query(
        notasRef,
        where("evaluacion_id", "==", evaluacionSeleccionada),
        where("estudiante_id", "==", estudianteId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Actualizar nota existente
        const notaDoc = snapshot.docs[0];
        await updateDoc(doc(db, "notas_evaluaciones", notaDoc.id), {
          notas_criterios: notasCriteriosArray,
          nota_definitiva: notasEst.nota_definitiva,
          observacion: notasEst.observacion || "",
          updated_at: serverTimestamp(),
        });
        showToast.success("Nota actualizada correctamente");
      } else {
        // Crear nueva nota
        await addDoc(collection(db, "notas_evaluaciones"), {
          evaluacion_id: evaluacionSeleccionada,
          estudiante_id: estudianteId,
          notas_criterios: notasCriteriosArray,
          nota_definitiva: notasEst.nota_definitiva,
          observacion: notasEst.observacion || "",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        showToast.success("Nota guardada correctamente");
      }
    } catch (error) {
      console.error("Error al guardar nota:", error);
      showToast.error("Error al guardar la nota");
    }
  };

  const handleGuardarTodasNotas = async () => {
    setGuardandoNotas(true);
    try {
      for (const estudiante of estudiantes) {
        if (estudiante.id) {
          await handleGuardarNota(estudiante.id);
        }
      }
    } catch (error) {
      console.error("Error al guardar notas:", error);
    } finally {
      setGuardandoNotas(false);
    }
  };

  const handleCompletarEvaluacion = async () => {
    if (!evaluacionSeleccionada) return;

    try {
      await updateDoc(doc(db, "evaluaciones", evaluacionSeleccionada), {
        status: "EVALUADA",
        updated_at: serverTimestamp(),
      });

      showToast.success("Evaluación marcada como completada");
    } catch (error) {
      console.error("Error al completar evaluación:", error);
      showToast.error("Error al completar la evaluación");
    }
  };

  const handleGuardarYCompletar = async () => {
    setGuardandoNotas(true);
    setCompletandoEvaluacion(true);

    try {
      // Primero guardar todas las notas
      const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
      if (!evaluacion || !evaluacionSeleccionada) {
        throw new Error("No se encontró la evaluación");
      }

      for (const estudiante of estudiantes) {
        if (!estudiante.id) continue;

        const notasEst = notasEstudiantes[estudiante.id];
        if (!notasEst) continue;

        const notasCriteriosArray: NotasCriterios[] = evaluacion.criterios.map((criterio) => ({
          criterio_numero: criterio.nro_criterio,
          criterio_nombre: criterio.nombre,
          ponderacion_maxima: criterio.ponderacion,
          nota_obtenida: notasEst.notas_criterios[criterio.nro_criterio] || 0,
        }));

        // Verificar si ya existe una nota
        const notasRef = collection(db, "notas_evaluaciones");
        const q = query(
          notasRef,
          where("evaluacion_id", "==", evaluacionSeleccionada),
          where("estudiante_id", "==", estudiante.id)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Actualizar nota existente
          const notaDoc = snapshot.docs[0];
          await updateDoc(doc(db, "notas_evaluaciones", notaDoc.id), {
            notas_criterios: notasCriteriosArray,
            nota_definitiva: notasEst.nota_definitiva,
            observacion: notasEst.observacion || "",
            updated_at: serverTimestamp(),
          });
        } else {
          // Crear nueva nota
          await addDoc(collection(db, "notas_evaluaciones"), {
            evaluacion_id: evaluacionSeleccionada,
            estudiante_id: estudiante.id,
            notas_criterios: notasCriteriosArray,
            nota_definitiva: notasEst.nota_definitiva,
            observacion: notasEst.observacion || "",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        }
      }

      // Luego completar la evaluación
      await updateDoc(doc(db, "evaluaciones", evaluacionSeleccionada), {
        status: "EVALUADA",
        updated_at: serverTimestamp(),
      });

      showToast.success("Notas guardadas y evaluación completada");

      // Redirigir a la página de evaluaciones
      setTimeout(() => {
        window.location.href = "/dashboard-docente";
      }, 1500);
    } catch (error) {
      console.error("Error al guardar y completar:", error);
      showToast.error("Error al guardar las notas y completar la evaluación");
    } finally {
      setGuardandoNotas(false);
      setCompletandoEvaluacion(false);
      setDialogCompletarOpen(false);
    }
  };

  const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);

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
          <h1 className="text-3xl font-bold">Subir Notas</h1>
          <p className="text-muted-foreground mt-2">
            Registra las calificaciones de tus estudiantes por evaluación
          </p>
        </div>
      </div>

      {/* Selector de Sección y Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
          <CardDescription>
            Primero elige la sección, luego la evaluación para registrar las notas
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
            <div className="max-w-md">
              <EvaluationSelector
                evaluaciones={evaluacionesFiltradas}
                evaluacionSeleccionada={evaluacionSeleccionada}
                onSelect={setEvaluacionSeleccionada}
                isLoading={isLoadingEvaluaciones}
                open={openCombobox}
                setOpen={setOpenCombobox}
              />
            </div>
          )}

          {evaluacion && <EvaluationInfo evaluacion={evaluacion} />}
        </CardContent>
      </Card>

      {/* Tabla de Estudiantes y Notas */}
      {evaluacion && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Estudiantes de la Sección</CardTitle>
                <CardDescription>
                  Ingresa las calificaciones para cada criterio de evaluación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GradesInputTable
              estudiantes={estudiantes}
              evaluacion={evaluacion}
              notasEstudiantes={notasEstudiantes}
              onNotaChange={handleNotaChange}
              onObservacionChange={handleObservacionChange}
              onGuardarTodasNotas={() => setDialogCompletarOpen(true)}
              isLoading={isLoadingEstudiantes}
              guardandoNotas={guardandoNotas}
            />
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Confirmación para Completar Evaluación */}
      <CompletionDialog
        open={dialogCompletarOpen}
        onOpenChange={setDialogCompletarOpen}
        onConfirm={handleGuardarYCompletar}
        isLoading={guardandoNotas}
        totalEstudiantes={estudiantes.length}
      />
    </div>
  );
}
