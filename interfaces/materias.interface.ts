import { Timestamp } from "firebase/firestore";

export interface Materias {
    id?: string;
    nombre: string; // Nombre de la materia (Matemática, Lengua, Castellano, etc.)
    codigo?: string; // Código de la materia (opcional)
    descripcion?: string;
    nivel_educativo: string; // 'primaria' o 'media_general'
    grados_años: string[]; // Grados/Años en los que se imparte ['1ro', '2do', '3ro']
    // horas_semanales?: number; // Horas de clase por semana
    es_obligatoria: boolean; // Si es materia obligatoria o electiva
    estado: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para asignar materias a docentes por sección
export interface AsignacionDocenteMateria {
    id?: string;
    docente_id: string; // ID del docente
    materia_id: string; // ID de la materia
    secciones_id: string[]; // ID de la sección
    periodo_escolar_id: string; // ID del periodo escolar
    estado: string;
    fecha_asignacion: string;
    observaciones?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface AsignacionDocenteGrado {
    id?: string;
    docente_id: string; // ID del docente
    seccion_id: string; // ID de la sección
    periodo_escolar_id: string; // ID del periodo escolar
    estado: string;
    fecha_asignacion: string;
    observaciones?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para los contenidos de una materia por lapso
export interface ContenidoMateria {
    id?: string;
    materia_id: string;
    asignacion_id: string; // ID de la asignación docente-materia
    periodo_escolar_id: string;
    lapso: number; // Lapso escolar
    nombre_contenido: string; // Nombre del contenido o tema
    descripcion?: string;
    competencias?: string[]; // Competencias a desarrollar
    ponderacion: number; // Peso del contenido en la nota final del lapso (%)
    tipo_evaluacion?: 'prueba' | 'trabajo' | 'exposicion' | 'proyecto' | 'participacion' | 'otro';
    fecha_evaluacion?: Timestamp;
    orden: number; // Orden del contenido dentro del lapso
    estado: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
