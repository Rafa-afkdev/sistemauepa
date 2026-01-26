 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { HistorialCambioSeccion, InscripcionSeccion, Secciones } from "@/interfaces/secciones.interface";
import estados from "@/lib/data/data-estados";
import {
  addDocument,
  getCollection,
  getDocument,
  updateDocument,
} from "@/lib/data/firebase";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp, where } from "firebase/firestore";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

  // Nuevos estados para inscripción
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [seccionesFiltradas, setSeccionesFiltradas] = useState<Secciones[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [selectedNivelAcademico, setSelectedNivelAcademico] = useState<string>("");
  const [selectedSeccion, setSelectedSeccion] = useState<string>("");
  const [tipoEstudiante, setTipoEstudiante] = useState<'nuevo' | 'regular'>('nuevo');
  const [inscripcionActual, setInscripcionActual] = useState<InscripcionSeccion | null>(null);

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
          estado_nacimiento: "",
          municipio: "",
          parroquia: "",
        },
  });

  // Cargar periodos y secciones
  useEffect(() => {
    const fetchPeriodosYSecciones = async () => {
      try {
        // Cargar periodos escolares
        const periodosData = (await getCollection("periodos_escolares")) as PeriodosEscolares[];
        setPeriodos(periodosData);

        // Cargar secciones activas
        const seccionesData = (await getCollection("secciones", [
          where("estado", "==", "activa"),
        ])) as Secciones[];
        setSecciones(seccionesData);
      } catch (error) {
        console.error("Error al cargar periosos y secciones:", error);
      }
    };

    if (open) {
      fetchPeriodosYSecciones();
    }
  }, [open]);

  // Cargar datos del estudiante a actualizar
  useEffect(() => {
    const loadStudentData = async () => {
      if (studentToUpdate) {
        // Establecer tipo de estudiante
        setTipoEstudiante(studentToUpdate.tipo_estudiante || 'regular');

        // Establecer periodo y sección si existen
        if (studentToUpdate.periodo_escolar_actual) {
          setSelectedPeriodo(studentToUpdate.periodo_escolar_actual);
        }
        if (studentToUpdate.seccion_actual) {
          setSelectedSeccion(studentToUpdate.seccion_actual);
        }

        // Encontrar el índice del estado
        const estadoIndex = estados.findIndex(
          (estado) => estado.estado === studentToUpdate.estado_nacimiento
        );
        setEstadoSeleccionado(estadoIndex !== -1 ? estadoIndex : null);

        // Cargar inscripción actual si existe
        if (studentToUpdate.id && studentToUpdate.periodo_escolar_actual) {
          try {
            const inscripciones = (await getCollection("estudiantes_inscritos", [
              where("id_estudiante", "==", studentToUpdate.id),
              where("id_periodo_escolar", "==", studentToUpdate.periodo_escolar_actual),
              where("estado", "==", "activo"),
            ])) as InscripcionSeccion[];

            if (inscripciones.length > 0) {
              setInscripcionActual(inscripciones[0]);
            }
          } catch (error) {
            console.error("Error al cargar inscripción actual:", error);
          }
        }
      }
    };

    if (open && studentToUpdate) {
      loadStudentData();
    }
  }, [open, studentToUpdate]);

  // Filtrar secciones por periodo escolar Y nivel académico
  useEffect(() => {
    if (selectedPeriodo && selectedNivelAcademico) {
      const filtered = secciones
        .filter(
          (seccion) => 
            seccion.id_periodo_escolar === selectedPeriodo &&
            seccion.nivel_educativo === selectedNivelAcademico
        )
        .sort((a, b) => {
          // Ordenar por grado_año (numérico) primero
          const gradoA = parseInt(a.grado_año) || 0;
          const gradoB = parseInt(b.grado_año) || 0;
          if (gradoA !== gradoB) return gradoA - gradoB;
          // Luego por letra de sección
          return a.seccion.localeCompare(b.seccion);
        });
      setSeccionesFiltradas(filtered);
    } else {
      setSeccionesFiltradas([]);
    }
  }, [selectedPeriodo, selectedNivelAcademico, secciones]);

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;
  const municipios =
    estadoSeleccionado !== null ? estados[estadoSeleccionado].municipios : [];
  const parroquias = municipioSeleccionado
    ? municipios.find((m) => m.municipio === municipioSeleccionado)?.parroquias
    : [];

  // Verificar si el estudiante ya está inscrito en el periodo
  const verificarInscripcionExistente = async (
    estudianteId: string | null,
    periodoId: string,
    cedula?: number
  ): Promise<InscripcionSeccion | null> => {
    try {
      let query;
      
      if (estudianteId) {
        // Buscar por ID de estudiante
        query = [
          where("id_estudiante", "==", estudianteId),
          where("id_periodo_escolar", "==", periodoId),
          where("estado", "==", "activo"),
        ];
      } else if (cedula) {
        // Buscar por cédula (para estudiantes nuevos)
        const estudiantesConCedula = await getCollection("estudiantes", [
          where("cedula", "==", cedula),
        ]);
        
        if (estudiantesConCedula.length > 0) {
          const estId = estudiantesConCedula[0].id;
          query = [
            where("id_estudiante", "==", estId),
            where("id_periodo_escolar", "==", periodoId),
            where("estado", "==", "activo"),
          ];
        } else {
          return null;
        }
      } else {
        return null;
      }

      const inscripciones = (await getCollection("estudiantes_inscritos", query)) as InscripcionSeccion[];
      return inscripciones.length > 0 ? inscripciones[0] : null;
      
    } catch (error) {
      console.error("Error verificando inscripción:", error);
      return null;
    }
  };

  const onSubmit = async (data: FormValues) => {
    // Validar que se haya seleccionado periodo y sección
    if (!selectedPeriodo) {
      showToast.error("Debes seleccionar un periodo escolar");
      return;
    }

    if (!selectedNivelAcademico) {
      showToast.error("Debes seleccionar un nivel académico");
      return;
    }

    if (!selectedSeccion) {
      showToast.error("Debes seleccionar una sección");
      return;
    }

    const studentData: Estudiantes = {
      ...data,
      cedula: Number(data.cedula),
      tipo_cedula: data.tipo_cedula,
      estado: data.estado || "",
      tipo_estudiante: tipoEstudiante,
    };
    
    if (studentToUpdate) {
      await UpdateStudent(studentData);
    } else {
      await CreateStudent(studentData);
    }
  };

  // Verificar cedula duplicada
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

  // CREAR ESTUDIANTE CON INSCRIPCIÓN
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

      // Verificar que no esté inscrito en el periodo escolar
      const inscripcionExistente = await verificarInscripcionExistente(
        null,
        selectedPeriodo,
        cedulaNumber
      );
      
      if (inscripcionExistente) {
        showToast.error("El estudiante ya está inscrito en este periodo escolar");
        setIsLoading(false);
        return;
      }

      // Verificar capacidad de la sección
      const seccion = (await getDocument(`secciones/${selectedSeccion}`)) as Secciones;
      if (!seccion) {
        showToast.error("Sección no encontrada");
        setIsLoading(false);
        return;
      }

      if (seccion.estudiantes_inscritos >= seccion.limite_estudiantes) {
        showToast.error(
          `La sección no tiene cupo disponible. Disponibles: ${
            seccion.limite_estudiantes - seccion.estudiantes_inscritos
          }`
        );
        setIsLoading(false);
        return;
      }

      // Obtener lapso activo
      const lapsoActivo = (await getCollection("lapsos", [
        where("status", "==", "ACTIVO"),
      ])) as any[];
      
      if (!lapsoActivo || lapsoActivo.length === 0) {
        showToast.error("No hay un lapso activo. Debes activar un lapso para inscribir estudiantes.");
        setIsLoading(false);
        return;
      }

      const idLapsoActivo = lapsoActivo[0].id as string;
  
      // Crear el estudiante
      const normalizedStudent = {
        ...student,
        cedula: cedulaNumber,
        nombres: student.nombres.toUpperCase(),
        apellidos: student.apellidos.toUpperCase(),
        estado: "activo",
        tipo_estudiante: tipoEstudiante,
        periodo_escolar_actual: selectedPeriodo,
        seccion_actual: selectedSeccion,
        año_actual: seccion.grado_año,
        estado_nacimiento: student.estado_nacimiento?.toUpperCase(),
        municipio: student.municipio?.toUpperCase(),
        parroquia: student.parroquia?.toUpperCase(),
      };
  
      const estudianteDoc = await addDocument(path, normalizedStudent);
      const estudianteId = estudianteDoc.id;

      // Crear inscripción
      const inscripcion: Partial<InscripcionSeccion> = {
        id_estudiante: estudianteId,
        id_seccion: selectedSeccion,
        id_lapso: idLapsoActivo,
        nivel_educativo: seccion.nivel_educativo,
        id_periodo_escolar: selectedPeriodo,
        fecha_inscripcion: Timestamp.now(),
        estado: "activo",
      };
      
      await addDocument("estudiantes_inscritos", inscripcion);

      // Actualizar contadores de la sección
      const nuevosInscritos = seccion.estudiantes_inscritos + 1;
      const estudiantesIds = [...(seccion.estudiantes_ids || []), estudianteId];
      
      await updateDocument(`secciones/${selectedSeccion}`, {
        estudiantes_inscritos: nuevosInscritos,
        estudiantes_ids: estudiantesIds,
      });
  
      showToast.success("El estudiante fue registrado e inscrito exitosamente");
      getStudents();
      setOpen(false);
      form.reset();
      resetForm();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // ACTUALIZAR ESTUDIANTE CON CAMBIO DE SECCIÓN
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

      // Verificar inscripción actual del estudiante en este periodo
      const inscripcionActualBD = (await getCollection("estudiantes_inscritos", [
        where("id_estudiante", "==", studentToUpdate?.id),
        where("id_periodo_escolar", "==", selectedPeriodo),
        where("estado", "==", "activo"),
      ])) as InscripcionSeccion[];

      // CASO 1: Ya está inscrito en este periodo
      if (inscripcionActualBD.length > 0) {
        const seccionAntiguaId = inscripcionActualBD[0].id_seccion;

        // No permitir reinscribir en la misma sección
        if (seccionAntiguaId === selectedSeccion) {
          // Está en la misma sección, solo actualizar datos del estudiante sin cambios de inscripción
          showToast.info("El estudiante ya está inscrito en esta sección. Se actualizaron solo los datos personales.");
        } else {

        // Verificar capacidad de nueva sección
        const nuevaSeccion = (await getDocument(`secciones/${selectedSeccion}`)) as Secciones;
        if (!nuevaSeccion) {
          showToast.error("Nueva sección no encontrada");
          setIsLoading(false);
          return;
        }

        if (nuevaSeccion.estudiantes_inscritos >= nuevaSeccion.limite_estudiantes) {
          showToast.error(
            `La nueva sección no tiene cupo disponible. Disponibles: ${
              nuevaSeccion.limite_estudiantes - nuevaSeccion.estudiantes_inscritos
            }`
          );
          setIsLoading(false);
          return;
        }

        const seccionAntigua = (await getDocument(`secciones/${seccionAntiguaId}`)) as Secciones;

        // Actualizar inscripción
        await updateDocument(`estudiantes_inscritos/${inscripcionActualBD[0].id}`, {
          id_seccion: selectedSeccion,
          nivel_educativo: nuevaSeccion.nivel_educativo,
        });

        // RESTAR de sección antigua
        const nuevosInscritosAntigua = Math.max(0, seccionAntigua.estudiantes_inscritos - 1);
        const estudiantesIdsAntigua = (seccionAntigua.estudiantes_ids || [])
          .filter(id => id !== studentToUpdate?.id);
        
        await updateDocument(`secciones/${seccionAntiguaId}`, {
          estudiantes_inscritos: nuevosInscritosAntigua,
          estudiantes_ids: estudiantesIdsAntigua,
        });

        // SUMAR a sección nueva
        const nuevosInscritosNueva = nuevaSeccion.estudiantes_inscritos + 1;
        const estudiantesIdsNueva = [
          ...(nuevaSeccion.estudiantes_ids || []),
          studentToUpdate?.id!
        ];
        
        await updateDocument(`secciones/${selectedSeccion}`, {
          estudiantes_inscritos: nuevosInscritosNueva,
          estudiantes_ids: estudiantesIdsNueva,
        });

        // Guardar historial de cambio de sección
        const historialCambio: Partial<HistorialCambioSeccion> = {
          id_estudiante: studentToUpdate?.id!,
          id_periodo_escolar: selectedPeriodo,
          id_seccion_anterior: seccionAntiguaId,
          seccion_anterior_nombre: `${seccionAntigua.grado_año}° ${seccionAntigua.nivel_educativo} - ${seccionAntigua.seccion}`,
          id_seccion_nueva: selectedSeccion,
          seccion_nueva_nombre: `${nuevaSeccion.grado_año}° ${nuevaSeccion.nivel_educativo} - ${nuevaSeccion.seccion}`,
          fecha_cambio: Timestamp.now(),
        };
        await addDocument("historial_cambios_seccion", historialCambio);

        showToast.success("Sección cambiada exitosamente");
        }
      } else {
        // No tiene inscripción activa, crear una nueva
        const seccion = (await getDocument(`secciones/${selectedSeccion}`)) as Secciones;
        
        if (!seccion) {
          showToast.error("Sección no encontrada");
          setIsLoading(false);
          return;
        }

        if (seccion.estudiantes_inscritos >= seccion.limite_estudiantes) {
          showToast.error("La sección no tiene cupo disponible");
          setIsLoading(false);
          return;
        }

        const lapsoActivo = (await getCollection("lapsos", [
          where("status", "==", "ACTIVO"),
        ])) as any[];
        
        if (!lapsoActivo || lapsoActivo.length === 0) {
          showToast.error("No hay un lapso activo");
          setIsLoading(false);
          return;
        }

        const idLapsoActivo = lapsoActivo[0].id as string;

        // Crear inscripción
        const inscripcion: Partial<InscripcionSeccion> = {
          id_estudiante: studentToUpdate?.id!,
          id_seccion: selectedSeccion,
          id_lapso: idLapsoActivo,
          nivel_educativo: seccion.nivel_educativo,
          id_periodo_escolar: selectedPeriodo,
          fecha_inscripcion: Timestamp.now(),
          estado: "activo",
        };
        
        await addDocument("estudiantes_inscritos", inscripcion);

        // Actualizar contadores
        const nuevosInscritos = seccion.estudiantes_inscritos + 1;
        const estudiantesIds = [...(seccion.estudiantes_ids || []), studentToUpdate?.id!];
        
        await updateDocument(`secciones/${selectedSeccion}`, {
          estudiantes_inscritos: nuevosInscritos,
          estudiantes_ids: estudiantesIds,
        });

        showToast.success("Estudiante inscrito exitosamente");
      }

      // Obtener sección actualizada
      const seccionFinal = (await getDocument(`secciones/${selectedSeccion}`)) as Secciones;
  
      // Actualizar datos del estudiante
      const normalizedStudent = {
        ...student,
        cedula: cedulaNumber,
        nombres: student.nombres.toUpperCase(),
        apellidos: student.apellidos.toUpperCase(),
        tipo_estudiante: tipoEstudiante,
        periodo_escolar_actual: selectedPeriodo,
        seccion_actual: selectedSeccion,
        año_actual: seccionFinal.grado_año,
        estado_nacimiento: student.estado_nacimiento?.toUpperCase(),
        municipio: student.municipio?.toUpperCase(),
        parroquia: student.parroquia?.toUpperCase(),
      };
    
      await updateDocument(path, normalizedStudent);
      showToast.success("El estudiante fue actualizado exitosamente");
      getStudents();
      setOpen(false);
      form.reset();
      resetForm();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset de formulario
  const resetForm = () => {
    setSelectedPeriodo("");
    setSelectedNivelAcademico("");
    setSelectedSeccion("");
    setTipoEstudiante('nuevo');
    setInscripcionActual(null);
    setEstadoSeleccionado(null);
    setMunicipioSeleccionado(null);
  };

return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-5 py-6">
            {/* Sección: Tipo de Estudiante */}
            <div className="space-y-4 bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-300 pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Clasificación del Estudiante
              </h3>
              
              <div>
                <Label htmlFor="tipo_estudiante" className="mb-2 block">
                  Tipo de Estudiante <span className="text-red-500">*</span>
                </Label>
                <Select value={tipoEstudiante} onValueChange={(value: 'nuevo' | 'regular') => setTipoEstudiante(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Nuevo: Primer ingreso al colegio | Regular: Ya ha estudiado en el colegio
                </p>
              </div>
            </div>

            {/* Sección: Inscripción */}
            <div className="space-y-4 bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-300 shadow-md">
              <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 pb-2 border-b-2 border-blue-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Inscripción
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Periodo Escolar */}
                <div>
                  <Label htmlFor="periodo" className="mb-2 block">
                    Periodo Escolar <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Periodos Escolares</SelectLabel>
                        {periodos.filter(p => p.status === 'ACTIVO').map(periodo => (
                          <SelectItem key={periodo.id} value={periodo.id!}>
                            {periodo.periodo}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nivel Académico */}
                <div>
                  <Label htmlFor="nivel_academico" className="mb-2 block">
                    Nivel Académico <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedNivelAcademico} 
                    onValueChange={setSelectedNivelAcademico}
                    disabled={!selectedPeriodo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Niveles Educativos</SelectLabel>
                        <SelectItem value="Grado">Educación Primaria</SelectItem>
                        <SelectItem value="Año">Educación Media General</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {!selectedPeriodo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona primero un periodo escolar
                    </p>
                  )}
                </div>

                {/* Sección */}
                <div>
                  <Label htmlFor="seccion" className="mb-2 block">
                    Sección <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedSeccion} 
                    onValueChange={setSelectedSeccion}
                    disabled={!selectedPeriodo || !selectedNivelAcademico}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una sección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Secciones Disponibles</SelectLabel>
                        {seccionesFiltradas.map(seccion => (
                          <SelectItem key={seccion.id} value={seccion.id!}>
                            {seccion.grado_año}° {seccion.nivel_educativo} - {seccion.seccion} 
                             (Disponibles: {seccion.limite_estudiantes - seccion.estudiantes_inscritos})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {(!selectedPeriodo || !selectedNivelAcademico) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {!selectedPeriodo 
                        ? "Selecciona primero un periodo escolar" 
                        : "Selecciona un nivel académico"}
                    </p>
                  )}
                </div>
              </div>

              {/* Mostrar inscripción actual si existe */}
              {inscripcionActual && studentToUpdate && (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <p className="text-sm text-amber-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <strong>Inscripción actual:</strong> {inscripcionActual.nivel_educativo}
                    {inscripcionActual.id_seccion !== selectedSeccion && (
                      <span className="ml-2 font-semibold text-amber-700">
                        (Se cambiará de sección)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Sección: Datos de Identificación */}
            <div className="space-y-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-300 pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
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
            <div className="space-y-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-300 pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>  
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
            <div className="space-y-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm  font-semibold text-gray-700 border-b border-gray-300 pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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

          <DialogFooter className="gap-2 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isLoading}
              className="hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
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
