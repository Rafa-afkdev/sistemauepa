import { Timestamp } from "firebase/firestore";

export interface LapsosEscolares {
    id?: string,
    lapso: string,
    año_escolar: string,
    fecha_inicio: string,
    fecha_fin: string,
    status: string,
    createdAt?: Timestamp;
}