"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Secciones } from "@/interfaces/secciones.interface";
import { db } from "@/lib/data/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { Check, ChevronLeft, ChevronsUpDown, FileText, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Periodo { id: string; nombre: string; status: string; }
interface Lapso   { id: string; lapso: string; status: string; }
interface Materia { id: string; nombre: string; abreviatura: string; }

interface Evaluacion {
  id: string;
  materia_id?: string;
  lapsop_id: string;
  seccion_id?: string;
  periodo_escolar_id: string;
  status: string;
  nota_definitiva?: number;
}

interface NotaEval {
  evaluacion_id: string;
  estudiante_id: string;
  nota_definitiva: number;
}

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_cedula: string;
  cedula: number;
}

// For each student: map materia_id → nota
interface FilaEstudiante {
  estudiante: Estudiante;
  notas: Record<string, number | null>; // materia_id → nota or null
  promedio: number;
  aprobadas: number;
  aplazadas: number;
  posicion?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SabanaNotasPage() {
  // Filters
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [lapsos, setLapsos]       = useState<Lapso[]>([]);
  const [lapsoId, setLapsoId]     = useState("");
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [seccionId, setSeccionId] = useState("");
  const [openSeccion, setOpenSeccion] = useState(false);

  // Loading
  const [isLoadingFiltros, setIsLoadingFiltros] = useState(false);
  const [isLoadingSabana,  setIsLoadingSabana]  = useState(false);

  // Sábana data
  const [materias,   setMaterias]   = useState<Materia[]>([]);
  const [filas,      setFilas]      = useState<FilaEstudiante[]>([]);
  const [seccionNombre, setSeccionNombre] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);
  
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [pendingEvData, setPendingEvData] = useState<{ validSectionIds: string[]; mainSeccion: Secciones | undefined } | null>(null);

  // ── Load periodos ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(query(collection(db, "periodos_escolares"), orderBy("periodo", "desc")));
        setPeriodos(snap.docs.map(d => ({ id: d.id, nombre: d.data().periodo, status: d.data().status })));
      } catch { showToast.error("Error cargando periodos"); }
      finally   { setIsLoadingFiltros(false); }
    };
    load();
  }, []);

  // ── Load lapsos when periodo changes ────────────────────────────────────────
  useEffect(() => {
    if (!periodoId) { setLapsos([]); setLapsoId(""); setSecciones([]); setSeccionId(""); return; }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(query(
          collection(db, "lapsos"),
          where("año_escolar", "==", periodoId)
        ));
        const lapsosData = snap.docs.map(d => ({ id: d.id, lapso: d.data().lapso, status: d.data().status }));
        lapsosData.sort((a, b) => a.lapso.localeCompare(b.lapso));
        setLapsos(lapsosData);
        setLapsoId(""); setSecciones([]); setSeccionId("");
      } catch (e) {
        console.error("Error load lapsos:", e);
        showToast.error("Error cargando lapsos");
      } finally {
        setIsLoadingFiltros(false);
      }
    };
    load();
  }, [periodoId]);

  // ── Load secciones when lapso changes ────────────────────────────────────────
  useEffect(() => {
    if (!periodoId || !lapsoId) { setSecciones([]); setSeccionId(""); return; }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(query(
          collection(db, "secciones"),
          where("id_periodo_escolar", "==", periodoId)
        ));
        const seccionesData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Secciones));
        
        // Agrupar secciones por nivel, grado y letra para eliminar duplicados reales en la UI.
        // Si hay duplicados (varias "1 A" de Primaria), nos quedamos con la que tenga ALUMNOS INSCRITOS.
        const agruparSeccionesMap = new Map<string, Secciones>();

        for (const s of seccionesData) {
          const key = `${s.grado_año}-${s.seccion}-${s.nivel_educativo}`;
          const existente = agruparSeccionesMap.get(key);
          
          if (!existente) {
            agruparSeccionesMap.set(key, s);
          } else {
            const estNuevo = s.estudiantes_ids?.length || 0;
            const estExistente = existente.estudiantes_ids?.length || 0;
            
            if (estNuevo > estExistente) {
              agruparSeccionesMap.set(key, s);
            } else if (estNuevo === estExistente) {
              const timeNuevo = s.createdAt?.toMillis?.() || 0;
              const timeExistente = existente.createdAt?.toMillis?.() || 0;
              if (timeNuevo > timeExistente) {
                agruparSeccionesMap.set(key, s);
              }
            }
          }
        }
        
        const uniqueSecciones = Array.from(agruparSeccionesMap.values());
        
        uniqueSecciones.sort((a, b) => {
          if (a.nivel_educativo !== b.nivel_educativo) return a.nivel_educativo.localeCompare(b.nivel_educativo);
          if (a.grado_año !== b.grado_año) return a.grado_año.localeCompare(b.grado_año);
          return a.seccion.localeCompare(b.seccion);
        });

        setSecciones(uniqueSecciones);
        setSeccionId("");
      } catch { showToast.error("Error cargando secciones"); }
      finally   { setIsLoadingFiltros(false); }
    };
    load();
  }, [periodoId, lapsoId]);

  // ── Build sábana ───────────────────────────────────────────────────────────
  const buildSabana = async () => {
    if (!periodoId || !lapsoId || !seccionId) return;
    setIsLoadingSabana(true);
    setFilas([]); setMaterias([]);
    try {
      // Find the main section we selected
      const mainSeccion = secciones.find(s => s.id === seccionId);
      
      const formatNivel = (n?: string) => {
        if (!n) return "";
        if (n === "Año" || n === "media_general") return "Media General";
        if (n === "Grado" || n === "primaria") return "Primaria";
        return n;
      };
      setSeccionNombre(mainSeccion ? `${mainSeccion.grado_año} "${mainSeccion.seccion}" - ${formatNivel(mainSeccion.nivel_educativo)}` : "");

      // Compile ALL duplicate section IDs that share this exact name and level
      // so if a teacher uploaded an evaluation to a duplicate, we still find the grades.
      const validSectionIds = mainSeccion 
        ? secciones.filter(s => 
            s.grado_año === mainSeccion.grado_año && 
            s.seccion === mainSeccion.seccion && 
            s.nivel_educativo === mainSeccion.nivel_educativo
          ).map(s => s.id)
        : [seccionId];

      // 1. Get ALL evaluations for this period
      const evSnap = await getDocs(query(
        collection(db, "evaluaciones"),
        where("periodo_escolar_id", "==", periodoId)
      ));
      
      const allEvaluaciones = evSnap.docs.map(d => ({ id: d.id, ...d.data() } as Evaluacion));
      const evaluacionesLapso = allEvaluaciones.filter(e => e.lapsop_id === lapsoId && e.status === "EVALUADA");
      
      console.log("=== DEBUG SABANA ===");
      console.log("Selected Section ID:", seccionId);
      console.log(`Found ${evaluacionesLapso.length} total EVALUADA evaluations for the lapso.`);
      
      // Map section IDs to see where the evaluations actually are
      const seccionCounts = new Map<string, number>();
      evaluacionesLapso.forEach(e => {
        const sid = e.seccion_id || "null";
        seccionCounts.set(sid, (seccionCounts.get(sid) || 0) + 1);
      });
      console.log("Evaluaciones por Seccion ID en este Lapso:", Object.fromEntries(seccionCounts));

      const evaluaciones = evaluacionesLapso.filter(e => e.seccion_id && validSectionIds.includes(e.seccion_id));

      if (evaluaciones.length === 0) {
        const strictValidIds = validSectionIds.filter(Boolean) as string[];
        setPendingEvData({ validSectionIds: strictValidIds, mainSeccion });
        setShowEmptyConfirm(true);
        setIsLoadingSabana(false);
        return;
      }

      const strictValidIds = validSectionIds.filter(Boolean) as string[];
      await processSabana(strictValidIds, evaluaciones, mainSeccion);
    } catch { showToast.error("Error generando la sábana"); setIsLoadingSabana(false); }
  };

  const processSabana = async (validSectionIds: string[], evaluaciones: Evaluacion[], mainSeccion: Secciones | undefined) => {
    setIsLoadingSabana(true);
    try {
      // 2. Determine mapped level for querying materias
      let mappedNivel = "";
      if (mainSeccion) {
        if (mainSeccion.nivel_educativo === "Año" || mainSeccion.nivel_educativo === "media_general") mappedNivel = "media_general";
        else if (mainSeccion.nivel_educativo === "Grado" || mainSeccion.nivel_educativo === "primaria") mappedNivel = "primaria";
      }

      // Base: materiaIds attached to evaluations (in case there are some that don't match the standard query)
      const materiaIdsFromEvaluations = [...new Set(evaluaciones.map(e => e.materia_id).filter(Boolean) as string[])];

      const materiasMap: Record<string, Materia> = {};

      // 3. Query all materias assigned to this section's level
      if (mappedNivel && mainSeccion?.grado_año) {
        const matSnap = await getDocs(query(
          collection(db, "materias"),
          where("nivel_educativo", "==", mappedNivel)
        ));
        
        matSnap.docs.forEach(doc => {
          const mData = doc.data();
          const gradosAños = mData.grados_años || [];
          if (gradosAños.includes(mainSeccion.grado_año)) {
            const nombre = mData.nombre as string;
            const abrev = nombre
              .split(" ")
              .map(w => w.substring(0, 2).toUpperCase())
              .join("")
              .substring(0, 4);
            materiasMap[doc.id] = { id: doc.id, nombre, abreviatura: abrev };
          }
        });
      }

      // 4. Also fetch names for any materia from an evaluation that wasn't caught by the query above
      const missingMateriaIds = materiaIdsFromEvaluations.filter(id => !materiasMap[id]);
      await Promise.all(missingMateriaIds.map(async (mid) => {
        const snap = await getDocs(query(collection(db, "materias"), where("__name__", "==", mid)));
        if (!snap.empty) {
          const d = snap.docs[0];
          const nombre = d.data().nombre as string;
          const abrev = nombre
            .split(" ")
            .map(w => w.substring(0, 2).toUpperCase())
            .join("")
            .substring(0, 4);
          materiasMap[mid] = { id: mid, nombre, abreviatura: abrev };
        } else {
          materiasMap[mid] = { id: mid, nombre: mid, abreviatura: mid.substring(0, 4).toUpperCase() };
        }
      }));

      // Sort materias alphabetically
      const materiasOrdenadas = Object.values(materiasMap).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setMaterias(materiasOrdenadas);

      // 3. Load all notas for these evaluations
      const evalIds = evaluaciones.map(e => e.id);
      // Firestore "in" max 30 items — chunk if needed
      const allNotas: NotaEval[] = [];
      const chunkSize = 30;
      for (let i = 0; i < evalIds.length; i += chunkSize) {
        const chunk = evalIds.slice(i, i + chunkSize);
        const notasSnap = await getDocs(query(
          collection(db, "notas_evaluaciones"),
          where("evaluacion_id", "in", chunk)
        ));
        notasSnap.docs.forEach(d => {
          const data = d.data();
          allNotas.push({
            evaluacion_id: data.evaluacion_id,
            estudiante_id: data.estudiante_id,
            nota_definitiva: data.nota_definitiva ?? 0,
          });
        });
      }

      // 4. Load student IDs from the section
      const estudiantesIds: string[] = mainSeccion?.estudiantes_ids ?? [];
      if (estudiantesIds.length === 0) {
        // fallback: get unique student IDs from the notas
        const fromNotas = [...new Set(allNotas.map(n => n.estudiante_id))];
        estudiantesIds.push(...fromNotas);
      }

      // 5. Load student documents
      const estudiantesMap: Record<string, Estudiante> = {};
      const estChunks: string[][] = [];
      for (let i = 0; i < estudiantesIds.length; i += 30) {
        estChunks.push(estudiantesIds.slice(i, i + 30));
      }
      await Promise.all(estChunks.map(async (chunk) => {
        const snap = await getDocs(query(collection(db, "estudiantes"), where("__name__", "in", chunk)));
        snap.docs.forEach(d => {
          estudiantesMap[d.id] = { id: d.id, ...d.data() } as Estudiante;
        });
      }));

      // 6. For each materia, pick the most recent EVALUADA evaluation
      //    (in case there are multiple evaluations per materia, take the one with highest nota_definitiva from its config
      //    or just use evaluacion where materia_id matches — aggregate by student)
      // Build map: materia_id → evaluacion_id[]
      const materiaEvalMap: Record<string, string[]> = {};
      evaluaciones.forEach(ev => {
        if (!ev.materia_id) return;
        if (!materiaEvalMap[ev.materia_id]) materiaEvalMap[ev.materia_id] = [];
        materiaEvalMap[ev.materia_id].push(ev.id);
      });

      // Build nota lookup: evaluacion_id + estudiante_id → nota
      const notaLookup: Record<string, number> = {};
      allNotas.forEach(n => {
        notaLookup[`${n.evaluacion_id}::${n.estudiante_id}`] = n.nota_definitiva;
      });

      // 7. Build rows
      const allEstIds = [...new Set([...estudiantesIds, ...allNotas.map(n => n.estudiante_id)])];
      const rows: FilaEstudiante[] = allEstIds
        .filter(id => estudiantesMap[id])
        .map(estId => {
          const est = estudiantesMap[estId];
          const notasPorMateria: Record<string, number | null> = {};

          materiasOrdenadas.forEach(mat => {
            const evals = materiaEvalMap[mat.id] ?? [];
            if (evals.length === 0) { notasPorMateria[mat.id] = null; return; }
            // Sum notes across all evaluations in this materia (for this student)
            let total = 0; let count = 0;
            evals.forEach(eid => {
              const nota = notaLookup[`${eid}::${estId}`];
              if (nota !== undefined) { total += nota; count++; }
            });
            notasPorMateria[mat.id] = count > 0 ? parseFloat((total / count).toFixed(2)) : null;
          });

          const notasValidas = Object.values(notasPorMateria).filter((n): n is number => n !== null);
          const promedio = notasValidas.length > 0
            ? parseFloat((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2))
            : 0;
          const aprobadas = notasValidas.filter(n => n >= 10).length;
          const aplazadas = notasValidas.filter(n => n < 10).length;

          return { estudiante: est, notas: notasPorMateria, promedio, aprobadas, aplazadas };
        });

      // 8. Sort by apellidos then assign position by promedio rank
      rows.sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos));
      const sorted = [...rows].sort((a, b) => b.promedio - a.promedio);
      sorted.forEach((row, i) => { row.posicion = i + 1; });

      setFilas(rows);
    } catch (err) {
      console.error(err);
      showToast.error("Error construyendo la sábana de notas.");
    } finally {
      setIsLoadingSabana(false);
    }
  };

  // ── Print handler ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const seccionObj = secciones.find(s => s.id === seccionId);
  const lapsoObj   = lapsos.find(l => l.id === lapsoId);
  const periodoObj = periodos.find(p => p.id === periodoId);

  return (
    <div className="p-6 space-y-6 print:p-2 print:space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 print:hidden">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Sábana de Notas</h1>
          <p className="text-muted-foreground mt-1">Resumen de calificaciones por sección</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecciona el periodo, lapso y sección para generar la sábana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Lapso */}
            <div className="space-y-2">
              <Label>Lapso</Label>
              <Select value={lapsoId} onValueChange={setLapsoId} disabled={!periodoId || isLoadingFiltros}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {lapsos.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.lapso} {l.status === "ACTIVO" ? "(Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sección — combobox */}
            <div className="space-y-2">
              <Label>Sección</Label>
              <Popover open={openSeccion} onOpenChange={setOpenSeccion}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                    disabled={!lapsoId || isLoadingFiltros}
                  >
                    <span className="truncate">
                      {seccionObj
                        ? `${seccionObj.grado_año} "${seccionObj.seccion}" - ${(seccionObj.nivel_educativo === "Año" || seccionObj.nivel_educativo === "media_general") ? "Media General" : "Primaria"}`
                        : "Selecciona sección..."}
                    </span>
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
                          const isMedia = s.nivel_educativo === "Año" || s.nivel_educativo === "media_general";
                          const nivelLabel = isMedia ? "Media General" : "Primaria";
                          return (
                            <CommandItem
                              key={s.id}
                              value={`${s.grado_año} ${s.seccion} ${nivelLabel}`}
                              onSelect={() => { setSeccionId(s.id ?? ""); setOpenSeccion(false); }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${s.id === seccionId ? "opacity-100" : "opacity-0"}`} />
                              {s.grado_año} &quot;{s.seccion}&quot; - {nivelLabel}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate button */}
            <div className="flex items-end">
              <Button
                onClick={buildSabana}
                disabled={!periodoId || !lapsoId || !seccionId || isLoadingSabana}
                className="w-full"
              >
                {isLoadingSabana
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
                  : <><RefreshCw className="h-4 w-4 mr-2" /> Generar Sábana</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sábana Table */}
      {filas.length > 0 && (
        <Card ref={tableRef}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">
                Sábana de Notas — {seccionNombre}
              </CardTitle>
              <CardDescription>
                {periodoObj?.nombre} · {lapsoObj?.lapso} · {filas.length} estudiante(s) · {materias.length} materia(s)
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handlePrint} className="print:hidden shrink-0">
              <FileText className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Row 1: fixed cols + materia names */}
                  <tr className="bg-muted/70 border-b">
                    <th className="px-2 py-2 text-left font-semibold border-r sticky left-0 bg-muted/70 min-w-[30px]">#</th>
                    <th className="px-2 py-2 text-left font-semibold border-r sticky left-8 bg-muted/70 min-w-[200px]">Apellidos y Nombres</th>
                    {materias.map(m => (
                      <th
                        key={m.id}
                        className="px-1 py-2 text-center font-semibold border-r min-w-[38px] max-w-[55px]"
                        title={m.nombre}
                      >
                        <span className="block truncate leading-tight">{m.abreviatura}</span>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center font-semibold border-r min-w-[45px] bg-blue-50 dark:bg-blue-950/30">Prom.</th>
                    <th className="px-2 py-2 text-center font-semibold border-r min-w-[38px]">Pos.</th>
                    <th className="px-2 py-2 text-center font-semibold border-r min-w-[38px] bg-green-50 dark:bg-green-950/20">Apr.</th>
                    <th className="px-2 py-2 text-center font-semibold min-w-[38px] bg-red-50 dark:bg-red-950/20">Apl.</th>
                  </tr>
                  {/* Row 2: materia full names as tooltip row */}
                  <tr className="bg-muted/30 border-b text-muted-foreground">
                    <td className="border-r" />
                    <td className="px-2 py-1 text-xs italic border-r">Materia →</td>
                    {materias.map(m => (
                      <td key={m.id} className="px-1 py-1 text-center border-r text-[10px] leading-tight" title={m.nombre}>
                        <span className="line-clamp-2">{m.nombre.split(" ")[0]}</span>
                      </td>
                    ))}
                    <td className="border-r" />
                    <td colSpan={3} />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, idx) => {
                    const promColor =
                      fila.promedio >= 15 ? "text-green-700 font-bold" :
                      fila.promedio >= 10 ? "text-blue-700 font-semibold" :
                      "text-red-600 font-bold";
                    return (
                      <tr
                        key={fila.estudiante.id}
                        className={`border-b transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-2 py-1.5 text-center text-muted-foreground border-r sticky left-0 bg-inherit">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1.5 font-medium border-r sticky left-8 bg-inherit whitespace-nowrap">
                          {fila.estudiante.apellidos}, {fila.estudiante.nombres}
                        </td>
                        {materias.map(m => {
                          const nota = fila.notas[m.id];
                          const color =
                            nota === null ? "text-muted-foreground" :
                            nota >= 15    ? "text-green-700" :
                            nota >= 10    ? "text-blue-700"  :
                            "text-red-600 font-semibold";
                          return (
                            <td key={m.id} className={`px-1 py-1.5 text-center border-r ${color}`}>
                              {nota !== null ? nota : "–"}
                            </td>
                          );
                        })}
                        <td className={`px-2 py-1.5 text-center border-r bg-blue-50/60 dark:bg-blue-950/20 ${promColor}`}>
                          {fila.promedio.toFixed(2)}
                        </td>
                        <td className="px-2 py-1.5 text-center border-r font-medium">
                          {fila.posicion}°
                        </td>
                        <td className="px-2 py-1.5 text-center border-r text-green-700 font-semibold bg-green-50/40 dark:bg-green-950/10">
                          {fila.aprobadas}
                        </td>
                        <td className="px-2 py-1.5 text-center text-red-600 bg-red-50/40 dark:bg-red-950/10">
                          {fila.aplazadas > 0 ? <span className="font-semibold">{fila.aplazadas}</span> : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer totals row */}
                <tfoot>
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="px-2 py-2 border-r" />
                    <td className="px-2 py-2 text-sm border-r">Promedio General</td>
                    {materias.map(m => {
                      const vals = filas
                        .map(f => f.notas[m.id])
                        .filter((n): n is number => n !== null);
                      const avg = vals.length > 0
                        ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
                        : "–";
                      return (
                        <td key={m.id} className="px-1 py-2 text-center border-r text-blue-700">
                          {avg}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center border-r text-blue-700 bg-blue-50/60">
                      {filas.length > 0
                        ? (filas.reduce((a, f) => a + f.promedio, 0) / filas.length).toFixed(2)
                        : "–"}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground print:hidden">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> ≥ 15 — Excelente</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> 10–14 — Aprobado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> &lt; 10 — Aplazado</span>
              <span className="ml-auto italic">Hover sobre abreviaturas para ver nombre completo de la materia</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoadingSabana && filas.length === 0 && seccionId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="font-medium">No hay datos disponibles</p>
            <p className="text-sm text-center max-w-sm">
              Haz clic en <strong>Generar Sábana</strong> para cargar los datos, o verifica que existan evaluaciones completadas para esta sección y lapso.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog for Empty Evaluations */}
      <AlertDialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sección Sin Calificaciones</AlertDialogTitle>
            <AlertDialogDescription>
              No hay evaluaciones completadas para esta sección en este lapso. Si continúas, la sábana se generará en blanco con la lista de los estudiantes sin calificaciones. ¿Deseas generarla de todos modos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEmptyConfirm(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowEmptyConfirm(false);
              if (pendingEvData) {
                processSabana(pendingEvData.validSectionIds, [], pendingEvData.mainSeccion);
              }
            }}>
              Sí, Generar Sábana
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
