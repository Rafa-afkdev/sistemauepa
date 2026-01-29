import { Timestamp } from "firebase/firestore";

// Niveles educativos




export interface Secciones {
    id?: string;
    nivel_educativo: string; // Grado o Año
    grado_año: string; // Grado/Año: 1ro, 2do, 3ro, etc.
    seccion: string; // Sección: A, B, C, etc.
    id_periodo_escolar: string; // ID del periodo escolar
    docente_guia_id?: string; // ID del docente guía de esta sección
    limite_estudiantes: number; // Cupo máximo de estudiantes
    estudiantes_inscritos: number; // Cantidad actual de estudiantes inscritos
    estudiantes_ids?: string[]; // Array de IDs de estudiantes inscritos
    estado: string; // Estado de la sección
    turno?: string; // Turno de la sección Mañana o Tarde (opcional)
    aula?: string; // Número o nombre del aula (opcional)
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para inscripción de estudiante en sección
export interface InscripcionSeccion {
    id?: string;
    id_estudiante: string;
    id_seccion: string;
    id_lapso: string;
    nivel_educativo: string;
    id_periodo_escolar: string;
    fecha_inscripcion: Timestamp;
    estado: 'activo' | 'retirado' | 'transferido' | 'promovido' | 'finalizado';
    observaciones?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface RetirarEstudiante {
    id?: string;
    id_estudiante: string;
    id_seccion: string;
    id_lapso: string;
    nivel_educativo: string;
    id_periodo_escolar: string;
    fecha_retiro: Timestamp;
    estado: string;
    observaciones?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para historial de cambios de sección
export interface HistorialCambioSeccion {
    id?: string;
    id_estudiante: string;
    id_periodo_escolar: string;
    id_seccion_anterior: string;
    seccion_anterior_nombre: string; // Ej: "5to Grado - A"
    id_seccion_nueva: string;
    seccion_nueva_nombre: string; // Ej: "5to Grado - B"
    fecha_cambio: Timestamp;
    motivo?: string;
    createdAt?: Timestamp;
}
