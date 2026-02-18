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
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import React from "react";



export function ConfirmDeletion({
  children,
  deleteStudent,
  student,
  hasRepresentative,
  isEnrolled
}: {
  children: React.ReactNode;
  deleteStudent: (student: Estudiantes) => Promise<void>;
  student: Estudiantes;
  hasRepresentative: boolean;
  isEnrolled: boolean;
}) {

  const isBlocked = hasRepresentative;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
             {isBlocked ? "No se puede eliminar el estudiante" : "¿Estás seguro de que deseas eliminar a este estudiante?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
               {/* Blocking Error for Representative */}
               {hasRepresentative && (
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md text-destructive text-sm font-medium">
                      Este estudiante tiene un representante asignado. Para eliminarlo, primero debe desvincular o eliminar el representante asociado.
                  </div>
               )}

               {/* Warning for Enrollment */}
               {!hasRepresentative && isEnrolled && (
                 <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-amber-800 text-sm">
                    <strong>¡Advertencia!</strong> El estudiante está inscrito en una sección. Si confirma:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Se retirará automáticamente de la sección actual.</li>
                        <li>Se perderá toda la información académica y de asistencia.</li>
                    </ul>
                 </div>
               )}

               {!hasRepresentative && !isEnrolled && (
                   <p>Esta acción no se puede deshacer.</p>
               )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {!isBlocked && (
              <AlertDialogAction 
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => deleteStudent(student)}
              >
                Confirmar
              </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
  