/* eslint-disable react/no-unescaped-entities */
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CortesEscolares } from "@/interfaces/cortes.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { getCollection, updateDocument } from "@/lib/data/firebase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarRange, CheckCircle, LayoutList, Lock, SquarePen, Trash2, XCircle } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import React, { useEffect, useState } from "react";
import { CreateUpdateCorte } from "./create-update-cortes.form";

export function TableViewCortes({
  cortes,
  deleteCorte,
  getCortes,
  isLoading,
}: {
  cortes: CortesEscolares[];
  deleteCorte: (corte: CortesEscolares) => Promise<void>;
  getCortes: () => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedCorte, setSelectedCorte] = useState<CortesEscolares | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [periodosEscolares, setPeriodosEscolares] = useState<React.RefObject<PeriodosEscolares[]>>({current: []});
  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);

  // Fetch contextual data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pRes = await getCollection("periodos_escolares") as PeriodosEscolares[];
        setPeriodos(pRes);
        const lRes = await getCollection("lapsos") as LapsosEscolares[];
        setLapsos(lRes);
      } catch (error) {
        console.error("Error fetching dependencies:", error);
      }
    };
    fetchData();
  }, []);

  const getPeriodoById = (id: string) => {
    return periodos.find(p => p.id === id)?.periodo || id;
  };
  const getLapsoById = (id: string) => {
    return lapsos.find(l => l.id === id)?.lapso || id;
  };


  const handleStatusChange = async (corteId: string, newStatus: string) => {
    try {
      if (newStatus === "ACTIVO") {
        const cSnap = await getCollection("cortes");
        const activoExists = cSnap.some((c: any) => c.status === "ACTIVO" && c.id !== corteId);
        if (activoExists) {
          showToast.error("Ya existe un corte activo. Cierra el actual primero.");
          return;
        }
      }

      await updateDocument(`cortes/${corteId}`, { status: newStatus });
      showToast.success("Estado actualizado correctamente");
      getCortes();
    } catch (error) {
      showToast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async () => {
    if (!selectedCorte) return;
    try {
      await deleteCorte(selectedCorte);
    } catch (error) {
      console.error("Error al eliminar el corte:", error);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedCorte(null);
    }
  };

  return (
    <>
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
              <TableHead>Nombre del Corte</TableHead>
              <TableHead>Lapso / Periodo</TableHead>
              <TableHead>Rango de Fechas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              cortes &&
              cortes.map((corte) => (
                <TableRow key={corte.id}>
                  <TableCell className="font-medium">{corte.corte}</TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                        <span>{getLapsoById(corte.lapso_id)}</span>
                        <span className="text-xs text-muted-foreground">{getPeriodoById(corte.periodo_escolar_id)}</span>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                          <CalendarRange className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(corte.fecha_inicio + "T00:00:00"), "dd MMM yyyy", { locale: es })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            al {format(new Date(corte.fecha_fin + "T23:59:59"), "dd MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      corte.status === "ACTIVO"
                        ? "bg-green-100 text-green-800"
                        : corte.status === "BLOQUEADO"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {corte.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* Edit Button */}
                    <CreateUpdateCorte
                      getCortesEscolares={getCortes}
                      corteToUpdate={corte}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline" title="Editar">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateCorte>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      title="Eliminar"
                      className="p-0.5 mx-1 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSelectedCorte(corte);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {/* Activate Button */}
                    {corte.status !== "ACTIVO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                        variant="outline"
                        title="Activar"
                        onClick={() => corte.id && handleStatusChange(corte.id, "ACTIVO")}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Block Button */}
                    {corte.status !== "BLOQUEADO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                        variant="outline"
                        title="Bloquear"
                        onClick={() => corte.id && handleStatusChange(corte.id, "BLOQUEADO")}
                      >
                        <Lock className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Close Button */}
                    {corte.status !== "CERRADO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                        variant="outline"
                        title="Cerrar"
                        onClick={() => corte.id && handleStatusChange(corte.id, "CERRADO")}
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
                  <TableCell><Skeleton className="w-full h-4" /></TableCell>
                  <TableCell><Skeleton className="w-full h-8" /></TableCell>
                  <TableCell><Skeleton className="w-full h-8" /></TableCell>
                  <TableCell><Skeleton className="w-full h-4" /></TableCell>
                  <TableCell><Skeleton className="w-full h-4" /></TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && cortes.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron cortes registrados</h2>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas eliminar este corte de notas?</AlertDialogTitle>
            <AlertDialogDescription>
              Presiona en "Confirmar" para eliminar. Recuerda que esta acción no se puede deshacer y puede afectar la visualización si hay notas ligadas a él indirectamente.
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
