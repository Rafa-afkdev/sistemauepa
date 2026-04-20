"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { ContenidoCriterios, Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { addDocument, db, updateDocument } from "@/lib/data/firebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { CalendarIcon, Check, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";

interface CrearEvaluacionDialogProps {
  children: React.ReactNode;
  onEvaluacionCreada: () => void;
  evaluacionToEdit?: Evaluaciones | null;
  onOpenChange?: (open: boolean) => void;
}

interface MateriaDocente {
  materia_id: string;
  materia_nombre: string;
}

interface SeccionDocente {
  seccion_id: string;
  nivel_educativo: string;
  grado_año: string;
  seccion: string;
  turno?: string;
}

export function CrearEvaluacionDialog({
  children,
  onEvaluacionCreada,
  evaluacionToEdit,
  onOpenChange,
}: CrearEvaluacionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  // Form state
  const [nombreEvaluacion, setNombreEvaluacion] = useState("");
  const [tipoEvaluacion, setTipoEvaluacion] = useState("");
  const [lapsoId, setLapsoId] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [seccionesIds, setSeccionesIds] = useState<string[]>([]);
  const [periodoEscolarId, setPeriodoEscolarId] = useState("");
  const [fecha, setFecha] = useState<Date>();
  const [porcentaje, setPorcentaje] = useState<number>(0);
  const [tieneCriterios, setTieneCriterios] = useState(false);
  const [criterios, setCriterios] = useState<ContenidoCriterios[]>([
    { nro_criterio: "1", nombre: "", ponderacion: 0 },
  ]);

  const isEditing = !!evaluacionToEdit;
  const isEvaluada = evaluacionToEdit?.status === "EVALUADA";

  // Efecto para abrir el modal si hay una evaluación para editar
  useEffect(() => {
    if (evaluacionToEdit) {
      setOpen(true);
      cargarDatosEvaluacion();
    }
  }, [evaluacionToEdit]);

  const cargarDatosEvaluacion = () => {
    if (!evaluacionToEdit) return;

    setNombreEvaluacion(evaluacionToEdit.nombre_evaluacion || "");
    setTipoEvaluacion(evaluacionToEdit.tipo_evaluacion || "");
    setLapsoId(evaluacionToEdit.lapsop_id || "");
    setMateriaId(evaluacionToEdit.materia_id || "");
    setSeccionesIds(evaluacionToEdit.seccion_id ? [evaluacionToEdit.seccion_id] : []);
    setPeriodoEscolarId(evaluacionToEdit.periodo_escolar_id || "");
    setPorcentaje(evaluacionToEdit.porcentaje || 0);

    // Ajustar fecha (sumar un día para compensar zona horaria si es necesario, o parsear correctamente)
    // Asumiendo que viene en formato YYYY-MM-DD
    if (evaluacionToEdit.fecha) {
      const fechaParts = evaluacionToEdit.fecha.split('-').map(Number);
      // Crear fecha local usando los componentes (año, mes base 0, día)
      setFecha(new Date(fechaParts[0], fechaParts[1] - 1, fechaParts[2]));
    }

    if (evaluacionToEdit.criterios && evaluacionToEdit.criterios.length > 0) {
      // Verificar si son criterios por defecto o personalizados
      const esCriterioUnico = evaluacionToEdit.criterios.length === 1 &&
        evaluacionToEdit.criterios[0].ponderacion === 20;

      setTieneCriterios(!esCriterioUnico);
      setCriterios(evaluacionToEdit.criterios);
    } else {
      setTieneCriterios(false);
      setCriterios([{ nro_criterio: "1", nombre: "", ponderacion: 0 }]);
    }
  };

  // Lapsos activos
  const [lapsosActivos, setLapsosActivos] = useState<LapsosEscolares[]>([]);
  const [loadingLapsos, setLoadingLapsos] = useState(true);

  // Materias y secciones del docente
  const [materias, setMaterias] = useState<MateriaDocente[]>([]);
  const [secciones, setSecciones] = useState<SeccionDocente[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingSecciones, setLoadingSecciones] = useState(false);

  // Cargar lapsos activos y materias al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadLapsosActivos();
      loadMateriasDocente();
    }
  }, [open, user]);

  // Cargar secciones cuando cambia la materia
  useEffect(() => {
    if (materiaId && user?.uid) {
      loadSeccionesPorMateria(materiaId);
    } else {
      setSecciones([]);
      setSeccionesIds([]);
    }
  }, [materiaId, user]);

  const loadLapsosActivos = async () => {
    setLoadingLapsos(true);
    try {
      const lapsosRef = collection(db, "lapsos");
      // Obtenemos todos los lapsos, no solo los activos
      const querySnapshot = await getDocs(lapsosRef);

      const lapsosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LapsosEscolares[];

      console.log("Lapsos encontrados:", lapsosData);

      setLapsosActivos(lapsosData);

      // Si hay un lapso activo, seleccionarlo por defecto, sino el primero (solo si no es modo edición)
      if (!isEditing) {
        const lapsoActivo = lapsosData.find(l => l.status === "ACTIVO");
        if (lapsoActivo) {
          setLapsoId(lapsoActivo.id || "");
          setPeriodoEscolarId(lapsoActivo.año_escolar);
        } else if (lapsosData.length > 0) {
          setLapsoId(lapsosData[0].id || "");
          setPeriodoEscolarId(lapsosData[0].año_escolar);
        }
      }
    } catch (error) {
      console.error("Error al cargar lapsos activos:", error);
      showToast.error("Error al cargar los lapsos escolares");
    } finally {
      setLoadingLapsos(false);
    }
  };

  const loadMateriasDocente = async () => {
    if (!user?.uid) return;

    setLoadingMaterias(true);
    try {
      const asignacionesRef = collection(db, "asignaciones_docente_materia");
      const q = query(
        asignacionesRef,
        where("docente_id", "==", user.uid),
        where("estado", "==", "activa")
      );
      const querySnapshot = await getDocs(q);

      // Usar un Map para obtener materias únicas
      const materiasMap = new Map<string, MateriaDocente>();

      for (const docSnap of querySnapshot.docs) {
        const asignacion = docSnap.data();

        if (asignacion.materia_id && !materiasMap.has(asignacion.materia_id)) {
          try {
            const materiaDoc = await getDoc(doc(db, "materias", asignacion.materia_id));
            if (materiaDoc.exists()) {
              materiasMap.set(asignacion.materia_id, {
                materia_id: asignacion.materia_id,
                materia_nombre: materiaDoc.data().nombre,
              });
            }
          } catch (error) {
            console.error("Error al obtener materia:", error);
          }
        }
      }

      const materiasArray = Array.from(materiasMap.values());
      console.log("Materias cargadas:", materiasArray);
      setMaterias(materiasArray);
    } catch (error) {
      console.error("Error al cargar materias:", error);
      showToast.error("Error al cargar las materias");
    } finally {
      setLoadingMaterias(false);
    }
  };

  const loadSeccionesPorMateria = async (materiaIdSeleccionada: string) => {
    if (!user?.uid) return;

    setLoadingSecciones(true);
    try {
      const asignacionesRef = collection(db, "asignaciones_docente_materia");
      const q = query(
        asignacionesRef,
        where("docente_id", "==", user.uid),
        where("materia_id", "==", materiaIdSeleccionada),
        where("estado", "==", "activa")
      );
      const querySnapshot = await getDocs(q);

      // Recopilar todos los IDs de secciones
      const seccionesIds = new Set<string>();
      querySnapshot.docs.forEach(docSnap => {
        const asignacion = docSnap.data();
        if (asignacion.secciones_id && Array.isArray(asignacion.secciones_id)) {
          asignacion.secciones_id.forEach((id: string) => seccionesIds.add(id));
        }
      });

      // Obtener detalles de cada sección
      const seccionesDetalles: SeccionDocente[] = [];

      for (const seccionId of Array.from(seccionesIds)) {
        try {
          const seccionDoc = await getDoc(doc(db, "secciones", seccionId));
          if (seccionDoc.exists()) {
            const seccionData = seccionDoc.data();
            seccionesDetalles.push({
              seccion_id: seccionId,
              nivel_educativo: seccionData.nivel_educativo,
              grado_año: seccionData.grado_año,
              seccion: seccionData.seccion,
              turno: seccionData.turno,
            });
          }
        } catch (error) {
          console.error("Error al obtener sección:", error);
        }
      }

      console.log("Secciones cargadas para materia:", seccionesDetalles);
      setSecciones(seccionesDetalles);
    } catch (error) {
      console.error("Error al cargar secciones:", error);
      showToast.error("Error al cargar las secciones");
    } finally {
      setLoadingSecciones(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      showToast.error("Error: Sesión de usuario no válida o expirada");
      return;
    }

    if (!nombreEvaluacion || nombreEvaluacion.trim() === "") {
      showToast.error("El nombre de la evaluación es obligatorio");
      return;
    }

    if (!isEvaluada) {
      if (!tipoEvaluacion || tipoEvaluacion.trim() === "") {
        showToast.error("El tipo de evaluación es obligatorio");
        return;
      }
      if (!lapsoId || lapsoId.trim() === "") {
        showToast.error("Debes seleccionar un lapso escolar");
        return;
      }
      if (!periodoEscolarId || periodoEscolarId.trim() === "") {
        showToast.error("El periodo escolar es inválido o no existe");
        return;
      }
      if (!materiaId || materiaId.trim() === "") {
        showToast.error("Debes seleccionar una materia");
        return;
      }
      if (!seccionesIds || seccionesIds.length === 0) {
        showToast.error("Debes seleccionar al menos una sección");
        return;
      }
      if (!fecha) {
        showToast.error("Debes seleccionar una fecha válida");
        return;
      }
      if (porcentaje === undefined || porcentaje === null || porcentaje <= 0 || porcentaje > 100) {
        showToast.error("El porcentaje debe estar entre 1 y 100");
        return;
      }
    }

    // Validar criterios solo si tiene criterios personalizados y no está evaluada
    let criteriosFinales = criterios;

    if (!isEvaluada && tieneCriterios) {
      const criteriosValidos = criterios.every(c => c.nombre && c.nombre.trim() !== "" && c.ponderacion > 0);
      if (!criteriosValidos) {
        showToast.error("Todos los criterios deben tener nombre válido y ponderación mayor a 0");
        return;
      }

      const totalPonderacion = criterios.reduce((sum, c) => sum + c.ponderacion, 0);
      if (totalPonderacion !== 20) {
        showToast.error(`La ponderación total debe ser 20 puntos (actual: ${totalPonderacion})`);
        return;
      }
    } else if (!isEvaluada) {
      // Si no tiene criterios, usar un criterio por defecto de 20 puntos
      criteriosFinales = [{ nro_criterio: "1", nombre: "Evaluación General", ponderacion: 20 }];
    }

    setIsSubmitting(true);

    try {
      // MODO EDICIÓN: Solo actualizar la evaluación existente (una sola sección)
      if (isEditing && evaluacionToEdit?.id) {

        // Si la evaluación ya fue evaluada, solo se puede cambiar el nombre
        if (isEvaluada) {
          await updateDocument(`evaluaciones/${evaluacionToEdit.id}`, {
            nombre_evaluacion: nombreEvaluacion,
            updatedAt: serverTimestamp(),
          });
          showToast.success("Nombre de la evaluación actualizado exitosamente");
        } else {
          const criteriosFinales = tieneCriterios
            ? criterios
            : [{ nro_criterio: "1", nombre: "Criterio Único", ponderacion: 20 }];

          // Validar duplicidad si cambió la sección, materia o fecha
          const cambioSeccion = seccionesIds[0] !== evaluacionToEdit.seccion_id;
          const cambioMateria = materiaId !== evaluacionToEdit.materia_id;
          const cambioFecha = format(fecha!, "yyyy-MM-dd") !== evaluacionToEdit.fecha;

          if (cambioSeccion || cambioMateria || cambioFecha) {
            const evaluacionesRef = collection(db, "evaluaciones");
            const qDuplicados = query(
              evaluacionesRef,
              where("seccion_id", "==", seccionesIds[0]),
              where("materia_id", "==", materiaId),
              where("fecha", "==", format(fecha!, "yyyy-MM-dd"))
            );

            const duplicadosSnapshot = await getDocs(qDuplicados);

            // Filtrar para excluir la evaluación actual
            const duplicados = duplicadosSnapshot.docs.filter(doc => doc.id !== evaluacionToEdit.id);

            if (duplicados.length > 0) {
              const seccionNombre = secciones.find(s => s.seccion_id === seccionesIds[0]);
              const materiaNombre = materias.find(m => m.materia_id === materiaId);
              const nombreCorto = seccionNombre
                ? `${seccionNombre.grado_año} "${seccionNombre.seccion}"`
                : `Sección ${seccionesIds[0]}`;

              showToast.error(`Ya existe una evaluación de ${materiaNombre?.materia_nombre || 'esta materia'} para ${nombreCorto} en esta fecha.`);
              setIsSubmitting(false);
              return;
            }
          }

          const evaluacionData = {
            nombre_evaluacion: nombreEvaluacion,
            tipo_evaluacion: tipoEvaluacion,
            lapsop_id: lapsoId,
            materia_id: materiaId,
            seccion_id: seccionesIds[0] || "", // Solo una sección en modo edición
            periodo_escolar_id: periodoEscolarId,
            criterios: criteriosFinales,
            porcentaje: porcentaje,
            fecha: format(fecha!, "yyyy-MM-dd"),
            status: "POR EVALUAR",
            updatedAt: serverTimestamp(),
          };

          // GUARDAR HISTORIAL DE CAMBIOS
          try {
            const historialData = {
              evaluacion_id: evaluacionToEdit.id,
              docente_id: user?.uid,
              fecha_cambio: new Date(),
              accion: "EDICION",
              datos_previos: {
                nombre_evaluacion: evaluacionToEdit.nombre_evaluacion,
                tipo_evaluacion: evaluacionToEdit.tipo_evaluacion,
                fecha: evaluacionToEdit.fecha,
                seccion_id: evaluacionToEdit.seccion_id,
                materia_id: evaluacionToEdit.materia_id,
                criterios: evaluacionToEdit.criterios,
                nota_definitiva: evaluacionToEdit.nota_definitiva
              }
            };
            await addDocument("historial_cambios_evaluaciones", historialData);
            console.log("Historial guardado correctamente");
          } catch (error) {
            console.error("Error al guardar historial de cambios:", error);
            // No detenemos el flujo principal si falla el historial
          }

          await updateDocument(`evaluaciones/${evaluacionToEdit.id}`, evaluacionData);
          showToast.success("Evaluación actualizada exitosamente");
        } // fin else !isEvaluada
      }
      // MODO CREACIÓN: Crear una evaluación por cada sección seleccionada
      else {
        const criteriosFinales = tieneCriterios
          ? criterios
          : [{ nro_criterio: "1", nombre: "Criterio Único", ponderacion: 20 }];

        const evaluacionesRef = collection(db, "evaluaciones");

        console.log("🚀 INICIO - Creación múltiple asíncrona", {
          seccionesSeleccionadas: seccionesIds,
          totalSecciones: seccionesIds.length,
          lapsoAsignado: lapsoId
        });

        // Crear array de promesas para procesar todas las secciones de manera asíncrona en paralelo
        const promesasCreacion = seccionesIds.map(async (seccionId, index) => {
          console.log(`📝 Procesando sección: ${seccionId}`);

          // Validar duplicidad para esta sección específica + materia + fecha
          const qDuplicados = query(
            evaluacionesRef,
            where("seccion_id", "==", seccionId),
            where("materia_id", "==", materiaId),
            where("fecha", "==", format(fecha!, "yyyy-MM-dd"))
          );

          const duplicadosSnapshot = await getDocs(qDuplicados);

          if (duplicadosSnapshot.docs.length > 0) {
            const seccionNombre = secciones.find(s => s.seccion_id === seccionId);
            const materiaNombre = materias.find(m => m.materia_id === materiaId);
            const nombreCorto = seccionNombre
              ? `${seccionNombre.grado_año} "${seccionNombre.seccion}"`
              : `Sección ${seccionId}`;

            console.log(`⚠️ DUPLICADO encontrado para ${nombreCorto} - ${materiaNombre?.materia_nombre}`);
            throw new Error(`Duplicado: Ya existe evaluación para ${nombreCorto} en esta fecha.`);
          }

          // Crear evaluación para esta sección asegurando de enviar lapsoId y periodoEscolarId
          const evaluacionData = {
            id_evaluacion: `EVAL${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            nombre_evaluacion: nombreEvaluacion,
            tipo_evaluacion: tipoEvaluacion,
            lapsop_id: lapsoId, // <- Asignación explícita del lapso validado
            materia_id: materiaId,
            seccion_id: seccionId,
            periodo_escolar_id: periodoEscolarId, // <- Asignación explícita del periodo
            docente_id: user?.uid || "",
            criterios: criteriosFinales,
            nota_definitiva: 20,
            porcentaje: porcentaje,
            fecha: format(fecha!, "yyyy-MM-dd"),
            status: "POR EVALUAR",
            createdAt: serverTimestamp(),
          };

          console.log(`💾 Guardando evaluación para sección ${seccionId}`, evaluacionData);
          await addDocument("evaluaciones", evaluacionData);
          return seccionId;
        });

        // Ejecutar todas las promesas en paralelo de manera segura
        const resultados = await Promise.allSettled(promesasCreacion);

        let evaluacionesCreadas = 0;
        let errores = 0;
        let erroresMensajes: string[] = [];

        resultados.forEach((resultado) => {
          if (resultado.status === 'fulfilled') {
            evaluacionesCreadas++;
          } else {
            errores++;
            erroresMensajes.push(resultado.reason.message || "Error desconocido");
            console.error("Error en creación de evaluación:", resultado.reason);
          }
        });

        console.log("🏁 FIN - Creación múltiple asíncrona", {
          creadas: evaluacionesCreadas,
          errores: errores,
          totalSeleccionadas: seccionesIds.length
        });

        if (evaluacionesCreadas > 0) {
          showToast.success(`${evaluacionesCreadas} evaluación(es) creada(s) correctamente.`);
          if (errores > 0) {
            showToast.warning(`Hubo ${errores} sección(es) omitidas (e.g. duplicidad).`);
          }
        } else {
          showToast.error("No se pudo crear ninguna evaluación. " + (erroresMensajes[0] || "Ocurrió un error."));
          setIsSubmitting(false);
          return;
        }
      }

      onEvaluacionCreada();
      setOpen(false);
      onOpenChange?.(false);
      resetForm();
    } catch (error) {
      console.error("Error al crear evaluación:", error);
      showToast.error("Error al crear la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const agregarCriterio = () => {
    if (criterios.length >= 6) {
      showToast.error("Máximo 6 criterios permitidos");
      return;
    }
    setCriterios([...criterios, {
      nro_criterio: (criterios.length + 1).toString(),
      nombre: "",
      ponderacion: 0
    }]);
  };

  const eliminarCriterio = (index: number) => {
    if (criterios.length > 1) {
      const nuevosCriterios = criterios.filter((_, i) => i !== index);
      // Renumerar criterios
      const criteriosRenumerados = nuevosCriterios.map((c, i) => ({
        ...c,
        nro_criterio: (i + 1).toString()
      }));
      setCriterios(criteriosRenumerados);
    }
  };

  const actualizarCriterio = (index: number, campo: keyof ContenidoCriterios, valor: string | number) => {
    const nuevosCriterios = [...criterios];
    if (campo === "ponderacion") {
      nuevosCriterios[index][campo] = Number(valor);
    } else {
      nuevosCriterios[index][campo] = valor as string;
    }
    setCriterios(nuevosCriterios);
  };

  const resetForm = () => {
    setNombreEvaluacion("");
    setTipoEvaluacion("");
    setLapsoId("");
    setMateriaId("");
    setSeccionesIds([]);
    setPeriodoEscolarId("");
    setFecha(undefined);
    setPorcentaje(0);
    setTieneCriterios(false);
    setCriterios([{ nro_criterio: "1", nombre: "", ponderacion: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      onOpenChange?.(val);
      if (!val) {
        // Reset form when closing if not submitting? 
        // Maybe better to wait for reopen or keep state?
        // Let's keep state for now unless it's a new creation.
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEvaluada ? "Editar Nombre de Evaluación" : isEditing ? "Editar Evaluación" : "Crear Nueva Evaluación"}</DialogTitle>
          <DialogDescription>
            {isEvaluada
              ? "Esta evaluación ya fue calificada. Los campos están en modo lectura — solo puedes modificar el nombre."
              : isEditing
              ? "Modifica los datos de la evaluación"
              : "Programa una nueva evaluación para tus estudiantes"}
          </DialogDescription>
        </DialogHeader>

        {/* Banner informativo en modo lectura */}
        {isEvaluada && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
            <span className="text-base">⚠️</span>
            <span>Evaluación ya calificada. La información se muestra en modo <strong>solo lectura</strong>. Solo puedes actualizar el nombre.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la Evaluación */}
          <div className="space-y-2">
            <Label htmlFor="nombreEvaluacion">
              Nombre de la Evaluación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombreEvaluacion"
              placeholder="Ej: Examen Parcial - Funciones Matemáticas"
              value={nombreEvaluacion}
              onChange={(e) => setNombreEvaluacion(e.target.value)}
              required
            />
          </div>

          {/* Tipo y Lapso */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoEvaluacion">
                Tipo de Evaluación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tipoEvaluacion"
                placeholder="Ej: Examen, Quiz, Tarea, Proyecto..."
                value={tipoEvaluacion}
                onChange={(e) => setTipoEvaluacion(e.target.value)}
                required={!isEvaluada}
                disabled={isEvaluada}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lapsoId">
                Lapso Escolar <span className="text-red-500">*</span>
              </Label>
              <Select
                value={lapsoId}
                onValueChange={(value) => {
                  setLapsoId(value);
                  const lapsoSeleccionado = lapsosActivos.find(l => l.id === value);
                  if (lapsoSeleccionado) {
                    setPeriodoEscolarId(lapsoSeleccionado.año_escolar);
                  }
                }}
                disabled={loadingLapsos || lapsosActivos.length === 0 || isEvaluada}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingLapsos
                      ? "Cargando lapsos..."
                      : lapsosActivos.length === 0
                        ? "No hay lapsos activos"
                        : "Selecciona un lapso"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {lapsosActivos.map((lapso) => (
                    <SelectItem key={lapso.id} value={lapso.id || ""}>
                      {lapso.lapso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Materia y Sección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materiaId">
                Materia <span className="text-red-500">*</span>
              </Label>
              <Select
                value={materiaId}
                onValueChange={(value) => {
                  setMateriaId(value);
                  setSeccionesIds([]); // Limpiar secciones al cambiar materia
                }}
                disabled={loadingMaterias || materias.length === 0 || isEvaluada}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingMaterias
                      ? "Cargando materias..."
                      : materias.length === 0
                        ? "No hay materias disponibles"
                        : "Selecciona una materia"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {materias.map((materia) => (
                    <SelectItem key={materia.materia_id} value={materia.materia_id}>
                      {materia.materia_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seccionId">
                Sección{!isEditing && "(es)"} <span className="text-red-500">*</span>
              </Label>
              {isEditing ? (
                // Modo edición: Permitir cambiar la sección
                <Select
                  value={seccionesIds[0] || ""}
                  onValueChange={(value) => setSeccionesIds([value])}
                  disabled={loadingSecciones || secciones.length === 0 || isEvaluada}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingSecciones
                        ? "Cargando secciones..."
                        : secciones.length === 0
                          ? "No hay secciones disponibles"
                          : "Selecciona una sección"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {secciones.map((seccion) => (
                      <SelectItem key={seccion.seccion_id} value={seccion.seccion_id}>
                        {seccion.grado_año} {seccion.nivel_educativo} "{seccion.seccion}"{seccion.turno ? ` ${seccion.turno}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                // Modo creación: Multi-select con checkboxes
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        seccionesIds.length === 0 && "text-muted-foreground"
                      )}
                      disabled={!materiaId || loadingSecciones || secciones.length === 0}
                      onClick={() => {
                        console.log("🔍 DEBUG - Selector clicked", {
                          materiaId,
                          loadingSecciones,
                          seccionesCount: secciones.length,
                          secciones,
                          isDisabled: !materiaId || loadingSecciones || secciones.length === 0
                        });
                      }}
                    >
                      {seccionesIds.length === 0
                        ? !materiaId
                          ? "Primero selecciona una materia"
                          : loadingSecciones
                            ? "Cargando secciones..."
                            : secciones.length === 0
                              ? "No hay secciones disponibles"
                              : "Selecciona sección(es)"
                        : `${seccionesIds.length} sección(es) seleccionada(s)`}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="max-h-64 overflow-auto p-2">
                      {secciones.map((seccion) => {
                        const isSelected = seccionesIds.includes(seccion.seccion_id);
                        return (
                          <div
                            key={seccion.seccion_id}
                            className={cn(
                              "flex items-center space-x-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent",
                              isSelected && "bg-accent"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("🖱️ DEBUG - Checkbox clicked", {
                                seccionId: seccion.seccion_id,
                                isSelected,
                                currentSelection: seccionesIds
                              });
                              if (isSelected) {
                                setSeccionesIds(seccionesIds.filter(id => id !== seccion.seccion_id));
                              } else {
                                setSeccionesIds([...seccionesIds, seccion.seccion_id]);
                              }
                            }}
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                            )}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-sm">
                              {seccion.grado_año} {seccion.nivel_educativo} "{seccion.seccion}"{seccion.turno ? ` ${seccion.turno}` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>
              Fecha <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fecha && "text-muted-foreground"
                  )}
                  disabled={isEvaluada}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? (
                    format(fecha, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={setFecha}
                  disabled={(date) => {
                    // Deshabilitar fines de semana
                    const day = date.getDay();
                    if (day === 0 || day === 6) {
                      return true;
                    }

                    const lapsoSeleccionado = lapsosActivos.find(
                      (l) => l.id === lapsoId
                    );
                    if (!lapsoSeleccionado) return false;

                    const inicio = new Date(lapsoSeleccionado.fecha_inicio);
                    const fin = new Date(lapsoSeleccionado.fecha_fin);

                    inicio.setHours(0, 0, 0, 0);
                    fin.setHours(23, 59, 59, 999);

                    return date < inicio || date > fin;
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Porcentaje de la Evaluación */}
          <div className="space-y-2">
            <Label htmlFor="porcentaje">
              Porcentaje de la Evaluación <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="porcentaje"
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="Ej: 30"
                value={porcentaje || ""}
                onChange={(e) => setPorcentaje(Number(e.target.value))}
                required={!isEvaluada}
                disabled={isEvaluada}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Indica el porcentaje que representa esta evaluación en el lapso (1-100%)
            </p>
          </div>

          {/* Criterios de Evaluación */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tieneCriterios"
                checked={tieneCriterios}
                onCheckedChange={(checked) => setTieneCriterios(checked as boolean)}
                disabled={isEvaluada}
              />
              <Label htmlFor="tieneCriterios" className={isEvaluada ? "cursor-default opacity-70" : "cursor-pointer"}>
                Esta evaluación requiere de criterios?
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {tieneCriterios
                ? "Define hasta 6 criterios que sumen 20 puntos en total."
                : "La evaluación tendrá un único criterio general de 20 puntos."}
            </p>

            {tieneCriterios && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <Label>
                      Criterios de Evaluación <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 6 criterios. La suma debe ser 20 puntos.
                    </p>
                  </div>
                  {!isEvaluada && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={agregarCriterio}
                      disabled={criterios.length >= 6}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Criterio {criterios.length}/6
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {criterios.map((criterio, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-md">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Nombre del Criterio</Label>
                          <Input
                            placeholder="Ej: Funciones Lineales"
                            value={criterio.nombre}
                            onChange={(e) => actualizarCriterio(index, "nombre", e.target.value)}
                            required={!isEvaluada}
                            disabled={isEvaluada}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ponderación (puntos)</Label>
                          <Input
                            type="number"
                            min="0.5"
                            max="20"
                            step="0.5"
                            placeholder="0"
                            value={criterio.ponderacion || ""}
                            onChange={(e) => actualizarCriterio(index, "ponderacion", e.target.value)}
                            required={!isEvaluada}
                            disabled={isEvaluada}
                          />
                        </div>
                      </div>
                      {criterios.length > 1 && !isEvaluada && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarCriterio(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Total ponderación: {criterios.reduce((sum, c) => sum + c.ponderacion, 0)}/20 puntos
                    <span className={criterios.reduce((sum, c) => sum + c.ponderacion, 0) !== 20 ? "text-red-500" : "text-green-600"}>
                      {criterios.reduce((sum, c) => sum + c.ponderacion, 0) === 20 ? " ✓" : " (debe sumar 20)"}
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onOpenChange?.(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {!isEditing && <Plus className="mr-2 h-4 w-4" />}
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {isSubmitting ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Guardar Cambios" : "Crear Evaluación")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
