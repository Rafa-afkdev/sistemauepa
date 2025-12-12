import { Timestamp } from "firebase/firestore";

export interface Evaluaciones {
id: string,
id_evaluacion: string,
nombre_evaluacion: string,
tipo_evaluacion: string,
lapsop_id: string,
asignacion_docente_id?: string; // Mantener para compatibilidad
materia_id?: string;
seccion_id?: string;
docente_id?: string;
periodo_escolar_id: string,
criterios: ContenidoCriterios[];
nota_definitiva: number,
fecha: string,
createdAt?: Timestamp,
updatedAt?: Timestamp,
status: string, // EVALUADA o POR EVALUAR
}

export interface ContenidoCriterios{
    nro_criterio: string
    nombre: string,
    ponderacion: number
}