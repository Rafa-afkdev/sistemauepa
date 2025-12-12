import { Timestamp } from "firebase/firestore";
import { NivelEducativo, GradoAño } from './secciones.interface';

// Escala de calificación para primaria (literal)
export type CalificacionPrimaria = 'A' | 'B' | 'C' | 'D' | 'E';

// Escala numérica para media general (0-20)
export type CalificacionMediaGeneral = number; // 0-20

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
    nivel_educativo: NivelEducativo; // 'primaria' o 'media_general'
    grado_año: GradoAño;
    periodo_escolar_id: string;
    lapso: 1 | 2 | 3; // Lapso escolar
    
    // Calificación según el nivel
    nota_numerica?: number; // Para media general (0-20)
    nota_literal?: CalificacionPrimaria; // Para primaria (A, B, C, D, E)
    nota_display: string; // Nota formateada para mostrar
    
    // Descriptores de evaluación (especialmente para primaria)
    descriptores?: {
        conocimiento?: string; // Nivel de conocimiento alcanzado
        habilidades?: string; // Habilidades desarrolladas
        actitudes?: string; // Actitudes y valores
    };
    
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
    nivel_educativo: NivelEducativo;
    grado_año: GradoAño;
    periodo_escolar_id: string;
    lapso: 1 | 2 | 3;
    notas_contenidos: {
        contenido_id: string;
        contenido_nombre: string;
        nota_numerica?: number;
        nota_literal?: CalificacionPrimaria;
        ponderacion: number;
    }[];
    nota_final_numerica?: number; // Para media general - Promedio ponderado del lapso
    nota_final_literal?: CalificacionPrimaria; // Para primaria
    nota_final_display: string; // Nota final formateada
    estado: 'en_progreso' | 'completado'; // Si ya se registraron todas las notas
    observaciones_generales?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para el resumen anual de un estudiante
export interface ResumenNotasAnual {
    id?: string;
    estudiante_id: string;
    estudiante_nombre: string;
    nivel_educativo: NivelEducativo;
    grado_año: GradoAño;
    periodo_escolar_id: string;
    seccion_id: string;
    materias: {
        materia_id: string;
        materia_nombre: string;
        // Notas por lapso
        nota_lapso_1_numerica?: number;
        nota_lapso_1_literal?: CalificacionPrimaria;
        nota_lapso_1_display?: string;
        nota_lapso_2_numerica?: number;
        nota_lapso_2_literal?: CalificacionPrimaria;
        nota_lapso_2_display?: string;
        nota_lapso_3_numerica?: number;
        nota_lapso_3_literal?: CalificacionPrimaria;
        nota_lapso_3_display?: string;
        // Promedio anual
        promedio_anual_numerico?: number; // Para media general
        promedio_anual_literal?: CalificacionPrimaria; // Para primaria
        promedio_anual_display: string;
        estado: 'aprobado' | 'reprobado' | 'en_progreso' | 'aplazado';
    }[];
    promedio_general_numerico?: number; // Para media general
    promedio_general_literal?: CalificacionPrimaria; // Para primaria
    promedio_general_display: string;
    estado_general: 'promovido' | 'no_promovido' | 'en_progreso';
    observaciones?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para control de acceso de docentes al registro de notas
export interface AccesoRegistroNotas {
    id?: string;
    docente_id: string;
    docente_nombre: string;
    periodo_escolar_id: string;
    puede_registrar_notas: boolean; // Control de estudio puede restringir acceso
    nivel_educativo?: NivelEducativo; // Restricción por nivel (opcional)
    fecha_restriccion?: Timestamp;
    fecha_habilitacion?: Timestamp;
    motivo_restriccion?: string;
    usuario_responsable_id?: string; // Usuario de control que aplicó la restricción
    usuario_responsable_nombre?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Interface para equivalencias entre escalas de calificación
export interface EquivalenciaCalificacion {
    literal: CalificacionPrimaria;
    rango_numerico_min: number; // Mínimo del rango (0-20)
    rango_numerico_max: number; // Máximo del rango (0-20)
    descripcion: string; // Descripción del nivel de logro
}

// Equivalencias estándar (pueden ser configurables)
export const EQUIVALENCIAS_CALIFICACION: EquivalenciaCalificacion[] = [
    { literal: 'A', rango_numerico_min: 18, rango_numerico_max: 20, descripcion: 'Excelente - Dominio total de las competencias' },
    { literal: 'B', rango_numerico_min: 15, rango_numerico_max: 17, descripcion: 'Bueno - Dominio satisfactorio de las competencias' },
    { literal: 'C', rango_numerico_min: 12, rango_numerico_max: 14, descripcion: 'Regular - Dominio básico de las competencias' },
    { literal: 'D', rango_numerico_min: 10, rango_numerico_max: 11, descripcion: 'Deficiente - Dominio mínimo de las competencias' },
    { literal: 'E', rango_numerico_min: 0, rango_numerico_max: 9, descripcion: 'Insuficiente - No alcanza las competencias mínimas' },
];

// Función helper para convertir nota numérica a literal
export function convertirNotaNumericaALiteral(nota: number): CalificacionPrimaria {
    for (const equiv of EQUIVALENCIAS_CALIFICACION) {
        if (nota >= equiv.rango_numerico_min && nota <= equiv.rango_numerico_max) {
            return equiv.literal;
        }
    }
    return 'E'; // Por defecto si no encuentra equivalencia
}
