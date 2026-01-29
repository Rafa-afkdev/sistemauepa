import { Timestamp } from "firebase/firestore";

export interface HorarioClase {
    id?: string;
    id_docente: string;
    id_periodo_escolar: string;
    dia: number; // 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes
    bloque_horario: number; // 1, 2, 3... (Indica el orden de la clase en el día)
    
    // Relación con la asignación
    id_asignacion: string; // ID de asignaciones_docente_materia
    id_materia: string;
    id_seccion: string; // Sección específica para este bloque (una materia puede tener varias secciones)
    
    // Detalles de tiempo
    hora_inicio: string; // Ej: "07:00"
    hora_fin: string;    // Ej: "07:45"
    
    // Denormalización para visualización rápida (opcional pero útil)
    nombre_materia?: string;
    nombre_seccion?: string; 
    
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
