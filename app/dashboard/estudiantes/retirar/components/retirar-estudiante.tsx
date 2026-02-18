/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { InscripcionSeccion, Secciones } from "@/interfaces/secciones.interface";
import { db, getCollection } from "@/lib/data/firebase";
import { addDoc, collection, Timestamp, where } from "firebase/firestore";
import { LoaderCircle, UserX2 } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import * as React from "react";
import { useEffect, useState } from "react";

interface RetirarEstudianteProps {
  children: React.ReactNode;
  getInscripcionesActivas: () => Promise<void>;
  retirarEstudiantes: (inscripcionesIds: string[]) => Promise<void>;
}

export function RetirarEstudiante({
  children,
  getInscripcionesActivas,
  retirarEstudiantes,
}: RetirarEstudianteProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [inscripcionesActivas, setInscripcionesActivas] = useState<InscripcionSeccion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [selectedInscripciones, setSelectedInscripciones] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Cargar datos cuando se abre el diálogo
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;
      
      try {
        const [inscData, estData, secData, perData] = await Promise.all([
          getCollection("estudiantes_inscritos", [where("estado", "==", "activo")]),
          getCollection("estudiantes"),
          getCollection("secciones"),
          getCollection("periodos_escolares"),
        ]);

        setInscripcionesActivas(inscData as InscripcionSeccion[]);
        setEstudiantes(estData as Estudiantes[]);
        setSecciones(secData as Secciones[]);
        setPeriodos(perData as PeriodosEscolares[]);
      } catch (error) {
        showToast.error("Error al cargar datos");
      }
    };

    fetchData();
  }, [open]);

  // Limpiar selecciones cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setSelectedInscripciones([]);
      setSearchTerm("");
    }
  }, [open]);

  const handleInscripcionToggle = (inscripcionId: string) => {
    setSelectedInscripciones((prev) =>
      prev.includes(inscripcionId)
        ? prev.filter((id) => id !== inscripcionId)
        : [...prev, inscripcionId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredInscripciones.map((i) => i.id!);
    if (selectedInscripciones.length === filteredIds.length) {
      setSelectedInscripciones([]);
    } else {
      setSelectedInscripciones(filteredIds);
    }
  };

  // Crear mapa de estudiantes para búsqueda rápida
  const estudiantesMap = React.useMemo(() => {
    const map: Record<string, Estudiantes> = {};
    estudiantes.forEach((est) => {
      if (est.id) map[est.id] = est;
    });
    return map;
  }, [estudiantes]);

  // Crear mapa de secciones
  const seccionesMap = React.useMemo(() => {
    const map: Record<string, Secciones> = {};
    secciones.forEach((sec) => {
      if (sec.id) map[sec.id] = sec;
    });
    return map;
  }, [secciones]);

  // Crear mapa de periodos
  const periodosMap = React.useMemo(() => {
    const map: Record<string, PeriodosEscolares> = {};
    periodos.forEach((per) => {
      if (per.id) map[per.id] = per;
    });
    return map;
  }, [periodos]);

  // Filtrar inscripciones por búsqueda
  const filteredInscripciones = inscripcionesActivas.filter((inscripcion) => {
    const estudiante = estudiantesMap[inscripcion.id_estudiante];
    if (!estudiante) return false;

    const seccion = seccionesMap[inscripcion.id_seccion];
    const periodo = periodosMap[inscripcion.id_periodo_escolar];

    const matchesSearch =
      estudiante.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.cedula.toString().includes(searchTerm) ||
      seccion?.seccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      periodo?.periodo.includes(searchTerm);

    return matchesSearch;
  });

  const onSubmit = async () => {
    if (selectedInscripciones.length === 0) {
      showToast.error("Debes seleccionar al menos un estudiante");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Log Withdrawal History
      const historyPromises = selectedInscripciones.map(async (inscripcionId) => {
        const inscripcion = inscripcionesActivas.find(i => i.id === inscripcionId);
        if (!inscripcion) return;

        const seccion = seccionesMap[inscripcion.id_seccion];
        const seccionNombre = seccion 
          ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.nivel_educativo}`
          : "Desconocida";

        await addDoc(collection(db, "historial_cambios_seccion"), {
          id_estudiante: inscripcion.id_estudiante,
          id_periodo_escolar: inscripcion.id_periodo_escolar,
          id_seccion_anterior: inscripcion.id_seccion,
          seccion_anterior_nombre: seccionNombre,
          id_seccion_nueva: null,
          seccion_nueva_nombre: "RETIRADO",
          fecha_cambio: Timestamp.now(),
          motivo: "Retiro voluntario/administrativo"
        });
      });

      await Promise.all(historyPromises);

      // 2. Perform Withdrawal
      await retirarEstudiantes(selectedInscripciones);
      await getInscripcionesActivas();
      setOpen(false);
      setSelectedInscripciones([]);
      setSearchTerm("");
    } catch (error: any) {
      showToast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Retirar Estudiantes</DialogTitle>
          <DialogDescription>
            Selecciona los estudiantes que deseas retirar. Su estado cambiará a "retirado".
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Búsqueda */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search" className="text-right">
              Buscar
            </Label>
            <div className="col-span-3">
              <Input
                id="search"
                placeholder="Buscar por nombre, cédula, sección o periodo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de estudiantes con checkboxes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Estudiantes</Label>
            <div className="col-span-3">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedInscripciones.length === filteredInscripciones.length &&
                    filteredInscripciones.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Seleccionar todos ({selectedInscripciones.length} de{" "}
                  {filteredInscripciones.length})
                </label>
              </div>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {filteredInscripciones.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No se encontraron estudiantes activos
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredInscripciones.map((inscripcion) => {
                      const estudiante = estudiantesMap[inscripcion.id_estudiante];
                      const seccion = seccionesMap[inscripcion.id_seccion];
                      const periodo = periodosMap[inscripcion.id_periodo_escolar];

                      if (!estudiante) return null;

                      return (
                        <div
                          key={inscripcion.id}
                          className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50"
                        >
                          <Checkbox
                            id={inscripcion.id}
                            checked={selectedInscripciones.includes(inscripcion.id!)}
                            onCheckedChange={() =>
                              handleInscripcionToggle(inscripcion.id!)
                            }
                          />
                          <label
                            htmlFor={inscripcion.id}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="font-medium">
                              {estudiante.tipo_cedula}-{estudiante.cedula} -{" "}
                              {estudiante.nombres} {estudiante.apellidos}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {seccion && (
                                <>
                                  {seccion.grado_año}° {seccion.nivel_educativo} {seccion.seccion}
                                  {" • "}
                                </>
                              )}
                              {periodo?.periodo || "Sin periodo"}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || selectedInscripciones.length === 0}
            variant="destructive"
          >
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            <UserX2 className="mr-2 h-4 w-4" />
            Retirar {selectedInscripciones.length} Estudiante(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
