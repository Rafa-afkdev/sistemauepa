"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Secciones } from "@/interfaces/secciones.interface";
import { db } from "@/lib/data/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  Label as RechartsLabel,
} from "recharts";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { generarBoletinPDF } from "@/utils/generateBoletinPDF";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Periodo { id: string; nombre: string; status: string; }
interface Lapso   { id: string; lapso: string; status: string; }
interface Materia { id: string; nombre: string; }
interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_cedula: string;
  cedula: number;
}
interface Evaluacion {
  id: string;
  materia_id?: string;
  lapsop_id: string;
  seccion_id?: string;
  periodo_escolar_id: string;
  status: string;
}
interface NotaEval {
  evaluacion_id: string;
  estudiante_id: string;
  nota_definitiva: number;
}
interface MateriaConNota {
  id: string;
  nombre: string;
  lapso1: number | null;
  lapso2: number | null;
  lapso3: number | null;
  promedio: number | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BoletinPage() {
  // Filters
  const [periodos, setPeriodos]       = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId]     = useState("");
  const [lapsos, setLapsos]           = useState<Lapso[]>([]);
  const [secciones, setSecciones]     = useState<Secciones[]>([]);
  const [seccionId, setSeccionId]     = useState("");
  const [openSeccion, setOpenSeccion] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteId, setEstudianteId] = useState("");
  const [openEstudiante, setOpenEstudiante] = useState(false);

  // Loading
  const [isLoadingFiltros, setIsLoadingFiltros]   = useState(false);
  const [isLoadingBoletin, setIsLoadingBoletin]   = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF]     = useState(false);

  // Boletin data
  const [materiasConNota, setMateriasConNota] = useState<MateriaConNota[]>([]);
  const [promedioGeneral, setPromedioGeneral] = useState(0);
  const [boletinReady, setBoletinReady]       = useState(false);
  const [bulkData, setBulkData]               = useState<{ estudianteObj: Estudiante, materiasConNota: MateriaConNota[], promedioGeneral: number, representanteObj?: { nombres: string, apellidos: string, cedula: string } }[]>([]);

  const seccionObj   = secciones.find(s => s.id === seccionId);
  const periodoObj   = periodos.find(p => p.id === periodoId);
  const estudianteObj = estudiantes.find(e => e.id === estudianteId);

  const formatNivel = (n?: string) => {
    if (!n) return "";
    if (n === "Año" || n === "media_general") return "Media General";
    if (n === "Grado" || n === "primaria") return "Primaria";
    return n;
  };

  const seccionLabel = seccionObj
    ? `${seccionObj.grado_año} "${seccionObj.seccion}" - ${formatNivel(seccionObj.nivel_educativo)}`
    : "Selecciona sección...";

  const estudianteLabel = estudianteObj
    ? estudianteObj.id === "TODOS" ? estudianteObj.nombres : `${estudianteObj.apellidos}, ${estudianteObj.nombres}`
    : "Selecciona estudiante...";

  // ── Load periodos ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(query(collection(db, "periodos_escolares"), orderBy("periodo", "desc")));
        setPeriodos(snap.docs.map(d => ({ id: d.id, nombre: d.data().periodo, status: d.data().status })));
      } catch { showToast.error("Error cargando periodos"); }
      finally { setIsLoadingFiltros(false); }
    };
    load();
  }, []);

  // ── Load lapsos when periodo changes ──────────────────────────────────────
  useEffect(() => {
    if (!periodoId) { setLapsos([]); setSecciones([]); setSeccionId(""); setEstudiantes([]); setEstudianteId(""); return; }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(query(collection(db, "lapsos"), where("año_escolar", "==", periodoId)));
        const data = snap.docs.map(d => ({ id: d.id, lapso: d.data().lapso, status: d.data().status }));
        data.sort((a, b) => a.lapso.localeCompare(b.lapso));
        setLapsos(data);
        setSecciones([]); setSeccionId(""); setEstudiantes([]); setEstudianteId("");
      } catch { showToast.error("Error cargando lapsos"); }
      finally { setIsLoadingFiltros(false); }
    };
    load();
  }, [periodoId]);

  // ── Load secciones when periodo changes ───────────────────────────────────
  useEffect(() => {
    if (!periodoId) { setSecciones([]); setSeccionId(""); setEstudiantes([]); setEstudianteId(""); return; }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(query(collection(db, "secciones"), where("id_periodo_escolar", "==", periodoId)));
        const seccionesData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Secciones));

        // Deduplicate
        const map = new Map<string, Secciones>();
        for (const s of seccionesData) {
          const key = `${s.grado_año}-${s.seccion}-${s.nivel_educativo}`;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, s);
          } else {
            const eN = s.estudiantes_ids?.length || 0;
            const eX = existing.estudiantes_ids?.length || 0;
            if (eN > eX) map.set(key, s);
          }
        }

        const unique = Array.from(map.values()).sort((a, b) => {
          if (a.nivel_educativo !== b.nivel_educativo) return a.nivel_educativo.localeCompare(b.nivel_educativo);
          if (a.grado_año !== b.grado_año) return a.grado_año.localeCompare(b.grado_año);
          return a.seccion.localeCompare(b.seccion);
        });

        setSecciones(unique);
        setSeccionId(""); setEstudiantes([]); setEstudianteId("");
      } catch { showToast.error("Error cargando secciones"); }
      finally { setIsLoadingFiltros(false); }
    };
    load();
  }, [periodoId]);

  // ── Load students when section changes ────────────────────────────────────
  useEffect(() => {
    if (!seccionId) { setEstudiantes([]); setEstudianteId(""); return; }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const sec = secciones.find(s => s.id === seccionId);
        const ids: string[] = sec?.estudiantes_ids ?? [];

        if (ids.length === 0) { setEstudiantes([]); setEstudianteId(""); return; }

        const estudiantesData: Estudiante[] = [];
        const chunkSize = 30;
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          const snap = await getDocs(query(collection(db, "estudiantes"), where("__name__", "in", chunk)));
          snap.docs.forEach(d => {
            estudiantesData.push({ id: d.id, ...d.data() } as Estudiante);
          });
        }

        estudiantesData.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
        
        // Add TODOS option
        const todosFallback: Estudiante = {
          id: "TODOS",
          nombres: "Todos los estudiantes",
          apellidos: "",
          tipo_cedula: "",
          cedula: 0
        };
        
        setEstudiantes([todosFallback, ...estudiantesData]);
        setEstudianteId("TODOS");
        setBoletinReady(false);
        setMateriasConNota([]);
      } catch { showToast.error("Error cargando estudiantes"); }
      finally { setIsLoadingFiltros(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionId]);

  // Reset boletin when student changes
  useEffect(() => {
    if (boletinReady && bulkData.length > 0) {
      if (estudianteId === "TODOS") {
        // Keep it ready for bulk
        return;
      }
      const studentData = bulkData.find(b => b.estudianteObj.id === estudianteId);
      if (studentData) {
        setMateriasConNota(studentData.materiasConNota);
        setPromedioGeneral(studentData.promedioGeneral);
        setBoletinReady(true);
        return;
      }
    }
    setBoletinReady(false);
    setMateriasConNota([]);
  }, [estudianteId, bulkData]);

  // ── Build boletin ─────────────────────────────────────────────────────────
  const buildBoletin = async () => {
    if (!periodoId || !seccionId || !estudianteId) return;
    setIsLoadingBoletin(true);
    setBoletinReady(false);
    setMateriasConNota([]);

    try {
      const mainSeccion = secciones.find(s => s.id === seccionId);

      // All section IDs that match this section (handle duplicates)
      const validSectionIds = mainSeccion
        ? secciones.filter(s =>
            s.grado_año === mainSeccion.grado_año &&
            s.seccion === mainSeccion.seccion &&
            s.nivel_educativo === mainSeccion.nivel_educativo
          ).map(s => s.id)
        : [seccionId];

      // 1. Get ALL lapsos for this period so we can map lapso_id -> lapso string (LAPSO 1, LAPSO 2, LAPSO 3)
      const lapsosDelPeriodo = lapsos; // Already loaded from useEffect for this periodo

      // 2. Get EVALUADA evaluations for this period
      const evSnap = await getDocs(query(
        collection(db, "evaluaciones"),
        where("periodo_escolar_id", "==", periodoId)
      ));
      const evaluaciones: Evaluacion[] = evSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Evaluacion))
        .filter(e => e.status === "EVALUADA" && e.seccion_id && validSectionIds.includes(e.seccion_id!));

      // 3. Build materia map
      let mappedNivel = "";
      if (mainSeccion) {
        if (mainSeccion.nivel_educativo === "Año" || mainSeccion.nivel_educativo === "media_general") mappedNivel = "media_general";
        else if (mainSeccion.nivel_educativo === "Grado" || mainSeccion.nivel_educativo === "primaria") mappedNivel = "primaria";
      }

      const materiasMap: Record<string, Materia> = {};

      if (mappedNivel && mainSeccion?.grado_año) {
        const matSnap = await getDocs(query(collection(db, "materias"), where("nivel_educativo", "==", mappedNivel)));
        matSnap.docs.forEach(doc => {
          const mData = doc.data();
          if ((mData.grados_años || []).includes(mainSeccion.grado_año)) {
            materiasMap[doc.id] = { id: doc.id, nombre: mData.nombre as string };
          }
        });
      }

      // Also fetch any materia from evaluations not in materiasMap
      const missingIds = [...new Set(evaluaciones.map(e => e.materia_id).filter(Boolean) as string[])].filter(id => !materiasMap[id]);
      await Promise.all(missingIds.map(async (mid) => {
        const s = await getDocs(query(collection(db, "materias"), where("__name__", "==", mid)));
        if (!s.empty) {
          materiasMap[mid] = { id: mid, nombre: s.docs[0].data().nombre as string };
        }
      }));

      const materiasOrdenadas = Object.values(materiasMap).sort((a, b) => a.nombre.localeCompare(b.nombre));

      // 4. Get notas for all students in section
      const evalIds = evaluaciones.map(e => e.id);
      const notasMap: Record<string, Record<string, number>> = {}; // estudianteId -> evalId -> nota

      const chunkSize = 30;
      for (let i = 0; i < evalIds.length; i += chunkSize) {
        const chunk = evalIds.slice(i, i + chunkSize);
        const nSnap = await getDocs(query(
          collection(db, "notas_evaluaciones"),
          where("evaluacion_id", "in", chunk)
        ));
        nSnap.docs.forEach(d => {
          const data = d.data() as NotaEval;
          if (!notasMap[data.estudiante_id]) notasMap[data.estudiante_id] = {};
          notasMap[data.estudiante_id][data.evaluacion_id] = data.nota_definitiva ?? 0;
        });
      }

      // 5. Build materia → lapso -> evals map (Global for period)
      const materiaLapsoEvals: Record<string, Record<string, string[]>> = {};
      evaluaciones.forEach(ev => {
        if (!ev.materia_id) return;
        const lapsoObj = lapsosDelPeriodo.find(l => l.id === ev.lapsop_id);
        const lapsoName = lapsoObj ? lapsoObj.lapso.toUpperCase() : "";
        if (!materiaLapsoEvals[ev.materia_id]) materiaLapsoEvals[ev.materia_id] = { "LAPSO 1": [], "LAPSO 2": [], "LAPSO 3": [] };
        if (lapsoName.includes("1")) materiaLapsoEvals[ev.materia_id]["LAPSO 1"].push(ev.id);
        else if (lapsoName.includes("2")) materiaLapsoEvals[ev.materia_id]["LAPSO 2"].push(ev.id);
        else if (lapsoName.includes("3")) materiaLapsoEvals[ev.materia_id]["LAPSO 3"].push(ev.id);
      });

      // 6. Compute nota per materia for EACH student
      const allBulkData: { 
        estudianteObj: Estudiante, 
        materiasConNota: MateriaConNota[], 
        promedioGeneral: number,
        representanteObj?: { nombres: string, apellidos: string, cedula: string } 
      }[] = [];
      const studentsToProcess = estudiantes.filter(e => e.id !== "TODOS");

      // 6.1 Fetch representatives for these students
      const repMap: Record<string, { nombres: string, apellidos: string, cedula: string }> = {};
      const studentIds = studentsToProcess.map(e => e.id);
      for (let i = 0; i < studentIds.length; i += 10) {
        const chunk = studentIds.slice(i, i + 10);
        const rSnap = await getDocs(query(collection(db, "representantes"), where("estudiantes_ids", "array-contains-any", chunk)));
        rSnap.docs.forEach(doc => {
          const rData = doc.data();
          chunk.forEach(sId => {
            if ((rData.estudiantes_ids || []).includes(sId)) {
              repMap[sId] = { nombres: rData.nombres || "", apellidos: rData.apellidos || "", cedula: rData.cedula || "" };
            }
          });
        });
      }

      for (const est of studentsToProcess) {
        const studentNotas = notasMap[est.id] || {};

        const result: MateriaConNota[] = materiasOrdenadas.map(mat => {
          const lapsoGroups = materiaLapsoEvals[mat.id] ?? { "LAPSO 1": [], "LAPSO 2": [], "LAPSO 3": [] };
          
          const computeLapsoAvg = (evals: string[]) => {
            if (evals.length === 0) return null;
            let total = 0; let count = 0;
            evals.forEach(eid => {
              const nota = studentNotas[eid];
              if (nota !== undefined) { total += nota; count++; }
            });
            return count > 0 ? parseFloat((total / count).toFixed(2)) : null;
          };

          const l1 = computeLapsoAvg(lapsoGroups["LAPSO 1"]);
          const l2 = computeLapsoAvg(lapsoGroups["LAPSO 2"]);
          const l3 = computeLapsoAvg(lapsoGroups["LAPSO 3"]);

          const validLapsos = [l1, l2, l3].filter((n): n is number => n !== null);
          const prom = validLapsos.length > 0 
            ? parseFloat((validLapsos.reduce((a, b) => a + b, 0) / validLapsos.length).toFixed(2)) 
            : null;

          return { ...mat, lapso1: l1, lapso2: l2, lapso3: l3, promedio: prom };
        });

        const notasValidas = result.map(m => m.promedio).filter((n): n is number => n !== null);
        const promTotal = notasValidas.length > 0
          ? parseFloat((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2))
          : 0;

        allBulkData.push({
          estudianteObj: est,
          materiasConNota: result,
          promedioGeneral: promTotal,
          representanteObj: repMap[est.id]
        });
      }

      setBulkData(allBulkData);

      setBulkData(allBulkData);

      // 7. If a single student is selected, show their preview immediately
      if (estudianteId !== "TODOS") {
        const myData = allBulkData.find(b => b.estudianteObj.id === estudianteId);
        if (myData) {
          setMateriasConNota(myData.materiasConNota);
          setPromedioGeneral(myData.promedioGeneral);
        }
        setBoletinReady(true);
      } else {
        // Automatically generate PDF for all students
        if (allBulkData.length === 0) {
          showToast.error("No hay estudiantes para generar");
          setIsLoadingBoletin(false);
          return;
        }

        const formatNivel = (n?: string) => {
          if (!n) return "";
          if (n === "Año" || n === "media_general") return "Media General";
          if (n === "Grado" || n === "primaria") return "Primaria";
          return n;
        };

        const argsToPDF = allBulkData.map(data => ({
          estudianteNombre: `${data.estudianteObj.apellidos}, ${data.estudianteObj.nombres}`,
          estudianteCedula: `${data.estudianteObj.tipo_cedula}-${data.estudianteObj.cedula}`,
          seccionNombre: mainSeccion ? `${mainSeccion.grado_año} "${mainSeccion.seccion}"` : "",
          gradoAño: mainSeccion?.grado_año ?? "",
          nivelEducativo: formatNivel(mainSeccion?.nivel_educativo),
          periodoNombre: periodoObj?.nombre ?? "",
          representanteNombre: data.representanteObj ? `${data.representanteObj.nombres} ${data.representanteObj.apellidos}` : "",
          representanteCedula: data.representanteObj ? data.representanteObj.cedula : "",
          materias: data.materiasConNota,
          promedioGeneral: data.promedioGeneral,
        }));
        
        await generarBoletinPDF(argsToPDF);
      }

    } catch (err) {
      console.error(err);
      showToast.error("Error generando el boletín");
    } finally {
      setIsLoadingBoletin(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!boletinReady || !periodoObj || !seccionObj || !estudianteObj) return;
    setIsGeneratingPDF(true);
    try {
      const formatNivel = (n?: string) => {
        if (!n) return "";
        if (n === "Año" || n === "media_general") return "Media General";
        if (n === "Grado" || n === "primaria") return "Primaria";
        return n;
      };
      
      const currentBulkData = bulkData.find(b => b.estudianteObj.id === estudianteObj.id);

      const argsToPDF = {
        estudianteNombre: `${estudianteObj.apellidos}, ${estudianteObj.nombres}`,
        estudianteCedula: `${estudianteObj.tipo_cedula}-${estudianteObj.cedula}`,
        seccionNombre: `${seccionObj.grado_año} "${seccionObj.seccion}"`,
        gradoAño: seccionObj.grado_año,
        nivelEducativo: formatNivel(seccionObj.nivel_educativo),
        periodoNombre: periodoObj.nombre,
        representanteNombre: currentBulkData?.representanteObj ? `${currentBulkData.representanteObj.nombres} ${currentBulkData.representanteObj.apellidos}` : "",
        representanteCedula: currentBulkData?.representanteObj ? currentBulkData.representanteObj.cedula : "",
        materias: materiasConNota,
        promedioGeneral: promedioGeneral,
      };
      
      await generarBoletinPDF([argsToPDF]);
    } catch (e) {
      console.error(e);
      showToast.error("Error generando el PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Boletines de Calificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera el boletín individual de un estudiante
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecciona el periodo, lapso, sección y estudiante para generar el boletín</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Periodo */}
            <div className="space-y-2">
              <Label>Periodo Escolar</Label>
              <Select value={periodoId} onValueChange={setPeriodoId} disabled={isLoadingFiltros}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.status === "ACTIVO" ? "(Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            {/* Sección */}
            <div className="space-y-2">
              <Label>Sección</Label>
              <Popover open={openSeccion} onOpenChange={setOpenSeccion}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                    disabled={!periodoId || isLoadingFiltros}
                  >
                    <span className="truncate">{seccionLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar sección..." />
                    <CommandList>
                      <CommandEmpty>No hay secciones.</CommandEmpty>
                      <CommandGroup>
                        {secciones.map(s => {
                          const nivel = formatNivel(s.nivel_educativo);
                          return (
                            <CommandItem
                              key={s.id}
                              value={`${s.grado_año} ${s.seccion} ${nivel}`}
                              onSelect={() => { setSeccionId(s.id ?? ""); setOpenSeccion(false); }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${s.id === seccionId ? "opacity-100" : "opacity-0"}`} />
                              {s.grado_año} &quot;{s.seccion}&quot; - {nivel}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Estudiante */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Estudiante</Label>
              <Popover open={openEstudiante} onOpenChange={setOpenEstudiante}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                    disabled={!seccionId || isLoadingFiltros || estudiantes.length === 0}
                  >
                    <span className="truncate flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      {estudianteLabel}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre o cédula..." />
                    <CommandList>
                      <CommandEmpty>No hay estudiantes en esta sección.</CommandEmpty>
                      <CommandGroup>
                        {estudiantes.map(est => (
                          <CommandItem
                            key={est.id}
                            value={`${est.apellidos} ${est.nombres} ${est.cedula}`}
                            onSelect={() => { setEstudianteId(est.id); setOpenEstudiante(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${est.id === estudianteId ? "opacity-100" : "opacity-0"}`} />
                            <span className="flex-1">{est.apellidos}, {est.nombres}</span>
                            <span className="text-xs text-muted-foreground ml-2">{est.tipo_cedula}-{est.cedula}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate button */}
            <div className="flex items-end">
              <Button
                onClick={buildBoletin}
                disabled={!periodoId || !seccionId || !estudianteId || isLoadingBoletin}
                className="w-full"
              >
                {isLoadingBoletin
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
                  : <><RefreshCw className="h-4 w-4 mr-2" /> Generar Boletín</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Single Boletín Preview */}
      {boletinReady && estudianteObj && estudianteObj.id !== "TODOS" && periodoObj && seccionObj && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-primary/5 rounded-t-lg">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Boletín — {estudianteObj.apellidos}, {estudianteObj.nombres}
              </CardTitle>
              <CardDescription>
                {seccionObj.grado_año} &quot;{seccionObj.seccion}&quot; · {formatNivel(seccionObj.nivel_educativo)} · {periodoObj.nombre}
              </CardDescription>
            </div>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="shrink-0"
            >
              {isGeneratingPDF
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando PDF...</>
                : <><FileText className="h-4 w-4 mr-2" /> Exportar PDF</>}
            </Button>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Student info strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Estudiante</p>
                <p className="font-semibold text-sm mt-0.5">{estudianteObj.apellidos}, {estudianteObj.nombres}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cédula</p>
                <p className="font-semibold text-sm mt-0.5">{estudianteObj.tipo_cedula}-{estudianteObj.cedula}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sección</p>
                <p className="font-semibold text-sm mt-0.5">{seccionObj.grado_año} &quot;{seccionObj.seccion}&quot;</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nivel</p>
                <p className="font-semibold text-sm mt-0.5">{formatNivel(seccionObj.nivel_educativo)}</p>
              </div>
            </div>

            {/* Grades table */}
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-4 py-3 text-left font-semibold">Materia</th>
                    <th className="px-4 py-3 text-center font-semibold w-24">Lapso 1</th>
                    <th className="px-4 py-3 text-center font-semibold w-24">Lapso 2</th>
                    <th className="px-4 py-3 text-center font-semibold w-24">Lapso 3</th>
                    <th className="px-4 py-3 text-center font-semibold w-28">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {materiasConNota.map((mat, idx) => {
                    const l1 = mat.lapso1;
                    const l2 = mat.lapso2;
                    const l3 = mat.lapso3;
                    const prom = mat.promedio;
                    
                    const getNotaCol = (n: number | null) => {
                      if (n === null) return { color: "text-muted-foreground", text: "–" };
                      const color = n >= 15 ? "text-green-700 font-bold" :
                                    n >= 10 ? "text-blue-700 font-semibold" :
                                    "text-red-600 font-bold";
                      return { color, text: n.toFixed(2) };
                    };

                    const nL1 = getNotaCol(l1);
                    const nL2 = getNotaCol(l2);
                    const nL3 = getNotaCol(l3);
                    const nP = getNotaCol(prom);

                    return (
                      <tr
                        key={mat.id}
                        className={`border-b transition-colors ${idx % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-3 font-medium">{mat.nombre}</td>
                        <td className={`px-4 py-3 text-center text-sm ${nL1.color}`}>
                          {nL1.text}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${nL2.color}`}>
                          {nL2.text}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${nL3.color}`}>
                          {nL3.text}
                        </td>
                        <td className={`px-4 py-3 text-center text-base ${nP.color}`}>
                          {nP.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Charts — Resumen de Calificaciones */}
            {materiasConNota.some(m => m.promedio !== null) && (() => {
              const chartData = materiasConNota
                .filter(m => m.promedio !== null)
                .map(m => ({
                  subject: m.nombre.split(" ").filter(w => w.length > 0 && !["de","del","la","el","y","e","a","en","los","las","un","una"].includes(w.toLowerCase())).map(w => w[0].toUpperCase()).join(""),
                  nombre: m.nombre,
                  average: m.promedio as number,
                }));

              const areaChartConfig = {
                average: { label: "Calificación", color: "hsl(var(--chart-1))" },
              } satisfies ChartConfig;

              return (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Area Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Tendencia de Calificaciones</CardTitle>
                      <CardDescription className="text-xs">Visualización por materia — máx. 20 pts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={areaChartConfig}>
                        <AreaChart
                          accessibilityLayer
                          data={chartData}
                          margin={{ left: 8, right: 8, top: 4, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="subject"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis domain={[0, 20]} hide />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                formatter={(value, _name, item) => (
                                  <span className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">{item.payload.nombre}</span>
                                    <span className="font-bold">{Number(value).toFixed(2)}</span>
                                  </span>
                                )}
                              />
                            }
                          />
                          <defs>
                            <linearGradient id="fillBoletinAvg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-average)" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="var(--color-average)" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <Area
                            dataKey="average"
                            type="natural"
                            fill="url(#fillBoletinAvg)"
                            fillOpacity={0.4}
                            stroke="var(--color-average)"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "var(--color-average)" }}
                            activeDot={{ r: 5 }}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                    <div className="px-6 pb-4">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        Tendencia de notas <TrendingUp className="h-3 w-3" />
                      </div>
                    </div>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Calificaciones por Materia</CardTitle>
                      <CardDescription className="text-xs">Barras coloreadas por nivel de logro</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={areaChartConfig}>
                        <BarChart
                          accessibilityLayer
                          data={chartData}
                          margin={{ left: 8, right: 8, top: 4, bottom: 0 }}
                          barCategoryGap="30%"
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="subject"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis domain={[0, 20]} hide />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                formatter={(value, _name, item) => (
                                  <span className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">{item.payload.nombre}</span>
                                    <span className="font-bold">{Number(value).toFixed(2)}</span>
                                  </span>
                                )}
                              />
                            }
                          />
                          <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.average >= 15 ? "hsl(142 71% 45%)" :
                                  entry.average >= 10 ? "hsl(217 91% 60%)" :
                                  "hsl(0 84% 60%)"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                    <div className="px-6 pb-4 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> &gt;= 15</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> 10–14</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> &lt; 10</span>
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* Promedio General */}
            {materiasConNota.length > 0 && (
              <>
                {/* Promedio General — Premium card */}
                {(() => {
                  const aprobadas = materiasConNota.filter(m => m.promedio !== null && m.promedio >= 10).length;
                const aplazadas = materiasConNota.filter(m => m.promedio !== null && m.promedio < 10).length;
                const sinNota   = materiasConNota.filter(m => m.promedio === null).length;
                const pct = Math.round((promedioGeneral / 20) * 100);

                const gradFrom =
                  promedioGeneral >= 15 ? "from-green-500"  :
                  promedioGeneral >= 10 ? "from-blue-500"   :
                  "from-red-500";
                const gradTo =
                  promedioGeneral >= 15 ? "to-emerald-400"  :
                  promedioGeneral >= 10 ? "to-indigo-400"   :
                  "to-rose-400";
                const accentColor =
                  promedioGeneral >= 15 ? "hsl(142 71% 45%)" :
                  promedioGeneral >= 10 ? "hsl(217 91% 60%)" :
                  "hsl(0 84% 60%)";
                const badgeCls =
                  promedioGeneral >= 10
                    ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-400/30"
                    : "bg-red-500/20 text-red-700 dark:text-red-400 border-red-400/30";

                const radialData = [{ value: pct, fill: accentColor }];
                const radialConfig = { value: { label: "Promedio" } } satisfies ChartConfig;

                return (
                  <div className={`mt-6 rounded-2xl bg-gradient-to-br ${gradFrom} ${gradTo} p-[2px] shadow-lg`}>
                    <div className="rounded-2xl bg-card dark:bg-card/90 p-5">
                      <div className="flex flex-col sm:flex-row items-center gap-6">

                        {/* Radial gauge */}
                        <div className="relative shrink-0">
                          <ChartContainer config={radialConfig} className="w-40 h-40">
                            <RadialBarChart
                              data={radialData}
                              startAngle={90}
                              endAngle={90 - 360 * (pct / 100)}
                              innerRadius={52}
                              outerRadius={72}
                            >
                              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false} />
                              <RadialBar
                                dataKey="value"
                                background={{ fill: "hsl(var(--muted))" }}
                                cornerRadius={8}
                                fill={accentColor}
                              />
                              <RechartsLabel
                                content={({ viewBox }) => {
                                  if (!viewBox || !("cx" in viewBox)) return null;
                                  const { cx, cy } = viewBox as { cx: number; cy: number };
                                  return (
                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                      <tspan x={cx} y={cy - 6} fontSize="22" fontWeight="bold" fill={accentColor}>
                                        {promedioGeneral.toFixed(1)}
                                      </tspan>
                                      <tspan x={cx} y={cy + 14} fontSize="10" fill="gray">
                                        / 20 pts
                                      </tspan>
                                    </text>
                                  );
                                }}
                              />
                            </RadialBarChart>
                          </ChartContainer>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 flex flex-col gap-3 w-full">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Promedio General</p>
                              <p className="text-4xl font-extrabold tracking-tight mt-0.5" style={{ color: accentColor }}>
                                {promedioGeneral.toFixed(2)}
                              </p>
                            </div>
                            <span className={`self-start px-3 py-1 rounded-full text-xs font-bold border ${badgeCls}`}>
                              {promedioGeneral >= 10 ? "✓ APROBADO" : "✗ APLAZADO"}
                            </span>
                          </div>

                          {/* Stat chips */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-center">
                              <p className="text-2xl font-extrabold text-green-700 dark:text-green-400">{aprobadas}</p>
                              <p className="text-[10px] text-green-600 dark:text-green-500 font-medium leading-tight mt-0.5">Aprobadas</p>
                            </div>
                            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-center">
                              <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{aplazadas}</p>
                              <p className="text-[10px] text-red-500 font-medium leading-tight mt-0.5">Aplazadas</p>
                            </div>
                            <div className="rounded-xl bg-muted/60 border border-muted p-3 text-center">
                              <p className="text-2xl font-extrabold text-muted-foreground">{sinNota}</p>
                              <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">Sin nota</p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>0</span><span>Rendimiento ({pct}%)</span><span>20</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: accentColor }}
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}
              </>
            )}

            {/* Empty state */}
            {materiasConNota.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto opacity-30 mb-3" />
                <p>No hay materias con calificaciones registradas para este estudiante en este lapso.</p>
              </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> ≥ 15 — Excelente</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> 10–14 — Aprobado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> &lt; 10 — Aplazado</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoadingBoletin && (
        <Card>
          <CardContent className="flex justify-center items-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando calificaciones...</span>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoadingBoletin && !boletinReady && estudianteId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-30" />
            <p className="font-medium">Haz clic en <strong>Generar Boletín</strong> para ver las calificaciones del estudiante.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
