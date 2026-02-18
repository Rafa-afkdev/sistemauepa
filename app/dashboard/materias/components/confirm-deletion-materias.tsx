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
} from "@/components/ui/alert-dialog";
import React from "react";
import { Materias } from "@/interfaces/materias.interface";

interface ConfirmDeletionMateriasProps {
  children: React.ReactNode;
  deleteMateria: (materia: Materias) => Promise<void>;
  materia: Materias;
}

export function ConfirmDeletionMaterias({
  children,
  deleteMateria,
  materia,
}: ConfirmDeletionMateriasProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de que deseas eliminar esta materia?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Presiona Confirmar para eliminar la materia. Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => deleteMateria(materia)}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
