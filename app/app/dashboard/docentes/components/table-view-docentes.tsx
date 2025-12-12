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
import { Eye, LayoutList, SquarePen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";  
import React from "react";
import { User } from "@/interfaces/users.interface";
import { CreateUpdateDocentes } from "./create-update-docentes-form";
import { ViewDocenteDetails } from "./view-docente-details";

  export function TableDocentesView({
    docentes,
    getDocentes,
    isLoading,
  }: {
    docentes: User[];
    getDocentes: () => Promise<void>;
    isLoading: boolean;
  }) {
    return (
        <>

        <style>
        {`
          /* Estilo general del scroll */
          .custom-scroll {
            scrollbar-width: thin; /* Ancho del scroll */
            scrollbar-color: white transparent; /* Color del thumb y track */
          }

          /* Estilo para navegadores basados en WebKit (Chrome, Safari, etc.) */
          .custom-scroll::-webkit-scrollbar {
            width: 8px; /* Ancho del scroll */
          }

          .custom-scroll::-webkit-scrollbar-track {
            background: transparent; /* Fondo del track */
          }

          .custom-scroll::-webkit-scrollbar-thumb {
            background: white; /* Color del thumb */
            border-radius: 4px; /* Bordes redondeados */
          }

          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #f0f0f0; /* Cambio de color al pasar el mouse */
          }
        `}
      </style>
      <div className="custom-scroll max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Contraseña</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              docentes &&
              docentes.map((docente) => (
                <TableRow key={docente.id}>
                  <TableCell>{docente.cedula}</TableCell>
                  <TableCell>{docente.name}</TableCell>
                  <TableCell>{docente.apellidos}</TableCell>                 
                  <TableCell>{docente.email}</TableCell>  
                  <TableCell>{docente.password}</TableCell>               
                  <TableCell>{docente.telefono}</TableCell>
                  <TableCell>
                    <ViewDocenteDetails docente={docente}>
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </ViewDocenteDetails>
                    <CreateUpdateDocentes
                      getDocentes={getDocentes}
                      docenteToUpdate={docente}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateDocentes>
                  </TableCell>
                </TableRow>
              ))}
            {isLoading &&
              [1, 1, 1].map((e, i) => (
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
        {!isLoading && docentes.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron registros existentes</h2>
          </div>
        )}
      </div>
      </>

    );
  }