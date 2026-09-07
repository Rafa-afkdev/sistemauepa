/* eslint-disable react/no-unescaped-entities */
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarX, LayoutList, SquarePen, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { where } from "firebase/firestore";
import React from "react";
import { CreateUpdatePeriodoEscolar } from "./create-update-periodos-escolares.form";
import { getCollection, updateDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

export function TableViewPeriodoEscolar({
  periodos_escolares,
  deletePeriodo_escolar,
  getPeriodosEscolares,
  isLoading,
}: {
  periodos_escolares: PeriodosEscolares[];
  deletePeriodo_escolar: (periodo_escolar: PeriodosEscolares) => Promise<void>;
  getPeriodosEscolares: () => Promise<void>; 
  isLoading: boolean;
}) {
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodosEscolares | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Función para confirmar el cambio de estado
  const confirmStatusChange = (periodo_escolar: PeriodosEscolares) => {
    setSelectedPeriodo(periodo_escolar);
    setOpenDialog(true);
  };

  const updateStudentsToRetired = async (periodoId: string) => {
    try {
      const estudiantes: any[] = await getCollection("estudiantes", [
        where("estado", "==", "INSCRITO"),
      ]);
      await Promise.all(
        estudiantes.map((st: any) =>
          updateDocument(`estudiantes/${st.id}`, { estado: "RETIRADO" })
        )
      );
      console.log(`Todos los estudiantes del período ${periodoId} han sido actualizados a RETIRADO.`);
    } catch (error) {
      console.error("Error al actualizar estudiantes a RETIRADO:", error);
    }
  };

  // Función para actualizar el estado del período escolar a "INACTIVO"
  const setPeriodoInactivo = async () => {
    if (!selectedPeriodo) return;
    try {
      setIsProcessing(true);
      await updateDocument(`periodos_escolares/${selectedPeriodo.id}`, { status: "INACTIVO" });
      console.log(`El período escolar ${selectedPeriodo.periodo} ha sido actualizado a INACTIVO.`);
      if (selectedPeriodo.id) {
        await updateStudentsToRetired(selectedPeriodo.id);
      } else {
        console.error("El ID del período seleccionado es indefinido.");
      }
      await getPeriodosEscolares();
      
      showToast.success(`El período escolar ${selectedPeriodo.periodo} ha sido cambiado a INACTIVO.`, {});
      setOpenDialog(false);
      setSelectedPeriodo(null);
    } catch (error) {
      console.error("Error al actualizar el estado del período escolar:", error);
      showToast.error("Error al actualizar el período escolar.", {});
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para eliminar un período escolar
  const handleDelete = async () => {
    if (!selectedPeriodo) return;
    try {
      await deletePeriodo_escolar(selectedPeriodo);
      console.log(`El período escolar ${selectedPeriodo.periodo} ha sido eliminado.`);
    } catch (error) {
      console.error("Error al eliminar el período escolar:", error);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedPeriodo(null);
    }
  };

  return (
    <>
      {/* Estilos personalizados para el scroll */}
      <style>
        {`
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: white transparent;
          }
          .custom-scroll::-webkit-scrollbar { width: 8px; }
          .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-scroll::-webkit-scrollbar-thumb { background: white; border-radius: 4px; }
          .custom-scroll::-webkit-scrollbar-thumb:hover { background: #f0f0f0; }
        `}
      </style>

      <div className="custom-scroll max-h-[600px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              periodos_escolares &&
              periodos_escolares.map((periodo_escolar) => (
                <TableRow key={periodo_escolar.id}>
                  <TableCell>{periodo_escolar.periodo}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      periodo_escolar.status === "ACTIVO"
                        ? "bg-green-100 text-green-800"
                        : periodo_escolar.status === "INACTIVO"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {periodo_escolar.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {periodo_escolar.status === "ACTIVO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        variant="outline"
                        onClick={() => confirmStatusChange(periodo_escolar)}
                      >
                        <CalendarX className="w-4 h-4" />
                      </Button>
                    )}
                    <CreateUpdatePeriodoEscolar
                      getPeriodos_Escolares={getPeriodosEscolares}
                      periodoToUpdate={periodo_escolar}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdatePeriodoEscolar>
                    <Button
                      variant="outline"
                      className="p-0.5 mx-1 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSelectedPeriodo(periodo_escolar);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {isLoading &&
              [1, 1, 1].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && periodos_escolares.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron periodos escolares existentes</h2>
          </div>
        )}
      </div>

      {/* Dialog de confirmación para cambiar estado a INACTIVO */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-700">
              ¿Deseas cambiar el estado del período escolar <span className="font-semibold text-gray-900">{selectedPeriodo?.periodo}</span> a <span className="font-semibold text-red-600">INACTIVO</span>?
            </p>
            <p className="text-xs text-gray-500">
              Nota: Al cerrar este período escolar, todos los estudiantes actualmente inscritos en él pasarán automáticamente al estado <span className="font-medium text-gray-700">RETIRADO</span>.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="ghost" onClick={() => setOpenDialog(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={setPeriodoInactivo}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas eliminar este período escolar?</AlertDialogTitle>
            <AlertDialogDescription>
              Presiona en "Confirmar" para eliminar este período escolar. Recuerda que esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600" onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
