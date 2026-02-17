import { FieldValue, Timestamp } from "firebase/firestore";

/**
 * Interfaz para representar la nota de un criterio específico
 */
export interface NotasCriterios {
  criterio_numero: string;
  criterio_nombre: string;
  ponderacion_maxima: number; // Nota máxima que puede obtener
  nota_obtenida: number; // Nota real del estudiante
}

/**
 * Interfaz para el historial de cambios de una nota
 */
export interface CambioNota {
  fecha: Timestamp;
  nota_anterior: number;
  nota_nueva: number;
  motivo: string;
  usuario_id: string;
}

/**
 * Interfaz para almacenar las notas de un estudiante en una evaluación
 */
export interface NotasEvaluacion {
  id?: string;
  evaluacion_id: string; // ID de la evaluación
  estudiante_id: string; // ID del estudiante
  estudiante_nombre: string; // Nombre completo para referencia
  notas_criterios: NotasCriterios[]; // Array de notas por criterio
  nota_definitiva: number; // Suma total de notas_obtenidas
  observacion?: string; // Observaciones del docente sobre la nota
  docente_id: string; // ID del docente que registró
  historial_cambios?: CambioNota[]; // Historial de modificaciones
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

