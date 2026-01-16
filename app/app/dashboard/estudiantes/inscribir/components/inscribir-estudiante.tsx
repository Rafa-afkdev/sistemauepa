/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardEdit, LoaderCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as React from "react";
import { InscripcionSeccion, Secciones } from "@/interfaces/secciones.interface";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { where, Timestamp } from "firebase/firestore";
import { addDocument, getCollection, updateDocument, getDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface InscribirEstudianteProps {
  children: React.ReactNode;
  getInscripciones: () => Promise<void>;
}

export function InscribirEstudiante({
  children,
  getInscripciones,
}: InscribirEstudianteProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [selectedEstudiantes, setSelectedEstudiantes] = useState<string[]>([]);
  const [selectedSeccion, setSelectedSeccion] = useState<string>("");
  const [estudiantesInscritosIds, setEstudiantesInscritosIds] = useState<string[]>([]);
  const [loadingInscritos, setLoadingInscritos] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [estudiantesConInscripcionActiva, setEstudiantesConInscripcionActiva] = useState<Map<string, { seccion: string; nivel: string }>>(new Map());

  // Obtener estudiantes activos
  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        const estudiantesData = (await getCollection("estudiantes", [
          // where("estado", "==", "activo"),
        ])) as Estudiantes[];
        setEstudiantes(estudiantesData);
      } catch (error) {
        showToast.error("Error al cargar estudiantes");
      }
    };

    if (open) fetchEstudiantes();
  }, [open]);

  // Obtener secciones activas
  useEffect(() => {
    const fetchSecciones = async () => {
      try {
        const seccionesData = (await getCollection("secciones", [
          where("estado", "==", "activa"),
        ])) as Secciones[];
        setSecciones(seccionesData);
      } catch (error: any) {
        showToast.error("Error al cargar secciones");
      }
    };

    if (open) {
      fetchSecciones();
    }
  }, [open]);

  // Cargar todos los estudiantes con inscripción activa en el período escolar actual
  useEffect(() => {
    const fetchInscripcionesActivasPeriodo = async () => {
      if (!open || secciones.length === 0) {
        setEstudiantesConInscripcionActiva(new Map());
        return;
      }

      try {
        setLoadingInscritos(true);

        // Obtener el id_periodo_escolar de las secciones activas (todas deberían tener el mismo)
        const periodosEscolaresIds = [...new Set(secciones.map(s => s.id_periodo_escolar))];

        // Obtener todas las inscripciones activas de estos períodos
        const todasInscripcionesActivas: InscripcionSeccion[] = [];

        for (const periodoId of periodosEscolaresIds) {
          const inscripciones = (await getCollection("estudiantes_inscritos", [
            where("id_periodo_escolar", "==", periodoId),
            where("estado", "==", "activo"),
          ])) as InscripcionSeccion[];
          todasInscripcionesActivas.push(...inscripciones);
        }

        // Crear mapa de estudiantes con inscripción activa
        const mapaInscripciones = new Map<string, { seccion: string; nivel: string }>();

        for (const inscripcion of todasInscripcionesActivas) {
          const seccionInfo = secciones.find(s => s.id === inscripcion.id_seccion);
          if (seccionInfo) {
            mapaInscripciones.set(inscripcion.id_estudiante, {
              seccion: `${seccionInfo.grado_año}° ${seccionInfo.nivel_educativo} - ${seccionInfo.seccion}`,
              nivel: seccionInfo.nivel_educativo
            });
          } else {
            // Si la sección no está en las activas, obtener info básica
            mapaInscripciones.set(inscripcion.id_estudiante, {
              seccion: inscripcion.nivel_educativo,
              nivel: inscripcion.nivel_educativo
            });
          }
        }

        setEstudiantesConInscripcionActiva(mapaInscripciones);
      } catch (error) {
        console.error("Error al cargar inscripciones activas:", error);
        setEstudiantesConInscripcionActiva(new Map());
      } finally {
        setLoadingInscritos(false);
      }
    };

    fetchInscripcionesActivasPeriodo();
  }, [open, secciones]);

  // Cargar IDs de estudiantes ya inscritos en la sección seleccionada
  useEffect(() => {
    const fetchInscritosSeccion = async () => {
      try {
        setLoadingInscritos(true);
        if (!open || !selectedSeccion) {
          setEstudiantesInscritosIds([]);
          setLoadingInscritos(false);
          return;
        }
        const yaInscritos = (await getCollection("estudiantes_inscritos", [
          where("id_seccion", "==", selectedSeccion),
        ])) as InscripcionSeccion[];
        setEstudiantesInscritosIds(yaInscritos.map((i) => i.id_estudiante));
      } catch (error) {
        setEstudiantesInscritosIds([]);
      } finally {
        setLoadingInscritos(false);
      }
    };

    fetchInscritosSeccion();
  }, [open, selectedSeccion]);

  // Limpiar selecciones cuando cambia la sección
  useEffect(() => {
    setSelectedEstudiantes([]);
  }, [selectedSeccion]);

  const handleEstudianteToggle = (estudianteId: string) => {
    setSelectedEstudiantes((prev) =>
      prev.includes(estudianteId)
        ? prev.filter((id) => id !== estudianteId)
        : [...prev, estudianteId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredEstudiantes.map((e) => e.id!);
    if (selectedEstudiantes.length === filteredIds.length) {
      setSelectedEstudiantes([]);
    } else {
      setSelectedEstudiantes(filteredIds);
    }
  };

  const filteredEstudiantes = estudiantes.filter((estudiante) => {
    const matchesSearch =
      estudiante.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.cedula.toString().includes(searchTerm);

    // Verificar si el estudiante ya tiene inscripción activa en el período escolar actual
    const noTieneInscripcionActiva = !estudiantesConInscripcionActiva.has(estudiante.id!);

    return matchesSearch && noTieneInscripcionActiva;
  });

  // Obtener información de inscripción activa para mostrar al usuario
  const getInfoInscripcionActiva = (estudianteId: string) => {
    return estudiantesConInscripcionActiva.get(estudianteId);
  };

  const onSubmit = async () => {
    if (selectedEstudiantes.length === 0) {
      showToast.error("Debes seleccionar al menos un estudiante");
      return;
    }

    if (!selectedSeccion) {
      showToast.error("Debes seleccionar una sección");
      return;
    }

    await InscribirEstudiantes();
  };

  const InscribirEstudiantes = async () => {
    setIsLoading(true);

    try {
      // Obtener datos de la sección seleccionada
      const seccion = (await getDocument(
        `secciones/${selectedSeccion}`
      )) as Secciones;

      if (!seccion) {
        showToast.error("Sección no encontrada");
        setIsLoading(false);
        return;
      }

      // Obtener el lapso ACTIVO para asociarlo a la inscripción
      const lapsoActivo = (await getCollection("lapsos", [
        where("status", "==", "ACTIVO"),
      ])) as any[];

      if (!lapsoActivo || lapsoActivo.length === 0) {
        showToast.error("No hay un lapso ACTIVO. Debes activar un lapso para inscribir estudiantes.");
        setIsLoading(false);
        return;
      }

      const idLapsoActivo = lapsoActivo[0].id as string;

      // Verificar capacidad
      const nuevosInscritos =
        (seccion.estudiantes_inscritos || 0) + selectedEstudiantes.length;
      if (nuevosInscritos > seccion.limite_estudiantes) {
        showToast.error(
          `La sección no tiene capacidad suficiente. Disponibles: ${seccion.limite_estudiantes - (seccion.estudiantes_inscritos || 0)
          }`
        );
        setIsLoading(false);
        return;
      }

      // VALIDACIÓN CRÍTICA: Verificar que ningún estudiante ya tiene inscripción activa en el período escolar
      const inscripcionesActivasPeriodo = (await getCollection("estudiantes_inscritos", [
        where("id_periodo_escolar", "==", seccion.id_periodo_escolar),
        where("estado", "==", "activo"),
      ])) as InscripcionSeccion[];

      const estudiantesYaInscritosPeriodo = inscripcionesActivasPeriodo
        .filter(insc => selectedEstudiantes.includes(insc.id_estudiante))
        .map(insc => insc.id_estudiante);

      if (estudiantesYaInscritosPeriodo.length > 0) {
        // Obtener nombres de los estudiantes que ya están inscritos
        const nombresYaInscritos = estudiantes
          .filter(e => estudiantesYaInscritosPeriodo.includes(e.id!))
          .map(e => `${e.nombres} ${e.apellidos}`)
          .join(", ");

        showToast.error(
          `Los siguientes estudiantes ya tienen inscripción activa en este período escolar: ${nombresYaInscritos}`,
          { duration: 5000 }
        );
        setIsLoading(false);
        return;
      }

      // Obtener todas las inscripciones de esta sección (activas y retiradas)
      const inscripcionesSeccion = (await getCollection("estudiantes_inscritos", [
        where("id_seccion", "==", selectedSeccion),
      ])) as InscripcionSeccion[];

      // Crear un mapa de inscripciones existentes por id_estudiante
      const inscripcionesMap = new Map<string, InscripcionSeccion>();
      inscripcionesSeccion.forEach((insc) => {
        inscripcionesMap.set(insc.id_estudiante, insc);
      });

      // Verificar si hay estudiantes con estado "activo" ya inscritos
      const estudiantesActivosYaInscritos = selectedEstudiantes.filter((estId) => {
        const inscripcion = inscripcionesMap.get(estId);
        return inscripcion && inscripcion.estado === "activo";
      });

      if (estudiantesActivosYaInscritos.length > 0) {
        showToast.error(
          "Algunos estudiantes ya están activos en esta sección"
        );
        setIsLoading(false);
        return;
      }

      // Separar estudiantes: los que tienen registro retirado vs los nuevos
      const estudiantesParaReactivar: string[] = [];
      const estudiantesNuevos: string[] = [];
      const estudiantesYaEnArray: string[] = []; // IDs que ya están en estudiantes_ids

      selectedEstudiantes.forEach((estId) => {
        const inscripcion = inscripcionesMap.get(estId);
        if (inscripcion && inscripcion.estado === "retirado") {
          estudiantesParaReactivar.push(estId);
          // Verificar si el ID ya está en el array de la sección
          if (seccion.estudiantes_ids?.includes(estId)) {
            estudiantesYaEnArray.push(estId);
          }
        } else if (!inscripcion) {
          estudiantesNuevos.push(estId);
        }
      });

      // Reactivar inscripciones existentes (cambiar estado de "retirado" a "activo")
      const reactivarPromises = estudiantesParaReactivar.map(async (estId) => {
        const inscripcion = inscripcionesMap.get(estId)!;
        return updateDocument(`estudiantes_inscritos/${inscripcion.id}`, {
          estado: "activo",
          id_lapso: idLapsoActivo,
          fecha_inscripcion: Timestamp.now(),
        });
      });

      // Crear nuevas inscripciones para estudiantes sin registro previo
      const crearPromises = estudiantesNuevos.map(async (estudianteId) => {
        const inscripcion: Partial<InscripcionSeccion> = {
          id_estudiante: estudianteId,
          id_seccion: selectedSeccion,
          id_lapso: idLapsoActivo,
          nivel_educativo: seccion.nivel_educativo,
          id_periodo_escolar: seccion.id_periodo_escolar,
          fecha_inscripcion: Timestamp.now(),
          estado: "activo",
        };
        return addDocument("estudiantes_inscritos", inscripcion);
      });

      await Promise.all([...reactivarPromises, ...crearPromises]);

      // Actualizar la sección: agregar solo los IDs que no están ya en el array
      const estudiantesParaAgregar = selectedEstudiantes.filter(
        (estId) => !seccion.estudiantes_ids?.includes(estId)
      );

      const estudiantesIdsActualizados = [
        ...(seccion.estudiantes_ids || []),
        ...estudiantesParaAgregar,
      ];

      // Calcular el nuevo total de inscritos
      const nuevoTotalInscritos =
        (seccion.estudiantes_inscritos || 0) + estudiantesParaAgregar.length;

      await updateDocument(`secciones/${selectedSeccion}`, {
        estudiantes_inscritos: nuevoTotalInscritos,
        estudiantes_ids: estudiantesIdsActualizados,
      });

      showToast.success(
        `${selectedEstudiantes.length} estudiante(s) inscrito(s) exitosamente`
      );
      getInscripciones();
      setOpen(false);
      setSelectedEstudiantes([]);
      setSelectedSeccion("");
      setSearchTerm("");
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Inscribir Estudiantes</DialogTitle>
          <DialogDescription>
            Selecciona los estudiantes y la sección para inscribirlos
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Selección de Sección */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="seccion" className="text-right">
              Sección
            </Label>
            <div className="col-span-3">
              <Select value={selectedSeccion} onValueChange={setSelectedSeccion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Secciones Activas</SelectLabel>
                    {secciones.map((seccion) => (
                      <SelectItem key={seccion.id} value={seccion.id!}>
                        {seccion.grado_año}° {seccion.nivel_educativo} - {seccion.seccion} (Disponibles: {seccion.limite_estudiantes - (seccion.estudiantes_inscritos || 0)})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Búsqueda de estudiantes */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search" className="text-right">
              Buscar
            </Label>
            <div className="col-span-3">
              <Input
                id="search"
                placeholder="Buscar por nombre, apellido o cédula..."
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
                    selectedEstudiantes.length === filteredEstudiantes.length &&
                    filteredEstudiantes.length > 0
                  }
                  disabled={loadingInscritos}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Seleccionar todos ({selectedEstudiantes.length} de{" "}
                  {filteredEstudiantes.length})
                </label>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {filteredEstudiantes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No se encontraron estudiantes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredEstudiantes.map((estudiante) => (
                      <div
                        key={estudiante.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={estudiante.id}
                          checked={selectedEstudiantes.includes(estudiante.id!)}
                          disabled={loadingInscritos}
                          onCheckedChange={() =>
                            handleEstudianteToggle(estudiante.id!)
                          }
                        />
                        <label
                          htmlFor={estudiante.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {estudiante.tipo_cedula}-{estudiante.cedula} -{" "}
                          {estudiante.nombres} {estudiante.apellidos}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || selectedEstudiantes.length === 0}
          >
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            <ClipboardEdit className="mr-2 h-4 w-4" />
            Inscribir {selectedEstudiantes.length} Estudiante(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
