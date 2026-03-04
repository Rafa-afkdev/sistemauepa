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
import { generarPlanillaPorMateriaPDF } from "@/utils/generatePlanillaMateriaPDF";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { BookOpen, Check, ChevronsUpDown, FileDown, Loader2, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AreaChartGradient } from "./components/AreaChartGradient";
import { CorteDeNotas } from "./components/CorteDeNotas";
import { GradesChart } from "./components/GradesChart";
import { PlanillaMateria } from "./components/PlanillaMateria";

interface Seccion {
  id: string;
  nombre: string;
  grado_año: string;
  seccion: string;
  estudiantes_ids?: string[];
}

type TipoGeneracion = "estudiante" | "materia";

export default function CorteNotasPage() {
  const { user } = useUser();

  // ── Shared state ────────────────────────────────────────────────────────────
  const [periodos, setPeriodos] = useState<{id: string, nombre: string, status: string}[]>([]);
  const [periodoId, setPeriodoId] = useState<string>("");
  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([]);
  const [lapsoSeleccionado, setLapsoSeleccionado] = useState<string>("");
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("");

  const [tipoGeneracion, setTipoGeneracion] = useState<TipoGeneracion>("estudiante");

  // ── Modo Estudiante ──────────────────────────────────────────────────────────
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string>("");
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluaciones[]>([]);
  const [notas, setNotas] = useState<NotasEvaluacion[]>([]);

  // ── Modo Materia ─────────────────────────────────────────────────────────────
  const [materiasSeccion, setMateriasSeccion] = useState<Materias[]>([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>("");
  const [evalsPorMateria, setEvalsPorMateria] = useState<Evaluaciones[]>([]);
  const [estudiantesSeccion, setEstudiantesSeccion] = useState<Estudiantes[]>([]);
  const [todasLasNotas, setTodasLasNotas] = useState<NotasEvaluacion[]>([]);
  const [docenteAsignado, setDocenteAsignado] = useState<string>("");

  // ── Loading flags ─────────────────────────────────────────────────────────────
  const [isLoadingSecciones, setIsLoadingSecciones] = useState(false);
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingMateriaData, setIsLoadingMateriaData] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openComboboxMateria, setOpenComboboxMateria] = useState(false);

  // ── 0. Cargar periodos ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadPeriodos = async () => {
      try {
        const q = query(collection(db, "periodos_escolares"), orderBy("periodo", "desc"));
        const s = await getDocs(q);
        const data = s.docs.map(d => ({id: d.id, nombre: d.data().periodo, status: d.data().status}));
        setPeriodos(data);
        const active = data.find(p => p.status === "ACTIVO");
        setPeriodoId(active ? active.id : data[0]?.id ?? "");
      } catch (e) { console.error(e); }
    };
    loadPeriodos();
  }, []);

  // ── 0.1 Cargar lapsos ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!periodoId) { setLapsos([]); setLapsoSeleccionado(""); return; }
    const load = async () => {
      try {
        const q = query(collection(db, "lapsos"), where("año_escolar", "==", periodoId));
        const s = await getDocs(q);
        const data = s.docs.map(d => ({id: d.id, ...d.data()} as LapsosEscolares));
        data.sort((a, b) => a.lapso.localeCompare(b.lapso));
        setLapsos(data);
        const active = data.find(l => l.status === "ACTIVO");
        setLapsoSeleccionado(active?.id ?? data[0]?.id ?? "");
      } catch (e) { console.error(e); }
    };
    load();
  }, [periodoId]);

  // ── 1. Cargar secciones ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!periodoId) return;
    const load = async () => {
      setIsLoadingSecciones(true);
      setSecciones([]);
      setSeccionSeleccionada("");
      try {
        const q = query(collection(db, "secciones"), where("id_periodo_escolar", "==", periodoId));
        const snap = await getDocs(q);
        const map = new Map<string, Seccion>();
        snap.docs.forEach(doc => {
          const d = doc.data();
          const nombre = `${d.grado_año} "${d.seccion}"`;
          const ns: Seccion = {id: doc.id, nombre, grado_año: d.grado_año, seccion: d.seccion, estudiantes_ids: d.estudiantes_ids ?? []};
          if (!map.has(nombre)) { map.set(nombre, ns); }
          else {
            const ex = map.get(nombre)!;
            if ((ns.estudiantes_ids?.length ?? 0) > (ex.estudiantes_ids?.length ?? 0)) map.set(nombre, ns);
          }
        });
        setSecciones(Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch (e) { console.error(e); }
      finally { setIsLoadingSecciones(false); }
    };
    load();
  }, [periodoId]);

  // ── 2. Cargar estudiantes de la sección (modo estudiante) ────────────────────
  useEffect(() => {
    if (!seccionSeleccionada || tipoGeneracion !== "estudiante") { setEstudiantes([]); setEstudianteSeleccionado(""); return; }
    const load = async () => {
      setIsLoadingEstudiantes(true);
      setEstudianteSeleccionado("");
      try {
        const seccion = secciones.find(s => s.id === seccionSeleccionada);
        const ids = seccion?.estudiantes_ids ?? [];
        const loaded: Estudiantes[] = [];
        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10);
            const snap = await getDocs(query(collection(db, "estudiantes"), where("__name__", "in", chunk)));
            snap.docs.forEach(d => loaded.push({id: d.id, ...d.data()} as Estudiantes));
          }
        }
        setEstudiantes(loaded.sort((a, b) => a.cedula - b.cedula));
      } catch (e) { console.error(e); }
      finally { setIsLoadingEstudiantes(false); }
    };
    load();
  }, [seccionSeleccionada, tipoGeneracion, secciones]);

  // ── 3. Cargar materias/evaluaciones/notas (modo estudiante) ──────────────────
  useEffect(() => {
    if (tipoGeneracion !== "estudiante" || !seccionSeleccionada || !estudianteSeleccionado || !periodoId || !lapsoSeleccionado) {
      setMaterias([]); setEvaluaciones([]); setNotas([]); return;
    }
    const load = async () => {
      setIsLoadingData(true);
      try {
        const materiasRef = collection(db, "materias");
        let materiasData: Materias[] = [];

        const qAs = query(
          collection(db, "asignaciones_docente_materia"),
          ...(user?.rol === "DOCENTE" ? [where("docente_id", "==", user.uid)] : []),
          where("periodo_escolar_id", "==", periodoId),
          where("secciones_id", "array-contains", seccionSeleccionada),
          where("estado", "==", "activa")
        );
        const snapAs = await getDocs(qAs);
        const matIds = [...new Set(snapAs.docs.map(d => d.data().materia_id))];

        for (let i = 0; i < matIds.length; i += 10) {
          const s = await getDocs(query(materiasRef, where("__name__", "in", matIds.slice(i, i+10))));
          s.docs.forEach(d => materiasData.push({id: d.id, ...d.data()} as Materias));
        }
        setMaterias(materiasData.sort((a, b) => a.nombre.localeCompare(b.nombre)));

        const qEval = query(
          collection(db, "evaluaciones"),
          where("seccion_id", "==", seccionSeleccionada),
          where("periodo_escolar_id", "==", periodoId),
          where("lapsop_id", "==", lapsoSeleccionado),
          where("status", "==", "EVALUADA")
        );
        const snapEval = await getDocs(qEval);
        let evalsData = snapEval.docs.map(doc => ({id: doc.id, ...doc.data()} as Evaluaciones));
        evalsData = evalsData.filter(e => materiasData.some(m => m.id === e.materia_id));
        setEvaluaciones(evalsData);

        const snapNotas = await getDocs(query(collection(db, "notas_evaluaciones"), where("estudiante_id", "==", estudianteSeleccionado)));
        setNotas(snapNotas.docs.map(d => ({id: d.id, ...d.data()} as NotasEvaluacion)));

      } catch (e) { console.error(e); }
      finally { setIsLoadingData(false); }
    };
    load();
  }, [estudianteSeleccionado, seccionSeleccionada, periodoId, lapsoSeleccionado, tipoGeneracion, user]);

  // ── 4. Cargar materias de la sección (modo materia) ──────────────────────────
  useEffect(() => {
    if (tipoGeneracion !== "materia" || !seccionSeleccionada || !periodoId) {
      setMateriasSeccion([]); setMateriaSeleccionada(""); return;
    }
    const load = async () => {
      try {
        const qAs = query(
          collection(db, "asignaciones_docente_materia"),
          ...(user?.rol === "DOCENTE" ? [where("docente_id", "==", user.uid)] : []),
          where("periodo_escolar_id", "==", periodoId),
          where("secciones_id", "array-contains", seccionSeleccionada),
          where("estado", "==", "activa")
        );
        const snapAs = await getDocs(qAs);
        const matIds = [...new Set(snapAs.docs.map(d => d.data().materia_id))];
        const mats: Materias[] = [];
        for (let i = 0; i < matIds.length; i += 10) {
          const s = await getDocs(query(collection(db, "materias"), where("__name__", "in", matIds.slice(i, i+10))));
          s.docs.forEach(d => mats.push({id: d.id, ...d.data()} as Materias));
        }
        setMateriasSeccion(mats.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch (e) { console.error(e); }
    };
    load();
  }, [tipoGeneracion, seccionSeleccionada, periodoId, user]);

  // ── 5. Cargar datos de materia seleccionada (modo materia) ───────────────────
  useEffect(() => {
    if (tipoGeneracion !== "materia" || !seccionSeleccionada || !materiaSeleccionada || !periodoId || !lapsoSeleccionado) {
      setEvalsPorMateria([]); setEstudiantesSeccion([]); setTodasLasNotas([]); setDocenteAsignado(""); return;
    }
    const load = async () => {
      setIsLoadingMateriaData(true);
      try {
        // 5.1 Evaluaciones de esta materia
        const qEval = query(
          collection(db, "evaluaciones"),
          where("seccion_id", "==", seccionSeleccionada),
          where("periodo_escolar_id", "==", periodoId),
          where("lapsop_id", "==", lapsoSeleccionado),
          where("materia_id", "==", materiaSeleccionada)
        );
        const snapEval = await getDocs(qEval);
        const evalsData = snapEval.docs.map(d => ({id: d.id, ...d.data()} as Evaluaciones));
        // console.log("Evaluaciones encontradas para la materia:", evalsData.length);
        setEvalsPorMateria(evalsData);

        // 5.2 Estudiantes de la sección
        const seccion = secciones.find(s => s.id === seccionSeleccionada);
        const ids = seccion?.estudiantes_ids ?? [];
        const estLoaded: Estudiantes[] = [];
        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i += 10) {
            const snap = await getDocs(query(collection(db, "estudiantes"), where("__name__", "in", ids.slice(i, i+10))));
            snap.docs.forEach(d => estLoaded.push({id: d.id, ...d.data()} as Estudiantes));
          }
        }
        setEstudiantesSeccion(estLoaded.sort((a, b) => a.cedula - b.cedula));

        // 5.3 Notas de todos los estudiantes para las evaluaciones de esta materia
        if (evalsData.length > 0) {
          const evalIds = evalsData.map(e => e.id);
          const notasLoaded: NotasEvaluacion[] = [];
          for (let i = 0; i < evalIds.length; i += 10) {
            const snap = await getDocs(query(
              collection(db, "notas_evaluaciones"),
              where("evaluacion_id", "in", evalIds.slice(i, i+10))
            ));
            snap.docs.forEach(d => notasLoaded.push({id: d.id, ...d.data()} as NotasEvaluacion));
          }
          setTodasLasNotas(notasLoaded);
        } else {
          setTodasLasNotas([]);
        }

        // 5.4 Obtener el docente asignado a esta materia en esta sección
        try {
          const qAsig = query(
            collection(db, "asignaciones_docente_materia"),
            where("materia_id", "==", materiaSeleccionada),
            where("periodo_escolar_id", "==", periodoId),
            where("secciones_id", "array-contains", seccionSeleccionada),
            where("estado", "==", "activa")
          );
          const snapAsig = await getDocs(qAsig);
          if (!snapAsig.empty) {
            const docenteId = snapAsig.docs[0].data().docente_id;
            const docenteSnap = await getDocs(
              query(collection(db, "users"), where("uid", "==", docenteId))
            );
            if (!docenteSnap.empty) {
              const d = docenteSnap.docs[0].data();
              setDocenteAsignado(`${d.apellidos ?? ""} ${d.name ?? ""}`.trim());
            } else {
              setDocenteAsignado("");
            }
          } else {
            setDocenteAsignado("");
          }
        } catch (eDocente) {
          console.error("Error loading docente:", eDocente);
          setDocenteAsignado("");
        }

      } catch (e) { console.error(e); }
      finally { setIsLoadingMateriaData(false); }
    };
    load();
  }, [tipoGeneracion, seccionSeleccionada, materiaSeleccionada, periodoId, lapsoSeleccionado, secciones]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const chartData = materias.map(m => {
    const mEvals = evaluaciones.filter(ev => ev.materia_id === m.id);
    const mNotas = notas.filter(n => mEvals.some(ev => ev.id === n.evaluacion_id));
    const sum = mNotas.reduce((acc, cur) => acc + cur.nota_definitiva, 0);
    const avg = mNotas.length > 0 ? sum / mNotas.length : 0;
    return { subject: m.nombre, average: parseFloat(avg.toFixed(2)) };
  }).filter(d => d.average > 0);

  const selectedStudent = estudiantes.find(e => e.id === estudianteSeleccionado);
  const selectedSection = secciones.find(s => s.id === seccionSeleccionada);
  const selectedLapso = lapsos.find(l => l.id === lapsoSeleccionado);
  const selectedMateria = materiasSeccion.find(m => m.id === materiaSeleccionada);

  const handlePrintEstudiante = async () => {
    if (!selectedStudent || !selectedSection) return;
    setIsGeneratingPDF(true);
    try {
      await generarCorteNotasPDF({ estudiante: selectedStudent, materias, evaluaciones, notas, seccionNombre: selectedSection.nombre });
      toast.success("PDF generado correctamente");
    } catch (e) { console.error(e); toast.error("Error al generar el PDF"); }
    finally { setIsGeneratingPDF(false); }
  };

  const handlePrintMateria = async () => {
    if (!selectedMateria || !selectedSection || !selectedLapso) return;
    setIsGeneratingPDF(true);
    try {
      await generarPlanillaPorMateriaPDF({
        materia: selectedMateria,
        seccionNombre: selectedSection.nombre,
        estudiantes: estudiantesSeccion,
        evaluaciones: evalsPorMateria,
        todasLasNotas,
        lapso: selectedLapso,
        docenteNombre: docenteAsignado || undefined,
      });
      toast.success("Planilla generada correctamente");
    } catch (e) { console.error(e); toast.error("Error al generar la planilla"); }
    finally { setIsGeneratingPDF(false); }
  };

  const handleTipoChange = (tipo: TipoGeneracion) => {
    setTipoGeneracion(tipo);
    // Reset dependent state
    setEstudianteSeleccionado("");
    setMateriaSeleccionada("");
    setMaterias([]); setEvaluaciones([]); setNotas([]);
    setMateriasSeccion([]); setEvalsPorMateria([]); setEstudiantesSeccion([]); setTodasLasNotas([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Corte de Notas</h1>
          <p className="text-muted-foreground">Generación de reportes de calificaciones</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Row 1: Periodo + Lapso + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="periodo">Periodo Escolar</Label>
              <Select value={periodoId} onValueChange={setPeriodoId}>
                <SelectTrigger id="periodo">
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.status === "ACTIVO" ? "(Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="lapso">Lapso</Label>
              <Select value={lapsoSeleccionado} onValueChange={setLapsoSeleccionado} disabled={!periodoId || lapsos.length === 0}>
                <SelectTrigger id="lapso">
                  <SelectValue placeholder="Selecciona un lapso" />
                </SelectTrigger>
                <SelectContent>
                  {lapsos.map(l => (
                    <SelectItem key={l.id} value={l.id ?? ""}>
                      {l.lapso} {l.status === "ACTIVO" ? "(Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de generación */}
            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="tipo-generacion">Generar por</Label>
              <Select value={tipoGeneracion} onValueChange={(v) => handleTipoChange(v as TipoGeneracion)}>
                <SelectTrigger id="tipo-generacion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estudiante">
                    <span className="flex items-center gap-2"><User className="h-4 w-4" />Por Estudiante</span>
                  </SelectItem>
                  <SelectItem value="materia">
                    <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Por Materia</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Filtros dinámicos según tipo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Sección (siempre visible) */}
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="seccion">Sección</Label>
              <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada} disabled={isLoadingSecciones || !periodoId}>
                <SelectTrigger id="seccion">
                  <SelectValue placeholder={isLoadingSecciones ? "Cargando..." : "Selecciona una sección"} />
                </SelectTrigger>
                <SelectContent>
                  {secciones.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modo Estudiante: combobox de selección */}
            {tipoGeneracion === "estudiante" && (
              <div className="space-y-2 flex flex-col md:col-span-6">
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
                        ? `${estudiantes.find(e => e.id === estudianteSeleccionado)?.apellidos}, ${estudiantes.find(e => e.id === estudianteSeleccionado)?.nombres}`
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
                          {estudiantes.map(est => (
                            <CommandItem
                              key={est.id}
                              value={`${est.cedula} ${est.apellidos} ${est.nombres}`}
                              onSelect={() => {
                                setEstudianteSeleccionado(est.id === estudianteSeleccionado ? "" : est.id ?? "");
                                setOpenCombobox(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", estudianteSeleccionado === est.id ? "opacity-100" : "opacity-0")} />
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
            )}

            {/* Modo Materia: combobox de materia */}
            {tipoGeneracion === "materia" && (
              <div className="space-y-2 flex flex-col md:col-span-6">
                <Label htmlFor="materia">Materia</Label>
                <Popover open={openComboboxMateria} onOpenChange={setOpenComboboxMateria}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openComboboxMateria}
                      className="w-full justify-between"
                      disabled={!seccionSeleccionada || materiasSeccion.length === 0}
                    >
                      {materiaSeleccionada
                        ? materiasSeccion.find(m => m.id === materiaSeleccionada)?.nombre
                        : (!seccionSeleccionada ? "Selecciona una sección primero" : materiasSeccion.length === 0 ? "Cargando materias..." : "Selecciona una materia")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar materia..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la materia.</CommandEmpty>
                        <CommandGroup>
                          {materiasSeccion.map(m => (
                            <CommandItem
                              key={m.id}
                              value={m.nombre}
                              onSelect={() => {
                                setMateriaSeleccionada(m.id === materiaSeleccionada ? "" : m.id ?? "");
                                setOpenComboboxMateria(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", materiaSeleccionada === m.id ? "opacity-100" : "opacity-0")} />
                              {m.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Botón acción */}
            {tipoGeneracion === "estudiante" && (
              <Button
                variant="default"
                className="md:col-span-3 w-auto px-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handlePrintEstudiante}
                disabled={!estudianteSeleccionado || isLoadingData || isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando PDF...</>
                ) : (
                  <><FileDown className="mr-2 h-4 w-4" />Imprimir Corte</>
                )}
              </Button>
            )}

            {tipoGeneracion === "materia" && (
              <Button
                variant="default"
                className="md:col-span-3 w-auto px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handlePrintMateria}
                disabled={!materiaSeleccionada || isLoadingMateriaData || isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando PDF...</>
                ) : (
                  <><FileDown className="mr-2 h-4 w-4" />Imprimir Planilla</>
                )}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>

      {/* ── Contenido modo Estudiante ─────────────────────────────────────────── */}
      {tipoGeneracion === "estudiante" && (
        isLoadingData ? (
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
                  <div className="px-6 pb-6">
                    <GradesChart data={chartData} />
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      Promedio por Asignatura
                    </div>
                  </div>
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
        )
      )}

      {/* ── Contenido modo Materia ────────────────────────────────────────────── */}
      {tipoGeneracion === "materia" && (
        isLoadingMateriaData ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : materiaSeleccionada && selectedMateria && selectedSection && selectedLapso ? (
          <div className="space-y-6">
            <PlanillaMateria
              materia={selectedMateria}
              seccionNombre={selectedSection.nombre}
              estudiantes={estudiantesSeccion}
              evaluaciones={evalsPorMateria}
              todasLasNotas={todasLasNotas}
              lapso={selectedLapso}
              docenteNombre={docenteAsignado || undefined}
            />
            {estudiantesSeccion.length > 0 && todasLasNotas.length > 0 && (() => {
              const chartDataMateria = estudiantesSeccion.map(est => {
                const notasEst = todasLasNotas.filter(n => n.estudiante_id === est.id);
                const vals = notasEst.map(n => n.nota_definitiva).filter(v => v > 0);
                const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                return { subject: est.apellidos, average: parseFloat(avg.toFixed(2)) };
              }).filter(d => d.average > 0);
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rendimiento por Estudiante</CardTitle>
                    </CardHeader>
                    <div className="px-6 pb-6">
                      <GradesChart data={chartDataMateria} />
                      <div className="mt-4 text-sm text-muted-foreground text-center">
                        Promedio por Estudiante
                      </div>
                    </div>
                  </Card>
                  <AreaChartGradient data={chartDataMateria} />
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Selecciona una sección y una materia</p>
            <p className="text-sm">Para generar la planilla de notas de toda la sección.</p>
          </div>
        )
      )}
    </div>
  );
}