 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { HistorialCambioSeccion, InscripcionSeccion, Secciones } from "@/interfaces/secciones.interface";
import { Representante } from "@/interfaces/users.interface";
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
import { Check, ChevronsUpDown, LoaderCircle, Search } from "lucide-react";
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
  const [pendingSeccion, setPendingSeccion] = useState<string>(""); // Sección pendiente de selección
  const [tipoEstudiante, setTipoEstudiante] = useState<'nuevo' | 'regular'>('nuevo');
  const [statusInscripcion, setStatusInscripcion] = useState<string>("activo");
  const [inscripcionActual, setInscripcionActual] = useState<InscripcionSeccion | null>(null);

  // Estados para datos del representante
  const [representanteData, setRepresentanteData] = useState<{
    tipo_cedula: 'V' | 'E';
    cedula: string;
    nombres: string;
    apellidos: string;
    parentesco: string;
    telefono_principal: string;
    telefono_secundario: string;
    email: string;
    direccion: string;
  }>({
    tipo_cedula: 'V',
    cedula: '',
    nombres: '',
    apellidos: '',
    parentesco: '',
    telefono_principal: '',
    telefono_secundario: '',
    email: '',
    direccion: ''
  });
  const [representanteExistente, setRepresentanteExistente] = useState<Representante | null>(null);
  
  // Estado para búsqueda de representantes
  const [openSearchRep, setOpenSearchRep] = useState(false);
  const [representantesList, setRepresentantesList] = useState<Representante[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);

  // Función para cargar representantes para el buscador
  const fetchRepresentantes = async () => {
    if (representantesList.length > 0) return; // Ya están cargados
    
    setLoadingReps(true);
    try {
      const reps = await getCollection("representantes") as Representante[];
      // Ordenar por nombres
      reps.sort((a, b) => (a.nombres || "").localeCompare(b.nombres || ""));
      setRepresentantesList(reps);
    } catch (error) {
      console.error("Error al cargar representantes:", error);
      showToast.error("Error al cargar lista de representantes");
    } finally {
      setLoadingReps(false);
    }
  };

  const handleSelectRepresentante = (rep: Representante) => {
    setRepresentanteExistente(rep);
    setRepresentanteData({
      tipo_cedula: rep.tipo_cedula || 'V',
      cedula: rep.cedula || '',
      nombres: rep.nombres || '',
      apellidos: rep.apellidos || '',
      parentesco: rep.parentesco || '',
      telefono_principal: rep.telefono_principal || '',
      telefono_secundario: rep.telefono_secundario || '',
      email: rep.email || '',
      direccion: rep.direccion || ''
    });
    setOpenSearchRep(false);
    showToast.info("Datos del representante cargados");
  };

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

        // Establecer periodo si existe
        if (studentToUpdate.periodo_escolar_actual) {
          setSelectedPeriodo(studentToUpdate.periodo_escolar_actual);
        }

        // Cargar la sección actual para obtener el nivel académico
        if (studentToUpdate.seccion_actual) {
          try {
            const seccionActual = await getDocument(`secciones/${studentToUpdate.seccion_actual}`) as Secciones;
            if (seccionActual) {
              // Establecer el nivel académico desde la sección
              setSelectedNivelAcademico(seccionActual.nivel_educativo || "");
              // Guardar la sección como pendiente (se establecerá cuando las secciones filtradas estén disponibles)
              setPendingSeccion(studentToUpdate.seccion_actual);
            }
          } catch (error) {
            console.error("Error al cargar sección actual:", error);
            // Si falla, guardar como pendiente de todos modos
            setPendingSeccion(studentToUpdate.seccion_actual);
          }
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

            ])) as InscripcionSeccion[];

            if (inscripciones.length > 0) {
              setInscripcionActual(inscripciones[0]);
              setStatusInscripcion(inscripciones[0].estado || "activo");
            }
          } catch (error) {
            console.error("Error al cargar inscripción actual:", error);
          }
        }

        // Cargar datos del representante si existe
        if (studentToUpdate.id_representante) {
          try {
            const representante = await getDocument(`representantes/${studentToUpdate.id_representante}`) as Representante;
            if (representante) {
              setRepresentanteExistente(representante);
              setRepresentanteData({
                tipo_cedula: representante.tipo_cedula || 'V',
                cedula: representante.cedula || '',
                nombres: representante.nombres || '',
                apellidos: representante.apellidos || '',
                parentesco: representante.parentesco || '',
                telefono_principal: representante.telefono_principal || '',
                telefono_secundario: representante.telefono_secundario || '',
                email: representante.email || '',
                direccion: representante.direccion || ''
              });
            }
          } catch (error) {
            console.error("Error al cargar representante:", error);
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

  // Establecer la sección pendiente cuando las secciones filtradas estén disponibles
  useEffect(() => {
    if (pendingSeccion && seccionesFiltradas.length > 0) {
      // Verificar si la sección pendiente existe en las secciones filtradas
      const seccionExiste = seccionesFiltradas.some(s => s.id === pendingSeccion);
      if (seccionExiste) {
        setSelectedSeccion(pendingSeccion);
        setPendingSeccion(""); // Limpiar la sección pendiente
      }
    }
  }, [pendingSeccion, seccionesFiltradas]);

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

    // Validar campos del representante
    if (!representanteData.cedula || representanteData.cedula.length < 6) {
      showToast.error("Debes ingresar la cédula del representante");
      return;
    }

    if (!representanteData.nombres) {
      showToast.error("Debes ingresar los nombres del representante");
      return;
    }

    if (!representanteData.apellidos) {
      showToast.error("Debes ingresar los apellidos del representante");
      return;
    }

    if (!representanteData.parentesco) {
      showToast.error("Debes seleccionar el parentesco del representante");
      return;
    }

    if (!representanteData.telefono_principal) {
      showToast.error("Debes ingresar el teléfono principal del representante");
      return;
    }

    if (!representanteData.direccion) {
      showToast.error("Debes ingresar la dirección del representante");
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

  // Helper para guardar o actualizar representante
  const guardarRepresentante = async (estudianteId: string): Promise<string | null> => {
    try {
      // Buscar si ya existe un representante con esta cédula
      const representantesExistentes = await getCollection("representantes", [
        where("cedula", "==", representanteData.cedula),
      ]) as Representante[];

      if (representantesExistentes.length > 0) {
        // El representante ya existe, actualizar y agregar estudiante si no está
        const repExistente = representantesExistentes[0];
        const estudiantesIds = repExistente.estudiantes_ids || [];
        
        if (!estudiantesIds.includes(estudianteId)) {
          estudiantesIds.push(estudianteId);
        }

        await updateDocument(`representantes/${repExistente.id}`, {
          ...representanteData,
          nombres: representanteData.nombres.toUpperCase(),
          apellidos: representanteData.apellidos.toUpperCase(),
          direccion: representanteData.direccion.toUpperCase(),
          estudiantes_ids: estudiantesIds,
          updatedAt: Timestamp.now(),
        });

        return repExistente.id!;
      } else {
        // Crear nuevo representante
        const nuevoRepresentante: Partial<Representante> = {
          tipo_cedula: representanteData.tipo_cedula,
          cedula: representanteData.cedula,
          nombres: representanteData.nombres.toUpperCase(),
          apellidos: representanteData.apellidos.toUpperCase(),
          parentesco: representanteData.parentesco,
          telefono_principal: representanteData.telefono_principal,
          telefono_secundario: representanteData.telefono_secundario,
          email: representanteData.email,
          direccion: representanteData.direccion.toUpperCase(),
          estudiantes_ids: [estudianteId],
          createdAt: Timestamp.now(),
        };

        const repDoc = await addDocument("representantes", nuevoRepresentante);
        return repDoc.id;
      }
    } catch (error) {
      console.error("Error al guardar representante:", error);
      return null;
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
        estado: statusInscripcion as any,
      };
      
      await addDocument("estudiantes_inscritos", inscripcion);

      // Guardar historial de NUEVO INGRESO
      const seccionHistorial = (await getDocument(`secciones/${selectedSeccion}`)) as Secciones; 
      const historialNuevo: Partial<HistorialCambioSeccion> = {
        id_estudiante: estudianteId,
        id_periodo_escolar: selectedPeriodo,
        id_seccion_anterior: "NUEVO_INGRESO",
        seccion_anterior_nombre: "NUEVO INGRESO",
        id_seccion_nueva: selectedSeccion,
        seccion_nueva_nombre: `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.nivel_educativo}`,
        fecha_cambio: Timestamp.now(),
        motivo: "Inscripción inicial"
      };
      await addDocument("historial_cambios_seccion", historialNuevo);

      // Actualizar contadores de la sección
      const nuevosInscritos = seccion.estudiantes_inscritos + 1;
      const estudiantesIds = [...(seccion.estudiantes_ids || []), estudianteId];
      
      await updateDocument(`secciones/${selectedSeccion}`, {
        estudiantes_inscritos: nuevosInscritos,
        estudiantes_ids: estudiantesIds,
      });

      // Guardar representante y vincular con estudiante
      const representanteId = await guardarRepresentante(estudianteId);
      if (representanteId) {
        await updateDocument(`estudiantes/${estudianteId}`, {
          id_representante: representanteId,
        });
      }
  
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

      ])) as InscripcionSeccion[];

      // CASO 1: Ya está inscrito en este periodo
      if (inscripcionActualBD.length > 0) {
        const seccionAntiguaId = inscripcionActualBD[0].id_seccion;

        // No permitir reinscribir en la misma sección
        // No permitir reinscribir en la misma sección, PERO si actualizar estatus
        if (seccionAntiguaId === selectedSeccion) {
          // Si el estatus es diferente, actualizarlo
          if (inscripcionActualBD[0].estado !== statusInscripcion) {
             await updateDocument(`estudiantes_inscritos/${inscripcionActualBD[0].id}`, {
               estado: statusInscripcion as any,
               updatedAt: Timestamp.now(),
             });
             
             // Registrar historial si cambia el estatus
             const seccionActual = (await getDocument(`secciones/${selectedSeccion}`)) as Secciones;
             
             let nuevaSeccionNombre = `${seccionActual.grado_año}° ${seccionActual.nivel_educativo} - ${seccionActual.seccion}`;
             let nuevaSeccionId = selectedSeccion;
             
             if (statusInscripcion === 'retirado') {
                 nuevaSeccionNombre = "RETIRADO";
                 nuevaSeccionId = null as any;
             }

             await addDocument("historial_cambios_seccion", {
                id_estudiante: studentToUpdate?.id!,
                id_periodo_escolar: selectedPeriodo,
                id_seccion_anterior: seccionAntiguaId,
                seccion_anterior_nombre: `${seccionActual.grado_año}° ${seccionActual.nivel_educativo} - ${seccionActual.seccion}`,
                id_seccion_nueva: nuevaSeccionId,
                seccion_nueva_nombre: nuevaSeccionNombre,
                fecha_cambio: Timestamp.now(),
                motivo: `Cambio de estatus: ${inscripcionActualBD[0].estado} -> ${statusInscripcion}`
             });

             // ACTUALIZAR CONTADORES DE LA SECCION
             if (statusInscripcion === 'retirado') {
                 // Si se retira, sacarlo de la sección
                 const nuevosEstudiantesIds = (seccionActual.estudiantes_ids || []).filter(id => id !== studentToUpdate?.id);
                 const nuevaCantidad = Math.max(0, seccionActual.estudiantes_inscritos - 1);
                 
                 await updateDocument(`secciones/${selectedSeccion}`, {
                    estudiantes_ids: nuevosEstudiantesIds,
                    estudiantes_inscritos: nuevaCantidad
                 });
             } else if (statusInscripcion === 'activo') {
                 // Si se reactiva, volverlo a meter (si no estaba)
                 const idsActuales = seccionActual.estudiantes_ids || [];
                 if (!idsActuales.includes(studentToUpdate?.id!)) {
                     const nuevosEstudiantesIds = [...idsActuales, studentToUpdate?.id!];
                     const nuevaCantidad = seccionActual.estudiantes_inscritos + 1;

                     await updateDocument(`secciones/${selectedSeccion}`, {
                        estudiantes_ids: nuevosEstudiantesIds,
                        estudiantes_inscritos: nuevaCantidad
                     });
                 }
             }

             showToast.success("Estatus de inscripción actualizado");
          }
          // Está en la misma sección, solo actualizar datos del estudiante
          showToast.info("Datos del estudiante actualizados.");
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
        
        // 1. ELIMINAR de sección antigua
        const nuevosInscritosAntigua = Math.max(0, seccionAntigua.estudiantes_inscritos - 1);
        const estudiantesIdsAntigua = (seccionAntigua.estudiantes_ids || [])
          .filter(id => id !== studentToUpdate?.id);
        
        await updateDocument(`secciones/${seccionAntiguaId}`, {
          estudiantes_inscritos: nuevosInscritosAntigua,
          estudiantes_ids: estudiantesIdsAntigua,
        });

        // 2. SUMAR a sección nueva
        const nuevosInscritosNueva = nuevaSeccion.estudiantes_inscritos + 1;
        const estudiantesIdsNueva = [
          ...(nuevaSeccion.estudiantes_ids || []),
          studentToUpdate?.id!
        ];
        
        await updateDocument(`secciones/${selectedSeccion}`, {
          estudiantes_inscritos: nuevosInscritosNueva,
          estudiantes_ids: estudiantesIdsNueva,
        });

        // 3. ACTUALIZAR INSCRIPCIÓN (Solo si los pasos anteriores fueron exitosos)
        await updateDocument(`estudiantes_inscritos/${inscripcionActualBD[0].id}`, {
          id_seccion: selectedSeccion,
          nivel_educativo: nuevaSeccion.nivel_educativo,
          estado: 'activo',
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

        // Guardar historial de NUEVO INGRESO (si no tenia inscripcion previa en este periodo)
        const historialNuevo: Partial<HistorialCambioSeccion> = {
            id_estudiante: studentToUpdate?.id!,
            id_periodo_escolar: selectedPeriodo,
            id_seccion_anterior: "NUEVO_INGRESO",
            seccion_anterior_nombre: "NUEVO INGRESO",
            id_seccion_nueva: selectedSeccion,
            seccion_nueva_nombre: `${seccion.grado_año}° "${seccion.seccion}" - ${seccion.nivel_educativo}`,
            fecha_cambio: Timestamp.now(),
            motivo: "Inscripción en periodo (sin registro previo)"
        };
        await addDocument("historial_cambios_seccion", historialNuevo);


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

      // Guardar/actualizar representante y vincular con estudiante
      const representanteId = await guardarRepresentante(studentToUpdate?.id!);
      if (representanteId && representanteId !== studentToUpdate?.id_representante) {
        await updateDocument(path, {
          id_representante: representanteId,
        });
      }

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
    // Reset datos del representante
    setRepresentanteData({
      tipo_cedula: 'V',
      cedula: '',
      nombres: '',
      apellidos: '',
      parentesco: '',
      telefono_principal: '',
      telefono_secundario: '',
      email: '',
      direccion: ''
    });
    setRepresentanteExistente(null);
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

          <Tabs defaultValue="inscripcion" className="w-full py-4">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-blue-100 border-blue-300">
              <TabsTrigger value="inscripcion" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Inscripción
              </TabsTrigger>
              <TabsTrigger value="estudiante" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Datos del Estudiante
              </TabsTrigger>
              <TabsTrigger value="representante" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Representante
              </TabsTrigger>
            </TabsList>

            {/* Tab: Inscripción */}
            <TabsContent value="inscripcion" className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
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

                {/* Estatus de Inscripción */}
                <div>
                  <Label htmlFor="status_inscripcion" className="mb-2 block">
                    Estatus de Inscripción
                  </Label>
                  <Select 
                    value={statusInscripcion} 
                    onValueChange={setStatusInscripcion}
                    disabled={!studentToUpdate || !inscripcionActual}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estatus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Estatus</SelectLabel>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="retirado">Retirado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
              </motion.div>
            </TabsContent>

            {/* Tab: Datos del Estudiante */}
            <TabsContent value="estudiante" className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            </TabsContent>

            {/* Tab: Datos del Representante */}
            <TabsContent value="representante" className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
              {/* Sección: Datos del Representante */}
            <div className="space-y-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-300 pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Datos del Representante
              </h3>

              <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => {
                      setOpenSearchRep(true);
                      fetchRepresentantes();
                    }}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Buscar representante existente
                  </Button>
              </div>
              
              {/* Dialogo para buscar representantes */}
              <Dialog open={openSearchRep} onOpenChange={setOpenSearchRep}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Buscar Representante</DialogTitle>
                    <DialogDescription>
                      Busca por nombre o número de cédula para autocompletar los datos.
                    </DialogDescription>
                  </DialogHeader>
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput placeholder="Escribe el nombre o cédula..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {loadingReps ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
                        ) : (
                          representantesList.map((rep) => (
                          <CommandItem
                            key={rep.id}
                            value={`${rep.nombres} ${rep.apellidos} ${rep.cedula}`}
                            onSelect={() => handleSelectRepresentante(rep)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                representanteData.cedula === rep.cedula
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                                <span className="font-medium">{rep.nombres} {rep.apellidos}</span>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>{rep.tipo_cedula}-{rep.cedula}</span>
                                  <span>•</span>
                                  <span>{rep.parentesco}</span>
                                </div>
                            </div>
                          </CommandItem>
                        )))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo y Cédula del Representante */}
                <div className="flex gap-2">
                  <div className="w-24">
                    <Label htmlFor="rep_tipo_cedula" className="mb-2 block">
                      Tipo
                    </Label>
                    <select
                      id="rep_tipo_cedula"
                      value={representanteData.tipo_cedula}
                      onChange={(e) => setRepresentanteData({
                        ...representanteData,
                        tipo_cedula: e.target.value as 'V' | 'E'
                      })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="V">V</option>
                      <option value="E">E</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="rep_cedula" className="mb-2 block">
                      Cédula del Representante <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="rep_cedula"
                      placeholder="Ingrese la cédula"
                      value={representanteData.cedula}
                      onChange={(e) => setRepresentanteData({
                        ...representanteData,
                        cedula: e.target.value.replace(/\D/g, '').slice(0, 11)
                      })}
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Parentesco */}
                <div>
                  <Label htmlFor="rep_parentesco" className="mb-2 block">
                    Parentesco <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={representanteData.parentesco}
                    onValueChange={(value) => setRepresentanteData({
                      ...representanteData,
                      parentesco: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Parentesco</SelectLabel>
                        <SelectItem value="Madre">Madre</SelectItem>
                        <SelectItem value="Padre">Padre</SelectItem>
                        <SelectItem value="Abuelo(a)">Abuelo(a)</SelectItem>
                        <SelectItem value="Tío(a)">Tío(a)</SelectItem>
                        <SelectItem value="Hermano(a)">Hermano(a)</SelectItem>
                        <SelectItem value="Tutor Legal">Tutor Legal</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nombres */}
                <div>
                  <Label htmlFor="rep_nombres" className="mb-2 block">
                    Nombres <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rep_nombres"
                    placeholder="Nombres del representante"
                    value={representanteData.nombres}
                    onChange={(e) => setRepresentanteData({
                      ...representanteData,
                      nombres: e.target.value
                    })}
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <Label htmlFor="rep_apellidos" className="mb-2 block">
                    Apellidos <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rep_apellidos"
                    placeholder="Apellidos del representante"
                    value={representanteData.apellidos}
                    onChange={(e) => setRepresentanteData({
                      ...representanteData,
                      apellidos: e.target.value
                    })}
                  />
                </div>

                {/* Teléfono Principal */}
                <div>
                  <Label htmlFor="rep_telefono_principal" className="mb-2 block">
                    Teléfono Principal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rep_telefono_principal"
                    placeholder="Ej: 04XX-XXXXXXX"
                    value={representanteData.telefono_principal}
                    onChange={(e) => setRepresentanteData({
                      ...representanteData,
                      telefono_principal: e.target.value
                    })}
                  />
                </div>

                {/* Teléfono Secundario */}
                <div>
                  <Label htmlFor="rep_telefono_secundario" className="mb-2 block">
                    Teléfono Secundario
                  </Label>
                  <Input
                    id="rep_telefono_secundario"
                    placeholder="Ej: 04XX-XXXXXXX (opcional)"
                    value={representanteData.telefono_secundario}
                    onChange={(e) => setRepresentanteData({
                      ...representanteData,
                      telefono_secundario: e.target.value
                    })}
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="rep_email" className="mb-2 block">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="rep_email"
                    type="email"
                    placeholder="correo@ejemplo.com (opcional)"
                    value={representanteData.email}
                    onChange={(e) => setRepresentanteData({
                      ...representanteData,
                      email: e.target.value.toLowerCase()
                    })}
                  />
                </div>

                {/* Dirección - ocupa toda la fila */}
                <div className="md:col-span-2">
                  <Label htmlFor="rep_direccion" className="mb-2 block">
                    Dirección <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rep_direccion"
                    placeholder="Dirección completa del representante"
                    value={representanteData.direccion}
                    onChange={(e) => setRepresentanteData({
                      ...representanteData,
                      direccion: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
              </motion.div>
            </TabsContent>
          </Tabs>

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
