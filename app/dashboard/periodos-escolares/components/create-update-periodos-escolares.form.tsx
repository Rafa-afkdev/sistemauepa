/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
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
import { LoaderCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { Timestamp } from "firebase/firestore";
import { addDocument, getCollection, updateDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

interface CreatePeriodoEscolarProps {
  children: React.ReactNode;
  getPeriodos_Escolares: () => Promise<void>;
  periodoToUpdate?: PeriodosEscolares;
}

export function CreateUpdatePeriodoEscolar({
  children,
  getPeriodos_Escolares,
  periodoToUpdate,
}: CreatePeriodoEscolarProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);


  // Validation schema for period
  const formSchema = z.object({
    periodo: z.string()
    .regex(/^\d{4}-\d{4}$/, "El formato debe ser AAAA-AAAA")
    .refine(value => {
      const [inicio, fin] = value.split('-');
      return parseInt(fin) === parseInt(inicio) + 1;
    }, "El segundo año debe ser exactamente un año después del primero"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: periodoToUpdate
      ? {
          periodo: periodoToUpdate.periodo,
        }
      : {
          periodo: "",
        },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const periodoData: Omit<PeriodosEscolares, "id"> = {
      periodo: data.periodo,
      status: periodoToUpdate?.status || "ACTIVO",
      createdAt: periodoToUpdate?.createdAt || Timestamp.now(),
    };

    if (periodoToUpdate) {
      await UpdatePeriodo(periodoData);
    } else {
      await CreatePeriodo(periodoData);
    }
  };

  const checkDuplicatePeriodo = async (
    periodo: string,
    currentPeriodoId?: string
  ): Promise<boolean> => {
    try {
      const periodos = await getCollection("periodos_escolares");
      return periodos.some(
        (p: any) => p.periodo === periodo && p.id !== currentPeriodoId
      );
    } catch (error) {
      console.error("Error checking duplicate periodo:", error);
      return false;
    }
  };

  const CreatePeriodo = async (periodo: Omit<PeriodosEscolares, "id">) => {
    const path = `periodos_escolares`;
    setIsLoading(true);
    try {
      const isDuplicate = await checkDuplicatePeriodo(periodo.periodo);
      if (isDuplicate) {
        showToast.error("Ya existe un periodo escolar con este año");
        setIsLoading(false);
        return;
      }

      const periodos = await getCollection("periodos_escolares");
      const activoExists = periodos.some((p: any) => p.status === "ACTIVO");
      if (activoExists) {
        showToast.error("Ya existe un periodo escolar activo.");
        setIsLoading(false);
        return;
      }

      await addDocument(path, {
        ...periodo,
        periodo: periodo.periodo,
        status: "ACTIVO",
        createdAt: Timestamp.now(),
      });
      showToast.success("Periodo escolar creado exitosamente");
      getPeriodos_Escolares();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  const UpdatePeriodo = async (periodo: Omit<PeriodosEscolares, "id">) => {
    if (!periodoToUpdate?.id) return;
    const path = `periodos_escolares/${periodoToUpdate.id}`;
    setIsLoading(true);
    try {
      const isDuplicate = await checkDuplicatePeriodo(
        periodo.periodo,
        periodoToUpdate.id
      );
      if (isDuplicate) {
        showToast.error("Ya existe un periodo escolar con este año");
        setIsLoading(false);
        return;
      }

      await updateDocument(path, {
        ...periodo,
        createdAt: periodoToUpdate.createdAt,
      });
      showToast.success("Periodo escolar actualizado exitosamente");
      getPeriodos_Escolares();
      setOpen(false);
      form.reset();
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
                {periodoToUpdate ? "Actualizar Periodo Escolar" : "Crear Nuevo Periodo Escolar"}
              </DialogTitle>
              <DialogDescription>
                Ingrese el periodo escolar en formato AAAA-AAAA
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="periodo" className="text-right">
                  Periodo Escolar
                </Label>
                <Input
                  {...register("periodo")}
                  id="periodo"
                  type="text"
                  placeholder="Ej: 2024-2025"
                  className="col-span-2"
                  maxLength={9}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = input.value.replace(/[^0-9]/g, "");
                    if (input.value.length > 4) {
                      input.value =
                        input.value.slice(0, 4) +
                        "-" +
                        input.value.slice(4, 8);
                    }
                  }}
                />
                {errors.periodo && (
                  <p className="text-red-500 col-span-3 text-center">
                    {errors.periodo.message}
                  </p>
                )}
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
                {periodoToUpdate ? "Actualizar" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}