import { Timestamp } from "firebase/firestore";

export interface Representante {
  id?: string;
  tipo_cedula: "V" | "E";
  cedula: string;
  nombres: string;
  apellidos: string;
  parentesco: string;
  telefono_principal: string;
  telefono_secundario?: string;
  email?: string;
  direccion?: string;
  estudiantes_ids: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
