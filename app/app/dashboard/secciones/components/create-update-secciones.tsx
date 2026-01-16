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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardEdit, LoaderCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { Secciones } from "@/interfaces/secciones.interface";
import { collection, getDocs, query, where } from "firebase/firestore";
import { User } from "@/interfaces/users.interface";
import { addDocument, db, updateDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

interface CreateUpdateSeccionesProps {
  children: React.ReactNode;
  seccionToUpdate?: Secciones;
  getSecciones: () => Promise<void>;
}

export function CreateUpdateSecciones({
  children,
  seccionToUpdate,
  getSecciones,
}: CreateUpdateSeccionesProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [docentes, setDocentes] = useState<User[]>([]);
  const [seccionesExistentes, setSeccionesExistentes] = useState<Secciones[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [activePeriodos, setActivePeriodos] = useState<{
    active: { id: string;[key: string]: any }[];
    inactive: { id: string;[key: string]: any }[];
  }>({
    active: [],
    inactive: [],
  });

  // Obtener docentes y secciones existentes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener docentes
        const qDocentes = query(
          collection(db, "users"),
          where("rol", "in", ["DOCENTE", "docente"])
        );
        const docentesSnapshot = await getDocs(qDocentes);
        const docentesData = docentesSnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid,
          cedula: doc.data().cedula,
          name: doc.data().name,
          apellidos: doc.data().apellidos,
          email: doc.data().email,
          rol: doc.data().rol,
          status: doc.data().status,
          password: doc.data().password || "",
          createdAt: doc.data().createdAt || new Date().toISOString(),
        }));
        setDocentes(docentesData);

        // Obtener todas las secciones
        const qSecciones = query(collection(db, "secciones"));
        const seccionesSnapshot = await getDocs(qSecciones);
        const seccionesData = seccionesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Secciones[];
        setSeccionesExistentes(seccionesData);
      } catch (error) {
        showToast.error("Error al cargar datos");
      }
    };

    if (open) fetchData();
  }, [open]);

  // Fetch active school periods
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const q = query(collection(db, "periodos_escolares"));
        const querySnapshot = await getDocs(q);

        const periods = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const active = periods.filter(
          (periodo: any) => periodo.status === "ACTIVO"
        );
        const inactive = periods.filter(
          (periodo: any) => periodo.status === "INACTIVO"
        );

        setActivePeriodos({
          active,
          inactive,
        });
      } catch (error: any) {
        showToast.error("Error al cargar periodos escolares");
      }
    };

    if (open) {
      fetchPeriodos();
    }
  }, [open]);

  // Esquema de validación para el interface Secciones
  const formSchema = z.object({
    nivel_educativo: z.string().min(1, "El nivel educativo es requerido"),
    grado_año: z.string().min(1, "El grado/año es requerido."),
    seccion: z.string().min(1, "La sección es requerida."),
    id_periodo_escolar: z.string().min(1, "El periodo escolar es requerido"),
    docente_guia_id: z.string().optional(),
    limite_estudiantes: z.number().min(1, "El límite mínimo es 1").max(999, "El límite máximo es 999"),
    estudiantes_inscritos: z.number().min(0, "No puede ser negativo"),
    estado: z.string().min(1, "El estado es requerido"),
    turno: z.string().optional(),
    aula: z.string().optional(),
    estudiantes_ids: z.array(z.string()),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: seccionToUpdate
      ? {
        nivel_educativo: seccionToUpdate.nivel_educativo,
        grado_año: seccionToUpdate.grado_año,
        seccion: seccionToUpdate.seccion,
        id_periodo_escolar: seccionToUpdate.id_periodo_escolar,
        docente_guia_id: seccionToUpdate.docente_guia_id || undefined,
        limite_estudiantes: seccionToUpdate.limite_estudiantes,
        estudiantes_inscritos: seccionToUpdate.estudiantes_inscritos,
        estado: seccionToUpdate.estado,
        turno: seccionToUpdate.turno || undefined,
        aula: seccionToUpdate.aula || undefined,
        estudiantes_ids: seccionToUpdate.estudiantes_ids || [],
      }
      : {
        nivel_educativo: "Grado",
        grado_año: "",
        seccion: "",
        id_periodo_escolar: "",
        docente_guia_id: undefined,
        limite_estudiantes: 0,
        estudiantes_inscritos: 0,
        estado: "activa",
        turno: undefined,
        aula: undefined,
        estudiantes_ids: [],
      },
  });

  const { register, handleSubmit, formState, watch } = form;
  const { errors } = formState;

  // Obtener el nivel educativo actual del formulario
  const nivelEducativoActual = watch("nivel_educativo");
  const periodoEscolarActual = watch("id_periodo_escolar");

  // Filtrar docentes disponibles (que no sean tutores en el nivel académico específico)
  const docentesDisponibles = React.useMemo(() => {
    if (!nivelEducativoActual || !periodoEscolarActual) return docentes;

    // Obtener IDs de docentes que ya son tutores en este nivel y período
    const docentesTutoresIds = new Set(
      seccionesExistentes
        .filter((seccion) => {
          // Excluir la sección actual si estamos editando
          if (seccionToUpdate && seccion.id === seccionToUpdate.id) return false;
          return (
            seccion.nivel_educativo === nivelEducativoActual &&
            seccion.id_periodo_escolar === periodoEscolarActual &&
            seccion.docente_guia_id
          );
        })
        .map((seccion) => seccion.docente_guia_id)
    );

    // Filtrar docentes que no están en la lista de tutores
    return docentes.filter((docente) => !docentesTutoresIds.has(docente.id));
  }, [docentes, seccionesExistentes, nivelEducativoActual, periodoEscolarActual, seccionToUpdate]);

  // FUNCIÓN DE SUBMIT
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const payload: Partial<Secciones> = {
      nivel_educativo: data.nivel_educativo,
      grado_año: data.grado_año,
      seccion: data.seccion,
      id_periodo_escolar: data.id_periodo_escolar,
      docente_guia_id: data.docente_guia_id || undefined,
      limite_estudiantes: data.limite_estudiantes,
      estudiantes_inscritos: data.estudiantes_inscritos,
      estado: data.estado,
      turno: data.turno || undefined,
      aula: data.aula || undefined,
      estudiantes_ids: data.estudiantes_ids || [],
    };

    if (seccionToUpdate) {
      await UpdateSeccion(payload as Secciones);
    } else {
      await CreateSeccion(payload as Secciones);
    }
  };

  // CREAR UNA SECCION EN LA DATABASE
  const CreateSeccion = async (seccion: Secciones) => {
    const path = `secciones`;
    setIsLoading(true);

    try {
      const normalizedSecciones: Partial<Secciones> = {
        nivel_educativo: seccion.nivel_educativo,
        grado_año: seccion.grado_año.trim(),
        seccion: seccion.seccion.trim().toUpperCase(),
        id_periodo_escolar: seccion.id_periodo_escolar,
        docente_guia_id: seccion.docente_guia_id || undefined,
        limite_estudiantes: Number(seccion.limite_estudiantes),
        estudiantes_inscritos: seccion.estudiantes_inscritos
          ? Number(seccion.estudiantes_inscritos)
          : 0,
        estudiantes_ids: seccion.estudiantes_ids || [],
        estado: seccion.estado,
        turno: seccion.turno || undefined,
        aula: seccion.aula || undefined,
      };

      // Verificar duplicado por nivel/grado/sección/periodo
      const q = query(
        collection(db, "secciones"),
        where("nivel_educativo", "==", normalizedSecciones.nivel_educativo),
        where("grado_año", "==", normalizedSecciones.grado_año),
        where("seccion", "==", normalizedSecciones.seccion),
        where("id_periodo_escolar", "==", normalizedSecciones.id_periodo_escolar)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        showToast.error(
          "Ya existe una sección con este nivel, grado/año, sección y periodo escolar"
        );
        setIsLoading(false);
        return;
      }

      // Verificar docente duplicado solo si hay docente_guia_id
      // Un docente puede ser tutor en diferentes niveles académicos, pero no en múltiples secciones del mismo nivel
      if (normalizedSecciones.docente_guia_id) {
        const docenteQuery = query(
          collection(db, "secciones"),
          where("docente_guia_id", "==", normalizedSecciones.docente_guia_id),
          where("id_periodo_escolar", "==", normalizedSecciones.id_periodo_escolar),
          where("nivel_educativo", "==", normalizedSecciones.nivel_educativo)
        );

        const docenteSnapshot = await getDocs(docenteQuery);

        if (!docenteSnapshot.empty) {
          showToast.error(
            "Este docente ya está asignado como tutor en otra sección del mismo nivel académico"
          );
          setIsLoading(false);
          return;
        }
      }

      if (
        normalizedSecciones.limite_estudiantes! <
        normalizedSecciones.estudiantes_inscritos!
      ) {
        showToast.error(
          "El límite no puede ser menor que la cantidad de inscritos"
        );
        setIsLoading(false);
        return;
      }

      await addDocument(path, normalizedSecciones);
      showToast.success("La sección fue creada exitosamente");
      getSecciones();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // ACTUALIZAR UNA SECCION EN LA DATABASE
  const UpdateSeccion = async (seccion: Secciones) => {
    const path = `secciones/${seccionToUpdate?.id}`;
    setIsLoading(true);

    try {
      const normalizedSecciones: Partial<Secciones> = {
        nivel_educativo: seccion.nivel_educativo,
        grado_año: seccion.grado_año.trim(),
        seccion: seccion.seccion.trim().toUpperCase(),
        id_periodo_escolar: seccion.id_periodo_escolar,
        docente_guia_id: seccion.docente_guia_id || undefined,
        limite_estudiantes: Number(seccion.limite_estudiantes),
        estudiantes_inscritos: seccion.estudiantes_inscritos
          ? Number(seccion.estudiantes_inscritos)
          : 0,
        estudiantes_ids: seccion.estudiantes_ids || [],
        estado: seccion.estado,
        turno: seccion.turno || undefined,
        aula: seccion.aula || undefined,
      };

      if (
        normalizedSecciones.limite_estudiantes! <
        normalizedSecciones.estudiantes_inscritos!
      ) {
        showToast.error(
          "El límite no puede ser menor que la cantidad de inscritos"
        );
        setIsLoading(false);
        return;
      }

      // Verificar docente duplicado solo si hay docente_guia_id
      // Un docente puede ser tutor en diferentes niveles académicos, pero no en múltiples secciones del mismo nivel
      if (normalizedSecciones.docente_guia_id) {
        const docenteQuery = query(
          collection(db, "secciones"),
          where("docente_guia_id", "==", normalizedSecciones.docente_guia_id),
          where("id_periodo_escolar", "==", normalizedSecciones.id_periodo_escolar),
          where("nivel_educativo", "==", normalizedSecciones.nivel_educativo)
        );

        const docenteSnapshot = await getDocs(docenteQuery);
        const isDocenteDuplicado = docenteSnapshot.docs.some(
          (doc) => doc.id !== seccionToUpdate?.id
        );

        if (isDocenteDuplicado) {
          showToast.error(
            "Este docente ya está asignado como tutor en otra sección del mismo nivel académico"
          );
          setIsLoading(false);
          return;
        }
      }

      // Verificar duplicado
      const q = query(
        collection(db, "secciones"),
        where("nivel_educativo", "==", normalizedSecciones.nivel_educativo),
        where("grado_año", "==", normalizedSecciones.grado_año),
        where("seccion", "==", normalizedSecciones.seccion),
        where("id_periodo_escolar", "==", normalizedSecciones.id_periodo_escolar)
      );

      const querySnapshot = await getDocs(q);
      const isDuplicate = querySnapshot.docs.some(
        (doc) => doc.id !== seccionToUpdate?.id
      );

      if (isDuplicate) {
        showToast.error(
          "Ya existe una sección con este nivel, grado/año, sección y periodo escolar"
        );
        setIsLoading(false);
        return;
      }

      await updateDocument(path, normalizedSecciones);
      showToast.success("La sección fue actualizada exitosamente");
      getSecciones();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {seccionToUpdate ? "Actualizar Sección" : "Crear Sección"}
            </DialogTitle>
            <DialogDescription>
              {seccionToUpdate
                ? "Por favor, llena los campos para actualizar los datos de la sección"
                : "Por favor, llena los campos para crear una nueva sección."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-8">
            <div className="space-y-4">
              {/* Nivel Educativo */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="nivel_educativo" className="text-right">
                  Nivel
                </Label>
                <div className="col-span-2">
                  <Select
                    value={form.watch("nivel_educativo")}
                    onValueChange={(value: "Grado" | "Año") => {
                      form.setValue("nivel_educativo", value, {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Grado">Educacion Primaria</SelectItem>
                        <SelectItem value="Año">Educacion Media</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.nivel_educativo && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.nivel_educativo.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Grado/Año */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="grado_año" className="text-right">
                  Grado/Año
                </Label>
                <div className="col-span-2">
                  <Input
                    {...register("grado_año")}
                    id="grado_año"
                    type="text"
                    placeholder="Ej: 1, 2, 3..."
                    onBlur={() => form.trigger("grado_año")}
                  />
                  {errors.grado_año && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.grado_año.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Sección */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="seccion" className="text-right">
                  Sección
                </Label>
                <div className="col-span-2">
                  <Select
                    value={form.watch("seccion")}
                    onValueChange={(value: string) => {
                      form.setValue("seccion", value, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una Sección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Secciones</SelectLabel>
                        {["A", "B", "C", "D", "E", "F"].map((letra) => (
                          <SelectItem key={letra} value={letra}>
                            {letra}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.seccion && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.seccion.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Límite de estudiantes */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="limite_estudiantes" className="text-right">
                  Límite
                </Label>
                <div className="col-span-2">
                  <Input
                    {...register("limite_estudiantes", { valueAsNumber: true })}
                    id="limite_estudiantes"
                    type="number"
                    inputMode="numeric"
                    placeholder="Capacidad máxima"
                    maxLength={3}
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value.length > 3) {
                        input.value = input.value.slice(0, 3);
                      }
                    }}
                    onBlur={() => form.trigger("limite_estudiantes")}
                  />
                  {errors.limite_estudiantes && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.limite_estudiantes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Periodo Escolar */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="id_periodo_escolar" className="text-right">
                  Periodo Escolar
                </Label>
                <div className="col-span-2">
                  <Select
                    value={form.watch("id_periodo_escolar")}
                    onValueChange={(value: string) => {
                      form.setValue("id_periodo_escolar", value, {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona Periodo Escolar" />
                    </SelectTrigger>
                    <SelectContent className="overflow-y-auto max-h-[200px]">
                      <SelectGroup>
                        <SelectLabel>Periodo Activo</SelectLabel>
                        {activePeriodos.active.map((periodo: any) => (
                          <SelectItem key={periodo.id} value={periodo.id}>
                            {periodo.periodo}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Otros Periodos</SelectLabel>
                        {activePeriodos.inactive.map((periodo: any) => (
                          <SelectItem key={periodo.id} value={periodo.id}>
                            {periodo.periodo}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.id_periodo_escolar && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.id_periodo_escolar.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Docente Tutor */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="docente_guia_id" className="text-right">
                  Docente Tutor
                </Label>
                <div className="col-span-2">
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                        type="button"
                      >
                        {form.watch("docente_guia_id")
                          ? (() => {
                            const selectedDocente = docentes.find(
                              (d) => d.id === form.watch("docente_guia_id")
                            );
                            return selectedDocente
                              ? `${selectedDocente.name} ${selectedDocente.apellidos}`
                              : "Selecciona un docente (Obligatorio)";
                          })()
                          : "Selecciona un docente (Obligatorio)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar docente..." />
                        <CommandList>
                          <CommandEmpty>No se encontró ningún docente.</CommandEmpty>
                          <CommandGroup>
                            {/* Opción para quitar docente tutor */}
                            {form.watch("docente_guia_id") && (
                              <CommandItem
                                value="sin-docente-tutor"
                                onSelect={() => {
                                  form.setValue("docente_guia_id", undefined, {
                                    shouldValidate: true,
                                  });
                                  setOpenCombobox(false);
                                }}
                                className="text-red-600 border-b mb-2"
                              >
                                <Check className="mr-2 h-4 w-4 opacity-0" />
                                <div className="flex flex-col">
                                  <span className="font-medium">✕ Quitar docente tutor</span>
                                  <span className="text-xs text-muted-foreground">
                                    Esta sección quedará sin docente guía asignado
                                  </span>
                                </div>
                              </CommandItem>
                            )}
                            {!nivelEducativoActual || !periodoEscolarActual ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Seleccione nivel educativo y período escolar primero
                              </div>
                            ) : docentesDisponibles.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No hay docentes disponibles para este nivel
                              </div>
                            ) : (
                              docentesDisponibles.map((docente) => (
                                <CommandItem
                                  key={docente.id}
                                  value={`${docente.name} ${docente.apellidos} ${docente.cedula}`}
                                  onSelect={() => {
                                    form.setValue(
                                      "docente_guia_id",
                                      docente.id,
                                      { shouldValidate: true }
                                    );
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.watch("docente_guia_id") === docente.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>
                                      {docente.name} {docente.apellidos}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      C.I: {docente.cedula}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.docente_guia_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.docente_guia_id.message}
                    </p>
                  )}
                  {nivelEducativoActual && periodoEscolarActual && docentesDisponibles.length < docentes.length && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {docentes.length - docentesDisponibles.length} docente(s) ya asignado(s) como tutor(es) en {nivelEducativoActual === "Grado" ? "Educación Primaria" : "Media General"}
                    </p>
                  )}
                </div>
              </div>

              {/* Turno (Opcional) */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="turno" className="text-right">
                  Turno
                </Label>
                <div className="col-span-2">
                  <Select
                    value={form.watch("turno")}
                    onValueChange={(value: string) => {
                      form.setValue("turno", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un turno (Obligatorio)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Mañana">Mañana</SelectItem>
                        <SelectItem value="Tarde">Tarde</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aula (Opcional) */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="aula" className="text-right">
                  Aula
                </Label>
                <div className="col-span-2">
                  <Input
                    {...register("aula")}
                    id="aula"
                    type="text"
                    placeholder="Ej: 101, Aula A (Obligatorio)"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              <ClipboardEdit className="mr-2 h-4 w-4" />
              {seccionToUpdate ? "Actualizar Sección" : "Crear Sección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}