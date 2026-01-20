import { Timestamp } from "firebase/firestore";
import { AsignacionDocenteMateria } from "./materias.interface";

export type AccionHistorial = 'creada' | 'modificada' | 'eliminada';

export interface HistorialAsignacion {
    id?: string;
    asignacion_id: string; // ID de la asignación original
    docente_id: string;
    docente_nombre: string; // Nombre completo del docente para referencia
    materia_id: string;
    materia_nombre: string; // Nombre de la materia para referencia
    secciones_id: string[];
    periodo_escolar_id: string;
    periodo_nombre: string; // Nombre del período para referencia
    
    accion: AccionHistorial;
    fecha_accion: Timestamp;
    usuario_accion_id?: string; // ID del usuario que realizó la acción
    usuario_accion_nombre?: string; // Nombre del usuario para referencia
    
    // Para modificaciones
    estado_anterior?: string;
    estado_nuevo?: string;
    cambios_realizados?: string; // Descripción de los cambios
    
    observaciones?: string;
    datos_snapshot: AsignacionDocenteMateria; // Snapshot completo de la asignación
    
    createdAt?: Timestamp;
}

// Interface para consultas rápidas del historial de un docente
export interface ResumenHistorialDocente {
    docente_id: string;
    nombre_completo: string;
    historial: HistorialAsignacion[];
    total_asignaciones: number;
    total_modificaciones: number;
    total_eliminaciones: number;
    fecha_primera_asignacion?: Timestamp;
    fecha_ultima_accion?: Timestamp;
}
