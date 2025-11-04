import { Timestamp } from "firebase/firestore";

export type TipoMovimiento = 'inscripcion' | 'cambio_seccion' | 'retiro' | 'reingreso';

export interface HistorialSecciones {
    id?: string;
    estudiante_id: string;
    periodo_escolar_id: string;
    tipo_movimiento: TipoMovimiento;
    seccion_origen_id?: string; // ID de la sección de origen (para cambios)
    seccion_destino_id?: string; // ID de la sección de destino (para cambios e inscripciones)
    año_origen?: string; // Año de la sección origen (1ro, 2do, etc.)
    seccion_origen?: string; // Letra de la sección origen (A, B, etc.)
    año_destino?: string; // Año de la sección destino
    seccion_destino?: string; // Letra de la sección destino
    motivo?: string; // Motivo del cambio o retiro
    usuario_responsable_id: string; // ID del usuario que realizó el movimiento
    usuario_responsable_nombre: string; // Nombre del usuario para referencia
    fecha_movimiento: Timestamp;
    observaciones?: string;
    createdAt?: Timestamp;
}

// Interface para consultas rápidas del historial de un estudiante
export interface ResumenHistorialEstudiante {
    estudiante_id: string;
    nombre_completo: string;
    historial: HistorialSecciones[];
    seccion_actual?: string;
    total_cambios: number;
}
