import { Timestamp } from "firebase/firestore";

export type TipoCedula = 'V' | 'E';

// export type EstadoEstudiante = 'activo' | 'retirado' | 'egresado';

export interface Estudiantes {
   id?: string,
   tipo_cedula: TipoCedula;
   cedula: number,
   nombres: string,
   apellidos: string,
   sexo: string,
   estado: string; // Estado del estudiante en el sistema
   fechaNacimiento: string,
   createdAt?: Timestamp,
   periodo_escolar_actual?: string;
   año_actual?: string;
   seccion_actual?: string; // ID de la sección actual
   estado_nacimiento: string,
   municipio: string;
   parroquia: string;
   fecha_retiro?: Timestamp; // Fecha de retiro si aplica
   motivo_retiro?: string; // Motivo del retiro
}
