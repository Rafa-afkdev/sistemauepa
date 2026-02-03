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
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
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
  const [seccionId, setSeccionId] = useState("");
  const [periodoEscolarId, setPeriodoEscolarId] = useState("");
  const [fecha, setFecha] = useState<Date>();
  const [porcentaje, setPorcentaje] = useState<number>(0);
  const [tieneCriterios, setTieneCriterios] = useState(false);
  const [criterios, setCriterios] = useState<ContenidoCriterios[]>([
    { nro_criterio: "1", nombre: "", ponderacion: 0 },
  ]);

  const isEditing = !!evaluacionToEdit;

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
    setSeccionId(evaluacionToEdit.seccion_id || "");
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
      setSeccionId("");
    }
  }, [materiaId, user]);

  const loadLapsosActivos = async () => {
    setLoadingLapsos(true);
    try {
      const lapsosRef = collection(db, "lapsos");
      const q = query(lapsosRef, where("status", "==", "ACTIVO"));
      const querySnapshot = await getDocs(q);

      const lapsosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LapsosEscolares[];

      console.log("Lapsos activos encontrados:", lapsosData);

      setLapsosActivos(lapsosData);

      // Si hay un lapso activo, seleccionarlo por defecto
      if (lapsosData.length > 0) {
        setLapsoId(lapsosData[0].id || "");
        setPeriodoEscolarId(lapsosData[0].año_escolar);
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

    if (!nombreEvaluacion || !tipoEvaluacion || !materiaId || !seccionId || !fecha) {
      showToast.error("Por favor completa todos los campos requeridos");
      return;
    }

    if (porcentaje <= 0 || porcentaje > 100) {
      showToast.error("El porcentaje debe estar entre 1 y 100");
      return;
    }

    // Validar criterios solo si tiene criterios personalizados
    let criteriosFinales = criterios;

    if (tieneCriterios) {
      const criteriosValidos = criterios.every(c => c.nombre && c.ponderacion > 0);
      if (!criteriosValidos) {
        showToast.error("Todos los criterios deben tener nombre y ponderación");
        return;
      }

      const totalPonderacion = criterios.reduce((sum, c) => sum + c.ponderacion, 0);
      if (totalPonderacion !== 20) {
        showToast.error(`La ponderación total debe ser 20 puntos (actual: ${totalPonderacion})`);
        return;
      }
    } else {
      // Si no tiene criterios, usar un criterio por defecto de 20 puntos
      criteriosFinales = [{ nro_criterio: "1", nombre: "Evaluación General", ponderacion: 20 }];
    }

    setIsSubmitting(true);

    try {
      // Validar duplicidad: Consultar si ya existe evaluación para esta sección y fecha
      const evaluacionesRef = collection(db, "evaluaciones");
      const qDuplicados = query(
        evaluacionesRef,
        where("seccion_id", "==", seccionId),
        where("fecha", "==", format(fecha, "yyyy-MM-dd"))
      );

      const duplicadosSnapshot = await getDocs(qDuplicados);

      const existeDuplicado = duplicadosSnapshot.docs.some(docSnap => {
        // Si estamos editando, ignorar el documento actual
        if (isEditing && evaluacionToEdit?.id) {
          return docSnap.id !== evaluacionToEdit.id;
        }
        return true;
      });

      if (existeDuplicado) {
        showToast.error("Ya existe una evaluación programada para esta sección en esta fecha.");
        setIsSubmitting(false);
        return;
      }

      const evaluacionData = {
        id_evaluacion: `EVAL${Date.now()}`,
        nombre_evaluacion: nombreEvaluacion,
        tipo_evaluacion: tipoEvaluacion,
        lapsop_id: lapsoId,
        materia_id: materiaId,
        seccion_id: seccionId,
        periodo_escolar_id: periodoEscolarId,
        docente_id: user?.uid || "",
        criterios: criteriosFinales,
        nota_definitiva: 20,
        porcentaje: porcentaje,
        fecha: format(fecha, "yyyy-MM-dd"),
        status: "POR EVALUAR",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Guardar en Firebase
      if (isEditing && evaluacionToEdit?.id) {
        // Actualizar
        const evaluacionActualizada = {
          ...evaluacionData,
          id: undefined, // No guardar el id dentro del documento si no es necesario o si ya está en otro lado
          updatedAt: new Date(),
          // Mantener campos que no editamos
          createdAt: evaluacionToEdit.createdAt || new Date(),
          id_evaluacion: evaluacionToEdit.id_evaluacion,
          status: evaluacionToEdit.status
        };

        // Remove undefined fields
        delete evaluacionActualizada.id;

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

        await updateDocument(`evaluaciones/${evaluacionToEdit.id}`, evaluacionActualizada);
        showToast.success("Evaluación actualizada exitosamente");
      } else {
        // Crear nueva
        await addDocument("evaluaciones", evaluacionData);
        showToast.success("Evaluación creada exitosamente");
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
    setSeccionId("");
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
          <DialogTitle>{isEditing ? "Editar Evaluación" : "Crear Nueva Evaluación"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos de la evaluación" : "Programa una nueva evaluación para tus estudiantes"}
          </DialogDescription>
        </DialogHeader>

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
                required
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
                disabled={loadingLapsos || lapsosActivos.length === 0}
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
                  setSeccionId(""); // Limpiar sección al cambiar materia
                }}
                disabled={loadingMaterias || materias.length === 0}
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
                Sección <span className="text-red-500">*</span>
              </Label>
              <Select
                value={seccionId}
                onValueChange={setSeccionId}
                disabled={!materiaId || loadingSecciones || secciones.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !materiaId
                      ? "Primero selecciona una materia"
                      : loadingSecciones
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
                required
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
              />
              <Label htmlFor="tieneCriterios" className="cursor-pointer">
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
                            required
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
                            required
                          />
                        </div>
                      </div>
                      {criterios.length > 1 && (
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
              <Plus />
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {isSubmitting ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Guardar Cambios" : "Crear Evaluación")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
