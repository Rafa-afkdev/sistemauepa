import { Timestamp } from "firebase/firestore";

// Interfaces para Estudiantes
export interface Estudiante {
  id?: string; // ID del documento en Firebase
  cedula: string;
  tipoCedula: 'V' | 'E';
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date | Timestamp;
  sexo: 'M' | 'F';
  direccion: string;
  telefono: string;
  email?: string;
  estado: 'activo' | 'retirado' | 'egresado';
  fechaIngreso: Date | Timestamp;
  fechaRetiro?: Date | Timestamp;
  motivoRetiro?: string;
  representanteId: string; // Referencia al representante
  seccionActualId?: string; // Referencia a la sección actual
  historialSecciones: HistorialSeccion[];
  historialAcademico: HistorialAcademico[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Representantes
export interface Representante {
  id?: string;
  cedula: string;
  tipoCedula: 'V' | 'E';
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
  parentesco: 'padre' | 'madre' | 'tutor' | 'otro';
  profesion?: string;
  lugarTrabajo?: string;
  telefonoTrabajo?: string;
  estudiantesIds: string[]; // IDs de los estudiantes a su cargo
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Secciones
export interface Seccion {
  id?: string;
  nombre: string; // Ej: "1ro A", "2do B"
  nivel: '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to';
  seccion: string; // A, B, C, etc.
  capacidadMaxima: number;
  capacidadActual: number;
  docenteGuiaId: string; // Referencia al docente guía
  periodoEscolarId: string; // Referencia al periodo escolar
  estado: 'activa' | 'cerrada' | 'completa';
  estudiantesIds: string[]; // IDs de los estudiantes en esta sección
  materias: MateriaSeccion[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Historial de Secciones
export interface HistorialSeccion {
  estudianteId: string;
  seccionId: string;
  seccionNombre: string; // Para fácil referencia
  fechaInicio: Date | Timestamp;
  fechaFin?: Date | Timestamp;
  motivoCambio?: string;
  periodoEscolarId: string;
  periodoEscolarNombre: string;
  creadoPor: string; // ID del usuario que realizó el cambio
}

// Interfaces para Periodos Escolares
export interface PeriodoEscolar {
  id?: string;
  nombre: string; // Ej: "2023-2024"
  fechaInicio: Date | Timestamp;
  fechaFin: Date | Timestamp;
  estado: 'activo' | 'cerrado' | 'planificado';
  esActual: boolean;
  lapsos: {
    nombre: string; // "Primer Lapso", "Segundo Lapso", etc.
    fechaInicio: Date | Timestamp;
    fechaFin: Date | Timestamp;
    porcentaje: number; // Porcentaje que representa este lapso en la nota final
  }[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Materias
export interface Materia {
  id?: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  horasSemanales: number;
  nivel: '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | 'todos';
  areaConocimiento: string;
  orden: number; // Para ordenar las materias
  estado: 'activa' | 'inactiva';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Materias por Sección
export interface MateriaSeccion {
  materiaId: string;
  materiaNombre: string;
  docenteId: string;
  docenteNombre: string;
  horario: {
    dia: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado';
    horaInicio: string;
    horaFin: string;
  }[];
}

// Interfaces para Docentes
export interface Docente {
  id?: string;
  cedula: string;
  tipoCedula: 'V' | 'E';
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date | Timestamp;
  sexo: 'M' | 'F';
  direccion: string;
  telefono: string;
  email: string;
  tituloAcademico: string;
  especialidad: string;
  fechaIngreso: Date | Timestamp;
  estado: 'activo' | 'inactivo' | 'jubilado' | 'permiso';
  materiasIds: string[]; // IDs de las materias que puede dictar
  esDocenteGuia: boolean;
  seccionGuiaId?: string; // Solo si es docente guía
  usuarioId: string; // Referencia al usuario
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Calificaciones
export interface Calificacion {
  id?: string;
  estudianteId: string;
  estudianteNombre: string;
  materiaId: string;
  materiaNombre: string;
  seccionId: string;
  seccionNombre: string;
  periodoEscolarId: string;
  periodoEscolarNombre: string;
  lapso: number; // 1, 2, 3, etc.
  notas: {
    tipo: 'evaluacion' | 'tarea' | 'proyecto' | 'examen' | 'otro';
    nombre: string;
    valor: number;
    porcentaje: number;
    fecha: Date | Timestamp;
    comentario?: string;
  }[];
  notaFinal?: number;
  asistencia: number; // Porcentaje de asistencia
  observaciones?: string;
  estado: 'borrador' | 'publicada' | 'revision' | 'aprobada';
  solicitadoPor?: string; // ID del docente que solicitó edición
  motivoSolicitud?: string;
  aprobadoPor?: string; // ID del usuario de control de estudio
  fechaAprobacion?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Usuarios
export interface Usuario {
  id?: string;
  email: string;
  password: string;
  rol: 'admin' | 'control_estudio' | 'docente' | 'representante' | 'estudiante';
  estado: 'activo' | 'inactivo' | 'pendiente';
  personaId: string; // Referencia a Estudiante, Docente o Representante
  personaTipo: 'estudiante' | 'docente' | 'representante';
  ultimoAcceso?: Date | Timestamp;
  intentosFallidos: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Solicitudes de Cambio
export interface SolicitudCambio {
  id?: string;
  tipo: 'cambio_seccion' | 'edicion_nota' | 'otro';
  estudianteId: string;
  estudianteNombre: string;
  seccionOrigenId?: string;
  seccionOrigenNombre?: string;
  seccionDestinoId?: string;
  seccionDestinoNombre?: string;
  calificacionId?: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  solicitadoPor: string; // ID del usuario que realiza la solicitud
  revisadoPor?: string; // ID del usuario que revisa
  fechaSolicitud: Date | Timestamp;
  fechaResolucion?: Date | Timestamp;
  comentarios?: string;
  datosAnteriores?: any; // Datos antes del cambio (para auditoría)
  datosNuevos?: any; // Datos después del cambio (para auditoría)
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Historial Académico
export interface HistorialAcademico {
  estudianteId: string;
  periodoEscolarId: string;
  periodoEscolarNombre: string;
  seccionId: string;
  seccionNombre: string;
  materias: {
    materiaId: string;
    materiaNombre: string;
    lapsos: {
      numero: number;
      nota: number;
      asistencia: number;
      estado: 'aprobado' | 'reprobado' | 'en_curso';
    }[];
    notaFinal?: number;
    estado: 'aprobado' | 'reprobado' | 'en_curso';
  }[];
  promedioGeneral?: number;
  asistenciaGeneral?: number;
  observaciones?: string;
  promovido: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Interfaces para Auditoría
export interface Auditoria {
  id?: string;
  accion: string;
  modulo: 'estudiantes' | 'docentes' | 'secciones' | 'calificaciones' | 'usuarios' | 'solicitudes';
  entidadId: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  realizadoPor: string; // ID del usuario
  realizadoPorNombre: string;
  fecha: Date | Timestamp;
  ip?: string;
  userAgent?: string;
}
