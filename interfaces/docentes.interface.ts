import { Timestamp } from "firebase/firestore";

export interface Docentes {
   uid: string,
//    image: TeacherImage,
   cedula: string,
   nombres: string,
   apellidos: string,
   telefono: string,
   email: string,
   password: string,
   rol: string,
   permiso: boolean,
   createdAt?: Timestamp,
}

// export interface TeacherImage {
//     path: string,
//     url: string
// }