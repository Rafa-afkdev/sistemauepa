import { Timestamp } from "firebase/firestore";

export interface Notas {
    id?: string;
    estudiante_id: string;
    estudiante_nombre: string; // Nombre completo para referencia
    asignacion_id: string; // ID de la asignación docente-materia
    materia_id: string;
    materia_nombre: string; // Nombre de la materia para referencia
    contenido_id: string; // ID del contenido evaluado
    contenido_nombre: string; // Nombre del contenido para referencia
    seccion_id: string;
    periodo_escolar_id: string;
    lapso: 1 | 2 | 3; // Lapso escolar
    nota: number; // Nota obtenida (0-20 en Venezuela)
    docente_id: string; // ID del docente que registró la nota
    docente_nombre: string; // Nombre del docente para referencia
    fecha_registro: Timestamp;
    observaciones?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para el resumen de notas por lapso de un estudiante
export interface ResumenNotasLapso {
    id?: string;
    estudiante_id: string;
    materia_id: string;
    materia_nombre: string;
    asignacion_id: string;
    seccion_id: string;
    periodo_escolar_id: string;
    lapso: 1 | 2 | 3;
    notas_contenidos: {
        contenido_id: string;
        contenido_nombre: string;
        nota: number;
        ponderacion: number;
    }[];
    nota_final_lapso: number; // Promedio ponderado del lapso
    estado: 'en_progreso' | 'completado'; // Si ya se registraron todas las notas
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para el resumen anual de un estudiante
export interface ResumenNotasAnual {
    id?: string;
    estudiante_id: string;
    estudiante_nombre: string;
    periodo_escolar_id: string;
    seccion_id: string;
    materias: {
        materia_id: string;
        materia_nombre: string;
        nota_lapso_1?: number;
        nota_lapso_2?: number;
        nota_lapso_3?: number;
        promedio_anual: number;
        estado: 'aprobado' | 'reprobado' | 'en_progreso';
    }[];
    promedio_general: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para control de acceso de docentes al registro de notas
export interface AccesoRegistroNotas {
    id?: string;
    docente_id: string;
    periodo_escolar_id: string;
    puede_registrar_notas: boolean; // Control de estudio puede restringir acceso
    fecha_restriccion?: Timestamp;
    motivo_restriccion?: string;
    usuario_responsable_id?: string; // Usuario de control que aplicó la restricción
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
