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
import { InscripcionSeccion } from "@/interfaces/secciones.interface";
import { getCollection } from "@/lib/data/firebase";
import { LayoutList } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import React from "react";

export function TableViewInscritos({
  inscripciones,
  getInscripciones,
  deleteInscripcion,
  isLoading,
}: {
  inscripciones: InscripcionSeccion[];
  getInscripciones: () => Promise<void>;
  deleteInscripcion: (inscripcion: InscripcionSeccion) => Promise<void>;
  isLoading: boolean;
}) {
  const [estudiantesMap, setEstudiantesMap] = React.useState<Record<string, string>>({});
  const [cedulasMap, setCedulasMap] = React.useState<Record<string, string>>({});
  const [seccionesMap, setSeccionesMap] = React.useState<Record<string, string>>({});
  const [periodosMap, setPeriodosMap] = React.useState<Record<string, string>>({});
  const [lookupsLoading, setLookupsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchLookups = async () => {
      try {
        setLookupsLoading(true);
        const [estudiantes, secciones, periodos] = await Promise.all([
          getCollection("estudiantes") as Promise<any[]>,
          getCollection("secciones") as Promise<any[]>,
          getCollection("periodos_escolares") as Promise<any[]>,
        ]);

        if (!isMounted) return;

        const eMap: Record<string, string> = {};
        const cMap: Record<string, string> = {};
        estudiantes.forEach((e: any) => {
          eMap[e.id] = e?.nombres && e?.apellidos
            ? `${e.nombres} ${e.apellidos}`
            : (e?.nombres ?? e?.apellidos ?? e.id);
          cMap[e.id] = e?.cedula?.toString() ?? "-";
        });

        const sMap: Record<string, string> = {};
        secciones.forEach((s: any) => {
          sMap[s.id] = `${s?.grado_año ?? ""}° ${s?.nivel_educativo ?? ""} - ${s?.seccion ?? ""}`;
        });

        const pMap: Record<string, string> = {};
        periodos.forEach((p: any) => {
          pMap[p.id] = p?.periodo ?? p.id;
        });

        // Batch updates to minimize renders
        setEstudiantesMap(eMap);
        setCedulasMap(cMap);
        setSeccionesMap(sMap);
        setPeriodosMap(pMap);
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString("es-ES");
    } catch {
      return "-";
    }
  };

  // Ordenar inscripciones por cédula
  const inscripcionesOrdenadas = React.useMemo(() => {
    if (!inscripciones || Object.keys(cedulasMap).length === 0) return inscripciones;
    
    return [...inscripciones].sort((a, b) => {
      const cedulaA = parseInt(cedulasMap[a.id_estudiante] || "0", 10);
      const cedulaB = parseInt(cedulasMap[b.id_estudiante] || "0", 10);
      return cedulaA - cedulaB;
    });
  }, [inscripciones, cedulasMap]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cédula</TableHead>
            <TableHead>Estudiante</TableHead>
            <TableHead>Sección</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Periodo Escolar</TableHead>
            <TableHead>Fecha Inscripción</TableHead>
            <TableHead>Estado</TableHead>
            {/* <TableHead>Acciones</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && !lookupsLoading &&
            inscripcionesOrdenadas &&
            inscripcionesOrdenadas.map((inscripcion) => (
              <TableRow key={inscripcion.id}>
                <TableCell>
                  {cedulasMap[inscripcion.id_estudiante] || "-"}
                </TableCell>
                <TableCell>
                  {estudiantesMap[inscripcion.id_estudiante] || inscripcion.id_estudiante}
                </TableCell>
                <TableCell>
                  {seccionesMap[inscripcion.id_seccion] || inscripcion.id_seccion}
                </TableCell>
                <TableCell>{inscripcion.nivel_educativo}</TableCell>
                <TableCell>
                  {periodosMap[inscripcion.id_periodo_escolar] || inscripcion.id_periodo_escolar}
                </TableCell>
                <TableCell>{formatDate(inscripcion.fecha_inscripcion)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      inscripcion.estado.toLowerCase() === "activo"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {inscripcion.estado.toUpperCase()}
                  </span>
                </TableCell>

                {/* <TableCell>
                  <div className="flex gap-1">
                    <ConfirmDeletionInscripcion
                      deleteInscripcion={deleteInscripcion}
                      inscripcion={inscripcion}
                    >
                      <Button
                        variant="outline"
                        className="p-0.5 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmDeletionInscripcion>
                  </div>
                </TableCell> */}
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
              </TableRow>
            ))}
        </TableBody>
        <TableFooter></TableFooter>
      </Table>
      {!isLoading && !lookupsLoading && inscripciones.length === 0 && (
        <div className="text-gray-200 my-20">
          <div className="flex justify-center">
            <LayoutList className="w-[120px] h-[120px]" />
          </div>
          <h2 className="text-center">
            No se encontraron inscripciones existentes
          </h2>
        </div>
      )}
    </>
  );
}