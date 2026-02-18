/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { LayoutList, SquarePen, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { Materias } from "@/interfaces/materias.interface";
import { CreateUpdateMaterias } from "./create-update-materias.form";
import { ConfirmDeletionMaterias } from "./confirm-deletion-materias";

interface TableMateriasViewProps {
  materias: Materias[];
  getMaterias: () => Promise<void>;
  deleteMateria: (materia: Materias) => Promise<void>;
  isLoading: boolean;
}

export function TableMateriasView({
  materias,
  getMaterias,
  deleteMateria,
  isLoading,
}: TableMateriasViewProps) {
  return (
    <>
      <style>
        {`
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: white transparent;
          }

          .custom-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scroll::-webkit-scrollbar-thumb {
            background: white;
            border-radius: 4px;
          }

          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #f0f0f0;
          }
        `}
      </style>

      <div className="custom-scroll max-h-[600px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Grados/Años</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              materias &&
              materias.map((materia) => (
                <TableRow key={materia.id}>
                  <TableCell>{materia.nombre}</TableCell>
                  <TableCell>{materia.codigo || "-"}</TableCell>
                  <TableCell>
                    {materia.nivel_educativo === "primaria"
                      ? "Educación Primaria"
                      : "Educación Media General"}
                  </TableCell>
                  <TableCell>{(materia.grados_años || []).join(", ")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        materia.es_obligatoria
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {materia.es_obligatoria ? "OBLIGATORIA" : "ELECTIVA"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        materia.estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {materia.estado.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <CreateUpdateMaterias
                        getMaterias={getMaterias}
                        materiaToUpdate={materia}
                      >
                        <Button
                          className="p-0.5 mx-1 border-0"
                          variant="outline"
                        >
                          <SquarePen className="w-4 h-4" />
                        </Button>
                      </CreateUpdateMaterias>

                      <ConfirmDeletionMaterias
                        materia={materia}
                        deleteMateria={deleteMateria}
                      >
                        <Button
                          variant="outline"
                          className="p-0.5 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ConfirmDeletionMaterias>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {isLoading &&
              [1, 2, 3].map((e, i) => (
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

        {!isLoading && materias.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">
              No se encontraron materias registradas
            </h2>
          </div>
        )}
      </div>
    </>
  );
}
