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

  export function ConfirmDeletion({children, deleteLapso, lapsos}: {children: React.ReactNode, deleteLapso: (lapsos: LapsosEscolares) => Promise<void>; lapsos: LapsosEscolares }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
        {children}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estas seguro que deseas eliminar esta seccioón?</AlertDialogTitle>
            <AlertDialogDescription>
          Presiona En Confirmar Para Eliminar Este Lapso. Recuerda que al eliminar este lapso, puede afectar a tus registros a largo plazo
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => deleteLapso(lapsos)}
            >
            Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  