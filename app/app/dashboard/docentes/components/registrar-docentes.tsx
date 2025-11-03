/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Teachers } from "@/interfaces/teachers.interface";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import {
  createUser,
  getCollection,
  setDocument,
  updateUser,
} from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutList, LoaderCircle, Search, UserPenIcon } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegistrarDocente() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [docentes, setDocentes] = useState<Teachers[]>([]);
  const [isLoadingDocentes, setIsLoadingDocentes] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "name">("cedula");


  const formSchema = z.object({
    uid: z.string(),
    cedula: z
      .string()
      .min(7, "La cédula debe tener al menos 7 caracteres")
      .regex(/^\d+$/, "Debe contener solo números"),
    name: z.string().min(3, "Los nombres son requeridos"),
    apellidos: z.string().min(3, "Los apellidos son requeridos"),
    telefono: z
      .string()
      .min(11, "El teléfono es requerido (mínimo 11 dígitos)")
      .max(14, "Máximo 14 dígitos")
      .regex(/^\d+$/, "Debe contener solo números"),
    email: z.string().email("Ingresa un correo válido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    rol: z.string().default("DOCENTE"),
    permiso: z.string().default("BLOQUEADO"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uid: "",
      cedula: "",
      name: "",
      apellidos: "",
      telefono: "",
      email: "",
      password: "",
      rol: "DOCENTE",
      permiso: "BLOQUEADO",
    },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  // Load teachers on component mount
  useEffect(() => {
    fetchDocentes();
  }, []);

  // Function to fetch all teachers
  const fetchDocentes = async () => {
    setIsLoadingDocentes(true);
    try {
      const teachersCollection = await getCollection("users", [
        { field: "rol", operator: "==", value: "DOCENTE" },
      ]);

      if (teachersCollection) {
        setDocentes(teachersCollection as unknown as Teachers[]);
      }
    } catch (error: any) {
      toast.error(`Error al cargar docentes: ${error.message}`);
    } finally {
      setIsLoadingDocentes(false);
    }
  };

  const onSubmit = async (teacher: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await createUser(teacher);
      teacher.uid = res.user.uid;

      // Crear usuario en Firestore
      await createUserInDB(teacher as Teachers);

      // Actualizar displayName en Authentication
      await updateUser({
        displayName: `${teacher.name} ${teacher.apellidos}`,
      });

      // Refresh the teachers list
      await fetchDocentes();

      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  const createUserInDB = async (teacher: Teachers) => {
    const path = `users/${teacher.uid}`;
    try {
      await setDocument(path, teacher);
      toast.success("Docente registrado exitosamente");
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Docentes</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Registrar Docente<UserPenIcon/></Button>
             
            </DialogTrigger>

            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Crear Docente</DialogTitle>
                  <DialogDescription>
                    Complete todos los campos requeridos
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Cédula */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="cedula" className="text-right">
                      Cédula
                    </Label>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Input
                        {...register("cedula")}
                        id="cedula"
                        placeholder="Ingresa la cédula del docente"
                        maxLength={9}
                      />
                      {errors.cedula && (
                        <p className="text-red-500 text-xs">
                          {errors.cedula.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nombres */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nombre
                    </Label>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Input
                        {...register("name")}
                        id="name"
                        placeholder="Ingresa el nombre del docente"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Apellidos */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="apellidos" className="text-right">
                      Apellido
                    </Label>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Input
                        {...register("apellidos")}
                        id="apellidos"
                        placeholder="Ingresa el apellido del docente"
                      />
                      {errors.apellidos && (
                        <p className="text-red-500 text-xs">
                          {errors.apellidos.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="telefono" className="text-right">
                      Teléfono
                    </Label>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Input
                        {...register("telefono")}
                        id="telefono"
                        placeholder="Ingresa el teléfono del docente"
                        maxLength={14}
                      />
                      {errors.telefono && (
                        <p className="text-red-500 text-xs">
                          {errors.telefono.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="Ingresa el correo del docente"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Contraseña
                    </Label>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Input
                        {...register("password")}
                        id="password"
                        type="text"
                        placeholder="Ingresa la contraseña a asignar al docente"
                      />
                      {errors.password && (
                        <p className="text-red-500 text-xs">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                      <UserPenIcon className="h-4 w-4" />
                      Registrar Docente
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
          <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Select
              value={searchType}
              onValueChange={(value: "cedula" | "name") => setSearchType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cedula">Cédula</SelectItem>
                <SelectItem value="name">Nombres</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardDescription>
        </CardHeader>
      
        <CardContent>
        <div className="custom-scroll max-h-[600px] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cédula</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Contraseña</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoadingDocentes && docentes.filter((docente) => docente.rol ==="DOCENTE").map((docente) => (
                <TableRow key={docente.uid}>
                  <TableCell>{docente.cedula}</TableCell>
                  <TableCell>{docente.name}</TableCell>
                  <TableCell>{docente.apellidos}</TableCell>
                  <TableCell>{docente.email}</TableCell>
                  <TableCell>{docente.password}</TableCell>
                  <TableCell>{docente.telefono}</TableCell>
                </TableRow>
              ))}
              {isLoadingDocentes &&
                [1, 2, 3].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="w-full h-4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {!isLoadingDocentes && docentes.length === 0 && (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <LayoutList className="w-[80px] h-[80px] text-gray-300" />
              </div>
              <h2 className="text-center text-gray-500 mt-4">No se encontraron registros existentes</h2>
            </div>
          )}
        </div>
        </CardContent>

    </Card>
  );
}
