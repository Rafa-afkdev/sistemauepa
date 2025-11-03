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
            <AlertDialogTitle>Estas seguro que deseas eliminar este periodo escolar?</AlertDialogTitle>
            <AlertDialogDescription>
          Presiona En Confirmar Para Eliminar Este Periodo Escolar. Recuerda que al eliminar este periodo escolar, puede afectar a tus registros a largo plazo
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
  