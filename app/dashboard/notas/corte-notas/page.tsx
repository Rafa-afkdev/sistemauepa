"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { Materias } from "@/interfaces/materias.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { cn } from "@/lib/utils";
import { generarCorteNotasPDF } from "@/utils/generateCorteNotasPDF";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Check, ChevronsUpDown, FileDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AreaChartGradient } from "./components/AreaChartGradient";
import { CorteDeNotas } from "./components/CorteDeNotas";
import { GradesChart } from "./components/GradesChart";

interface Seccion {
  id: string;
  nombre: string;
  grado_año: string;
  seccion: string;
  estudiantes_ids?: string[];
}

export default function CorteNotasPage() {
  const { user } = useUser();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluaciones[]>([]);
  const [notas, setNotas] = useState<NotasEvaluacion[]>([]);
  
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string>("");
  
  // New State for Filters
  const [periodos, setPeriodos] = useState<{id: string, nombre: string, status: string}[]>([]);
  const [periodoId, setPeriodoId] = useState<string>("");
  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([]);
  const [lapsoSeleccionado, setLapsoSeleccionado] = useState<string>("");

  const [isLoadingSecciones, setIsLoadingSecciones] = useState(false);
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  
  // 0. Cargar periodos y el activo por defecto
  useEffect(() => {
    const loadPeriodos = async () => {
        try {
            const q = query(collection(db, "periodos_escolares"), orderBy("periodo", "desc"));
            const s = await getDocs(q);
            const periodosData = s.docs.map(d => ({id: d.id, nombre: d.data().periodo, status: d.data().status}));
            setPeriodos(periodosData);

            const active = periodosData.find(p => p.status === "ACTIVO");
            if (active) {
                setPeriodoId(active.id);
            } else if (periodosData.length > 0) {
                setPeriodoId(periodosData[0].id);
            }
        } catch (e) {
            console.error("Error loading periods", e);
        }
    }
    loadPeriodos();
  }, []);

  // 0.1 Cargar lapsos cuando cambia el periodo
  useEffect(() => {
      if (!periodoId) {
          setLapsos([]);
          setLapsoSeleccionado("");
          return;
      }

      const loadLapsos = async () => {
          try {
            const q = query(collection(db, "lapsos"), where("año_escolar", "==", periodoId));
            const s = await getDocs(q);
            const lapsosData = s.docs.map(d => ({id: d.id, ...d.data()} as LapsosEscolares));
            
            // Sort lapsos if possible
            lapsosData.sort((a,b) => a.lapso.localeCompare(b.lapso));

            setLapsos(lapsosData);

            // Select active lapso by default if available
            const activeLapso = lapsosData.find(l => l.status === "ACTIVO");
            if (activeLapso) {
                setLapsoSeleccionado(activeLapso.id || "");
            } else if (lapsosData.length > 0) {
                setLapsoSeleccionado(lapsosData[0].id || "");
            } else {
                setLapsoSeleccionado("");
            }

          } catch (e) {
              console.error("Error loading lapsos", e);
          }
      }
      loadLapsos();
  }, [periodoId]);


  // 1. Cargar secciones del periodo seleccionado
  useEffect(() => {
    if (!periodoId) return;

    const loadSecciones = async () => {
      setIsLoadingSecciones(true);
      setSecciones([]); 
      setSeccionSeleccionada(""); // Reset section on period change
      
      try {
        const seccRef = collection(db, "secciones");
        const q = query(seccRef, where("id_periodo_escolar", "==", periodoId));
        const snapshot = await getDocs(q);
        
        const uniqueSections = new Map<string, Seccion>();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const nombre = `${data.grado_año} "${data.seccion}"`;
            
            const newSection: Seccion = {
                id: doc.id,
                nombre: nombre,
                grado_año: data.grado_año,
                seccion: data.seccion,
                estudiantes_ids: data.estudiantes_ids || []
            };

            if (!uniqueSections.has(nombre)) {
                uniqueSections.set(nombre, newSection);
            } else {
                const existing = uniqueSections.get(nombre)!;
                const existingCount = existing.estudiantes_ids?.length || 0;
                const newCount = newSection.estudiantes_ids?.length || 0;
                
                if (newCount > existingCount) {
                    uniqueSections.set(nombre, newSection);
                }
            }
        });

        const data = Array.from(uniqueSections.values());
        setSecciones(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch (error) {
        console.error("Error loading sections:", error);
      } finally {
        setIsLoadingSecciones(false);
      }
    };
    loadSecciones();
  }, [periodoId]);

  // 2. Cargar estudiantes de la sección seleccionada
  useEffect(() => {
    if (!seccionSeleccionada) {
      setEstudiantes([]);
      setEstudianteSeleccionado("");
      return;
    }

    const loadEstudiantes = async () => {
      setIsLoadingEstudiantes(true);
      setEstudianteSeleccionado("");
      try {
        const seccion = secciones.find(s => s.id === seccionSeleccionada);
        const ids = seccion?.estudiantes_ids || [];

        if (ids.length > 0) {
            const estRef = collection(db, "estudiantes");
            const estudiantesLoaded: Estudiantes[] = [];
            // Batch fetching
            for (let i = 0; i < ids.length; i += 10) {
                const chunk = ids.slice(i, i + 10);
                const qEst = query(estRef, where("__name__", "in", chunk));
                const snapEst = await getDocs(qEst);
                snapEst.docs.forEach(d => estudiantesLoaded.push({ id: d.id, ...d.data() } as Estudiantes));
            }
            setEstudiantes(estudiantesLoaded.sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
        } else {
            // Fallback: Try fetching from estudiantes_inscritos if array is empty (legacy compatibility)
            console.warn("Section has no estudiantes_ids array, trying estudiantes_inscritos...");
            const inscripcionesRef = collection(db, "estudiantes_inscritos");
            const q = query(inscripcionesRef, where("id_seccion", "==", seccionSeleccionada), where("estado", "==", "activo"));
            const snapshot = await getDocs(q);
            const inscritosIds = snapshot.docs.map(doc => doc.data().id_estudiante);
            
            if (inscritosIds.length > 0) {
                const estRef = collection(db, "estudiantes");
                const estudiantesLoaded: Estudiantes[] = [];
                for (let i = 0; i < inscritosIds.length; i += 10) {
                    const chunk = inscritosIds.slice(i, i + 10);
                    const qEst = query(estRef, where("__name__", "in", chunk));
                    const snapEst = await getDocs(qEst);
                    snapEst.docs.forEach(d => estudiantesLoaded.push({ id: d.id, ...d.data() } as Estudiantes));
                }
                setEstudiantes(estudiantesLoaded.sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
            } else {
                setEstudiantes([]);
            }
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setIsLoadingEstudiantes(false);
      }
    };
    loadEstudiantes();
  }, [seccionSeleccionada, secciones]);

  // 3. Cargar materias, evaluaciones y notas
  useEffect(() => {
    if (!seccionSeleccionada || !estudianteSeleccionado || !periodoId || !lapsoSeleccionado) {
        setMaterias([]);
        setEvaluaciones([]);
        setNotas([]);
        return;
    }

    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const seccion = secciones.find(s => s.id === seccionSeleccionada);
            if (!seccion) return;

            // 3.1 Cargar materias
            // Si es ADMIN, todas las del grado. Si es DOCENTE, solo las asignadas.
            const materiasRef = collection(db, "materias");
            let materiasData: Materias[] = [];

            if (user?.rol === "DOCENTE") {
                const qAsignaciones = query(
                    collection(db, "asignaciones_docente_materia"),
                    where("docente_id", "==", user.uid),
                    where("periodo_escolar_id", "==", periodoId),
                    where("secciones_id", "array-contains", seccionSeleccionada),
                    where("estado", "==", "activa")
                );
                const snapAsignaciones = await getDocs(qAsignaciones);
                const materiaIds = [...new Set(snapAsignaciones.docs.map(d => d.data().materia_id))];
                
                if (materiaIds.length > 0) {
                    // Fetch details
                     for (let i = 0; i < materiaIds.length; i += 10) {
                        const chunk = materiaIds.slice(i, i + 10);
                        const qM = query(materiasRef, where("__name__", "in", chunk));
                        const sM = await getDocs(qM);
                        sM.docs.forEach(d => materiasData.push({ id: d.id, ...d.data() } as Materias));
                    }
                }

            } else {
                 // ADMIN o cualquier otro: Cargar solo las materias con asignación activa en esta sección
                const qAsignaciones = query(
                    collection(db, "asignaciones_docente_materia"),
                    where("periodo_escolar_id", "==", periodoId),
                    where("secciones_id", "array-contains", seccionSeleccionada),
                    where("estado", "==", "activa")
                );
                const snapAsignaciones = await getDocs(qAsignaciones);
                const materiaIds = [...new Set(snapAsignaciones.docs.map(d => d.data().materia_id))];
                
                if (materiaIds.length > 0) {
                    for (let i = 0; i < materiaIds.length; i += 10) {
                        const chunk = materiaIds.slice(i, i + 10);
                        const qM = query(materiasRef, where("__name__", "in", chunk));
                        const sM = await getDocs(qM);
                        sM.docs.forEach(d => materiasData.push({ id: d.id, ...d.data() } as Materias));
                    }
                }
            }

            // Ordenar materias
            setMaterias(materiasData.sort((a,b) => a.nombre.localeCompare(b.nombre)));


            // 3.2 Cargar evaluaciones
            const evalRef = collection(db, "evaluaciones");
            const qEval = query(
                evalRef, 
                where("seccion_id", "==", seccionSeleccionada),
                where("periodo_escolar_id", "==", periodoId), // Ensure using period
                where("lapsop_id", "==", lapsoSeleccionado),
                where("status", "==", "EVALUADA") 
            );
            const snapEval = await getDocs(qEval);
            let evaluacionesData = snapEval.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluaciones));
            
            // Filter evaluations by loaded subjects (in case of teacher view)
            evaluacionesData = evaluacionesData.filter(e => materiasData.some(m => m.id === e.materia_id));

            setEvaluaciones(evaluacionesData);

            // 3.3 Cargar notas del estudiante
            const notasRef = collection(db, "notas_evaluaciones");
            const qNotas = query(notasRef, where("estudiante_id", "==", estudianteSeleccionado));
            const snapNotas = await getDocs(qNotas);
            const notasData = snapNotas.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotasEvaluacion));
            setNotas(notasData);

        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };
    loadData();
  }, [estudianteSeleccionado, seccionSeleccionada, secciones, periodoId, lapsoSeleccionado, user]);

  // Chart Data Preparation
  const chartData = materias.map(materia => {
    const materiaEvals = evaluaciones.filter(ev => ev.materia_id === materia.id);
    const materiaNotas = notas.filter(n => materiaEvals.some(ev => ev.id === n.evaluacion_id));
    
    // Calculate average
    // Only count evaluations that have a grade > 0 ? Or all? 
    // Average of grades present.
    const sum = materiaNotas.reduce((acc, curr) => acc + curr.nota_definitiva, 0);
    const count = materiaNotas.length;
    const average = count > 0 ? sum / count : 0;

    return {
        subject: materia.nombre,
        average: parseFloat(average.toFixed(2))
    };
  }).filter(d => d.average > 0); // Opcional: mostrar solo materias con notas

  const selectedStudent = estudiantes.find(e => e.id === estudianteSeleccionado);
  const selectedSection = secciones.find(s => s.id === seccionSeleccionada);

  const handlePrint = async () => {
    if (!selectedStudent || !selectedSection) return;
    setIsGeneratingPDF(true);
    try {
        await generarCorteNotasPDF({
            estudiante: selectedStudent,
            materias,
            evaluaciones,
            notas,
            seccionNombre: selectedSection.nombre
        });
        toast.success("PDF generado correctamente");
    } catch (error) {
        console.error("Error creating PDF", error);
        toast.error("Error al generar el PDF");
    } finally {
        setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Corte de Notas</h1>
           <p className="text-muted-foreground">Generación de reporte de calificaciones por estudiante</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Student Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="space-y-2 md:col-span-4 lg:col-span-2">
            <Label htmlFor="periodo">Periodo Escolar</Label>
            <Select 
                value={periodoId} 
                onValueChange={setPeriodoId}
                disabled={isLoadingSecciones && secciones.length === 0 && !periodoId}
            >
              <SelectTrigger id="periodo">
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id}>
                    {periodo.nombre} {periodo.status === "ACTIVO" ? "(Activo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-4 lg:col-span-2">
            <Label htmlFor="lapso">Lapso</Label>
            <Select 
                value={lapsoSeleccionado} 
                onValueChange={setLapsoSeleccionado}
                disabled={!periodoId || lapsos.length === 0}
            >
              <SelectTrigger id="lapso">
                <SelectValue placeholder="Selecciona un lapso" />
              </SelectTrigger>
              <SelectContent>
                 {lapsos.map((lapso) => (
                  <SelectItem key={lapso.id} value={lapso.id || ""}>
                    {lapso.lapso} {lapso.status === "ACTIVO" ? "(Activo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-4 lg:col-span-2">
            <Label htmlFor="seccion">Sección</Label>
            <Select 
                value={seccionSeleccionada} 
                onValueChange={setSeccionSeleccionada}
                disabled={isLoadingSecciones || !periodoId}
            >
              <SelectTrigger id="seccion">
                <SelectValue placeholder={isLoadingSecciones ? "Cargando..." : "Selecciona una sección"} />
              </SelectTrigger>
              <SelectContent>
                {secciones.map((seccion) => (
                  <SelectItem key={seccion.id} value={seccion.id}>
                    {seccion.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col md:col-span-8 lg:col-span-4">
            <Label htmlFor="estudiante">Estudiante</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                        disabled={isLoadingEstudiantes || !seccionSeleccionada}
                    >
                        {estudianteSeleccionado
                            ? estudiantes.find((est) => est.id === estudianteSeleccionado)?.apellidos + ", " + estudiantes.find((est) => est.id === estudianteSeleccionado)?.nombres
                            : (isLoadingEstudiantes ? "Cargando..." : "Selecciona un estudiante")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar por nombre o cédula..." />
                        <CommandList>
                            <CommandEmpty>No se encontró el estudiante.</CommandEmpty>
                            <CommandGroup>
                                {estudiantes.map((est) => (
                                    <CommandItem
                                        key={est.id}
                                        value={`${est.cedula} ${est.apellidos} ${est.nombres}`} 
                                        onSelect={(currentValue) => {
                                            setEstudianteSeleccionado(est.id === estudianteSeleccionado ? "" : est.id || "");
                                            setOpenCombobox(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                estudianteSeleccionado === est.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{est.apellidos}, {est.nombres}</span>
                                            <span className="text-xs text-muted-foreground">C.I: {est.cedula}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          
           <Button 
            variant="default" 
            className="md:col-span-4 lg:col-span-2 w-auto px-4 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handlePrint}
            disabled={!estudianteSeleccionado || isLoadingData || isGeneratingPDF}
            >
            {isGeneratingPDF ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando PDF...
                </>
            ) : (
                <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Imprimir Corte
                </>
            )}
            </Button>
        </div>
        </CardContent>
      </Card>

      {isLoadingData ? (
        <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : estudianteSeleccionado && selectedStudent && selectedSection ? (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CorteDeNotas 
                        estudiante={selectedStudent}
                        materias={materias}
                        evaluaciones={evaluaciones}
                        notas={notas}
                        seccionNombre={selectedSection.nombre}
                    />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rendimiento Académico</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GradesChart data={chartData} />
                            <div className="mt-4 text-sm text-muted-foreground text-center">
                                Promedio por Asignatura
                            </div>
                        </CardContent>
                    </Card>

                    <AreaChartGradient data={chartData} />
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Selecciona una sección y un estudiante</p>
            <p className="text-sm">Para visualizar el corte de notas y generar el reporte.</p>
        </div>
      )}
    </div>
  );
}