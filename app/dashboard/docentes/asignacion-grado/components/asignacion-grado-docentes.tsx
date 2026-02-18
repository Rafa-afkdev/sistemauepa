"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { getCollection, addDocument, updateDocument } from "@/lib/data/firebase";
import { User } from "@/interfaces/users.interface";
import { AsignacionDocenteGrado } from "@/interfaces/materias.interface";
import { Secciones } from "@/interfaces/secciones.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { where, orderBy } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";

import {
  Card,
  CardContent,
  CardDescription,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LayoutList, Search, GraduationCap, Loader2, SquarePen, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AsignarGradoDialogProps {
  docente: User;
  secciones: Secciones[];
  periodos: PeriodosEscolares[];
  asignacionesDocente: AsignacionDocenteGrado[];
  todasLasAsignaciones: AsignacionDocenteGrado[];
  onAsignacionCreada: () => Promise<void> | void;
}

const AsignarGradoDialog: React.FC<AsignarGradoDialogProps> = ({
  docente,
  secciones,
  periodos,
  asignacionesDocente,
  todasLasAsignaciones,
  onAsignacionCreada,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seccionId, setSeccionId] = useState<string>("");
  const [periodoId, setPeriodoId] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");

  // Filtrar secciones de educación primaria (Grado)
  const seccionesFiltradas = useMemo(() => {
    return secciones.filter((s) => s.nivel_educativo === "Grado");
  }, [secciones]);

  // Verificar qué secciones ya están asignadas en el período seleccionado (cualquier docente)
  const seccionesOcupadas = useMemo(() => {
    const ocupadas = new Set<string>();
    if (!periodoId) return ocupadas;

    todasLasAsignaciones
      .filter((a) => a.periodo_escolar_id === periodoId)
      .forEach((a) => {
        if (a.seccion_id) {
          ocupadas.add(a.seccion_id);
        }
      });

    return ocupadas;
  }, [todasLasAsignaciones, periodoId]);

  const handleSubmit = async () => {
    if (!docente?.id) {
      showToast.error("Docente inválido");
      return;
    }
    if (!seccionId) {
      showToast.error("Debe seleccionar una sección");
      return;
    }
    if (!periodoId) {
      showToast.error("Debe seleccionar un período escolar");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AsignacionDocenteGrado = {
        docente_id: docente.id,
        seccion_id: seccionId,
        periodo_escolar_id: periodoId,
        estado: "activa",
        fecha_asignacion: new Date().toISOString(),
        observaciones: observaciones || "",
      };

      await addDocument("asignaciones_docente_grado", {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      showToast.success("Grado asignado al docente correctamente");
      await onAsignacionCreada();

      // Reset form
      setSeccionId("");
      setPeriodoId("");
      setObservaciones("");
      setOpen(false);
    } catch (error: any) {
      showToast.error(error?.message || "Error al asignar el grado", {
        duration: 2500,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!docente?.id} className="border-blue-400 text-blue-400 hover:bg-blue-50">
          Asignar Grado
          <GraduationCap className="ml-2 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar grado a docente</DialogTitle>
          <DialogDescription>
            Docente seleccionado: {docente.name} {docente.apellidos}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
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
                Sección (Grado) <span className="text-red-500">*</span>
              </label>
              <Select
                value={seccionId}
                onValueChange={(value) => setSeccionId(value)}
                disabled={!periodoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesFiltradas
                    .filter((s) => {
                      const id = s.id as string;
                      if (!id) return false;
                      if (seccionesOcupadas.has(id)) return false;
                      return true;
                    })
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id as string}>
                        {s.grado_año}° "{s.seccion}" - {s.turno}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {periodoId && seccionesFiltradas.filter((s) => !seccionesOcupadas.has(s.id as string)).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No hay secciones de primaria disponibles para este período
                </p>
              )}
            </div>

            <div>
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
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-400 hover:bg-blue-500 text-white">
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
  asignacion: AsignacionDocenteGrado;
  docente: User;
  seccionesMap: Record<string, Secciones>;
  periodosMap: Record<string, PeriodosEscolares>;
  onUpdated: () => Promise<void> | void;
}

const EditarAsignacionDialog: React.FC<EditarAsignacionDialogProps> = ({
  asignacion,
  docente,
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

  useEffect(() => {
    if (open) {
      setEstado(asignacion.estado || "activa");
      setObservaciones(asignacion.observaciones || "");
    }
  }, [open, asignacion]);

  const handleUpdate = async () => {
    if (!asignacion.id) {
      showToast.error("Asignación inválida");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDocument(
        `asignaciones_docente_grado/${asignacion.id}`,
        {
          estado,
          observaciones,
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

  const seccion = seccionesMap[asignacion.seccion_id];
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
          <DialogTitle>Editar asignación de grado</DialogTitle>
          <DialogDescription>
            Docente: {docente.name} {docente.apellidos}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-sm space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-600">Sección:</span>
                <span className="font-medium">
                  {seccion
                    ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.turno}`
                    : asignacion.seccion_id}
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
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

            <div>
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
          <Button type="button" onClick={handleUpdate} disabled={isSubmitting} className="bg-blue-400 hover:bg-blue-500 text-white">
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

const AsignacionGradoDocentes: React.FC = () => {
  const { user } = useUser();

  const [docentes, setDocentes] = useState<User[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionDocenteGrado[]>([]);
  const [todasLasAsignaciones, setTodasLasAsignaciones] = useState<AsignacionDocenteGrado[]>([]);

  const [selectedDocente, setSelectedDocente] = useState<User | null>(null);

  const [isLoadingInicial, setIsLoadingInicial] = useState<boolean>(true);
  const [isLoadingAsignaciones, setIsLoadingAsignaciones] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      setIsLoadingInicial(true);
      try {
        const usuariosRes = await getCollection("users", [orderBy("cedula", "asc")]);
        const resSecciones = await getCollection("secciones");
        const resPeriodos = await getCollection("periodos_escolares");
        const resTodasAsignaciones = await getCollection("asignaciones_docente_grado");

        const soloDocentes = (usuariosRes as User[]).filter(
          (u) => (u.rol || "").toLowerCase() === "docente"
        );

        setDocentes(soloDocentes);
        setSecciones(resSecciones as Secciones[]);
        setPeriodos(resPeriodos as PeriodosEscolares[]);
        setTodasLasAsignaciones(resTodasAsignaciones as AsignacionDocenteGrado[]);
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
      const res = await getCollection("asignaciones_docente_grado", [
        where("docente_id", "==", docenteId),
      ]);
      setAsignaciones(res as AsignacionDocenteGrado[]);
    } catch (error) {
      console.error(error);
      showToast.error("Error al cargar los grados asignados");
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Columna izquierda: listado de docentes */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Docentes</CardTitle>
          <CardDescription>
            Seleccione un docente para ver y asignar grados.
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
              <div className="text-gray-400 text-sm mt-6 text-center">
                No se encontraron docentes.
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

      {/* Columna derecha: grados asignados al docente seleccionado */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                {selectedDocente
                  ? `Grados asignados a ${selectedDocente.name} ${selectedDocente.apellidos}`
                  : "Seleccione un docente"}
              </CardTitle>
              {selectedDocente && (
                <CardDescription>
                  C.I: {selectedDocente.cedula} · {selectedDocente.email}
                </CardDescription>
              )}
            </div>
            {selectedDocente && (
              <AsignarGradoDialog
                docente={selectedDocente}
                secciones={secciones}
                periodos={periodos}
                asignacionesDocente={asignaciones}
                todasLasAsignaciones={todasLasAsignaciones}
                onAsignacionCreada={async () => {
                  if (selectedDocente?.id) {
                    await loadAsignacionesDocente(selectedDocente.id);
                    // Recargar todas las asignaciones para mantener el filtro actualizado
                    const resTodasAsignaciones = await getCollection("asignaciones_docente_grado");
                    setTodasLasAsignaciones(resTodasAsignaciones as AsignacionDocenteGrado[]);
                  }
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDocente && (
            <div className="text-gray-400 my-16 text-center">
              <LayoutList className="w-16 h-16 mx-auto mb-4" />
              <p>Seleccione un docente para ver y asignar sus grados.</p>
            </div>
          )}

          {selectedDocente && (
            <div className="custom-scroll max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sección (Grado)</TableHead>
                    <TableHead>Período Escolar</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Asignación</TableHead>
                    <TableHead>Opciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAsignaciones && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                        Cargando grados asignados...
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingAsignaciones && asignaciones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                        Este docente no tiene grados asignados aún.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingAsignaciones && asignaciones.length > 0 && (
                    <>
                      {asignaciones.map((a) => {
                        const seccion = seccionesMap[a.seccion_id];
                        const periodo = periodosMap[a.periodo_escolar_id];
                        return (
                          <TableRow key={a.id}>
                            <TableCell>
                              {seccion
                                ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.turno}`
                                : a.seccion_id}
                            </TableCell>
                            <TableCell>{periodo?.periodo || a.periodo_escolar_id}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  a.estado === "activa"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {a.estado}
                              </span>
                            </TableCell>
                            <TableCell>
                              {a.fecha_asignacion
                                ? new Date(a.fecha_asignacion).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <EditarAsignacionDialog
                                asignacion={a}
                                docente={selectedDocente as User}
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
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AsignacionGradoDocentes;
