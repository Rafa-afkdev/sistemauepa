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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Materias } from "@/interfaces/materias.interface";
import { addDocument, getCollection, updateDocument } from "@/lib/data/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const GRADOS_PRIMARIA = ["1", "2", "3", "4", "5", "6"];
const GRADOS_MEDIA_GENERAL = ["1", "2", "3", "4", "5"];

const getGradosPorNivel = (nivel: string) => {
  if (nivel === "media_general") return GRADOS_MEDIA_GENERAL;
  return GRADOS_PRIMARIA;
};

interface CreateUpdateMateriasProps {
  children: React.ReactNode;
  materiaToUpdate?: Materias;
  getMaterias: () => Promise<void>;
}

const formSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido"),
  codigo: z.string().optional(),
  descripcion: z.string().optional(),
  nivel_educativo: z.string().min(1, "El nivel educativo es requerido"),
  grados_años: z.string().min(1, "Debe indicar al menos un grado/año"),
  es_obligatoria: z.string().min(1, "Indique si es obligatoria"),
  estado: z.string().min(1, "El estado es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateUpdateMaterias({
  children,
  materiaToUpdate,
  getMaterias,
}: CreateUpdateMateriasProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: materiaToUpdate
      ? {
          nombre: materiaToUpdate.nombre,
          codigo: materiaToUpdate.codigo || "",
          descripcion: materiaToUpdate.descripcion || "",
          nivel_educativo: materiaToUpdate.nivel_educativo,
          grados_años: (materiaToUpdate.grados_años || []).join(", "),
          es_obligatoria: materiaToUpdate.es_obligatoria ? "true" : "false",
          estado: materiaToUpdate.estado,
        }
      : {
          nombre: "",
          codigo: "",
          descripcion: "",
          nivel_educativo: "",
          grados_años: "",
          es_obligatoria: "true",
          estado: "activa",
        },
  });

  const { register, handleSubmit, formState, watch, setValue } = form;
  const { errors } = formState;

  const nivelEducativo = watch("nivel_educativo");

  const [selectedGrados, setSelectedGrados] = useState<string[]>(
    materiaToUpdate?.grados_años || []
  );
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>("");

  useEffect(() => {
    if (materiaToUpdate && materiaToUpdate.grados_años) {
      setSelectedGrados(materiaToUpdate.grados_años);
      setValue(
        "grados_años",
        materiaToUpdate.grados_años.join(", "),
        { shouldValidate: true }
      );
    } else {
      setSelectedGrados([]);
      setValue("grados_años", "", { shouldValidate: true });
    }
    setGradoSeleccionado("");
  }, [materiaToUpdate, open, setValue]);

  // Cuando cambia el nivel educativo, asegurarse de que los grados seleccionados
  // sigan siendo válidos (por ejemplo, quitar 6° si se cambia a media_general)
  useEffect(() => {
    const base = getGradosPorNivel(nivelEducativo);
    const sanitized = selectedGrados.filter((g) => base.includes(g));
    if (sanitized.length !== selectedGrados.length) {
      setSelectedGrados(sanitized);
      setValue("grados_años", sanitized.join(", "), { shouldValidate: true });
    }
  }, [nivelEducativo, selectedGrados, setValue]);

  const availableGrados = getGradosPorNivel(nivelEducativo).filter(
    (g) => !selectedGrados.includes(g)
  );

  const handleAddGrado = () => {
    if (!gradoSeleccionado) return;
    if (selectedGrados.includes(gradoSeleccionado)) return;
    const updated = [...selectedGrados, gradoSeleccionado];
    setSelectedGrados(updated);
    setValue("grados_años", updated.join(", "), { shouldValidate: true });
    setGradoSeleccionado("");
  };

  const handleRemoveGrado = (grado: string) => {
    const updated = selectedGrados.filter((g) => g !== grado);
    setSelectedGrados(updated);
    setValue("grados_años", updated.join(", "), { shouldValidate: true });
  };

  const handleSelectAllGrados = () => {
    const todosLosGrados = getGradosPorNivel(nivelEducativo);
    setSelectedGrados(todosLosGrados);
    setValue("grados_años", todosLosGrados.join(", "), { shouldValidate: true });
    setGradoSeleccionado("");
  };

  const onSubmit = async (data: FormValues) => {
    const gradosArray = data.grados_años
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    const baseData: Materias = {
      nombre: data.nombre.toUpperCase(),
      codigo: data.codigo ? data.codigo.toUpperCase() : undefined,
      descripcion: data.descripcion || "",
      nivel_educativo: data.nivel_educativo,
      grados_años: gradosArray,
      es_obligatoria: data.es_obligatoria === "true",
      estado: data.estado,
    };

    if (materiaToUpdate?.id) {
      await updateMateria(materiaToUpdate.id, baseData, data);
    } else {
      await createMateria(baseData, data);
    }
  };

  const checkDuplicateNombre = async (
    nombre: string,
    currentId?: string
  ): Promise<boolean> => {
    try {
      const materias = await getCollection("materias");
      return materias.some(
        (m: any) =>
          (m.nombre || "").toString().toLowerCase() === nombre.toLowerCase() &&
          m.id !== currentId
      );
    } catch (error) {
      console.error("Error checking duplicate materia nombre:", error);
      return false;
    }
  };

  const createMateria = async (materia: Materias, raw: FormValues) => {
    setIsLoading(true);
    try {
      const isDuplicate = await checkDuplicateNombre(raw.nombre);
      if (isDuplicate) {
        showToast.error("Ya existe una materia con este nombre");
        setIsLoading(false);
        return;
      }

      const dataToSave = {
        ...materia,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDocument("materias", dataToSave);
      showToast.success("La materia fue registrada exitosamente");
      await getMaterias();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error?.message || "Error al registrar la materia", {
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMateria = async (
    materiaId: string,
    materia: Materias,
    raw: FormValues
  ) => {
    setIsLoading(true);
    try {
      const isDuplicate = await checkDuplicateNombre(raw.nombre, materiaId);
      if (isDuplicate) {
        showToast.error("Ya existe una materia con este nombre");
        setIsLoading(false);
        return;
      }

      const dataToSave = {
        ...materia,
        updatedAt: new Date(),
      };

      await updateDocument(`materias/${materiaId}`, dataToSave as any);
      showToast.success("La materia fue actualizada exitosamente");
      await getMaterias();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error?.message || "Error al actualizar la materia", {
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {materiaToUpdate ? "Actualizar Materia" : "Registrar Materia"}
            </DialogTitle>
            <DialogDescription>
              {materiaToUpdate
                ? "Actualiza los datos de la materia."
                : "Llena los campos para registrar una nueva materia."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Datos básicos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Datos de la Materia
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre" className="mb-2 block">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("nombre")}
                    id="nombre"
                    placeholder="Ej: Matemática"
                    maxLength={80}
                  />
                  {errors.nombre && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nombre.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="codigo" className="mb-2 block">
                    Código
                  </Label>
                  <Input
                    {...register("codigo")}
                    id="codigo"
                    placeholder="Ej: MAT-01"
                    maxLength={20}
                  />
                  {errors.codigo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.codigo.message as string}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="descripcion" className="mb-2 block">
                    Descripción
                  </Label>
                  <Input
                    {...register("descripcion")}
                    id="descripcion"
                    placeholder="Descripción breve de la materia (opcional)"
                    maxLength={200}
                  />
                  {errors.descripcion && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.descripcion.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración académica */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Configuración Académica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Nivel Educativo *</Label>
                  <Select
                    value={watch("nivel_educativo")}
                    onValueChange={(value) =>
                      setValue("nivel_educativo", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Niveles</SelectLabel>
                        <SelectItem value="primaria">Educación Primaria</SelectItem>
                        <SelectItem value="media_general">
                          Educación Media General
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.nivel_educativo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nivel_educativo.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="grados_años" className="mb-2 block">
                    Grados/Años <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={gradoSeleccionado}
                      onValueChange={(value) => setGradoSeleccionado(value)}
                      disabled={!nivelEducativo}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione grado/año" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Grados/Años</SelectLabel>
                          {availableGrados.map((grado) => (
                            <SelectItem key={grado} value={grado}>
                              {grado}°
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddGrado}
                      disabled={!gradoSeleccionado || !nivelEducativo}
                    >
                      Agregar
                    </Button>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSelectAllGrados}
                      disabled={!nivelEducativo || availableGrados.length === 0}
                      title="Seleccionar todos los grados"
                    >
                      Todos
                    </Button>
                  </div>
                  <input
                    type="hidden"
                    {...register("grados_años")}
                    id="grados_años"
                  />
                  {selectedGrados.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedGrados.map((grado) => (
                        <button
                          key={grado}
                          type="button"
                          onClick={() => handleRemoveGrado(grado)}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {grado}°
                          <span className="ml-1 text-red-600 font-bold">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.grados_años && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.grados_años.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Tipo de Materia *</Label>
                  <Select
                    value={watch("es_obligatoria")}
                    onValueChange={(value) =>
                      setValue("es_obligatoria", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tipo</SelectLabel>
                        <SelectItem value="true">Obligatoria</SelectItem>
                        <SelectItem value="false">Electiva</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.es_obligatoria && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.es_obligatoria.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Estado *</Label>
                  <Select
                    value={watch("estado")}
                    onValueChange={(value) =>
                      setValue("estado", value as "activa" | "inactiva", {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Estado</SelectLabel>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.estado && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.estado.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {materiaToUpdate ? "Actualizar" : "Registrar"}
              <Check />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
