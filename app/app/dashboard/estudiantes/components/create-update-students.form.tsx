 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect } from "react";
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
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
// import DragAndDropImage from "@/components/ui/drag-and-drop-image";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import {
  addDocument,
  getCollection,
  updateDocument,
  // uploadBase64,
} from "@/lib/data/firebase";
// import Image from "next/image";
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
import estados from "@/lib/data/data-estados";
import { showToast } from "nextjs-toast-notify";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CreateUpdateStudentsProps {
  children: React.ReactNode;
  studentToUpdate?: Estudiantes;
  getStudents: () => Promise<void>
}

export function CreateUpdateStudents({
  children,
  studentToUpdate,
  getStudents
}: CreateUpdateStudentsProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
    const [openSexo, setOpenSexo] = useState(false);
  const [openEstado, setOpenEstado] = useState(false);
  const [openMunicipio, setOpenMunicipio] = useState(false);
  const [openParroquia, setOpenParroquia] = useState(false);

  const [open, setOpen] = useState<boolean>(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<number | null>(
    null
  );
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState<
    string | null
  >(null);
  // const [image, setImage] = useState<string>("");

  const formSchema = z.object({
    tipo_cedula: z.enum(['V', 'E'], {
      message: "El tipo de cédula es requerido",
    }),
    cedula: z.string()
      .min(1, "La cédula es requerida")
      .regex(/^\d+$/, "La cédula debe contener solo números")
      .refine((val) => Number(val) >= 10000000, "La cédula debe tener al menos 8 dígitos"),
    nombres: z.string().min(3, "Los nombres son requeridos"),
    apellidos: z.string().min(3, "Los apellidos son requeridos"),
    sexo: z.string().min(1, "El sexo es requerido"),
    estado: z.string().optional(),
    fechaNacimiento: z
      .string()
      .nonempty("La fecha de nacimiento es requerida")
      .refine((date) => {
        const selectedDate = new Date(date);
        const currentDate = new Date();
        const minDate = new Date("1940-01-01");
        return selectedDate <= currentDate && selectedDate >= minDate;
      }, "La fecha debe estar entre 1940 y la fecha actual"),
    periodo_escolar_actual: z.string().optional(),
    año_actual: z.string().optional(),
    seccion_actual: z.string().optional(),
    estado_nacimiento: z
      .string()
      .min(2, "El estado de nacimiento es requerido"),
    municipio: z.string().min(1, "El municipio es requerido"),
    parroquia: z.string().min(1, "La parroquia es requerida"),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: studentToUpdate
      ? {
          tipo_cedula: studentToUpdate.tipo_cedula,
          cedula: studentToUpdate.cedula.toString(),
          nombres: studentToUpdate.nombres,
          apellidos: studentToUpdate.apellidos,
          sexo: studentToUpdate.sexo,
          estado: studentToUpdate.estado || "",
          fechaNacimiento: studentToUpdate.fechaNacimiento,
          periodo_escolar_actual: studentToUpdate.periodo_escolar_actual || "",
          // año_actual: studentToUpdate.año_actual || "",
          seccion_actual: studentToUpdate.seccion_actual || "",
          estado_nacimiento: studentToUpdate.estado_nacimiento,
          municipio: studentToUpdate.municipio,
          parroquia: studentToUpdate.parroquia,
        }
      : {
          tipo_cedula: 'V' as const,
          cedula: "",
          nombres: "",
          apellidos: "",
          sexo: "",
          estado: "",
          fechaNacimiento: "",
          periodo_escolar_actual: "",
          año_actual: "",
          seccion_actual: "",
          estado_nacimiento: "",
          municipio: "",
          parroquia: "",
        },
  });

    // Fetch secciones data
    useEffect(() => {
      const fetchSecciones = async () => {
        
        // Get unique periodos
      };
      fetchSecciones();
    }, []);
  
   // Fetch secciones data
   useEffect(() => {
    const fetchSecciones = async () => {
      
      // Si hay un studentToUpdate, establecer los valores iniciales
      if (studentToUpdate) {

        
        // Encontrar el índice del estado
        const estadoIndex = estados.findIndex(
          (estado) => estado.estado === studentToUpdate.estado_nacimiento
        );
        setEstadoSeleccionado(estadoIndex !== -1 ? estadoIndex : null);
      }
    };
    fetchSecciones();
  }, [studentToUpdate]);





  const { register, handleSubmit, formState } = form;
  const { errors } = formState;
  const municipios =
    estadoSeleccionado !== null ? estados[estadoSeleccionado].municipios : [];
  const parroquias = municipioSeleccionado
    ? municipios.find((m) => m.municipio === municipioSeleccionado)?.parroquias
    : [];

  //! SUBIR O ACTUALIZAR LA IMAGEN
  // const handleImage = (url: string) => {
  //   const path = studentToUpdate ? studentToUpdate.image.path : `${Date.now()}`;
  //   setValue("image", { url, path });
  //   setImage(url);
  // };

  // useEffect(() => {
  //   if (studentToUpdate) setImage(studentToUpdate.image.url);
  // }, [open]);
  

  //  TODO ====== FUNCION DE SUBMIT =========///
  const onSubmit = async (data: FormValues) => {
    const studentData: Estudiantes = {
      ...data,
      cedula: Number(data.cedula),
      tipo_cedula: data.tipo_cedula,
      estado: data.estado || "",
      periodo_escolar_actual: data.periodo_escolar_actual || "",
      año_actual: data.año_actual || "",
      seccion_actual: data.seccion_actual || "",
    };
    
    if (studentToUpdate) {
      await UpdateStudent(studentData);
    } else {
      await CreateStudent(studentData);
    }
  };

  // TODO ====== VERIFICAR CEDULA DUPLICADA =====//
  const checkDuplicateCedula = async (
    cedula: number,
    currentStudentId?: string
  ): Promise<boolean> => {
    try {
      const students = await getCollection("estudiantes");
      return students.some(
        (student: any) =>
          Number(student.cedula) === cedula && student.id !== currentStudentId
      );
    } catch (error) {
      console.error("Error checking duplicate cedula:", error);
      return false;
    }
  };


  //TODO // CREAR UN ESTUDIANTE EN LA DATABASE ////

  const CreateStudent = async (student: Estudiantes) => {
    const path = `estudiantes`;
    setIsLoading(true);
  
    try {
      const cedulaNumber = Number(student.cedula);
      const isDuplicate = await checkDuplicateCedula(cedulaNumber);
  
      if (isDuplicate) {
        showToast.error("Ya existe un estudiante con esta cédula");
        setIsLoading(false);
        return;
      }
  
 
      const normalizedStudent = {
        ...student,
        cedula: cedulaNumber,
        nombres: student.nombres.toUpperCase(),
        apellidos: student.apellidos.toUpperCase(),
        estado: "",
        año_actual:"",
        seccion_actual: "",
        estado_nacimiento: student.estado_nacimiento?.toUpperCase(),
        municipio: student.municipio?.toUpperCase(),
        parroquia: student.parroquia?.toUpperCase(),
      };
  
      await addDocument(path, normalizedStudent);
      showToast.success("El estudiante fue registrado exitosamente");
      getStudents();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };
  //TODO // ACTUALIZAR UN ESTUDIANTE EN LA DATABASE ////

  const UpdateStudent = async (student: Estudiantes) => {
    const path = `estudiantes/${studentToUpdate?.id}`;
    setIsLoading(true);
  
    try {
      const cedulaNumber = Number(student.cedula);
      const isDuplicate = await checkDuplicateCedula(
        cedulaNumber,
        studentToUpdate?.id
      );
  
      if (isDuplicate) {
        showToast.error("Ya existe un estudiante con esta cédula");
        setIsLoading(false);
        return;
      }
  
      const normalizedStudent = {
        ...student,
        cedula: cedulaNumber,
        nombres: student.nombres.toUpperCase(),
        apellidos: student.apellidos.toUpperCase(),
        estado: "",
        año_actual:"",
        seccion_actual: "",
        estado_nacimiento: student.estado_nacimiento?.toUpperCase(),
        municipio: student.municipio?.toUpperCase(),
        parroquia: student.parroquia?.toUpperCase(),
      };
    
      await updateDocument(path, normalizedStudent);
      showToast.success("El estudiante fue actualizado exitosamente");
      getStudents();
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {studentToUpdate ? "Actualizar Estudiante" : "Agregar Estudiante"}
            </DialogTitle>
            <DialogDescription>
              {studentToUpdate
                ? "Por favor, actualiza los datos del estudiante."
                : "Por favor, llena todos los campos para registrar un nuevo estudiante."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Sección: Datos de Identificación */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Datos de Identificación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo y Cédula en la misma fila */}
                <div className="flex gap-2">
                  <div className="w-24">
                    <Label htmlFor="tipo_cedula" className="mb-2 block">
                      Tipo
                    </Label>
                    <select
                      {...register("tipo_cedula")}
                      id="tipo_cedula"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="V">V</option>
                      <option value="E">E</option>
                    </select>
                    {errors.tipo_cedula && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.tipo_cedula.message}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
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
                </div>

                {/* Sexo - Combobox */}
                <div>
                  <Label className="mb-2 block">
                    Sexo <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openSexo} onOpenChange={setOpenSexo}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSexo}
                        className="w-full justify-between"
                      >
                        {form.watch("sexo") || "Selecciona el sexo"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar sexo..." />
                        <CommandList>
                          <CommandEmpty>No se encontró.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="MASCULINO"
                              onSelect={() => {
                                form.setValue("sexo", "MASCULINO", {
                                  shouldValidate: true,
                                });
                                setOpenSexo(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.watch("sexo") === "MASCULINO"
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              Masculino
                            </CommandItem>
                            <CommandItem
                              value="FEMENINO"
                              onSelect={() => {
                                form.setValue("sexo", "FEMENINO", {
                                  shouldValidate: true,
                                });
                                setOpenSexo(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.watch("sexo") === "FEMENINO"
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              Femenino
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.sexo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.sexo.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombres */}
                <div>
                  <Label htmlFor="nombres" className="mb-2 block">
                    Nombres <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("nombres")}
                    id="nombres"
                    placeholder="Ingresa los nombres"
                    maxLength={60}
                  />
                  {errors.nombres && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nombres.message}
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

                {/* Fecha de Nacimiento */}
                <div>
                  <Label htmlFor="fechaNacimiento" className="mb-2 block">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("fechaNacimiento")}
                    id="fechaNacimiento"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    min="1940-01-01"
                  />
                  {errors.fechaNacimiento && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fechaNacimiento.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Lugar de Nacimiento */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Lugar de Nacimiento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estado de Nacimiento - Combobox */}
                <div>
                  <Label className="mb-2 block">
                    Estado <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openEstado} onOpenChange={setOpenEstado}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openEstado}
                        className="w-full justify-between"
                      >
                        {form.watch("estado_nacimiento") || "Selecciona un estado"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar estado..." />
                        <CommandList>
                          <CommandEmpty>No se encontró el estado.</CommandEmpty>
                          <CommandGroup>
                            {estados.map((estado, index) => (
                              <CommandItem
                                key={estado.id_estado}
                                value={estado.estado}
                                onSelect={() => {
                                  setEstadoSeleccionado(index);
                                  setMunicipioSeleccionado(null);
                                  form.setValue("estado_nacimiento", estado.estado, {
                                    shouldValidate: true,
                                  });
                                  form.setValue("municipio", "");
                                  form.setValue("parroquia", "");
                                  setOpenEstado(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("estado_nacimiento") === estado.estado
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {estado.estado}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.estado_nacimiento && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.estado_nacimiento.message}
                    </p>
                  )}
                </div>

                {/* Municipio - Combobox */}
                <div>
                  <Label className="mb-2 block">
                    Municipio <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openMunicipio} onOpenChange={setOpenMunicipio}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMunicipio}
                        className="w-full justify-between"
                        disabled={estadoSeleccionado === null}
                      >
                        {form.watch("municipio") || "Selecciona un municipio"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar municipio..." />
                        <CommandList>
                          <CommandEmpty>No se encontró el municipio.</CommandEmpty>
                          <CommandGroup>
                            {municipios.map((municipio) => (
                              <CommandItem
                                key={municipio.municipio}
                                value={municipio.municipio}
                                onSelect={() => {
                                  setMunicipioSeleccionado(municipio.municipio);
                                  form.setValue("municipio", municipio.municipio, {
                                    shouldValidate: true,
                                  });
                                  form.setValue("parroquia", "");
                                  setOpenMunicipio(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("municipio") === municipio.municipio
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {municipio.municipio}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.municipio && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.municipio.message}
                    </p>
                  )}
                </div>

                {/* Parroquia - Combobox */}
                <div className="md:col-span-2">
                  <Label className="mb-2 block">
                    Parroquia <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openParroquia} onOpenChange={setOpenParroquia}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openParroquia}
                        className="w-full justify-between"
                        disabled={!municipioSeleccionado}
                      >
                        {form.watch("parroquia") || "Selecciona una parroquia"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar parroquia..." />
                        <CommandList>
                          <CommandEmpty>No se encontró la parroquia.</CommandEmpty>
                          <CommandGroup>
                            {parroquias?.map((parroquia) => (
                              <CommandItem
                                key={parroquia}
                                value={parroquia}
                                onSelect={() => {
                                  form.setValue("parroquia", parroquia, {
                                    shouldValidate: true,
                                  });
                                  setOpenParroquia(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("parroquia") === parroquia
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {parroquia}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.parroquia && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.parroquia.message}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {studentToUpdate ? "Actualizar" : "Agregar"}
              <Check />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
