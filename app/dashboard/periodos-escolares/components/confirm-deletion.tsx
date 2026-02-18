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
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import React from "react";



  export function ConfirmDeletion({children, deletePeriodo_Escolar, periodo_escolar}: {children: React.ReactNode, deletePeriodo_Escolar: (periodo_escolar: PeriodosEscolares) => Promise<void>; periodo_escolar: PeriodosEscolares }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
        {children}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas eliminar este período escolar?</AlertDialogTitle>
            <AlertDialogDescription>
          Presiona Confirmar para eliminar este período escolar. Recuerda que al eliminar este período escolar, puede afectar tus registros a largo plazo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => deletePeriodo_Escolar(periodo_escolar)}
            >
            Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  