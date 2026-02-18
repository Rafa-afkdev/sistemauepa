import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutList, SquarePen, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Secciones } from "@/interfaces/secciones.interface";
import { CreateUpdateSecciones } from "./create-update-secciones";
import { ConfirmDeletion } from "./confirm-deletion-secciones";
import { where } from "firebase/firestore";
import { getCollection } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

export function TableSeccionView({
  secciones,
  getSecciones,
  deleteSeccion,
  isLoading,
}: {
  secciones: Secciones[];
  getSecciones: () => Promise<void>;
  deleteSeccion: (seccion: Secciones) => Promise<void>;
  isLoading: boolean;
}) {
  const [periodosMap, setPeriodosMap] = React.useState<Record<string, string>>({});
  const [docentesMap, setDocentesMap] = React.useState<Record<string, string>>({});
  const [lookupsLoading, setLookupsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchLookups = async () => {
      try {
        setLookupsLoading(true);
        const [periodos, docentes] = await Promise.all([
          getCollection("periodos_escolares") as Promise<any[]>,
          getCollection("users", [where("rol", "in", ["DOCENTE", "docente"])]) as Promise<any[]>,
        ]);

        if (!isMounted) return;

        const pMap: Record<string, string> = {};
        periodos.forEach((p: any) => {
          pMap[p.id] = p?.periodo ?? p.id;
        });

        const dMap: Record<string, string> = {};
        docentes.forEach((u: any) => {
          dMap[u.id] = u?.name && u?.apellidos ? `${u.name} ${u.apellidos}` : (u?.name ?? u?.apellidos ?? u.id);
        });

        // Batch updates to minimize renders
        setPeriodosMap(pMap);
        setDocentesMap(dMap);
      } catch (e: any) {
        if (isMounted) showToast.error("Error al cargar datos de referencia");
      } finally {
        if (isMounted) setLookupsLoading(false);
      }
    };

    fetchLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grado/Año</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Sección</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Inscritos</TableHead>
            <TableHead>Periodo Escolar</TableHead>
            <TableHead>Docente Tutor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Turno</TableHead>
            <TableHead>Aula</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && !lookupsLoading &&
            secciones &&
            secciones.map((seccion) => (
              <TableRow key={seccion.id}>
                <TableCell className="w-1">{seccion.grado_año}</TableCell>
                <TableCell>{seccion.nivel_educativo}</TableCell>
                <TableCell>{seccion.seccion}</TableCell>
                <TableCell>{seccion.limite_estudiantes}</TableCell>
                <TableCell>{seccion.estudiantes_inscritos}</TableCell>
                <TableCell>
                  {periodosMap[seccion.id_periodo_escolar] || seccion.id_periodo_escolar}
                </TableCell>
                <TableCell>
                  {seccion.docente_guia_id
                    ? docentesMap[seccion.docente_guia_id] || seccion.docente_guia_id
                    : "Sin asignar"}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      seccion.estado.toLowerCase() === "activa"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {seccion.estado.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>{seccion.turno || "-"}</TableCell>
                <TableCell>{seccion.aula || "-"}</TableCell>

                <TableCell>
                  <div className="flex gap-1">
                    <CreateUpdateSecciones
                      getSecciones={getSecciones}
                      seccionToUpdate={seccion}
                    >
                      <Button
                        className="p-0.5 mx-1 border-0"
                        variant="outline"
                      >
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateSecciones>
                    <ConfirmDeletion
                      deleteSeccion={deleteSeccion}
                      seccion={seccion}
                    >
                      <Button
                        variant="outline"
                        className="p-0.5 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmDeletion>
                  </div>
                </TableCell>
              </TableRow>
            ))}

          {(isLoading || lookupsLoading) &&
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
      {!isLoading && !lookupsLoading && secciones.length === 0 && (
        <div className="text-gray-200 my-20">
          <div className="flex justify-center">
            <LayoutList className="w-[120px] h-[120px]" />
          </div>
          <h2 className="text-center">
            No se encontraron secciones existentes
          </h2>
        </div>
      )}
    </>
  );
}