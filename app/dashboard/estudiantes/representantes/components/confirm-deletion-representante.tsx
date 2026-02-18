"use client";

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
import { Representante } from "@/interfaces/representante.interface";
import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

export function ConfirmDeletionRepresentante({
  children,
  representante,
  deleteRepresentante,
}: {
  children: ReactNode;
  representante: Representante;
  deleteRepresentante: (rep: Representante) => Promise<void>;
}) {
  const hasStudents = representante.estudiantes_ids && representante.estudiantes_ids.length > 0;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            ¿Eliminar Representante?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
            <p>
              ¿Está seguro de que desea eliminar a{" "}
              <span className="font-semibold">
                {representante.nombres} {representante.apellidos}
              </span>
              ?
            </p>
            {hasStudents && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
                <p className="text-yellow-800 text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Advertencia
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Este representante tiene {representante.estudiantes_ids.length} estudiante(s)
                  asignado(s). Al eliminarlo, los estudiantes quedarán sin representante
                  registrado.
                </p>
              </div>
            )}
            <p className="text-muted-foreground mt-2">Esta acción no se puede deshacer.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteRepresentante(representante)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
