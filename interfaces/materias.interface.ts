import { Timestamp } from "firebase/firestore";

export interface Materias {
    id?: string;
    nombre: string; // Nombre de la materia (Matemática, Lengua, etc.)
    codigo?: string; // Código de la materia (opcional)
    descripcion?: string;
    año: string[]; // Años en los que se imparte esta materia ['1ro', '2do', '3ro']
    estado: 'activa' | 'inactiva';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para asignar materias a docentes por sección
export interface AsignacionDocenteMateria {
    id?: string;
    docente_id: string; // ID del docente
    docente_nombre: string; // Nombre del docente para referencia
    materia_id: string; // ID de la materia
    materia_nombre: string; // Nombre de la materia para referencia
    seccion_id: string; // ID de la sección
    año: string; // Año (1ro, 2do, etc.)
    seccion: string; // Letra de la sección (A, B, etc.)
    periodo_escolar_id: string; // ID del periodo escolar
    estado: 'activa' | 'inactiva';
    fecha_asignacion: Timestamp;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para los contenidos de una materia por lapso
export interface ContenidoMateria {
    id?: string;
    materia_id: string;
    asignacion_id: string; // ID de la asignación docente-materia
    lapso: 1 | 2 | 3; // Lapso escolar
    nombre_contenido: string; // Nombre del contenido o tema
    descripcion?: string;
    ponderacion: number; // Peso del contenido en la nota final del lapso (%)
    fecha_evaluacion?: Timestamp;
    orden: number; // Orden del contenido dentro del lapso
    estado: 'activo' | 'inactivo';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
