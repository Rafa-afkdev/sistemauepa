/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CortesEscolares } from "@/interfaces/cortes.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { addDocument, db, getCollection, updateDocument } from "@/lib/data/firebase";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Calendar as CalendarIcon, LoaderCircle } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateCorteProps {
  children: React.ReactNode;
  getCortesEscolares: () => Promise<void>;
  corteToUpdate?: CortesEscolares;
}

export function CreateUpdateCorte({
  children,
  getCortesEscolares,
  corteToUpdate,
}: CreateCorteProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);
  const [lapsosEscolares, setLapsosEscolares] = useState<LapsosEscolares[]>([]);

  // Validation schema
  const formSchema = z.object({
    corte: z.string().min(1, "El nombre del corte es requerido"),
    periodo_escolar_id: z.string().min(1, "El periodo escolar es requerido"),
    lapso_id: z.string().min(1, "El lapso es requerido"),
    status: z.string().min(1, "El estado es requerido"),
    fecha_inicio: z.date(),
    fecha_fin: z.date(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: corteToUpdate
      ? {
          corte: corteToUpdate.corte,
          periodo_escolar_id: corteToUpdate.periodo_escolar_id,
          lapso_id: corteToUpdate.lapso_id,
          status: corteToUpdate.status,
          fecha_inicio: corteToUpdate.fecha_inicio
            ? new Date(corteToUpdate.fecha_inicio)
            : undefined,
          fecha_fin: corteToUpdate.fecha_fin
            ? new Date(corteToUpdate.fecha_fin)
            : undefined,
        }
      : {
          corte: "",
          periodo_escolar_id: "",
          lapso_id: "",
          status: "ACTIVO",
          fecha_inicio: undefined,
          fecha_fin: undefined,
        },
  });

  const { handleSubmit, formState, setValue, watch, reset } = form;
  const { errors } = formState;

  const periodoSeleccionado = watch("periodo_escolar_id");

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
        console.error("Error fetching periodos:", error);
      }
    };
    fetchPeriodos();
  }, []);

  // Fetch Lapsos based on selected Periodo
  useEffect(() => {
    const fetchLapsos = async () => {
      if (!periodoSeleccionado) {
        setLapsosEscolares([]);
        return;
      }
      try {
        const qLapsos = query(
          collection(db, "lapsos"),
          where("año_escolar", "==", periodoSeleccionado)
        );
        const snapshot = await getDocs(qLapsos);
        const lapsosData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as LapsosEscolares));
        setLapsosEscolares(lapsosData.sort((a,b) => a.lapso.localeCompare(b.lapso)));
        
        // Reset lapso selection if it's no longer valid
        const isLapsoValido = lapsosData.some(l => l.id === watch("lapso_id"));
        if (!isLapsoValido &&!corteToUpdate) {
             setValue("lapso_id", "", {shouldValidate: false});
        }
      } catch (error) {
        console.error("Error fetching lapsos:", error);
      }
    };
    if (open) fetchLapsos();
  }, [periodoSeleccionado, open, setValue, watch, corteToUpdate]);

  // Reset form when dialog opens with update data
  useEffect(() => {
    if (open && corteToUpdate) {
      reset({
        corte: corteToUpdate.corte,
        periodo_escolar_id: corteToUpdate.periodo_escolar_id,
        lapso_id: corteToUpdate.lapso_id,
        status: corteToUpdate.status,
        fecha_inicio: corteToUpdate.fecha_inicio
          ? new Date(corteToUpdate.fecha_inicio)
          : undefined,
        fecha_fin: corteToUpdate.fecha_fin
          ? new Date(corteToUpdate.fecha_fin)
          : undefined,
      });
    } else if (open && !corteToUpdate) {
      reset({
        corte: "",
        periodo_escolar_id: "",
        lapso_id: "",
        status: "ACTIVO",
        fecha_inicio: undefined,
        fecha_fin: undefined,
      });
    }
  }, [open, corteToUpdate, reset]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const corteData: Omit<CortesEscolares, "id"> = {
      corte: data.corte,
      periodo_escolar_id: data.periodo_escolar_id,
      lapso_id: data.lapso_id,
      status: data.status,
      fecha_inicio: format(data.fecha_inicio, "yyyy-MM-dd"),
      fecha_fin: format(data.fecha_fin, "yyyy-MM-dd"),
      createdAt: corteToUpdate?.createdAt || Timestamp.now(),
    };

    if (corteToUpdate) {
      await UpdateCorte(corteData);
    } else {
      await CreateCorte(corteData);
    }
  };

  // Check for duplicate corte in the same lapso
  const checkDuplicateCorte = async (
    corte: string,
    lapsoId: string,
    currentCorteId?: string
  ): Promise<boolean> => {
    try {
      const q = query(
        collection(db, "cortes"),
        where("corte", "==", corte),
        where("lapso_id", "==", lapsoId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.some(
        (doc) => doc.id !== currentCorteId
      );
    } catch (error) {
      console.error("Error checking duplicate corte:", error);
      return false;
    }
  };

  const CreateCorte = async (corte: Omit<CortesEscolares, "id">) => {
    const path = `cortes`;
    setIsLoading(true);
    try {
      // Validar fechas respecto al lapso
      const lapsoSeleccionado = lapsosEscolares.find(l => l.id === corte.lapso_id);
      if (lapsoSeleccionado) {
        const lapsoInicio = new Date(lapsoSeleccionado.fecha_inicio + "T00:00:00");
        const lapsoFin = new Date(lapsoSeleccionado.fecha_fin + "T23:59:59");
        const corteInicio = new Date(corte.fecha_inicio + "T00:00:00");
        const corteFin = new Date(corte.fecha_fin + "T23:59:59");

        if (corteInicio < lapsoInicio || corteInicio > lapsoFin) {
          showToast.error("La fecha de inicio del corte debe estar dentro de las fechas del lapso seleccionado.");
          setIsLoading(false);
          return;
        }
        if (corteFin < lapsoInicio || corteFin > lapsoFin) {
          showToast.error("La fecha de fin del corte debe estar dentro de las fechas del lapso seleccionado.");
          setIsLoading(false);
          return;
        }
        if (corteFin < corteInicio) {
          showToast.error("La fecha de fin no puede ser menor a la fecha de inicio.");
          setIsLoading(false);
          return;
        }
      }

      // Check for duplicate
      const isDuplicate = await checkDuplicateCorte(corte.corte, corte.lapso_id);
      if (isDuplicate) {
        showToast.error("Ya existe este corte para el lapso seleccionado");
        setIsLoading(false);
        return;
      }

      // Check active conflict
      if (corte.status === "ACTIVO") {
        const qActivos = query(collection(db, "cortes"), where("status", "==", "ACTIVO"));
        const activosSnap = await getDocs(qActivos);
        if (!activosSnap.empty) {
          showToast.error("Ya existe un corte activo actualmente. Cierrelo primero.");
          setIsLoading(false);
          return;
        }
      }

      await addDocument(path, {
        ...corte,
        createdAt: Timestamp.now(),
      });
      showToast.success("Corte creado exitosamente");
      getCortesEscolares();
      setOpen(false);
      reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  const UpdateCorte = async (corte: Omit<CortesEscolares, "id">) => {
    if (!corteToUpdate?.id) return;
    const path = `cortes/${corteToUpdate.id}`;
    setIsLoading(true);
    try {
      // Validar fechas respecto al lapso
      const lapsoSeleccionado = lapsosEscolares.find(l => l.id === corte.lapso_id);
      if (lapsoSeleccionado) {
        const lapsoInicio = new Date(lapsoSeleccionado.fecha_inicio + "T00:00:00");
        const lapsoFin = new Date(lapsoSeleccionado.fecha_fin + "T23:59:59");
        const corteInicio = new Date(corte.fecha_inicio + "T00:00:00");
        const corteFin = new Date(corte.fecha_fin + "T23:59:59");

        if (corteInicio < lapsoInicio || corteInicio > lapsoFin) {
          showToast.error("La fecha de inicio del corte debe estar dentro de las fechas del lapso seleccionado.");
          setIsLoading(false);
          return;
        }
        if (corteFin < lapsoInicio || corteFin > lapsoFin) {
          showToast.error("La fecha de fin del corte debe estar dentro de las fechas del lapso seleccionado.");
          setIsLoading(false);
          return;
        }
        if (corteFin < corteInicio) {
          showToast.error("La fecha de fin no puede ser menor a la fecha de inicio.");
          setIsLoading(false);
          return;
        }
      }

      const isDuplicate = await checkDuplicateCorte(
        corte.corte,
        corte.lapso_id,
        corteToUpdate.id
      );
      if (isDuplicate) {
        showToast.error("Ya existe este corte para el lapso seleccionado");
        setIsLoading(false);
        return;
      }

      if (corte.status === "ACTIVO") {
        const qActivos = query(collection(db, "cortes"), where("status", "==", "ACTIVO"));
        const activosSnap = await getDocs(qActivos);
        const otroActivo = activosSnap.docs.some(d => d.id !== corteToUpdate.id);
        if (otroActivo) {
          showToast.error("Ya existe un corte activo actualmente.");
          setIsLoading(false);
          return;
        }
      }

      await updateDocument(path, {
        ...corte,
        createdAt: corteToUpdate.createdAt,
      });
      showToast.success("Corte actualizado exitosamente");
      getCortesEscolares();
      setOpen(false);
      reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {corteToUpdate ? "Actualizar Corte de Notas" : "Crear Nuevo Corte de Notas"}
              </DialogTitle>
              <DialogDescription>
                Define los tiempos de apertura para cargar notas
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8">
              
              {/* Name */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="corte" className="text-right">Nombre</Label>
                <div className="col-span-2">
                    <Input 
                      placeholder="Ej. Corte 1 / Semana 1-3" 
                      {...form.register("corte")}
                    />
                     {errors.corte && (
                    <p className="text-red-500 text-sm mt-1">{errors.corte.message}</p>
                  )}
                </div>
              </div>

               {/* Periodo Escolar Selection */}
               <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="periodo_escolar_id" className="text-right">
                  Periodo
                </Label>
                <div className="col-span-2">
                  <Select
                    value={watch("periodo_escolar_id")}
                    onValueChange={(value) => setValue("periodo_escolar_id", value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Periodos Activos</SelectLabel>
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
                  {errors.periodo_escolar_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.periodo_escolar_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Lapso Selection */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="lapso_id" className="text-right">
                  Lapso
                </Label>
                <div className="col-span-2">
                  <Select
                    value={watch("lapso_id")}
                    onValueChange={(value) => setValue("lapso_id", value, { shouldValidate: true })}
                    disabled={!periodoSeleccionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el Lapso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {lapsosEscolares.map(l => (
                            <SelectItem key={l.id} value={l.id!}>
                                {l.lapso}
                            </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.lapso_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lapso_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha de Inicio */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">
                  Desde
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
                          <span>Fecha inicio</span>
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
                          const lapsoSeleccionado = lapsosEscolares.find(l => l.id === watch("lapso_id"));
                          if (!lapsoSeleccionado) return true; // Deshabilitar todo si no hay lapso seleccionado
                          
                          const lapsoInicio = new Date(lapsoSeleccionado.fecha_inicio + "T00:00:00");
                          const lapsoFin = new Date(lapsoSeleccionado.fecha_fin + "T23:59:59");
                          const dateObj = new Date(date);
                          dateObj.setHours(0,0,0,0);
                          lapsoInicio.setHours(0,0,0,0);
                          lapsoFin.setHours(23,59,59,999);

                          return dateObj < lapsoInicio || dateObj > lapsoFin;
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
                  Hasta
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
                        disabled={!watch("lapso_id")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("fecha_fin") ? (
                          format(watch("fecha_fin"), "PPP", { locale: es })
                        ) : (
                          <span>Fecha límite</span>
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
                           const lapsoSeleccionado = lapsosEscolares.find(l => l.id === watch("lapso_id"));
                           if (!lapsoSeleccionado) return true;
                           
                           const lapsoInicio = new Date(lapsoSeleccionado.fecha_inicio + "T00:00:00");
                           const lapsoFin = new Date(lapsoSeleccionado.fecha_fin + "T23:59:59");
                           const minDate = watch("fecha_inicio") ? new Date(watch("fecha_inicio")) : lapsoInicio;
                           
                           const dateObj = new Date(date);
                           dateObj.setHours(0,0,0,0);
                           minDate.setHours(0,0,0,0);
                           lapsoFin.setHours(23,59,59,999);
 
                           return dateObj < minDate || dateObj > lapsoFin;
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
                {corteToUpdate ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
