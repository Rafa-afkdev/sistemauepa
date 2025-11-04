import { Timestamp } from "firebase/firestore";

export interface User {
    uid: string,
    id: string,
    cedula: string,
    name: string,
    apellidos: string,
    email: string,
    password: string,
    image?: string,
    rol: string, // 'admin', 'control_estudio', 'docente', etc.
    status: string,
    createdAt: Timestamp;
    permiso?: boolean; // Control de estudio puede restringir acceso a docentes
    telefono?: string;
}

// Interface específica para docentes con información adicional
export interface Docente extends User {
    especialidad?: string; // Especialidad del docente
    titulo?: string; // Título académico
    es_docente_guia: boolean; // Si es docente guía de alguna sección
    seccion_guia_id?: string; // ID de la sección de la cual es guía
    materias_asignadas: string[]; // IDs de las materias que imparte
    puede_registrar_notas: boolean; // Control de acceso para registro de notas
    fecha_ingreso?: Timestamp;
}

// Interface para representantes de estudiantes
export interface Representante {
    id?: string;
    tipo_cedula: 'V' | 'E';
    cedula: string;
    nombres: string;
    apellidos: string;
    parentesco: string; // Madre, Padre, Tío, etc.
    telefono_principal: string;
    telefono_secundario?: string;
    email?: string;
    direccion: string;
    estudiantes_ids: string[]; // IDs de los estudiantes que representa
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}