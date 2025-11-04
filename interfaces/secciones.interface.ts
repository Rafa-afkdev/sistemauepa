import { Timestamp } from "firebase/firestore";

export type Año = '1ro' | '2do' | '3ro' | '4to' | '5to';
export type Seccion = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface Secciones {
    id?: string;
    año: Año; // Año escolar: 1ro, 2do, 3ro, etc.
    seccion: Seccion; // Sección: A, B, C, etc.
    periodo_escolar_id: string; // ID del periodo escolar
    docente_guia_id?: string; // ID del docente guía de esta sección
    limite_estudiantes: number; // Cupo máximo de estudiantes
    estudiantes_inscritos: number; // Cantidad actual de estudiantes inscritos
    estudiantes_ids: string[]; // Array de IDs de estudiantes inscritos
    estado: 'activa' | 'inactiva' | 'cerrada'; // Estado de la sección
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para inscripción de estudiante en sección
export interface InscripcionSeccion {
    id?: string;
    estudiante_id: string;
    seccion_id: string;
    periodo_escolar_id: string;
    fecha_inscripcion: Timestamp;
    estado: 'activo' | 'retirado' | 'transferido';
    createdAt?: Timestamp;
}
