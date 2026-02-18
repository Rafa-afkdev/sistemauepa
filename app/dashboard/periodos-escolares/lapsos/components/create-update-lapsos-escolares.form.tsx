/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
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
import { LoaderCircle, Calendar as CalendarIcon } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { Timestamp, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { addDocument, getCollection, updateDocument, db } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreateLapsoEscolarProps {
  children: React.ReactNode;
  getLapsosEscolares: () => Promise<void>;
  lapsoToUpdate?: LapsosEscolares;
}

export function CreateUpdateLapsoEscolar({
  children,
  getLapsosEscolares,
  lapsoToUpdate,
}: CreateLapsoEscolarProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);

  // Validation schema
  const formSchema = z.object({
    lapso: z.string().min(1, "El lapso es requerido"),
    año_escolar: z.string().min(1, "El periodo escolar es requerido"),
    status: z.string().min(1, "El estado es requerido"),
    fecha_inicio: z.date(),
    fecha_fin: z.date(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: lapsoToUpdate
      ? {
          lapso: lapsoToUpdate.lapso,
          año_escolar: lapsoToUpdate.año_escolar,
          status: lapsoToUpdate.status,
          fecha_inicio: lapsoToUpdate.fecha_inicio
            ? new Date(lapsoToUpdate.fecha_inicio)
            : undefined,
          fecha_fin: lapsoToUpdate.fecha_fin
            ? new Date(lapsoToUpdate.fecha_fin)
            : undefined,
        }
      : {
          lapso: "",
          año_escolar: "",
          status: "ACTIVO",
          fecha_inicio: undefined,
          fecha_fin: undefined,
        },
  });

  const { handleSubmit, formState, setValue, watch, reset } = form;
  const { errors } = formState;

  // Fetch periodos escolares
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const res = await getCollection("periodos_escolares", [
          orderBy("periodo", "desc")
        ]) as PeriodosEscolares[];
        
        const sortedPeriodos = res.sort((a, b) => {
          if (a.status === 'ACTIVO' && b.status !== 'ACTIVO') return -1;
          if (b.status === 'ACTIVO' && a.status !== 'ACTIVO') return 1;
          return a.periodo.localeCompare(b.periodo);
        });
        
        setPeriodosEscolares(sortedPeriodos);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPeriodos();
  }, []);

  // Reset form when dialog opens with update data
  useEffect(() => {
    if (open && lapsoToUpdate) {
      reset({
        lapso: lapsoToUpdate.lapso,
        año_escolar: lapsoToUpdate.año_escolar,
        status: lapsoToUpdate.status,
        fecha_inicio: lapsoToUpdate.fecha_inicio
          ? new Date(lapsoToUpdate.fecha_inicio)
          : undefined,
        fecha_fin: lapsoToUpdate.fecha_fin
          ? new Date(lapsoToUpdate.fecha_fin)
          : undefined,
      });
    } else if (open && !lapsoToUpdate) {
      reset({
        lapso: "",
        año_escolar: "",
        status: "ACTIVO",
        fecha_inicio: undefined,
        fecha_fin: undefined,
      });
    }
  }, [open, lapsoToUpdate, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const lapsoData: Omit<LapsosEscolares, "id"> = {
      lapso: data.lapso,
      año_escolar: data.año_escolar,
      status: data.status,
      fecha_inicio: format(data.fecha_inicio, "yyyy-MM-dd"),
      fecha_fin: format(data.fecha_fin, "yyyy-MM-dd"),
      createdAt: lapsoToUpdate?.createdAt || Timestamp.now(),
    };

    if (lapsoToUpdate) {
      await UpdateLapso(lapsoData);
    } else {
      await CreateLapso(lapsoData);
    }
  };

  // Check for duplicate lapso in the same periodo
  const checkDuplicateLapso = async (
    lapso: string,
    añoEscolar: string,
    currentLapsoId?: string
  ): Promise<boolean> => {
    try {
      const q = query(
        collection(db, "lapsos"),
        where("lapso", "==", lapso),
        where("año_escolar", "==", añoEscolar)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.some(
        (doc) => doc.id !== currentLapsoId
      );
    } catch (error) {
      console.error("Error checking duplicate lapso:", error);
      return false;
    }
  };

  const CreateLapso = async (lapso: Omit<LapsosEscolares, "id">) => {
    const path = `lapsos`;
    setIsLoading(true);
    try {
      // Check for duplicate lapso in same periodo
      const isDuplicate = await checkDuplicateLapso(lapso.lapso, lapso.año_escolar);
      if (isDuplicate) {
        showToast.error("Ya existe este lapso para el periodo escolar seleccionado");
        setIsLoading(false);
        return;
      }

      // Check if there's already an active lapso
      if (lapso.status === "ACTIVO") {
        const lapsos = await getCollection("lapsos");
        const activoExists = lapsos.some((l: any) => l.status === "ACTIVO");
        if (activoExists) {
          showToast.error("Ya existe un lapso activo.");
          setIsLoading(false);
          return;
        }
      }

      await addDocument(path, {
        ...lapso,
        createdAt: Timestamp.now(),
      });
      showToast.success("Lapso escolar creado exitosamente");
      getLapsosEscolares();
      setOpen(false);
      reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  const UpdateLapso = async (lapso: Omit<LapsosEscolares, "id">) => {
    if (!lapsoToUpdate?.id) return;
    const path = `lapsos/${lapsoToUpdate.id}`;
    setIsLoading(true);
    try {
      // Check for duplicate lapso in same periodo (excluding current)
      const isDuplicate = await checkDuplicateLapso(
        lapso.lapso,
        lapso.año_escolar,
        lapsoToUpdate.id
      );
      if (isDuplicate) {
        showToast.error("Ya existe este lapso para el periodo escolar seleccionado");
        setIsLoading(false);
        return;
      }

      // Check if there's already an active lapso (excluding current)
      if (lapso.status === "ACTIVO") {
        const lapsos = await getCollection("lapsos");
        const activoExists = lapsos.some(
          (l: any) => l.status === "ACTIVO" && l.id !== lapsoToUpdate.id
        );
        if (activoExists) {
          showToast.error("Ya existe un lapso activo.");
          setIsLoading(false);
          return;
        }
      }

      await updateDocument(path, {
        ...lapso,
        createdAt: lapsoToUpdate.createdAt,
      });
      showToast.success("Lapso escolar actualizado exitosamente");
      getLapsosEscolares();
      setOpen(false);
      reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // Get periodo name from ID
  const getPeriodoById = (periodoId: string) => {
    const periodo = periodosEscolares.find(p => p.id === periodoId);
    return periodo?.periodo || periodoId;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {lapsoToUpdate ? "Actualizar Lapso Escolar" : "Crear Nuevo Lapso Escolar"}
              </DialogTitle>
              <DialogDescription>
                Seleccione el lapso y el periodo escolar correspondiente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8">
              {/* Lapso Selection */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="lapso" className="text-right">
                  Lapso
                </Label>
                <div className="col-span-2">
                  <Select
                    value={watch("lapso")}
                    onValueChange={(value) => setValue("lapso", value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el lapso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="LAPSO 1">Lapso 1</SelectItem>
                        <SelectItem value="LAPSO 2">Lapso 2</SelectItem>
                        <SelectItem value="LAPSO 3">Lapso 3</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.lapso && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lapso.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha de Inicio */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">
                  Fecha Inicio
                </Label>
                <div className="col-span-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !watch("fecha_inicio") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("fecha_inicio") ? (
                          format(watch("fecha_inicio"), "PPP", { locale: es })
                        ) : (
                          <span>Seleccione la fecha de inicio</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("fecha_inicio")}
                        onSelect={(date) =>
                          setValue("fecha_inicio", date as Date, { shouldValidate: true })
                        }
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.fecha_inicio && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fecha_inicio.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha de Fin */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">
                  Fecha Fin
                </Label>
                <div className="col-span-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !watch("fecha_fin") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("fecha_fin") ? (
                          format(watch("fecha_fin"), "PPP", { locale: es })
                        ) : (
                          <span>Seleccione la fecha de fin</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("fecha_fin")}
                        onSelect={(date) =>
                          setValue("fecha_fin", date as Date, { shouldValidate: true })
                        }
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.fecha_fin && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fecha_fin.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Periodo Escolar Selection */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="año_escolar" className="text-right">
                  Periodo Escolar
                </Label>
                <div className="col-span-2">
                  <Select
                    value={watch("año_escolar")}
                    onValueChange={(value) => setValue("año_escolar", value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Periodo Activo</SelectLabel>
                        {periodosEscolares
                          .filter((periodo) => periodo.status === "ACTIVO")
                          .map((periodo) => (
                            <SelectItem key={periodo.id} value={periodo.id!}>
                              {periodo.periodo}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Otros Periodos</SelectLabel>
                        {periodosEscolares
                          .filter((periodo) => periodo.status !== "ACTIVO")
                          .map((periodo) => (
                            <SelectItem key={periodo.id} value={periodo.id!}>
                              {periodo.periodo}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.año_escolar && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.año_escolar.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Selection */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Estado
                </Label>
                <div className="col-span-2">
                  <Select
                    value={watch("status")}
                    onValueChange={(value) => setValue("status", value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                      <SelectItem value="CERRADO">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.status.message}
                    </p>
                  )}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {lapsoToUpdate ? "Actualizar" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
