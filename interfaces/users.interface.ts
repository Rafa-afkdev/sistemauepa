import { Timestamp } from "firebase/firestore";

export interface User {
    uid: string,
    id: string,
    cedula: string,
    name: string,
    apellidos: string,
    email: string,
    password: string,
    image?: string,
    rol: string,
    status: string,
    createdAt: Timestamp;
}