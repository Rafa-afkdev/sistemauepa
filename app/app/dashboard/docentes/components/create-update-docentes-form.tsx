 
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
import { User } from "@/interfaces/users.interface";
import {
  createUser,
  getCollection,
  setDocument,
  updateDocument,
} from "@/lib/data/firebase";
import { SendEmail } from "@/lib/email/resend";
import { getWelcomeDocenteEmailTemplate } from "@/lib/email/templates/welcome-docente";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateUpdateDocentesProps {
  children: React.ReactNode;
  docenteToUpdate?: User;
  getDocentes: () => Promise<void>
}

export function CreateUpdateDocentes({
  children,
  docenteToUpdate,
  getDocentes
}: CreateUpdateDocentesProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const formSchema = z.object({
    cedula: z.string()
      .min(1, "La cédula es requerida")
      .regex(/^\d+$/, "La cédula debe contener solo números")
      .refine((val) => Number(val) >= 1000000, "La cédula debe tener al menos 7 dígitos"),
    name: z.string().min(3, "El nombre es requerido"),
    apellidos: z.string().min(3, "Los apellidos son requeridos"),
    email: z.string().email("Email inválido"),
    password: docenteToUpdate ? z.string().optional() : z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    telefono: z.string().optional(),
    rol: z.string().min(1, "El rol es requerido"),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: docenteToUpdate
      ? {
          cedula: docenteToUpdate.cedula,
          name: docenteToUpdate.name,
          apellidos: docenteToUpdate.apellidos,
          email: docenteToUpdate.email,
          password: "",
          telefono: docenteToUpdate.telefono || "",
          rol: docenteToUpdate.rol,
        }
      : {
          cedula: "",
          name: "",
          apellidos: "",
          email: "",
          password: "",
          telefono: "",
          rol: "docente",
        },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const onSubmit = async (data: FormValues) => {
    if (docenteToUpdate) {
      await UpdateDocente(data);
    } else {
      await CreateDocente(data);
    }
  };

  const checkDuplicateCedula = async (
    cedula: string,
    currentDocenteId?: string
  ): Promise<boolean> => {
    try {
      const users = await getCollection("users");
      return users.some(
        (user: any) =>
          user.cedula === cedula && user.id !== currentDocenteId
      );
    } catch (error) {
      console.error("Error checking duplicate cedula:", error);
      return false;
    }
  };

  const checkDuplicateEmail = async (
    email: string,
    currentDocenteId?: string
  ): Promise<boolean> => {
    try {
      const users = await getCollection("users");
      return users.some(
        (user: any) =>
          user.email === email && user.id !== currentDocenteId
      );
    } catch (error) {
      console.error("Error checking duplicate email:", error);
      return false;
    }
  };

  const CreateDocente = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const isDuplicateCedula = await checkDuplicateCedula(data.cedula);
      if (isDuplicateCedula) {
        showToast.error("Ya existe un usuario con esta cédula");
        setIsLoading(false);
        return;
      }

      const isDuplicateEmail = await checkDuplicateEmail(data.email);
      if (isDuplicateEmail) {
        showToast.error("Ya existe un usuario con este email");
        setIsLoading(false);
        return;
      }

      const userCredential = await createUser({
        email: data.email,
        password: data.password || ""
      });

      const uid = userCredential.user.uid;

      const docenteData = {
        uid,
        cedula: data.cedula,
        name: data.name.toUpperCase(),
        apellidos: data.apellidos.toUpperCase(),
        email: data.email,
        password: data.password || "",
        telefono: data.telefono || "",
        rol: data.rol,
        permiso: true,
        status: "activo",
        createdAt: new Date(),
      };

      await setDocument(`users/${uid}`, docenteData);
      
      // Enviar email de bienvenida al docente
      try {
        const emailTemplate = getWelcomeDocenteEmailTemplate({
          docenteName: data.name,
          docenteApellidos: data.apellidos,
          email: data.email,
          password: data.password || "",
        });

        await SendEmail({
          sendTo: data.email,
          subject: "Bienvenido al Sistema - U.E.P Adventista Alejandro Oropeza Castillo",
          body: emailTemplate,
        });

        showToast.success("El docente fue registrado exitosamente y se le envió un correo de bienvenida");
      } catch (emailError: any) {
        console.error("Error al enviar email:", emailError);
        showToast.warning("El docente fue registrado, pero no se pudo enviar el correo de bienvenida");
      }
      
      getDocentes();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error.message || "Error al registrar el docente", { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  const UpdateDocente = async (data: FormValues) => {
    if (!docenteToUpdate) return;
    const path = `users/${docenteToUpdate.id}`;
    setIsLoading(true);

    try {
      const isDuplicateCedula = await checkDuplicateCedula(
        data.cedula,
        docenteToUpdate?.id
      );
      if (isDuplicateCedula) {
        showToast.error("Ya existe un usuario con esta cédula");
        setIsLoading(false);
        return;
      }

      const isDuplicateEmail = await checkDuplicateEmail(
        data.email,
        docenteToUpdate?.id
      );
      if (isDuplicateEmail) {
        showToast.error("Ya existe un usuario con este email");
        setIsLoading(false);
        return;
      }

      const docenteData: any = {
        cedula: data.cedula,
        name: data.name.toUpperCase(),
        apellidos: data.apellidos.toUpperCase(),
        email: data.email,
        telefono: data.telefono || "",
        rol: data.rol,
      };

      if (data.password && data.password.length > 0) {
        docenteData.password = data.password;
      }

      // === ACTUALIZACIÓN EN AUTH (SISTEMA DE LOGIN) ===
      // Solo si cambió el email o hay contraseña nueva
      const emailChanged = data.email !== docenteToUpdate.email;
      const passwordChanged = !!(data.password && data.password.length > 0);

      if (emailChanged || passwordChanged) {
        try {
          const apiRes = await fetch("/api/admin/update-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: docenteToUpdate.id,
              email: data.email,
              password: data.password || undefined
            })
          });

          const apiData = await apiRes.json();
          
          if (!apiRes.ok) {
             throw new Error(apiData.error || "Error al actualizar credenciales de acceso");
          }
          console.log("Credenciales actualizadas en Auth:", apiData);

        } catch (authError: any) {
             console.error("Error Auth Update:", authError);
             // Si falla el auth, avisamos pero preguntamos si continuar con BD? 
             // O mejor detenemos para evitar inconsistencia.
             // En este caso, lanzamos error para detener y que el usuario sepa.
             if (authError.message.includes("Faltan las credenciales")) {
                 showToast.error("Falta configuración del servidor (Service Account) para cambiar el email/password.");
             } else {
                 showToast.error(`No se pudo actualizar el Login: ${authError.message}`);
             }
             setIsLoading(false);
             return; 
        }
      }
      // ===============================================

      await updateDocument(path, docenteData);
      showToast.success("El docente fue actualizado exitosamente");
      getDocentes();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error.message || "Error al actualizar el docente", { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {docenteToUpdate ? "Actualizar Docente" : "Registrar Docente"}
            </DialogTitle>
            <DialogDescription>
              {docenteToUpdate
                ? "Por favor, actualiza los datos del docente."
                : "Por favor, llena todos los campos para registrar un nuevo docente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Sección: Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Datos Personales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cédula */}
                <div>
                  <Label htmlFor="cedula" className="mb-2 block">
                    Cédula <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("cedula")}
                    id="cedula"
                    placeholder="Ingrese la cédula"
                    maxLength={11}
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.replace(/\D/g, '').slice(0, 11);
                    }}
                  />
                  {errors.cedula && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.cedula.message}
                    </p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("name")}
                    id="name"
                    placeholder="Ingresa el nombre"
                    maxLength={60}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <Label htmlFor="apellidos" className="mb-2 block">
                    Apellidos <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("apellidos")}
                    id="apellidos"
                    placeholder="Ingresa los apellidos"
                    maxLength={60}
                  />
                  {errors.apellidos && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.apellidos.message}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <Label htmlFor="telefono" className="mb-2 block">
                    Teléfono
                  </Label>
                  <Input
                    {...register("telefono")}
                    id="telefono"
                    placeholder="Ingresa el teléfono"
                    maxLength={15}
                  />
                  {errors.telefono && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.telefono.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Credenciales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Credenciales de Acceso
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="mb-2 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="mb-2 block">
                    Contraseña {!docenteToUpdate && <span className="text-red-500">*</span>}
                    {docenteToUpdate && <span className="text-xs text-gray-500">(dejar vacío para mantener)</span>}
                  </Label>
                  <Input
                    {...register("password")}
                    id="password"
                    type="password"
                    placeholder={docenteToUpdate ? "Nueva contraseña (opcional)" : "Contraseña"}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Rol */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Rol
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rol */}
                <div>
                  <Label htmlFor="rol" className="mb-2 block">
                    Rol <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch("rol")}
                    onValueChange={(value) => form.setValue("rol", value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Roles</SelectLabel>
                        <SelectItem value="docente">Docente</SelectItem>
                        {/* <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="coordinador">Coordinador</SelectItem> */}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.rol && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.rol.message}
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
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {docenteToUpdate ? "Actualizar" : "Registrar"}
              <Check />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
