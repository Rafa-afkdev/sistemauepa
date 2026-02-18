/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LayoutList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useEffect, useState } from "react";
import { InscripcionSeccion, Secciones } from "@/interfaces/secciones.interface";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { getCollection } from "@/lib/data/firebase";

export function TableViewEstudiantesRetirar({
  inscripciones,
  isLoading,
}: {
  inscripciones: InscripcionSeccion[];
  isLoading: boolean;
}) {
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [estData, secData, perData] = await Promise.all([
          getCollection("estudiantes"),
          getCollection("secciones"),
          getCollection("periodos_escolares"),
        ]);

        setEstudiantes(estData as Estudiantes[]);
        setSecciones(secData as Secciones[]);
        setPeriodos(perData as PeriodosEscolares[]);
      } catch (e) {
        // ignore silently for table fallback
      }
    };
    loadRefs();
  }, []);

  // Crear mapas para búsqueda rápida
  const estudiantesMap = React.useMemo(() => {
    const map: Record<string, Estudiantes> = {};
    estudiantes.forEach((est) => {
      if (est.id) map[est.id] = est;
    });
    return map;
  }, [estudiantes]);

  const seccionesMap = React.useMemo(() => {
    const map: Record<string, Secciones> = {};
    secciones.forEach((sec) => {
      if (sec.id) map[sec.id] = sec;
    });
    return map;
  }, [secciones]);

  const periodosMap = React.useMemo(() => {
    const map: Record<string, PeriodosEscolares> = {};
    periodos.forEach((per) => {
      if (per.id) map[per.id] = per;
    });
    return map;
  }, [periodos]);

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
              <TableHead>Cédula</TableHead>
              <TableHead>Nombres & Apellidos</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Periodo Escolar</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              inscripciones &&
              inscripciones.map((inscripcion) => {
                const estudiante = estudiantesMap[inscripcion.id_estudiante];
                const seccion = seccionesMap[inscripcion.id_seccion];
                const periodo = periodosMap[inscripcion.id_periodo_escolar];

                if (!estudiante) return null;

                return (
                  <TableRow key={inscripcion.id}>
                    <TableCell>
                      {estudiante.tipo_cedula}-{estudiante.cedula}
                    </TableCell>
                    <TableCell>
                      {estudiante.nombres} {estudiante.apellidos}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {seccion
                          ? `${seccion.grado_año}° ${seccion.nivel_educativo} ${seccion.seccion}`
                          : "Sin sección"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {periodo?.periodo || "Sin periodo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                        ACTIVO
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && inscripciones.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">
              No se encontraron estudiantes activos para retirar
            </h2>
          </div>
        )}
      </div>
    </>
  );
}
