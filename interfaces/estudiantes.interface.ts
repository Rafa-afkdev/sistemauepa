import { Timestamp } from "firebase/firestore";
// import { NivelEducativo } from "./secciones.interface";
 

export type TipoCedula = 'V' | 'E';

// export type EstadoEstudiante = 'activo' | 'retirado' | 'egresado';

export interface Estudiantes {
   id?: string,
   tipo_cedula: TipoCedula;
   cedula: number,
   nombres: string,
   apellidos: string,
   sexo: string,
   estado: string; // Estado del estudiante en el sistema: 'activo', 'retirado', 'egresado'
   fechaNacimiento: string,
   createdAt?: Timestamp,
   
   // Lugar de nacimiento
   estado_nacimiento?: string; // Estado de nacimiento
   municipio?: string; // Municipio de nacimiento
   parroquia?: string; // Parroquia de nacimiento
   
   // Información académica actual
   // nivel_educativo_actual?: NivelEducativo; //TODO Grado o Año
   grado_año_actual?: string; // Grado/Año actual
   año_actual?: string; // Año actual (alias de grado_año_actual)
   periodo_escolar_actual?: string; // ID del periodo escolar
   seccion_actual?: string; // ID de la sección actual
   
   
   // Control de retiro
   fecha_retiro?: Timestamp; // Fecha de retiro si aplica
   motivo_retiro?: string; // Motivo del retiro
   
   // Metadata
   updatedAt?: Timestamp;
}
