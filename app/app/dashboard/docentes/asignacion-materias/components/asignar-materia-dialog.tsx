"use client";

import React, { useMemo, useState } from "react";
import { User } from "@/interfaces/users.interface";
import {
  Materias,
  AsignacionDocenteMateria,
} from "@/interfaces/materias.interface";
import { Secciones } from "@/interfaces/secciones.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { addDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

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
import { NotebookPen, Loader2 } from "lucide-react";

export interface AsignarMateriaDialogProps {
  docente: User;
  materias: Materias[];
  secciones: Secciones[];
  periodos: PeriodosEscolares[];
  asignacionesDocente: AsignacionDocenteMateria[];
  todasLasAsignaciones: AsignacionDocenteMateria[];
  onAsignacionCreada: () => Promise<void> | void;
}

export const AsignarMateriaDialog: React.FC<AsignarMateriaDialogProps> = ({
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
  const [materiaId, setMateriaId] = useState<string>("");
  const [seccionesIds, setSeccionesIds] = useState<string[]>([]);
  const [seccionIdSeleccionada, setSeccionIdSeleccionada] =
    useState<string>("");
  const [periodoId, setPeriodoId] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");

  const seccionesOcupadas = useMemo(() => {
    const usadas = new Set<string>();
    if (!materiaId) return usadas;

    todasLasAsignaciones
      .filter((a) => {
        if (a.materia_id !== materiaId) return false;
        if (!periodoId) return true;
        return a.periodo_escolar_id === periodoId;
      })
      .forEach((a) => {
        (a.secciones_id || []).forEach((id) => usadas.add(id));
      });

    return usadas;
  }, [todasLasAsignaciones, materiaId, periodoId]);

  const handleSubmit = async () => {
    if (!docente?.id) {
      showToast.error("Docente inválido");
      return;
    }
    if (!materiaId || seccionesIds.length === 0 || !periodoId) {
      showToast.error(
        "Debe seleccionar materia, al menos una sección y período escolar"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AsignacionDocenteMateria = {
        docente_id: docente.id,
        materia_id: materiaId,
        secciones_id: seccionesIds,
        periodo_escolar_id: periodoId,
        estado: "activa",
        fecha_asignacion: new Date().toISOString(),
        observaciones: observaciones || "",
      };

      await addDocument("asignaciones_docente_materia", {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      showToast.success("Materia asignada al docente correctamente");
      await onAsignacionCreada();

      setMateriaId("");
      setSeccionesIds([]);
      setSeccionIdSeleccionada("");
      setPeriodoId("");
      setObservaciones("");
      setOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al asignar la materia";
      showToast.error(message, {
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
                Período Escolar
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
              <label className="mb-1 block text-sm font-medium">Materia</label>
              <Select
                value={materiaId}
                onValueChange={(value) => setMateriaId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una materia" />
                </SelectTrigger>
                <SelectContent>
                  {materias
                    .filter((m) => m.nivel_educativo === "media_general")
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id as string}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Secciones
              </label>
              <div className="flex gap-2">
                <Select
                  value={seccionIdSeleccionada}
                  onValueChange={(value) => setSeccionIdSeleccionada(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {secciones
                      .filter((s) => {
                        const id = s.id as string;
                        if (!id) return false;
                        if (s.nivel_educativo !== "Año") return false;
                        if (seccionesOcupadas.has(id)) return false;
                        if (seccionesIds.includes(id)) return false;
                        return true;
                      })
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id as string}>
                          {s.grado_año}° "{s.seccion}" - {s.turno}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!seccionIdSeleccionada) return;
                    if (seccionesIds.includes(seccionIdSeleccionada)) return;
                    if (seccionesOcupadas.has(seccionIdSeleccionada)) return;
                    setSeccionesIds((prev) => [...prev, seccionIdSeleccionada]);
                    setSeccionIdSeleccionada("");
                  }}
                  disabled={!seccionIdSeleccionada}
                >
                  Agregar
                </Button>
              </div>

              {seccionesIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {seccionesIds.map((id) => {
                    const seccion = secciones.find((s) => s.id === id);
                    const label = seccion
                      ? `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.turno}`
                      : id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setSeccionesIds((prev) =>
                            prev.filter((prevId) => prevId !== id)
                          )
                        }
                        className="px-2 py-1 rounded-full bg-blue-50 border border-blue-300 text-xs text-blue-800 hover:bg-blue-100"
                      >
                        {label}
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
