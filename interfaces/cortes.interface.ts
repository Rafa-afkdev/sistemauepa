import { Timestamp } from "firebase/firestore";

export interface CortesEscolares {
    id?: string,
    corte: string,
    lapso_id: string,
    periodo_escolar_id: string,
    fecha_inicio: string,
    fecha_fin: string,
    status: string,
    createdAt?: Timestamp;
}
