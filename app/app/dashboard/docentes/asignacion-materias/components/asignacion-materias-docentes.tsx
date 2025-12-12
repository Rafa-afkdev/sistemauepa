"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { getCollection, addDocument, updateDocument } from "@/lib/data/firebase";
import { User } from "@/interfaces/users.interface";
import { Materias, AsignacionDocenteMateria } from "@/interfaces/materias.interface";
import { Secciones } from "@/interfaces/secciones.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { where, orderBy } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LayoutList, Search, NotebookPen, Loader2, SquarePen, X, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AsignarMateriaDialogProps {
  docente: User;
  materias: Materias[];
  secciones: Secciones[];
  periodos: PeriodosEscolares[];
  asignacionesDocente: AsignacionDocenteMateria[];
  todasLasAsignaciones: AsignacionDocenteMateria[];
  onAsignacionCreada: () => Promise<void> | void;
}

const AsignarMateriaDialog: React.FC<AsignarMateriaDialogProps> = ({
  docente,
  materias,
  secciones,
  periodos,
  asignacionesDocente,
  todasLasAsignaciones,
  onAsignacionCreada,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nivelEducativo = "Año"; // Establecido por defecto para Media General
  const [seccionId, setSeccionId] = useState<string>("");
  const [materiasIds, setMateriasIds] = useState<string[]>([]);
  const [materiaIdSeleccionada, setMateriaIdSeleccionada] = useState<string>("");
  const [periodoId, setPeriodoId] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");

  // Filtrar secciones por nivel educativo (Año = Media General)
  const seccionesFiltradas = useMemo(() => {
    return secciones.filter((s) => s.nivel_educativo === "Año");
  }, [secciones]);

  // Filtrar materias por nivel educativo (media_general)
  const materiasFiltradas = useMemo(() => {
    return materias.filter((m) => m.nivel_educativo === "media_general");
  }, [materias]);

  // Verificar qué materias ya están asignadas para esta sección y período (cualquier docente)
  const materiasAsignadas = useMemo(() => {
    const asignadas = new Set<string>();
    if (!seccionId || !periodoId) return asignadas;

    todasLasAsignaciones
      .filter((a) => {
        return (
          a.periodo_escolar_id === periodoId &&
          a.secciones_id?.includes(seccionId)
        );
      })
      .forEach((a) => {
        asignadas.add(a.materia_id);
      });

    return asignadas;
  }, [todasLasAsignaciones, seccionId, periodoId]);

  const handleSubmit = async () => {
    if (!docente?.id) {
      showToast.error("Docente inválido");
      return;
    }
    if (!seccionId) {
      showToast.error("Debe seleccionar una sección");
      return;
    }
    if (materiasIds.length === 0) {
      showToast.error("Debe seleccionar al menos una materia");
      return;
    }
    if (!periodoId) {
      showToast.error("Debe seleccionar un período escolar");
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear un registro de asignación por cada materia seleccionada
      const promises = materiasIds.map((materiaId) => {
        const payload: AsignacionDocenteMateria = {
          docente_id: docente.id,
          materia_id: materiaId,
          secciones_id: [seccionId], // Solo una sección por asignación
          periodo_escolar_id: periodoId,
          estado: "activa",
          fecha_asignacion: new Date().toISOString(),
          observaciones: observaciones || "",
        };

        return addDocument("asignaciones_docente_materia", {
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await Promise.all(promises);

      showToast.success(
        `${materiasIds.length} materia(s) asignada(s) al docente correctamente`
      );
      await onAsignacionCreada();

      // Reset form
      setSeccionId("");
      setMateriasIds([]);
      setMateriaIdSeleccionada("");
      setPeriodoId("");
      setObservaciones("");
      setOpen(false);
    } catch (error: any) {
      showToast.error(error?.message || "Error al asignar las materias", {
        duration: 2500,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!docente?.id}>
          Asignar Materia
          <NotebookPen className="ml-2 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar materia a docente</DialogTitle>
          <DialogDescription>
            Docente seleccionado: {docente.name} {docente.apellidos}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Período Escolar <span className="text-red-500">*</span>
              </label>
              <Select
                value={periodoId}
                onValueChange={(value) => setPeriodoId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id as string}>
                      {p.periodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Sección <span className="text-red-500">*</span>
              </label>
              <Select
                value={seccionId}
                onValueChange={(value) => {
                  setSeccionId(value);
                  // Reset materias cuando cambia la sección
                  setMateriasIds([]);
                  setMateriaIdSeleccionada("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesFiltradas.map((s) => (
                    <SelectItem key={s.id} value={s.id as string}>
                      {s.grado_año}° "{s.seccion}" - {s.turno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {seccionesFiltradas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No hay secciones disponibles
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Materias <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={materiaIdSeleccionada}
                  onValueChange={(value) => setMateriaIdSeleccionada(value)}
                  disabled={!seccionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasFiltradas
                      .filter((m) => {
                        const id = m.id as string;
                        if (!id) return false;
                        // No mostrar materias ya seleccionadas
                        if (materiasIds.includes(id)) return false;
                        // No mostrar materias ya asignadas
                        if (materiasAsignadas.has(id)) return false;
                        return true;
                      })
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id as string}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!materiaIdSeleccionada) return;
                    if (materiasIds.includes(materiaIdSeleccionada)) return;
                    if (materiasAsignadas.has(materiaIdSeleccionada)) return;
                    setMateriasIds((prev) => [...prev, materiaIdSeleccionada]);
                    setMateriaIdSeleccionada("");
                  }}
                  disabled={!materiaIdSeleccionada}
                >
                  Agregar
                </Button>
              </div>
              {!nivelEducativo && (
                <p className="text-xs text-gray-500 mt-1">
                  Primero seleccione un nivel educativo
                </p>
              )}
              {nivelEducativo && !seccionId && (
                <p className="text-xs text-gray-500 mt-1">
                  Primero seleccione una sección
                </p>
              )}
              {nivelEducativo && materiasFiltradas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No hay materias disponibles para el nivel educativo seleccionado
                </p>
              )}

              {materiasIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {materiasIds.map((id) => {
                    const materia = materias.find((m) => m.id === id);
                    const label = materia ? materia.nombre : id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setMateriasIds((prev) =>
                            prev.filter((prevId) => prevId !== id)
                          )
                        }
                        className="px-2 py-1 rounded-full bg-blue-50 border border-blue-300 text-xs text-blue-800 hover:bg-blue-100"
                      >
                        {label} <X className="inline w-3 h-3 ml-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Observaciones (opcional)
              </label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre la asignación"
                maxLength={200}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Guardar Asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditarAsignacionDialogProps {
  asignacion: AsignacionDocenteMateria;
  docente: User;
  materiasMap: Record<string, Materias>;
  seccionesMap: Record<string, Secciones>;
  periodosMap: Record<string, PeriodosEscolares>;
  onUpdated: () => Promise<void> | void;
}

const EditarAsignacionDialog: React.FC<EditarAsignacionDialogProps> = ({
  asignacion,
  docente,
  materiasMap,
  seccionesMap,
  periodosMap,
  onUpdated,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estado, setEstado] = useState<string>(asignacion.estado || "activa");
  const [observaciones, setObservaciones] = useState<string>(
    asignacion.observaciones || ""
  );
  const [seccionesIds, setSeccionesIds] = useState<string[]>(
    asignacion.secciones_id || []
  );

  useEffect(() => {
    if (open) {
      setEstado(asignacion.estado || "activa");
      setObservaciones(asignacion.observaciones || "");
      setSeccionesIds(asignacion.secciones_id || []);
    }
  }, [open, asignacion]);

  const handleUpdate = async () => {
    if (!asignacion.id) {
      showToast.error("Asignación inválida");
      return;
    }

    if (seccionesIds.length === 0) {
      showToast.error(
        "Debe haber al menos una sección asignada. Si desea eliminar la asignación completamente, use la opción de eliminar."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDocument(
        `asignaciones_docente_materia/${asignacion.id}`,
        {
          estado,
          observaciones,
          secciones_id: seccionesIds,
        }
      );

      showToast.success("Asignación actualizada correctamente");
      await onUpdated();
      setOpen(false);
    } catch (error: any) {
      showToast.error(error?.message || "Error al actualizar la asignación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const materia = materiasMap[asignacion.materia_id];
  const periodo = periodosMap[asignacion.periodo_escolar_id];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <SquarePen className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar asignación de materia</DialogTitle>
          <DialogDescription>
            Docente: {docente.name} {docente.apellidos}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-sm space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-600">Materia:</span>
                <span className="font-medium">
                  {materia?.nombre || asignacion.materia_id}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-600">
                  Período escolar:
                </span>
                <span className="font-medium">
                  {periodo?.periodo || asignacion.periodo_escolar_id}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 block mb-2">
                  Secciones asignadas:
                </span>
                {seccionesIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {seccionesIds.map((id) => {
                      const seccion = seccionesMap[id];
                      const label = seccion
                        ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.turno}`
                        : id;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() =>
                              setSeccionesIds((prev) =>
                                prev.filter((pid) => pid !== id)
                              )
                            }
                            className="ml-1.5 text-slate-400 hover:text-red-500 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">
                    No hay secciones asignadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <Select value={estado} onValueChange={(value) => setEstado(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Observaciones
              </label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas sobre esta asignación"
                maxLength={200}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AsignacionMateriasDocentes: React.FC = () => {
  const { user } = useUser();

  const [docentes, setDocentes] = useState<User[]>([]);
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionDocenteMateria[]>([]);
  const [todasLasAsignaciones, setTodasLasAsignaciones] = useState<AsignacionDocenteMateria[]>([]);

  const [selectedDocente, setSelectedDocente] = useState<User | null>(null);

  const [isLoadingInicial, setIsLoadingInicial] = useState<boolean>(true);
  const [isLoadingAsignaciones, setIsLoadingAsignaciones] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");

  // Estados para búsqueda por sección
  const [busquedaSeccionId, setBusquedaSeccionId] = useState<string>("");
  const [busquedaMateriaId, setBusquedaMateriaId] = useState<string>("");
  const [busquedaPeriodoId, setBusquedaPeriodoId] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      setIsLoadingInicial(true);
      try {
        const usuariosRes = await getCollection("users", [orderBy("cedula", "asc")]);
        const resMaterias = await getCollection("materias");
        const resSecciones = await getCollection("secciones");
        const resPeriodos = await getCollection("periodos_escolares");
        const resTodasAsignaciones = await getCollection("asignaciones_docente_materia");

        const soloDocentes = (usuariosRes as User[]).filter(
          (u) => (u.rol || "").toLowerCase() === "docente"
        );

        setDocentes(soloDocentes);
        setMaterias(resMaterias as Materias[]);
        setSecciones(resSecciones as Secciones[]);
        setPeriodos(resPeriodos as PeriodosEscolares[]);
        setTodasLasAsignaciones(resTodasAsignaciones as AsignacionDocenteMateria[]);
      } catch (error) {
        console.error(error);
        showToast.error("Error al cargar datos iniciales");
      } finally {
        setIsLoadingInicial(false);
      }
    };

    loadInitialData();
  }, [user]);

  const loadAsignacionesDocente = async (docenteId: string) => {
    setIsLoadingAsignaciones(true);
    try {
      const res = await getCollection("asignaciones_docente_materia", [
        where("docente_id", "==", docenteId),
      ]);
      setAsignaciones(res as AsignacionDocenteMateria[]);
    } catch (error) {
      console.error(error);
      showToast.error("Error al cargar las materias asignadas");
    } finally {
      setIsLoadingAsignaciones(false);
    }
  };

  const handleSelectDocente = async (docente: User) => {
    setSelectedDocente(docente);
    await loadAsignacionesDocente(docente.id);
  };

  const filteredDocentes = useMemo(() => {
    return docentes.filter((docente) => {
      if (searchType === "cedula") {
        return docente.cedula.toString().includes(searchQuery);
      }
      return docente.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    });
  }, [docentes, searchQuery, searchType]);

  const materiasMap = useMemo(() => {
    const map: Record<string, Materias> = {};
    materias.forEach((m) => {
      if (m.id) map[m.id] = m;
    });
    return map;
  }, [materias]);

  const seccionesMap = useMemo(() => {
    const map: Record<string, Secciones> = {};
    secciones.forEach((s) => {
      if (s.id) map[s.id] = s;
    });
    return map;
  }, [secciones]);

  const periodosMap = useMemo(() => {
    const map: Record<string, PeriodosEscolares> = {};
    periodos.forEach((p) => {
      if (p.id) map[p.id] = p;
    });
    return map;
  }, [periodos]);

  const docentesMap = useMemo(() => {
    const map: Record<string, User> = {};
    docentes.forEach((d) => {
      if (d.id) map[d.id] = d;
    });
    return map;
  }, [docentes]);

  // Búsqueda de asignaciones por sección y materia
  const asignacionesFiltradas = useMemo(() => {
    if (!busquedaSeccionId || !busquedaMateriaId) return [];

    return todasLasAsignaciones.filter((a) => {
      const cumpleSeccion = a.secciones_id?.includes(busquedaSeccionId);
      const cumpleMateria = a.materia_id === busquedaMateriaId;
      const cumplePeriodo = !busquedaPeriodoId || a.periodo_escolar_id === busquedaPeriodoId;
      
      return cumpleSeccion && cumpleMateria && cumplePeriodo;
    });
  }, [todasLasAsignaciones, busquedaSeccionId, busquedaMateriaId, busquedaPeriodoId]);

  // Filtrar secciones de Media General para la búsqueda
  const seccionesMediaGeneral = useMemo(() => {
    return secciones.filter((s) => s.nivel_educativo === "Año");
  }, [secciones]);

  // Filtrar materias de Media General para la búsqueda
  const materiasMediaGeneral = useMemo(() => {
    return materias.filter((m) => m.nivel_educativo === "media_general");
  }, [materias]);

  return (
    <Tabs defaultValue="asignar" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto mb-4 grid-cols-2">
        <TabsTrigger value="asignar" className="gap-2 data-[state=active]:bg-blue-400 data-[state=active]:text-white">
          <NotebookPen className="w-4 h-4" />
          Asignar Materias
        </TabsTrigger>
        <TabsTrigger value="buscar" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
          <BookOpen className="w-4 h-4" />
          Buscar por Sección
        </TabsTrigger>
      </TabsList>

      <TabsContent value="asignar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna izquierda: listado de docentes */}
          <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Docentes</CardTitle>
          <CardDescription>
            Seleccione un docente para ver y asignar materias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Select
              value={searchType}
              onValueChange={(value: "cedula" | "nombres") =>
                setSearchType(value)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cedula">Cédula</SelectItem>
                <SelectItem value="nombres">Nombres</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700" />
              <Input
                type="text"
                placeholder="Buscar docente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="custom-scroll max-h-[500px] overflow-y-auto">
            {isLoadingInicial && (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="w-full h-10" />
                ))}
              </div>
            )}

            {!isLoadingInicial && filteredDocentes.length === 0 && (
              <div className="text-muted-foreground text-sm mt-6 text-center p-4 border border-dashed rounded-lg">
                <p>No se encontraron docentes</p>
              </div>
            )}

            {!isLoadingInicial && filteredDocentes.length > 0 && (
              <ul className="space-y-2">
                {filteredDocentes.map((docente) => {
                  const isSelected = selectedDocente?.id === docente.id;
                  return (
                    <li key={docente.id}>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full justify-start h-auto py-3 ${
                          isSelected ? "bg-blue-400 hover:bg-blue-500" : ""
                        }`}
                        onClick={() => handleSelectDocente(docente)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                            isSelected ? "bg-white text-blue-400" : "bg-blue-100 text-blue-500"
                          }`}>
                            {docente.name.charAt(0)}{docente.apellidos.charAt(0)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-sm">
                              {docente.name} {docente.apellidos}
                            </div>
                            <div className={`text-xs ${isSelected ? "text-blue-100" : "text-muted-foreground"}`}>
                              C.I: {docente.cedula}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Columna derecha: materias asignadas al docente seleccionado */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                {selectedDocente
                  ? `Materias asignadas a ${selectedDocente.name} ${selectedDocente.apellidos}`
                  : "Seleccione un docente"}
              </CardTitle>
              {selectedDocente && (
                <CardDescription>
                  C.I: {selectedDocente.cedula} · {selectedDocente.email}
                </CardDescription>
              )}
            </div>
            {selectedDocente && (
              <AsignarMateriaDialog
                docente={selectedDocente}
                materias={materias}
                secciones={secciones}
                periodos={periodos}
                asignacionesDocente={asignaciones}
                todasLasAsignaciones={todasLasAsignaciones}
                onAsignacionCreada={async () => {
                  if (selectedDocente?.id) {
                    await loadAsignacionesDocente(selectedDocente.id);
                    // Recargar todas las asignaciones para mantener el filtro actualizado
                    const resTodasAsignaciones = await getCollection("asignaciones_docente_materia");
                    setTodasLasAsignaciones(resTodasAsignaciones as AsignacionDocenteMateria[]);
                  }
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDocente && (
            <div className="text-muted-foreground my-16 text-center">
              <LayoutList className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Seleccione un docente</p>
              <p className="text-sm mt-1">Para ver y asignar sus materias</p>
            </div>
          )}

          {selectedDocente && (
            <div className="custom-scroll max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead>Período Escolar</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Asignación</TableHead>
                    <TableHead>Opciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAsignaciones && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                        Cargando materias asignadas...
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingAsignaciones &&
                    asignaciones &&
                    asignaciones.map((a) => {
                      const materia = materiasMap[a.materia_id];
                      const periodo = periodosMap[a.periodo_escolar_id];

                      return (
                        <TableRow key={a.id}>
                          <TableCell>{materia?.nombre || a.materia_id}</TableCell>
                          <TableCell>
                            {a.secciones_id && a.secciones_id.length > 0 ? (
                              <ul className="space-y-1">
                                {a.secciones_id.map((id) => {
                                  const seccion = seccionesMap[id];
                                  return (
                                    <li key={id}>
                                      {seccion
                                        ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.turno}`
                                        : id}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{periodo?.periodo || a.periodo_escolar_id}</TableCell>
                          <TableCell>
                            <Badge variant={(a.estado || "").toLowerCase() === "activa" ? "default" : "secondary"}>
                              {a.estado || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {a.fecha_asignacion
                              ? a.fecha_asignacion.split("T")[0]
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <EditarAsignacionDialog
                              asignacion={a}
                              docente={selectedDocente as User}
                              materiasMap={materiasMap}
                              seccionesMap={seccionesMap}
                              periodosMap={periodosMap}
                              onUpdated={async () => {
                                if (selectedDocente?.id) {
                                  await loadAsignacionesDocente(selectedDocente.id);
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {!isLoadingAsignaciones &&
                    selectedDocente &&
                    asignaciones.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="text-muted-foreground">
                            <p className="text-sm">Este docente aún no tiene materias asignadas</p>
                            <p className="text-xs mt-1">Use el botón "Asignar Materia" para comenzar</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </TabsContent>

      <TabsContent value="buscar">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Buscar Docente por Sección y Materia
            </CardTitle>
            <CardDescription>
              Seleccione una sección y materia para ver qué docente la imparte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros de búsqueda */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Período Escolar
                  <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
                </label>
                <Select
                  value={busquedaPeriodoId || undefined}
                  onValueChange={(value) => setBusquedaPeriodoId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los períodos" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p.id} value={p.id as string}>
                        {p.periodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {busquedaPeriodoId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setBusquedaPeriodoId("")}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Sección <span className="text-red-500">*</span>
                </label>
                <Select
                  value={busquedaSeccionId}
                  onValueChange={(value) => setBusquedaSeccionId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {seccionesMediaGeneral.map((s) => (
                      <SelectItem key={s.id} value={s.id as string}>
                        {s.grado_año}° "{s.seccion}" - {s.turno}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Materia <span className="text-red-500">*</span>
                </label>
                <Select
                  value={busquedaMateriaId}
                  onValueChange={(value) => setBusquedaMateriaId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasMediaGeneral.map((m) => (
                      <SelectItem key={m.id} value={m.id as string}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Resultados de búsqueda */}
            <div>
              {!busquedaSeccionId || !busquedaMateriaId ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Seleccione una sección y una materia para buscar</p>
                </div>
              ) : asignacionesFiltradas.length === 0 ? (
                <div className="text-center py-12 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-medium">No se encontró ninguna asignación</p>
                  <p className="text-sm mt-1">
                    Esta materia no está asignada a ningún docente en la sección seleccionada.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Docentes encontrados ({asignacionesFiltradas.length})
                  </h3>
                  <div className="grid gap-4">
                    {asignacionesFiltradas.map((asignacion) => {
                      const docente = docentesMap[asignacion.docente_id];
                      const materia = materiasMap[asignacion.materia_id];
                      const periodo = periodosMap[asignacion.periodo_escolar_id];
                      const seccion = seccionesMap[busquedaSeccionId];

                      return (
                        <Card key={asignacion.id} className="border-l-4 border-l-blue-400">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-semibold text-lg">
                                    {docente?.name?.charAt(0)}
                                    {docente?.apellidos?.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      {docente?.name} {docente?.apellidos}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      C.I: {docente?.cedula}
                                    </p>
                                  </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Materia:</span>
                                    <p className="font-medium">{materia?.nombre || "N/A"}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Sección:</span>
                                    <p className="font-medium">
                                      {seccion ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.turno}` : "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Período:</span>
                                    <p className="font-medium">{periodo?.periodo || "N/A"}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Estado:</span>
                                    <div className="mt-1">
                                      <Badge variant={asignacion.estado === "activa" ? "default" : "secondary"}>
                                        {asignacion.estado}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {asignacion.observaciones && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-md">
                                    <span className="text-xs text-muted-foreground">Observaciones:</span>
                                    <p className="text-sm mt-1">{asignacion.observaciones}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AsignacionMateriasDocentes;
