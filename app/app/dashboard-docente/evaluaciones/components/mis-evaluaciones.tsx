"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Edit,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";

import { useUser } from "@/hooks/use-user";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { AsignacionDocenteMateria } from "@/interfaces/materias.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { CrearEvaluacionDialog } from "./crear-evaluacion-dialog";

import { db, deleteDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface MateriaConNombre {
  id: string;
  nombre: string;
}

interface SeccionConInfo {
  id: string;
  grado_año: string;
  seccion: string;
  nivel_educativo: string;
  nombre_completo: string;
}

export function MisEvaluaciones() {
  const { user } = useUser();
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Nuevos estados para filtros en cascada
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>("");
  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([]);
  const [lapsoSeleccionado, setLapsoSeleccionado] = useState<string>("");
  const [materiasDocente, setMateriasDocente] = useState<MateriaConNombre[]>([]);
  const [asignacionesDocente, setAsignacionesDocente] = useState<AsignacionDocenteMateria[]>([]);
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<SeccionConInfo[]>([]);
  const [seccionFiltro, setSeccionFiltro] = useState<string>("todas");
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [openMateriaCombo, setOpenMateriaCombo] = useState(false);
  const [openSeccionCombo, setOpenSeccionCombo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [evaluacionEditar, setEvaluacionEditar] = useState<EvaluacionConDetalles | null>(null);
  const [evaluacionToDelete, setEvaluacionToDelete] = useState<EvaluacionConDetalles | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar periodos escolares al montar el componente
  useEffect(() => {
    loadPeriodosEscolares();
  }, []);

  // Cargar lapsos cuando cambia el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionado) {
      loadLapsosByPeriodo(periodoSeleccionado);
    } else {
      setLapsos([]);
      setLapsoSeleccionado("");
    }
  }, [periodoSeleccionado]);

  // Cargar materias del docente cuando cambia el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionado && user?.uid) {
      loadMateriasDocente(periodoSeleccionado);
    } else {
      setMateriasDocente([]);
      setAsignacionesDocente([]);
    }
  }, [periodoSeleccionado, user]);

  // Cargar secciones cuando cambia la materia seleccionada
  useEffect(() => {
    if (materiaFiltro && materiaFiltro !== "todas") {
      loadSeccionesByMateria(materiaFiltro);
    } else {
      setSeccionesDisponibles([]);
      setSeccionFiltro("todas");
    }
  }, [materiaFiltro, asignacionesDocente]);

  // Cargar evaluaciones cuando cambia el usuario
  useEffect(() => {
    loadEvaluaciones();
  }, [user]);

  // Cargar periodos escolares
  const loadPeriodosEscolares = async () => {
    setIsLoadingFilters(true);
    try {
      const periodosRef = collection(db, 'periodos_escolares');
      const q = query(periodosRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const periodosData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as PeriodosEscolares[];

      setPeriodosEscolares(periodosData);

      // Seleccionar el periodo activo por defecto
      const periodoActivo = periodosData.find(p => p.status === 'ACTIVO');
      if (periodoActivo?.id) {
        setPeriodoSeleccionado(periodoActivo.id);
      } else if (periodosData.length > 0 && periodosData[0].id) {
        setPeriodoSeleccionado(periodosData[0].id);
      }
    } catch (error) {
      console.error("Error al cargar periodos escolares:", error);
      showToast.error("Error al cargar periodos escolares");
    } finally {
      setIsLoadingFilters(false);
    }
  };

  // Cargar lapsos por periodo escolar
  const loadLapsosByPeriodo = async (periodoId: string) => {
    try {
      const lapsosRef = collection(db, 'lapsos');
      const q = query(
        lapsosRef,
        where('año_escolar', '==', periodoId),
        where('status', '==', 'ACTIVO')
      );
      const snapshot = await getDocs(q);
      const lapsosData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as LapsosEscolares[];

      setLapsos(lapsosData);

      // Seleccionar el primer lapso por defecto
      if (lapsosData.length > 0 && lapsosData[0].id) {
        setLapsoSeleccionado(lapsosData[0].id);
      } else {
        setLapsoSeleccionado("");
      }
    } catch (error) {
      console.error("Error al cargar lapsos:", error);
      setLapsos([]);
      setLapsoSeleccionado("");
    }
  };

  // Cargar materias asignadas al docente para el periodo seleccionado
  const loadMateriasDocente = async (periodoId: string) => {
    if (!user?.uid) return;

    try {
      const asignacionesRef = collection(db, 'asignaciones_docente_materia');
      const q = query(
        asignacionesRef,
        where('docente_id', '==', user.uid),
        where('periodo_escolar_id', '==', periodoId),
        where('estado', '==', 'activa')
      );
      const snapshot = await getDocs(q);
      const asignaciones = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AsignacionDocenteMateria[];

      // Obtener IDs únicos de materias
      const uniqueMateriaIds = [...new Set(asignaciones.map(a => a.materia_id).filter(Boolean))];

      // Obtener nombres de las materias
      const materiasConNombres: MateriaConNombre[] = await Promise.all(
        uniqueMateriaIds.map(async (materiaId) => {
          try {
            const materiaDoc = await getDoc(doc(db, "materias", materiaId));
            return {
              id: materiaId,
              nombre: materiaDoc.exists() ? materiaDoc.data().nombre : `Materia ${materiaId}`
            };
          } catch (error) {
            console.error("Error al obtener materia:", error);
            return { id: materiaId, nombre: `Materia ${materiaId}` };
          }
        })
      );

      setMateriasDocente(materiasConNombres);
      setAsignacionesDocente(asignaciones);
      setMateriaFiltro("todas"); // Reset materia filter when periodo changes
      setSeccionFiltro("todas"); // Reset seccion filter
    } catch (error) {
      console.error("Error al cargar materias del docente:", error);
      setMateriasDocente([]);
      setAsignacionesDocente([]);
    }
  };

  // Cargar secciones disponibles basadas en la materia seleccionada
  const loadSeccionesByMateria = async (materiaId: string) => {
    try {
      // Obtener las asignaciones para esta materia
      const asignacionesMateria = asignacionesDocente.filter(a => a.materia_id === materiaId);

      // Obtener todos los IDs de secciones de estas asignaciones
      const allSeccionIds: string[] = [];
      asignacionesMateria.forEach(a => {
        if (a.secciones_id && Array.isArray(a.secciones_id)) {
          allSeccionIds.push(...a.secciones_id);
        }
      });

      const uniqueSeccionIds = [...new Set(allSeccionIds)];

      if (uniqueSeccionIds.length === 0) {
        setSeccionesDisponibles([]);
        setSeccionFiltro("todas");
        return;
      }

      // Obtener información de cada sección
      const seccionesInfoPromises = uniqueSeccionIds.map(async (seccionId) => {
        try {
          const seccionDoc = await getDoc(doc(db, "secciones", seccionId));
          if (seccionDoc.exists()) {
            const data = seccionDoc.data();
            return {
              id: seccionId,
              grado_año: data.grado_año || "",
              seccion: data.seccion || "",
              nivel_educativo: data.nivel_educativo || "",
              nombre_completo: `${data.grado_año} ${data.nivel_educativo} "${data.seccion}"`
            } satisfies SeccionConInfo;
          }
          return null;
        } catch (error) {
          console.error("Error al obtener sección:", error);
          return null;
        }
      });

      const seccionesInfo = await Promise.all(seccionesInfoPromises);

      // Filtrar nulls y ordenar por grado/año y sección
      const seccionesValidas = seccionesInfo
        .filter((s): s is SeccionConInfo => s !== null)
        .sort((a, b) => {
          if (a.grado_año !== b.grado_año) return a.grado_año.localeCompare(b.grado_año);
          return a.seccion.localeCompare(b.seccion);
        });

      setSeccionesDisponibles(seccionesValidas);
      setSeccionFiltro("todas");
    } catch (error) {
      console.error("Error al cargar secciones:", error);
      setSeccionesDisponibles([]);
    }
  };

  const loadEvaluaciones = async () => {
    if (!user?.uid) return;

    setIsLoading(true);

    try {
      const evaluacionesRef = collection(db, 'evaluaciones');
      const q = query(
        evaluacionesRef,
        where('docente_id', '==', user.uid),
      );

      const evaluacionesSnapshot = await getDocs(q);

      // Step 1: Get all evaluations first
      const evaluacionesRaw = evaluacionesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as EvaluacionConDetalles[];

      // Step 2: Extract unique IDs
      const uniqueMateriaIds = [...new Set(evaluacionesRaw.map(e => e.materia_id).filter(Boolean))] as string[];
      const uniqueSeccionIds = [...new Set(evaluacionesRaw.map(e => e.seccion_id).filter(Boolean))] as string[];

      // Step 3: Fetch all unique materias and secciones in parallel
      const [materiasResults, seccionesResults] = await Promise.all([
        Promise.all(
          uniqueMateriaIds.map(async (id) => {
            try {
              const materiaDoc = await getDoc(doc(db, "materias", id));
              return { id, nombre: materiaDoc.exists() ? materiaDoc.data().nombre : null };
            } catch (error) {
              console.error("Error al obtener materia:", error);
              return { id, nombre: null };
            }
          })
        ),
        Promise.all(
          uniqueSeccionIds.map(async (id) => {
            try {
              const seccionDoc = await getDoc(doc(db, "secciones", id));
              if (seccionDoc.exists()) {
                const data = seccionDoc.data();
                return { id, nombre: `${data.grado_año} ${data.nivel_educativo} "${data.seccion}"` };
              }
              return { id, nombre: null };
            } catch (error) {
              console.error("Error al obtener sección:", error);
              return { id, nombre: null };
            }
          })
        )
      ]);

      // Step 4: Create lookup maps
      const materiasMap = new Map(materiasResults.map(m => [m.id, m.nombre]));
      const seccionesMap = new Map(seccionesResults.map(s => [s.id, s.nombre]));

      // Step 5: Enrich evaluations with names
      const evaluacionesConDetalles = evaluacionesRaw.map(evaluacion => ({
        ...evaluacion,
        materia_nombre: evaluacion.materia_id ? materiasMap.get(evaluacion.materia_id) ?? undefined : undefined,
        seccion_nombre: evaluacion.seccion_id ? seccionesMap.get(evaluacion.seccion_id) ?? undefined : undefined
      }));

      console.log("Evaluaciones cargadas:", evaluacionesConDetalles);
      setEvaluaciones(evaluacionesConDetalles);
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      showToast.error("Error al cargar las evaluaciones");
      setEvaluaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!evaluacionToDelete?.id) return;

    setIsDeleting(true);
    try {
      await deleteDocument(`evaluaciones/${evaluacionToDelete.id}`);
      showToast.success("Evaluación eliminada correctamente");

      // Actualizar lista localmente
      setEvaluaciones(prev => prev.filter(e => e.id !== evaluacionToDelete.id));
      setEvaluacionToDelete(null);
    } catch (error) {
      console.error("Error al eliminar evaluación:", error);
      showToast.error("Error al eliminar la evaluación");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar evaluaciones
  const evaluacionesFiltradas = evaluaciones.filter(
    (ev) => ev.lapsop_id === lapsoSeleccionado &&
      (materiaFiltro === "todas" || ev.materia_id === materiaFiltro) &&
      (seccionFiltro === "todas" || ev.seccion_id === seccionFiltro) &&
      (searchTerm === "" || ev.nombre_evaluacion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Estadísticas por lapso
  const estadisticasLapso = (() => {
    const total = evaluacionesFiltradas.length;
    const evaluadas = evaluacionesFiltradas.filter((ev) => ev.status === "EVALUADA").length;
    const porEvaluar = evaluacionesFiltradas.filter((ev) => ev.status === "POR EVALUAR").length;
    
    // Calcular porcentaje según el filtro de materia
    let porcentajeCalculado = 0;
    let descripcionPorcentaje = "";
    
    if (total > 0) {
      const sumaPorcentajes = evaluacionesFiltradas.reduce((sum, ev) => sum + (ev.porcentaje || 0), 0);
      
      if (materiaFiltro === "todas") {
        // Sin filtro de materia: mostrar PROMEDIO
        porcentajeCalculado = Math.round(sumaPorcentajes / total);
        descripcionPorcentaje = "Promedio de todas las evaluaciones";
      } else {
        // Con filtro de materia: mostrar SUMATORIA
        porcentajeCalculado = sumaPorcentajes;
        descripcionPorcentaje = "Sumatoria de la materia seleccionada";
      }
    }
    
    return {
      total,
      evaluadas,
      porEvaluar,
      porcentajeCalculado,
      descripcionPorcentaje
    };
  })();

  // Obtener nombres para mostrar en estadísticas
  const periodoActualNombre = periodosEscolares.find(p => p.id === periodoSeleccionado)?.periodo || '';
  const lapsoActualNombre = lapsos.find(l => l.id === lapsoSeleccionado)?.lapso || 'Seleccione un lapso';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y programa las evaluaciones de tus estudiantes
          </p>
        </div>
        <CrearEvaluacionDialog onEvaluacionCreada={loadEvaluaciones}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Evaluación
          </Button>
        </CrearEvaluacionDialog>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.total}</div>
            <p className="text-xs text-muted-foreground">
              {periodoActualNombre} - {lapsoActualNombre}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.evaluadas}</div>
            <p className="text-xs text-muted-foreground">
              Completamente calificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Evaluar</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.porEvaluar}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes de calificar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Porcentaje Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.porcentajeCalculado}%</div>
            <p className="text-xs text-muted-foreground">
              {estadisticasLapso.descripcionPorcentaje}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscador por nombre */}
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar Evaluación</label>
            <Input
              type="text"
              placeholder="Buscar por nombre de evaluación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Periodo Escolar */}
            <div>
              <label className="text-sm font-medium mb-2 block">Periodo Escolar</label>
              <Select
                value={periodoSeleccionado}
                onValueChange={setPeriodoSeleccionado}
                disabled={isLoadingFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodosEscolares.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id || ""}>
                      {periodo.periodo} {periodo.status === "ACTIVO" && "(Activo)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lapso */}
            <div>
              <label className="text-sm font-medium mb-2 block">Lapso</label>
              <Select
                value={lapsoSeleccionado}
                onValueChange={setLapsoSeleccionado}
                disabled={lapsos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lapsos.length === 0 ? "Sin lapsos disponibles" : "Seleccione un lapso"} />
                </SelectTrigger>
                <SelectContent>
                  {lapsos.map((lapso) => (
                    <SelectItem key={lapso.id} value={lapso.id || ""}>
                      {lapso.lapso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Materia - Combobox buscable */}
            <div>
              <label className="text-sm font-medium mb-2 block">Materia</label>
              <Popover open={openMateriaCombo} onOpenChange={setOpenMateriaCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openMateriaCombo}
                    className="w-full justify-between font-normal"
                    disabled={materiasDocente.length === 0}
                  >
                    {materiaFiltro === "todas"
                      ? "Todas las materias"
                      : materiasDocente.find((m) => m.id === materiaFiltro)?.nombre || "Seleccione una materia"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar materia..." />
                    <CommandList>
                      <CommandEmpty>No se encontró la materia.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todas"
                          onSelect={() => {
                            setMateriaFiltro("todas");
                            setOpenMateriaCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              materiaFiltro === "todas" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Todas las materias
                        </CommandItem>
                        {materiasDocente.map((materia) => (
                          <CommandItem
                            key={materia.id}
                            value={materia.nombre}
                            onSelect={() => {
                              setMateriaFiltro(materia.id);
                              setOpenMateriaCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                materiaFiltro === materia.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {materia.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sección - Combobox buscable */}
            <div>
              <label className="text-sm font-medium mb-2 block">Año y Sección</label>
              <Popover open={openSeccionCombo} onOpenChange={setOpenSeccionCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSeccionCombo}
                    className="w-full justify-between font-normal"
                    disabled={materiaFiltro === "todas" || seccionesDisponibles.length === 0}
                  >
                    {seccionFiltro === "todas"
                      ? "Todas las secciones"
                      : seccionesDisponibles.find((s) => s.id === seccionFiltro)?.nombre_completo || "Seleccione"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar sección..." />
                    <CommandList>
                      <CommandEmpty>No se encontró la sección.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todas"
                          onSelect={() => {
                            setSeccionFiltro("todas");
                            setOpenSeccionCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              seccionFiltro === "todas" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Todas las secciones
                        </CommandItem>
                        {seccionesDisponibles.map((seccion) => (
                          <CommandItem
                            key={seccion.id}
                            value={seccion.nombre_completo}
                            onSelect={() => {
                              setSeccionFiltro(seccion.id);
                              setOpenSeccionCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                seccionFiltro === seccion.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {seccion.nombre_completo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de evaluaciones */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando evaluaciones...</p>
            </CardContent>
          </Card>
        ) : evaluacionesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay evaluaciones</h3>
              <p className="text-muted-foreground mb-4">
                No tienes evaluaciones programadas para este lapso
              </p>
              <CrearEvaluacionDialog onEvaluacionCreada={loadEvaluaciones}>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Evaluación
                </Button>
              </CrearEvaluacionDialog>
            </CardContent>
          </Card>
        ) : (
          evaluacionesFiltradas.map((evaluacion) => (
            <Card key={evaluacion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{evaluacion.nombre_evaluacion}</CardTitle>
                      <Badge
                        variant="outline"
                        className={evaluacion.status === "EVALUADA"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-yellow-100 text-yellow-800 border-yellow-300"}
                      >
                        {evaluacion.status}
                      </Badge>
                    </div>
                    <CardDescription>ID: {evaluacion.id_evaluacion}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEvaluacionEditar(evaluacion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setEvaluacionToDelete(evaluacion)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium capitalize">{evaluacion.tipo_evaluacion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {(() => {
                        const parts = evaluacion.fecha.split('-').map(Number);
                        // parts[0] is year, parts[1] is month (1-based), parts[2] is day
                        // Date constructor takes 0-based month
                        return format(new Date(parts[0], parts[1] - 1, parts[2]), "dd/MM/yyyy", { locale: es });
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nota Definitiva</p>
                    <p className="font-medium">{evaluacion.nota_definitiva} pts</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Porcentaje</p>
                    <p className="font-medium">{evaluacion.porcentaje}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lapso</p>
                    <p className="font-medium">

                      {lapsos.find(l => l.id === evaluacion.lapsop_id)?.lapso || evaluacion.lapsop_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Materia</p>
                    <p className="font-medium">{evaluacion.materia_nombre || evaluacion.materia_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sección</p>
                    <p className="font-medium">{evaluacion.seccion_nombre || evaluacion.seccion_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criterios</p>
                    <p className="font-medium">{evaluacion.criterios.length} criterios</p>
                  </div>
                </div>

                {/* Criterios de Evaluación */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Criterios de Evaluación:</p>
                  <div className="grid gap-2">
                    {evaluacion.criterios.map((criterio) => (
                      <div
                        key={criterio.nro_criterio}
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            #{criterio.nro_criterio}
                          </span>
                          <span className="text-sm">{criterio.nombre}</span>
                        </div>
                        <Badge variant="secondary">{criterio.ponderacion} pts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))

        )}
      </div>

      {/* Diálogo de Edición - Instancia única controlada por estado */}
      <CrearEvaluacionDialog
        evaluacionToEdit={evaluacionEditar}
        onEvaluacionCreada={() => {
          loadEvaluaciones();
          setEvaluacionEditar(null);
        }}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEvaluacionEditar(null);
        }}
      >
        <div className="hidden"></div>
      </CrearEvaluacionDialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={!!evaluacionToDelete} onOpenChange={(open) => !open && setEvaluacionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de eliminar esta evaluación?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La evaluación y todas las notas asociadas serán eliminadas permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEvaluacionToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
