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
import { Representante } from "@/interfaces/representante.interface";
import { LayoutList, SquarePen, Trash2 } from "lucide-react";
import { ConfirmDeletionRepresentante } from "./confirm-deletion-representante";
import { CreateUpdateRepresentante } from "./create-update-representante.form";
import { VerRepresentanteDialog } from "./ver-representante-dialog";


export function TableRepresentanteView({
  representantes,
  getRepresentantes,
  deleteRepresentante,
  isLoading,
}: {
  representantes: Representante[];
  getRepresentantes: () => Promise<void>;
  deleteRepresentante: (representante: Representante) => Promise<void>;
  isLoading: boolean;
}) {
  return (
    <>
      <style>
        {`
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 10px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 10px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}
      </style>

      <div className="rounded-md border custom-scroll" style={{ maxHeight: "600px", overflowY: "auto" }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[120px]">Cédula</TableHead>
              <TableHead>Nombres</TableHead>
              <TableHead>Apellidos</TableHead>
              <TableHead>Parentesco</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-center"># Est.</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : representantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron representantes
                </TableCell>
              </TableRow>
            ) : (
              representantes.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium">
                    {rep.tipo_cedula}-{rep.cedula}
                  </TableCell>
                  <TableCell>{rep.nombres}</TableCell>
                  <TableCell>{rep.apellidos}</TableCell>
                  <TableCell>{rep.parentesco}</TableCell>
                  <TableCell>{rep.telefono_principal}</TableCell>
                  <TableCell className="text-center">
                    {rep.estudiantes_ids?.length || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <VerRepresentanteDialog representante={rep}>
                        <Button variant="ghost" size="icon">
                          <LayoutList className="w-4 h-4" />
                        </Button>
                      </VerRepresentanteDialog>

                      <CreateUpdateRepresentante
                        representante={rep}
                        getRepresentantes={getRepresentantes}
                      >
                        <Button variant="ghost" size="icon">
                          <SquarePen className="w-4 h-4" />
                        </Button>
                      </CreateUpdateRepresentante>

                      <ConfirmDeletionRepresentante
                        representante={rep}
                        deleteRepresentante={deleteRepresentante}
                      >
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ConfirmDeletionRepresentante>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {!isLoading && representantes.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Total: {representantes.length} representante(s)
                  </span>
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
}
