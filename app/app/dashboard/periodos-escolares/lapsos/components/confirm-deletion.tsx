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
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import React from "react";



  export function ConfirmDeletion({children, deleteLapsoEscolar, lapso_escolar}: {children: React.ReactNode, deleteLapsoEscolar: (lapso_escolar: LapsosEscolares) => Promise<void>; lapso_escolar: LapsosEscolares }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
        {children}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas eliminar este lapso escolar?</AlertDialogTitle>
            <AlertDialogDescription>
          Presiona Confirmar para eliminar este lapso escolar. Recuerda que al eliminar este lapso escolar, puede afectar tus registros a largo plazo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => deleteLapsoEscolar(lapso_escolar)}
            >
            Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  