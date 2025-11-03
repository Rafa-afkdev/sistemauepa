import { Timestamp } from "firebase/firestore";

export type TipoCedula = 'V' | 'E';

export interface Estudiantes {
   id?: string,
   tipo_cedula: TipoCedula;
   cedula: number,
   nombres: string,
   apellidos: string,
   sexo: string,
   estado?: string
   fechaNacimiento: string,
   createdAt?: Timestamp,
   periodo_escolar_actual?: string;
   año_actual?: string;
   seccion_actual?: string;
   estado_nacimiento: string,
   municipio: string;
   parroquia: string;
}
