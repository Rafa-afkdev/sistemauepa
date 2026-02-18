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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Representante } from "@/interfaces/representante.interface";
import { addDocument, updateDocument } from "@/lib/data/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const representanteSchema = z.object({
  tipo_cedula: z.enum(["V", "E"]),
  cedula: z.string().min(6, "La cédula debe tener al menos 6 dígitos"),
  nombres: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "El apellido es requerido"),
  parentesco: z.string().min(1, "El parentesco es requerido"),
  telefono_principal: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  telefono_secundario: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
});

type RepresentanteFormData = z.infer<typeof representanteSchema>;

interface CreateUpdateRepresentanteProps {
  children: ReactNode;
  representante?: Representante;
  getRepresentantes: () => Promise<void>;
}

export const CreateUpdateRepresentante = ({
  children,
  representante,
  getRepresentantes,
}: CreateUpdateRepresentanteProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RepresentanteFormData>({
    resolver: zodResolver(representanteSchema),
    defaultValues: {
      tipo_cedula: "V",
      cedula: "",
      nombres: "",
      apellidos: "",
      parentesco: "",
      telefono_principal: "",
      telefono_secundario: "",
      email: "",
      direccion: "",
    },
  });

  const tipoCedula = watch("tipo_cedula");
  const parentesco = watch("parentesco");

  useEffect(() => {
    if (representante && open) {
      setValue("tipo_cedula", representante.tipo_cedula);
      setValue("cedula", representante.cedula);
      setValue("nombres", representante.nombres);
      setValue("apellidos", representante.apellidos);
      setValue("parentesco", representante.parentesco);
      setValue("telefono_principal", representante.telefono_principal);
      setValue("telefono_secundario", representante.telefono_secundario || "");
      setValue("email", representante.email || "");
      setValue("direccion", representante.direccion || "");
    } else if (!open) {
      reset();
    }
  }, [representante, open, setValue, reset]);

  const onSubmit = async (data: RepresentanteFormData) => {
    setIsLoading(true);
    try {
      const representanteData: Partial<Representante> = {
        tipo_cedula: data.tipo_cedula,
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        parentesco: data.parentesco,
        telefono_principal: data.telefono_principal,
        telefono_secundario: data.telefono_secundario || "",
        email: data.email || "",
        direccion: data.direccion || "",
        updatedAt: Timestamp.now(),
      };

      if (representante?.id) {
        // Update
        await updateDocument(`representantes/${representante.id}`, representanteData);
        showToast.success("Representante actualizado exitosamente");
      } else {
        // Create
        representanteData.estudiantes_ids = [];
        representanteData.createdAt = Timestamp.now();
        await addDocument("representantes", representanteData);
        showToast.success("Representante creado exitosamente");
      }

      await getRepresentantes();
      setOpen(false);
      reset();
    } catch (error: any) {
      showToast.error(error.message || "Error al guardar el representante");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {representante ? "Editar Representante" : "Crear Representante"}
          </DialogTitle>
          <DialogDescription>
            {representante
              ? "Modifica los datos del representante"
              : "Complete los datos del nuevo representante"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo y Cédula */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_cedula">Tipo</Label>
              <Select
                value={tipoCedula}
                onValueChange={(value: "V" | "E") => setValue("tipo_cedula", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="cedula">Cédula*</Label>
              <Input
                id="cedula"
                type="text"
                {...register("cedula")}
                placeholder="12345678"
              />
              {errors.cedula && (
                <p className="text-sm text-destructive">{errors.cedula.message}</p>
              )}
            </div>
          </div>

          {/* Nombres */}
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres*</Label>
            <Input
              id="nombres"
              type="text"
              {...register("nombres")}
              placeholder="Juan Carlos"
            />
            {errors.nombres && (
              <p className="text-sm text-destructive">{errors.nombres.message}</p>
            )}
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos*</Label>
            <Input
              id="apellidos"
              type="text"
              {...register("apellidos")}
              placeholder="Pérez González"
            />
            {errors.apellidos && (
              <p className="text-sm text-destructive">{errors.apellidos.message}</p>
            )}
          </div>

          {/* Parentesco */}
          <div className="space-y-2">
            <Label htmlFor="parentesco">Parentesco*</Label>
            <Select
              value={parentesco}
              onValueChange={(value) => setValue("parentesco", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione parentesco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Padre">Padre</SelectItem>
                <SelectItem value="Madre">Madre</SelectItem>
                <SelectItem value="Abuelo(a)">Abuelo(a)</SelectItem>
                <SelectItem value="Tío(a)">Tío(a)</SelectItem>
                <SelectItem value="Hermano(a)">Hermano(a)</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {errors.parentesco && (
              <p className="text-sm text-destructive">{errors.parentesco.message}</p>
            )}
          </div>

          {/* Teléfonos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono_principal">Teléfono Principal*</Label>
              <Input
                id="telefono_principal"
                type="tel"
                {...register("telefono_principal")}
                placeholder="04121234567"
              />
              {errors.telefono_principal && (
                <p className="text-sm text-destructive">
                  {errors.telefono_principal.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono_secundario">Teléfono Secundario</Label>
              <Input
                id="telefono_secundario"
                type="tel"
                {...register("telefono_secundario")}
                placeholder="04241234567"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="ejemplo@correo.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              {...register("direccion")}
              placeholder="Dirección completa"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {representante ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
