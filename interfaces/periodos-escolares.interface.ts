import { Timestamp } from "firebase/firestore";

export interface PeriodosEscolares {
    id?: string,
    periodo: string,
    status: string,
    createdAt?: Timestamp;
}