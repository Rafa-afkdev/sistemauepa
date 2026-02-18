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
import { CheckCircle, LayoutList, Lock, SquarePen, Trash2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { useState, useEffect } from "react";
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
import React from "react";
import { CreateUpdateLapsoEscolar } from "./create-update-lapsos-escolares.form";
import { getCollection, updateDocument } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

export function TableViewLapsoEscolar({
  lapsos_escolares,
  deleteLapsoEscolar,
  getLapsosEscolares,
  isLoading,
}: {
  lapsos_escolares: LapsosEscolares[];
  deleteLapsoEscolar: (lapso_escolar: LapsosEscolares) => Promise<void>;
  getLapsosEscolares: () => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedLapso, setSelectedLapso] = useState<LapsosEscolares | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);

  // Fetch periodos escolares to display periodo name instead of ID
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const res = await getCollection("periodos_escolares") as PeriodosEscolares[];
        setPeriodosEscolares(res);
      } catch (error) {
        console.error("Error fetching periodos:", error);
      }
    };
    fetchPeriodos();
  }, []);

  // Get periodo name from ID
  const getPeriodoById = (periodoId: string) => {
    const periodo = periodosEscolares.find(p => p.id === periodoId);
    return periodo?.periodo || periodoId;
  };

  // Handle status change
  const handleStatusChange = async (lapsoId: string, newStatus: string) => {
    try {
      // Check if there's already an active lapso when trying to activate
      if (newStatus === "ACTIVO") {
        const lapsos = await getCollection("lapsos");
        const activoExists = lapsos.some((l: any) => l.status === "ACTIVO" && l.id !== lapsoId);
        if (activoExists) {
          showToast.error("Ya existe un lapso activo.");
          return;
        }
      }

      await updateDocument(`lapsos/${lapsoId}`, { status: newStatus });
      showToast.success("Estado actualizado correctamente");
      getLapsosEscolares();
    } catch (error) {
      showToast.error("Error al actualizar el estado");
    }
  };

  // Function to delete a lapso escolar
  const handleDelete = async () => {
    if (!selectedLapso) return;
    try {
      await deleteLapsoEscolar(selectedLapso);
      console.log(`El lapso escolar ${selectedLapso.lapso} ha sido eliminado.`);
    } catch (error) {
      console.error("Error al eliminar el lapso escolar:", error);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedLapso(null);
    }
  };

  return (
    <>
      {/* Custom scroll styles */}
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
              <TableHead>Lapso</TableHead>
              <TableHead>Periodo Escolar</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              lapsos_escolares &&
              lapsos_escolares.map((lapso_escolar) => (
                <TableRow key={lapso_escolar.id}>
                  <TableCell>{lapso_escolar.lapso}</TableCell>
                  <TableCell>{getPeriodoById(lapso_escolar.año_escolar)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      lapso_escolar.status === "ACTIVO"
                        ? "bg-green-100 text-green-800"
                        : lapso_escolar.status === "BLOQUEADO"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {lapso_escolar.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* Edit Button */}
                    <CreateUpdateLapsoEscolar
                      getLapsosEscolares={getLapsosEscolares}
                      lapsoToUpdate={lapso_escolar}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateLapsoEscolar>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      className="p-0.5 mx-1 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSelectedLapso(lapso_escolar);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {/* Activate Button */}
                    {lapso_escolar.status !== "ACTIVO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                        variant="outline"
                        onClick={() => lapso_escolar.id && handleStatusChange(lapso_escolar.id, "ACTIVO")}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Block Button */}
                    {lapso_escolar.status !== "BLOQUEADO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                        variant="outline"
                        onClick={() => lapso_escolar.id && handleStatusChange(lapso_escolar.id, "BLOQUEADO")}
                      >
                        <Lock className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Close Button */}
                    {lapso_escolar.status !== "CERRADO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                        variant="outline"
                        onClick={() => lapso_escolar.id && handleStatusChange(lapso_escolar.id, "CERRADO")}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
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
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && lapsos_escolares.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron lapsos escolares existentes</h2>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas eliminar este lapso escolar?</AlertDialogTitle>
            <AlertDialogDescription>
              Presiona en "Confirmar" para eliminar este lapso escolar. Recuerda que esta acción no se puede deshacer.
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
