import { Timestamp } from "firebase/firestore";

export type TipoMovimiento = 'inscripcion' | 'cambio_seccion' | 'retiro' | 'reingreso' | 'promocion';

export interface HistorialSecciones {
    id?: string;
    estudiante_id: string;
    estudiante_nombre: string; // Nombre completo para referencia
    periodo_escolar_id: string;
    tipo_movimiento: TipoMovimiento;
    
    // Información de origen
    seccion_origen_id?: string; // ID de la sección de origen (para cambios)
    nivel_educativo_origen?: string; // Nivel educativo origen
    grado_año_origen?: string; // Grado/Año de la sección origen
    seccion_origen?: string; // Letra de la sección origen (A, B, etc.)
    
    // Información de destino
    seccion_destino_id?: string; // ID de la sección de destino (para cambios e inscripciones)
    nivel_educativo_destino?: string; // Nivel educativo destino
    grado_año_destino?: string; // Grado/Año de la sección destino
    seccion_destino?: string; // Letra de la sección destino
    
    motivo?: string; // Motivo del cambio, retiro o promoción
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
    nivel_educativo_actual?: string;
    grado_año_actual?: string;
    seccion_actual?: string;
    historial: HistorialSecciones[];
    total_movimientos: number;
    total_cambios_seccion: number;
    total_promociones: number;
    fecha_primera_inscripcion?: Timestamp;
    fecha_ultimo_movimiento?: Timestamp;
}
