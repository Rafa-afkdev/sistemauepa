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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SelectValue,
} from "@/components/ui/select";
import { Secciones } from "@/interfaces/secciones.interface";
import { db } from "@/lib/data/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Loader2,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Marker used to identify evaluaciones created by this tool so updates
 *  don't create duplicates and they can be distinguished from real evaluations */
const TIPO_CARGA_DIRECTA = "CARGA_DIRECTA";

/** Nota máxima en el sistema */
const NOTA_MAX = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Periodo {
  id: string;
  nombre: string;
  status: string;
}

interface Lapso {
  id: string;
  lapso: string;
  status: string;
}

interface Materia {
  id: string;
  nombre: string;
  abreviatura: string;
}

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_cedula: string;
  cedula: number;
}

/** Nota already saved in Firestore: { notaDocId, evaluacionId, valor } */
interface NotaGuardada {
  notaDocId: string;
  evaluacionId: string;
  valor: number;
}

/**
 * Cell value for the editable grid.
 * `inputValue`  – string bound to the <Input> (allows empty during editing)
 * `savedNota`   – Firestore reference, if this cell has been saved before
 */
interface CeldaNota {
  inputValue: string;
  savedNota: NotaGuardada | null;
}

/** Map: estudianteId → materiaId → cell */
type GridState = Record<string, Record<string, CeldaNota>>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clampNota(raw: string): number {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return 0;
  return Math.min(NOTA_MAX, Math.max(0, n));
}

/** Returns true if the string represents a valid, non-empty grade */
function isValidInput(v: string): boolean {
  const n = parseInt(v.trim(), 10);
  return v.trim() !== "" && !isNaN(n) && n >= 0 && n <= NOTA_MAX && String(n) === v.trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CargaDirectaPage() {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [lapsos, setLapsos] = useState<Lapso[]>([]);
  const [lapsoId, setLapsoId] = useState("");
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [seccionId, setSeccionId] = useState("");
  const [openSeccion, setOpenSeccion] = useState(false);

  // ── Loading flags ────────────────────────────────────────────────────────────
  const [isLoadingFiltros, setIsLoadingFiltros] = useState(false);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Grid data ────────────────────────────────────────────────────────────────
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [grid, setGrid] = useState<GridState>({});
  const [seccionNombre, setSeccionNombre] = useState("");

  // ── Confirm dialog ───────────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);

  // ── View mode ────────────────────────────────────────────────────────────────
  /** "todas" = full grid, "individual" = one materia at a time */
  const [vistaMode, setVistaMode] = useState<"todas" | "individual">("todas");
  const [materiaActivaId, setMateriaActivaId] = useState("");

  // Used to track the "all sections IDs" that correspond to the chosen visible section
  const validSectionIdsRef = useRef<string[]>([]);

  // ── Load periodos ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(
          query(collection(db, "periodos_escolares"), orderBy("periodo", "desc"))
        );
        setPeriodos(
          snap.docs.map((d) => ({
            id: d.id,
            nombre: d.data().periodo,
            status: d.data().status,
          }))
        );
      } catch {
        showToast.error("Error cargando periodos escolares");
      } finally {
        setIsLoadingFiltros(false);
      }
    };
    load();
  }, []);

  // ── Load lapsos when periodo changes ─────────────────────────────────────────
  useEffect(() => {
    if (!periodoId) {
      setLapsos([]);
      setLapsoId("");
      setSecciones([]);
      setSeccionId("");
      return;
    }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(
          query(collection(db, "lapsos"), where("año_escolar", "==", periodoId))
        );
        const data = snap.docs
          .map((d) => ({
            id: d.id,
            lapso: d.data().lapso,
            status: d.data().status,
          }))
          .sort((a, b) => a.lapso.localeCompare(b.lapso));
        setLapsos(data);
        setLapsoId("");
        setSecciones([]);
        setSeccionId("");
      } catch {
        showToast.error("Error cargando lapsos");
      } finally {
        setIsLoadingFiltros(false);
      }
    };
    load();
  }, [periodoId]);

  // ── Load secciones when lapso changes ────────────────────────────────────────
  useEffect(() => {
    if (!periodoId || !lapsoId) {
      setSecciones([]);
      setSeccionId("");
      return;
    }
    const load = async () => {
      setIsLoadingFiltros(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "secciones"),
            where("id_periodo_escolar", "==", periodoId)
          )
        );
        const rawSecciones = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Secciones)
        );

        // Deduplicate: keep section with most students per (grado, letra, nivel)
        const map = new Map<string, Secciones>();
        for (const s of rawSecciones) {
          const key = `${s.grado_año}-${s.seccion}-${s.nivel_educativo}`;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, s);
          } else {
            const newCount = s.estudiantes_ids?.length ?? 0;
            const exCount = existing.estudiantes_ids?.length ?? 0;
            if (newCount > exCount) map.set(key, s);
          }
        }

        const unique = Array.from(map.values()).sort((a, b) => {
          if (a.nivel_educativo !== b.nivel_educativo)
            return a.nivel_educativo.localeCompare(b.nivel_educativo);
          if (a.grado_año !== b.grado_año)
            return a.grado_año.localeCompare(b.grado_año);
          return a.seccion.localeCompare(b.seccion);
        });

        setSecciones(unique);
        setSeccionId("");
      } catch {
        showToast.error("Error cargando secciones");
      } finally {
        setIsLoadingFiltros(false);
      }
    };
    load();
  }, [periodoId, lapsoId]);

  // ── Clear grid when filters change ───────────────────────────────────────────
  useEffect(() => {
    setMaterias([]);
    setEstudiantes([]);
    setGrid({});
    setSeccionNombre("");
  }, [periodoId, lapsoId, seccionId]);

  // ── Build grid ───────────────────────────────────────────────────────────────
  const buildGrid = useCallback(async () => {
    if (!periodoId || !lapsoId || !seccionId) return;
    setIsLoadingGrid(true);
    setMaterias([]);
    setEstudiantes([]);
    setGrid({});

    try {
      const mainSeccion = secciones.find((s) => s.id === seccionId);
      if (!mainSeccion) throw new Error("Sección no encontrada");

      // Resolved display name
      const nivelLabel =
        mainSeccion.nivel_educativo === "Año" ||
        mainSeccion.nivel_educativo === "media_general"
          ? "Media General"
          : "Primaria";
      setSeccionNombre(
        `${mainSeccion.grado_año} "${mainSeccion.seccion}" — ${nivelLabel}`
      );

      // All section IDs that represent the "same" section (duplicates in DB)
      const allSecciones = await getDocs(
        query(
          collection(db, "secciones"),
          where("id_periodo_escolar", "==", periodoId)
        )
      );
      const validIds = allSecciones.docs
        .map((d) => ({ id: d.id, ...d.data() } as Secciones))
        .filter(
          (s) =>
            s.grado_año === mainSeccion.grado_año &&
            s.seccion === mainSeccion.seccion &&
            s.nivel_educativo === mainSeccion.nivel_educativo
        )
        .map((s) => s.id)
        .filter((id): id is string => Boolean(id));
      validSectionIdsRef.current = validIds;

      // ── 1. Load materias ──────────────────────────────────────────────────
      // Map all common nivel_educativo values to the canonical ones stored in materias
      const nivelMap: Record<string, string> = {
        "Año": "media_general",
        "media_general": "media_general",
        "Grado": "primaria",
        "primaria": "primaria",
      };
      const mappedNivel = nivelMap[mainSeccion.nivel_educativo] ?? "primaria";

      const matSnap = await getDocs(
        query(
          collection(db, "materias"),
          where("nivel_educativo", "==", mappedNivel)
        )
      );

      // Tier 1: exact match on grado_año
      const materiasData: Materia[] = [];
      const allMateriasForNivel: Materia[] = [];

      matSnap.docs.forEach((d) => {
        const data = d.data();
        const gradosAños: string[] = data.grados_años ?? [];
        const SKIP_WORDS = new Set(["de","del","la","el","y","e","a","en","los","las","un","una","para","por"]);
        const makeAbrev = (nombre: string) =>
          nombre
            .split(" ")
            .filter((w) => w.length > 0 && !SKIP_WORDS.has(w.toLowerCase()))
            .map((w) => w[0].toUpperCase())
            .join("") || nombre.substring(0, 3).toUpperCase();

        const m: Materia = {
          id: d.id,
          nombre: data.nombre as string,
          abreviatura: makeAbrev(data.nombre as string),
        };
        allMateriasForNivel.push(m);
        if (gradosAños.includes(mainSeccion.grado_año)) {
          materiasData.push(m);
        }
      });

      // Tier 2: case-insensitive match
      if (materiasData.length === 0 && allMateriasForNivel.length > 0) {
        const gradoNorm = mainSeccion.grado_año.toLowerCase().trim();
        matSnap.docs.forEach((d) => {
          const data = d.data();
          const gradosAños: string[] = data.grados_años ?? [];
          if (
            gradosAños.some((g) => g.toLowerCase().trim() === gradoNorm) &&
            !materiasData.find((m) => m.id === d.id)
          ) {
            const SKIP_WORDS = new Set(["de","del","la","el","y","e","a","en","los","las","un","una","para","por"]);
            const nombre = data.nombre as string;
            const abreviatura = nombre.split(" ")
              .filter((w) => w.length > 0 && !SKIP_WORDS.has(w.toLowerCase()))
              .map((w) => w[0].toUpperCase())
              .join("") || nombre.substring(0, 3).toUpperCase();
            materiasData.push({ id: d.id, nombre, abreviatura });
          }
        });
      }

      // Tier 3: all materias for this nivel
      if (materiasData.length === 0 && allMateriasForNivel.length > 0) {
        console.warn(`[CargaDirecta] Fallback: loading all ${allMateriasForNivel.length} materias for nivel="${mappedNivel}"`);
        materiasData.push(...allMateriasForNivel);
      }

      materiasData.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setMaterias(materiasData);

      if (materiasData.length === 0) {
        showToast.warning(
          `No hay materias configuradas para el nivel "${mappedNivel}". Verifica el módulo de Materias.`
        );
        setIsLoadingGrid(false);
        return;
      }

      // ── 2. Load estudiantes ───────────────────────────────────────────────
      const estudiantesIds: string[] = mainSeccion.estudiantes_ids ?? [];

      // Fallback: try inscripciones if estudiantes_ids is empty
      if (estudiantesIds.length === 0) {
        const inscSnap = await getDocs(
          query(
            collection(db, "estudiantes_inscritos"),
            where("id_seccion", "in", validIds.slice(0, 10)),
            where("estado", "==", "activo")
          )
        );
        inscSnap.docs.forEach((d) => {
          const eid = d.data().id_estudiante;
          if (eid && !estudiantesIds.includes(eid)) estudiantesIds.push(eid);
        });
      }

      if (estudiantesIds.length === 0) {
        showToast.warning(
          "No hay estudiantes inscritos en esta sección."
        );
        setIsLoadingGrid(false);
        return;
      }

      const estMap: Record<string, Estudiante> = {};
      const chunkSize = 30;
      for (let i = 0; i < estudiantesIds.length; i += chunkSize) {
        const chunk = estudiantesIds.slice(i, i + chunkSize);
        const estSnap = await getDocs(
          query(collection(db, "estudiantes"), where("__name__", "in", chunk))
        );
        estSnap.docs.forEach((d) => {
          estMap[d.id] = { id: d.id, ...d.data() } as Estudiante;
        });
      }

      const estudiantesData = Object.values(estMap).sort((a, b) =>
        a.cedula - b.cedula
      );
      setEstudiantes(estudiantesData);

      // ── 3. Load existing CARGA_DIRECTA evaluaciones ───────────────────────
      // Find all synthetic evaluations for this lapso/periodo/section
      const evalSnap = await getDocs(
        query(
          collection(db, "evaluaciones"),
          where("periodo_escolar_id", "==", periodoId),
          where("tipo_evaluacion", "==", TIPO_CARGA_DIRECTA)
        )
      );

      // Map: materiaId → evaluacionId (only for our section set)
      const evalPorMateria: Record<string, string> = {};
      evalSnap.docs.forEach((d) => {
        const data = d.data();
        if (
          data.lapsop_id === lapsoId &&
          validIds.includes(data.seccion_id ?? "")
        ) {
          evalPorMateria[data.materia_id] = d.id;
        }
      });

      // ── 4. Load existing notas for those evaluaciones ─────────────────────
      const evalIds = Object.values(evalPorMateria);

      // Map: evaluacionId → Map<estudianteId, { notaDocId, valor }>
      const notasPorEval: Record<
        string,
        Record<string, { notaDocId: string; valor: number }>
      > = {};

      for (let i = 0; i < evalIds.length; i += chunkSize) {
        const chunk = evalIds.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        const notasSnap = await getDocs(
          query(
            collection(db, "notas_evaluaciones"),
            where("evaluacion_id", "in", chunk)
          )
        );
        notasSnap.docs.forEach((d) => {
          const data = d.data();
          if (!notasPorEval[data.evaluacion_id]) {
            notasPorEval[data.evaluacion_id] = {};
          }
          notasPorEval[data.evaluacion_id][data.estudiante_id] = {
            notaDocId: d.id,
            valor: data.nota_definitiva ?? 0,
          };
        });
      }

      // ── 5. Build initial grid state ───────────────────────────────────────
      const initialGrid: GridState = {};
      estudiantesData.forEach((est) => {
        initialGrid[est.id] = {};
        materiasData.forEach((mat) => {
          const evalId = evalPorMateria[mat.id];
          const notaInfo = evalId
            ? notasPorEval[evalId]?.[est.id]
            : undefined;
          initialGrid[est.id][mat.id] = {
            inputValue: notaInfo !== undefined ? String(notaInfo.valor) : "",
            savedNota: notaInfo
              ? {
                  notaDocId: notaInfo.notaDocId,
                  evaluacionId: evalId,
                  valor: notaInfo.valor,
                }
              : null,
          };
        });
      });

      setGrid(initialGrid);
    } catch (err) {
      console.error("[CargaDirecta] buildGrid error:", err);
      showToast.error("Error cargando los datos. Revisa la consola.");
    } finally {
      setIsLoadingGrid(false);
    }
  }, [periodoId, lapsoId, seccionId, secciones]);

  // ── Handle cell input change ─────────────────────────────────────────────────
  const handleCellChange = (
    estudianteId: string,
    materiaId: string,
    value: string
  ) => {
    // Only allow up to 2 digits (integers 0–20)
    if (value !== "" && !/^\d{0,2}$/.test(value)) return;
    // Reject values beyond 20 as soon as we can tell
    if (value !== "" && parseInt(value, 10) > NOTA_MAX) return;
    setGrid((prev) => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        [materiaId]: {
          ...prev[estudianteId]?.[materiaId],
          inputValue: value,
        },
      },
    }));
  };

  // ── Handle cell blur: clamp value ────────────────────────────────────────────
  const handleCellBlur = (estudianteId: string, materiaId: string) => {
    const cell = grid[estudianteId]?.[materiaId];
    if (!cell || cell.inputValue === "") return;
    const clamped = clampNota(cell.inputValue);
    setGrid((prev) => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        [materiaId]: { ...prev[estudianteId][materiaId], inputValue: String(clamped) },
      },
    }));
  };

  // ── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const mainSeccion = secciones.find((s) => s.id === seccionId);
    if (!mainSeccion) {
      showToast.error("Sección no encontrada");
      setIsSaving(false);
      return;
    }

    const todayISO = new Date().toISOString().split("T")[0];

    try {
      // Cache of evaluacionId per materiaId created/found during this save
      const evalCache: Record<string, string> = {};

      // Pre-load existing synthetic evaluations for this context
      const evalSnap = await getDocs(
        query(
          collection(db, "evaluaciones"),
          where("periodo_escolar_id", "==", periodoId),
          where("tipo_evaluacion", "==", TIPO_CARGA_DIRECTA)
        )
      );
      evalSnap.docs.forEach((d) => {
        const data = d.data();
        if (
          data.lapsop_id === lapsoId &&
          validSectionIdsRef.current.includes(data.seccion_id ?? "")
        ) {
          evalCache[data.materia_id] = d.id;
        }
      });

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const mat of materias) {
        // Collect cells with valid input for this materia
        const cellsToSave: Array<{
          estId: string;
          nota: number;
          cell: CeldaNota;
        }> = [];

        for (const est of estudiantes) {
          const cell = grid[est.id]?.[mat.id];
          if (!cell) continue;
          if (!isValidInput(cell.inputValue)) {
            skippedCount++;
            continue;
          }
          cellsToSave.push({
            estId: est.id,
            nota: clampNota(cell.inputValue),
            cell,
          });
        }

        if (cellsToSave.length === 0) continue;

        // Ensure synthetic evaluacion exists
        if (!evalCache[mat.id]) {
          const materia = materias.find((m) => m.id === mat.id);
          const newEval = await addDoc(collection(db, "evaluaciones"), {
            nombre_evaluacion: `Nota Definitiva — ${materia?.nombre ?? mat.id}`,
            tipo_evaluacion: TIPO_CARGA_DIRECTA,
            materia_id: mat.id,
            seccion_id: seccionId,
            lapsop_id: lapsoId,
            periodo_escolar_id: periodoId,
            porcentaje: 100,
            nota_definitiva: NOTA_MAX,
            fecha: todayISO,
            criterios: [],
            status: "EVALUADA",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          evalCache[mat.id] = newEval.id;
        }

        const evalId = evalCache[mat.id];

        // Batch: load existing notas for this eval to avoid duplicate creates
        const notasSnap = await getDocs(
          query(
            collection(db, "notas_evaluaciones"),
            where("evaluacion_id", "==", evalId)
          )
        );
        const existingNotaMap: Record<string, string> = {};
        notasSnap.docs.forEach((d) => {
          existingNotaMap[d.data().estudiante_id] = d.id;
        });

        for (const { estId, nota, cell } of cellsToSave) {
          const est = estudiantes.find((e) => e.id === estId);
          const existingDocId = cell.savedNota?.notaDocId ?? existingNotaMap[estId];

          if (existingDocId) {
            // Update
            await updateDoc(doc(db, "notas_evaluaciones", existingDocId), {
              nota_definitiva: nota,
              notas_criterios: [
                {
                  criterio_numero: "1",
                  criterio_nombre: "Nota Definitiva",
                  ponderacion_maxima: NOTA_MAX,
                  nota_obtenida: nota,
                },
              ],
              updatedAt: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
            updatedCount++;
          } else {
            // Create
            await addDoc(collection(db, "notas_evaluaciones"), {
              evaluacion_id: evalId,
              estudiante_id: estId,
              estudiante_nombre: `${est?.nombres ?? ""} ${est?.apellidos ?? ""}`.trim(),
              docente_id: "admin_carga_directa",
              nota_definitiva: nota,
              notas_criterios: [
                {
                  criterio_numero: "1",
                  criterio_nombre: "Nota Definitiva",
                  ponderacion_maxima: NOTA_MAX,
                  nota_obtenida: nota,
                },
              ],
              observacion: "Cargado directamente por administración (LAPSO pasado)",
              historial_cambios: [],
              createdAt: serverTimestamp(),
              created_at: serverTimestamp(),
              updatedAt: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
            createdCount++;
          }
        }
      }

      const parts: string[] = [];
      if (createdCount > 0) parts.push(`${createdCount} nota(s) nuevas`);
      if (updatedCount > 0) parts.push(`${updatedCount} actualizada(s)`);
      if (skippedCount > 0) parts.push(`${skippedCount} celda(s) vacía(s) ignorada(s)`);

      showToast.success(
        `✓ Guardado exitosamente: ${parts.join(", ")}.`
      );

      // Reload grid to refresh savedNota references
      await buildGrid();
    } catch (err) {
      console.error("[CargaDirecta] handleSave error:", err);
      showToast.error(
        "Error al guardar. Algunos registros pueden no haberse guardado. Revisa la consola."
      );
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────────
  const seccionObj = secciones.find((s) => s.id === seccionId);
  const lapsoObj = lapsos.find((l) => l.id === lapsoId);
  const periodoObj = periodos.find((p) => p.id === periodoId);
  const hasGrid = estudiantes.length > 0 && materias.length > 0;

  /** Subset of materias to render in the table depending on mode */
  const materiasVisibles =
    vistaMode === "individual" && materiaActivaId
      ? materias.filter((m) => m.id === materiaActivaId)
      : materias;

  // Count filled cells (scoped to visible materias)
  const filledCount = hasGrid
    ? estudiantes.reduce(
        (acc, est) =>
          acc +
          materiasVisibles.filter((mat) =>
            isValidInput(grid[est.id]?.[mat.id]?.inputValue ?? "")
          ).length,
        0
      )
    : 0;
  const totalCells = estudiantes.length * materiasVisibles.length;

  // Count cells that differ from saved value (scoped to visible materias)
  const changedCount = hasGrid
    ? estudiantes.reduce(
        (acc, est) =>
          acc +
          materiasVisibles.filter((mat) => {
            const cell = grid[est.id]?.[mat.id];
            if (!cell || cell.inputValue === "") return false;
            const currentVal = clampNota(cell.inputValue);
            const savedVal = cell.savedNota?.valor;
            return savedVal === undefined || currentVal !== savedVal;
          }).length,
        0
      )
    : 0;

  // ── Section label helper ─────────────────────────────────────────────────────
  const formatSeccionLabel = (s: Secciones) => {
    const isMedia =
      s.nivel_educativo === "Año" || s.nivel_educativo === "media_general";
    return `${s.grado_año} "${s.seccion}" — ${isMedia ? "Media General" : "Primaria"}`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard/notas">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">Carga Directa de Notas</h1>
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-xs font-semibold tracking-wide"
            >
              HERRAMIENTA TEMPORAL
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Registro expedito de nota definitiva por materia sin pasar por evaluaciones
          </p>
        </div>
      </div>

      {/* ── Warning Banner ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 px-5 py-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Herramienta de emergencia — uso excepcional</p>
          <p>
            Esta página permite cargar la <strong>nota lapso</strong> de cada materia
            directamente sin registrar evaluaciones individuales. Úsala solo cuando el lapso
            ya cerró y los docentes no pudieron registrar sus evaluaciones a tiempo.
            Las notas se guardan en el sistema como una evaluación sintética del 100%, por
            lo que serán visibles en la <strong>Sábana de Notas</strong> y los{" "}
            <strong>Boletines</strong> normalmente.
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecciona el periodo, lapso y sección para cargar las notas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Periodo */}
            <div className="space-y-2">
              <Label htmlFor="select-periodo">Periodo Escolar</Label>
              <Select
                value={periodoId}
                onValueChange={setPeriodoId}
                disabled={isLoadingFiltros}
              >
                <SelectTrigger id="select-periodo">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                      {p.status === "ACTIVO" ? " (Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lapso */}
            <div className="space-y-2">
              <Label htmlFor="select-lapso">Lapso</Label>
              <Select
                value={lapsoId}
                onValueChange={setLapsoId}
                disabled={!periodoId || isLoadingFiltros}
              >
                <SelectTrigger id="select-lapso">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {lapsos.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.lapso}
                      {l.status === "ACTIVO" ? " (Activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sección — combobox with search */}
            <div className="space-y-2">
              <Label>Sección</Label>
              <Popover open={openSeccion} onOpenChange={setOpenSeccion}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-label="Seleccionar sección"
                    className="w-full justify-between font-normal"
                    disabled={!lapsoId || isLoadingFiltros}
                  >
                    <span className="truncate">
                      {seccionObj
                        ? formatSeccionLabel(seccionObj)
                        : "Selecciona sección..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar sección..." />
                    <CommandList>
                      <CommandEmpty>No hay secciones.</CommandEmpty>
                      <CommandGroup>
                        {secciones.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={formatSeccionLabel(s)}
                            onSelect={() => {
                              setSeccionId(s.id ?? "");
                              setOpenSeccion(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                s.id === seccionId
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {formatSeccionLabel(s)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Load button */}
            <div className="flex items-end">
              <Button
                onClick={buildGrid}
                disabled={
                  !periodoId || !lapsoId || !seccionId || isLoadingGrid
                }
                className="w-full"
              >
                {isLoadingGrid ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar Datos
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Grid table ──────────────────────────────────────────────────────── */}
      {hasGrid && (
        <Card>
          <CardHeader className="border-b pb-0">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-6 pt-5 pb-3">
              <div>
                <CardTitle className="text-lg">
                  Ingreso de Notas — {seccionNombre}
                </CardTitle>
                <CardDescription className="mt-1">
                  {periodoObj?.nombre} · {lapsoObj?.lapso} ·{" "}
                  {estudiantes.length} estudiante(s) · {materias.length} materia(s)
                  {filledCount > 0 && (
                    <>
                      {" · "}
                      <span className="text-blue-600 font-medium">
                        {filledCount}/{totalCells} llenadas
                      </span>
                    </>
                  )}
                  {changedCount > 0 && (
                    <>
                      {" · "}
                      <span className="text-amber-600 font-medium">
                        {changedCount} cambio(s) pendiente(s)
                      </span>
                    </>
                  )}
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={isSaving || filledCount === 0}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Notas ({filledCount})
                  </>
                )}
              </Button>
            </div>

            {/* View mode toggle + materia selector */}
            <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
              <div className="flex items-center rounded-lg border bg-muted/40 p-1 gap-1">
                <Button
                  size="sm"
                  variant={vistaMode === "todas" ? "default" : "ghost"}
                  className="h-7 px-3 text-xs"
                  onClick={() => {
                    setVistaMode("todas");
                    setMateriaActivaId("");
                  }}
                >
                  Todas las materias
                </Button>
                <Button
                  size="sm"
                  variant={vistaMode === "individual" ? "default" : "ghost"}
                  className="h-7 px-3 text-xs"
                  onClick={() => {
                    setVistaMode("individual");
                    if (!materiaActivaId && materias.length > 0) {
                      setMateriaActivaId(materias[0].id);
                    }
                  }}
                >
                  Materia por materia
                </Button>
              </div>

              {/* Materia selector + nav arrows — only in individual mode */}
              {vistaMode === "individual" && materias.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    disabled={materias.findIndex((m) => m.id === materiaActivaId) <= 0}
                    onClick={() => {
                      const idx = materias.findIndex((m) => m.id === materiaActivaId);
                      if (idx > 0) setMateriaActivaId(materias[idx - 1].id);
                    }}
                    aria-label="Materia anterior"
                  >
                    ‹
                  </Button>

                  <Select
                    value={materiaActivaId}
                    onValueChange={setMateriaActivaId}
                  >
                    <SelectTrigger className="h-7 text-xs w-[220px]">
                      <SelectValue placeholder="Selecciona una materia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map((m) => {
                        const filled = estudiantes.filter((est) =>
                          isValidInput(grid[est.id]?.[m.id]?.inputValue ?? "")
                        ).length;
                        return (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex items-center gap-2">
                              {m.nombre}
                              {filled > 0 && (
                                <span className="text-[10px] text-blue-600 font-medium">
                                  ({filled}/{estudiantes.length})
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    disabled={
                      materias.findIndex((m) => m.id === materiaActivaId) >=
                      materias.length - 1
                    }
                    onClick={() => {
                      const idx = materias.findIndex((m) => m.id === materiaActivaId);
                      if (idx < materias.length - 1)
                        setMateriaActivaId(materias[idx + 1].id);
                    }}
                    aria-label="Materia siguiente"
                  >
                    ›
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    {materias.findIndex((m) => m.id === materiaActivaId) + 1} /{" "}
                    {materias.length}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* ── Edit info bar: shows if there are already-saved grades ───── */}
            {(() => {
              const savedCount = estudiantes.reduce(
                (a, est) =>
                  a +
                  materiasVisibles.filter(
                    (mat) =>
                      grid[est.id]?.[mat.id]?.savedNota !== null &&
                      grid[est.id]?.[mat.id]?.savedNota !== undefined
                  ).length,
                0
              );
              return savedCount > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/20 border-b text-xs text-blue-700 dark:text-blue-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>
                    <strong>{savedCount}</strong> nota(s) ya guardadas en la base de datos —{" "}
                    <span className="font-medium">puedes editarlas directamente en la tabla y luego presionar Guardar.</span>
                    {" "}Las celdas con punto azul tienen nota guardada.
                  </span>
                </div>
              ) : null;
            })()}
            <div className="overflow-x-auto rounded-b-lg">
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Row 1: abbreviations */}
                  <tr className="bg-muted/70 border-b">
                    <th className="px-2 py-2.5 text-left font-semibold border-r sticky left-0 bg-muted/70 w-7 text-muted-foreground">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold border-r sticky left-7 bg-muted/70 min-w-[200px]">
                      Apellidos y Nombres
                    </th>
                    {materiasVisibles.map((m) => (
                      <th
                        key={m.id}
                        className="px-1 py-2.5 text-center font-bold border-r w-12 min-w-[48px]"
                        title={m.nombre}
                      >
                        <span className="block truncate leading-tight text-[11px]">
                          {m.abreviatura}
                        </span>
                      </th>
                    ))}
                  </tr>
                  {/* Row 2: first word of each materia name as sub-label */}
                  <tr className="bg-muted/30 border-b text-muted-foreground">
                    <td className="border-r" />
                    <td className="px-3 py-1 text-[10px] italic border-r">
                      Materia →
                    </td>
                    {materiasVisibles.map((m) => (
                      <td
                        key={m.id}
                        className="px-0.5 py-1 text-center border-r text-[9px] leading-tight"
                        title={m.nombre}
                      >
                        <span className="line-clamp-2 block px-0.5">
                          {m.nombre.split(" ").slice(0, 2).join(" ")}
                        </span>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((est, idx) => (
                    <tr
                      key={est.id}
                      className={`border-b transition-colors hover:bg-muted/20 ${
                        idx % 2 === 0 ? "" : "bg-muted/5"
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center text-muted-foreground text-[11px] border-r sticky left-0 bg-inherit">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-1.5 border-r sticky left-7 bg-inherit whitespace-nowrap">
                        <div className="font-medium text-sm">
                          {est.apellidos}, {est.nombres}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {est.tipo_cedula}-{est.cedula}
                        </div>
                      </td>
                      {materiasVisibles.map((mat, matIdx) => {
                        const cell = grid[est.id]?.[mat.id];
                        const val = cell?.inputValue ?? "";
                        const isSaved = cell?.savedNota !== null && cell?.savedNota !== undefined;
                        const numVal = parseFloat(val);
                        const isEmpty = val === "";
                        const isLow = !isEmpty && !isNaN(numVal) && numVal < 10;
                        const isHigh = !isEmpty && !isNaN(numVal) && numVal >= 15;
                        const isNormal = !isEmpty && !isNaN(numVal) && numVal >= 10 && numVal < 15;

                        return (
                          <td
                            key={mat.id}
                            className="px-1 py-1 border-r text-center"
                          >
                            <div className="relative inline-block w-12">
                              <Input
                                id={`cell-${idx}-${matIdx}`}
                                type="text"
                                inputMode="decimal"
                                value={val}
                                onChange={(e) =>
                                  handleCellChange(est.id, mat.id, e.target.value)
                                }
                                onBlur={() => handleCellBlur(est.id, mat.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "ArrowDown") {
                                    e.preventDefault();
                                    handleCellBlur(est.id, mat.id);
                                    const next = document.getElementById(
                                      `cell-${idx + 1}-${matIdx}`
                                    ) as HTMLInputElement | null;
                                    next?.focus();
                                    next?.select();
                                  } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    handleCellBlur(est.id, mat.id);
                                    const prev = document.getElementById(
                                      `cell-${idx - 1}-${matIdx}`
                                    ) as HTMLInputElement | null;
                                    prev?.focus();
                                    prev?.select();
                                  } else if (e.key === "ArrowRight") {
                                    e.preventDefault();
                                    handleCellBlur(est.id, mat.id);
                                    const next = document.getElementById(
                                      `cell-${idx}-${matIdx + 1}`
                                    ) as HTMLInputElement | null;
                                    next?.focus();
                                    next?.select();
                                  } else if (e.key === "ArrowLeft") {
                                    e.preventDefault();
                                    handleCellBlur(est.id, mat.id);
                                    const prev = document.getElementById(
                                      `cell-${idx}-${matIdx - 1}`
                                    ) as HTMLInputElement | null;
                                    prev?.focus();
                                    prev?.select();
                                  }
                                }}
                                placeholder="—"
                                className={[
                                  "h-7 w-12 text-center text-xs font-mono px-1 py-0 rounded",
                                  "transition-colors placeholder:text-muted-foreground/40",
                                  isLow
                                    ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-700"
                                    : isHigh
                                    ? "border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700"
                                    : isNormal
                                    ? "border-blue-300 bg-blue-50/40 dark:bg-blue-950/10 text-blue-800"
                                    : "",
                                  isSaved && !isEmpty
                                    ? "ring-1 ring-blue-300/70"
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                aria-label={`Nota de ${est.apellidos} en ${mat.nombre}`}
                              />
                              {isSaved && !isEmpty && (
                                <span
                                  className="absolute -top-1 -right-1 block w-1.5 h-1.5 rounded-full bg-blue-500 shadow"
                                  title="Guardada en BD"
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-muted-foreground border-t">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                ≥ 15 — Excelente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                10–14 — Aprobado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                &lt; 10 — Aplazado
              </span>
              <span className="flex items-center gap-1.5 ml-auto">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Punto azul = nota ya guardada en BD
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {!isLoadingGrid && !hasGrid && seccionId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <RefreshCw className="h-10 w-10 opacity-20" />
            <p className="font-medium">Haz clic en &quot;Cargar Datos&quot; para cargar la tabla</p>
            <p className="text-sm text-center max-w-sm">
              Selecciona Periodo, Lapso y Sección, luego presiona el botón{" "}
              <strong>Cargar Datos</strong> para ver la tabla de ingreso de notas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────────────────── */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar guardado de notas</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Vas a guardar <strong>{filledCount}</strong> nota(s) para la sección{" "}
                  <strong>{seccionNombre}</strong> — {lapsoObj?.lapso}.
                </p>
                {changedCount > 0 && (
                  <p className="text-amber-700 dark:text-amber-400">
                    {changedCount} nota(s) serán modificadas respecto a lo ya guardado.
                  </p>
                )}
                <p>Esta acción es reversible: puedes corregir cualquier nota volviendo a esta página.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Sí, Guardar Notas"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
