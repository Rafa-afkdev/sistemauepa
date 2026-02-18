import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"  
import { Secciones } from "@/interfaces/secciones.interface";
import React from "react"; // <-- Agrega esto


  export function ConfirmDeletion({children, deleteSeccion, seccion}: {children: React.ReactNode, deleteSeccion: (seccion: Secciones) => Promise<void>; seccion: Secciones }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
        {children}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas eliminar esta sección?</AlertDialogTitle>
            <AlertDialogDescription>
          Presiona Confirmar para eliminar la sección. Recuerda que al eliminar esta sección, puede afectar tus registros a largo plazo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => deleteSeccion(seccion)}
            >
            Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  