/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, getFirestore, increment, limit, query, serverTimestamp, setDoc, startAfter, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

//TODO CONFIGURACION DE PRODUCCION
const firebaseConfig = {
  apiKey: "AIzaSyC5zYhmNaffwYTp_kDpz7AMZIQLA_1RV-Q",
  authDomain: "colegiouepa-93545.firebaseapp.com",
  projectId: "colegiouepa-93545",
  storageBucket: "colegiouepa-93545.firebasestorage.app",
  messagingSenderId: "532750479123",
  appId: "1:532750479123:web:8972db8ca4fd9ed50eb4e6"
};


//TODO CONFIGURACION DE DESARROLLO
// const firebaseConfig = {
//   apiKey: "AIzaSyBRvMoAIwHRlUjy-t7nikzCmcok9O82vU4",
//   authDomain: "colegiouepa-a7efa.firebaseapp.com",
//   projectId: "colegiouepa-a7efa",
//   storageBucket: "colegiouepa-a7efa.firebasestorage.app",
//   messagingSenderId: "859629992927",
//   appId: "1:859629992927:web:aabb827e2e3d9b3839a26a"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Instancia secundaria para crear usuarios sin afectar la sesión actual
const secondaryApp = initializeApp(firebaseConfig, "Secondary");

export default app;

export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);
export const storage = getStorage(app);


//TODO Las FUNCIONES DEL AUTH //

//?CREAR NUEVO USUARIO///
// Usa la instancia secundaria para no cerrar la sesión del administrador
export const createUser = async(user: {email: string, password:string}) => {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
    // Cerrar sesión en la instancia secundaria para que no interfiera
    await secondaryAuth.signOut();
    return userCredential;
}

//??ENTRAR CON EMAIL & CONTRASEÑA//

export const signIn = async(user: {email: string, password: string}) => {
    return await signInWithEmailAndPassword(auth, user.email, user.password);
}

//?ACTUALIZAR USUARIO//
export const updateUser = (user: { displayName?: string | null; photoURL?: string | null; }) => {
    if(auth.currentUser) return updateProfile(auth.currentUser, user)
}

//?CERRAR SESION//
export const signOutAccount = () => {
    localStorage.removeItem('user');
    return auth.signOut();
}

//? RECUPERAR CONTRASEÑA//
export const sentResetEmail = (email: string) => {
    return sendPasswordResetEmail(auth, email)
}


//TODO FUNCIONES DATABASE///

//?INCREMENTAR O DECREMENTAR UN VALOR NUMERICO//
export { increment };

export const getCollection = async(colectionName: string, queryArray?:any[]) => {
    const ref = collection(db, colectionName);
    const q = queryArray ? query(ref, ...queryArray) : query(ref);
    return (await getDocs(q)).docs.map((doc) => ({id: doc.id, ...doc.data()}));

}

//? OBTENER COLECCIÓN CON PAGINACIÓN //
export const getCollectionPaginated = async(
    colectionName: string, 
    pageSize: number,
    lastDoc?: any,
    queryArray?: any[]
) => {
    const ref = collection(db, colectionName);
    let constraints = queryArray ? [...queryArray] : [];
    
    // IMPORTANTE: startAfter debe ir ANTES de limit
    // Si hay un documento anterior, empezar después de él
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }
    
    // Agregar limit al final
    constraints.push(limit(pageSize));
    
    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
        docs: snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()})),
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
    };
}

//? OBTENER CONTEO TOTAL DE DOCUMENTOS //
export const getCollectionCount = async(colectionName: string, queryArray?: any[]) => {
    const ref = collection(db, colectionName);
    const q = queryArray ? query(ref, ...queryArray) : query(ref);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

//?OBTENER UN DOCUMENTO DE UNA COLECCION//
export const getDocument = async (path:string) => {
    return (await getDoc(doc(db, path))).data();
}



//?SETEAR UN DOCUMENTO EN UNA COLECCION//
export const setDocument = (path:string, data:any) => {
    data.createAt = serverTimestamp();
    return setDoc(doc(db, path), data)
}

//? ACTUALIZAR UN DOCUMENTO EN UNA COLECCION//
export const updateDocument = (path:string, data:any) => {
    return updateDoc(doc(db, path), data)
}

//? ELIMINAR UN DOCUMENTO DE UNA COLECCION//
export const deleteDocument = (path:string) => {
    return deleteDoc(doc(db, path))
}

//? AGREGAR UN DOCUMENTO //////
export const addDocument = (path:string, data:any) => {
    data.createAt = serverTimestamp();
    return addDoc(collection(db, path), data)
}

//?TODO ===== FUNCIONES DEL STORAGE====== ///

//! SUBIR UN ARCHIVO CON FORMATO BASE64 & OBTENER SU URL//
export const uploadBase64 = async (path: string, base64: string) => {
    return uploadString(ref(storage, path), base64, 'data_url').then(() => {
        return getDownloadURL(ref(storage, path))
    })
}