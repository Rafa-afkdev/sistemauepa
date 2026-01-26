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
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { InscripcionSeccion, Secciones } from "@/interfaces/secciones.interface";
import { getCollection } from "@/lib/data/firebase";
import { LayoutList, SquarePen, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ConfirmDeletion } from "./confirm-deletion";
import { CreateUpdateStudents } from "./create-update-students.form";

export function TableStudentView({
  students,
  getStudents,
  deleteStudent,
  isLoading,
}: {
  students: Estudiantes[];
  getStudents: () => Promise<void>;
  deleteStudent: (student: Estudiantes) => Promise<void>;
  isLoading: boolean;
}) {
  const [inscripciones, setInscripciones] = useState<InscripcionSeccion[]>([]);
  const [seccionesMap, setSeccionesMap] = useState<Record<string, Secciones>>({});
  const [periodosMap, setPeriodosMap] = useState<Record<string, PeriodosEscolares>>({});

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [insc, secc, pers] = await Promise.all([
          getCollection("estudiantes_inscritos"),
          getCollection("secciones"),
          getCollection("periodos_escolares"),
        ]);

        setInscripciones(insc as InscripcionSeccion[]);
        const seccMap: Record<string, Secciones> = {};
        (secc as Secciones[]).forEach((s) => {
          if (s.id) seccMap[s.id] = s;
        });
        setSeccionesMap(seccMap);

        const perMap: Record<string, PeriodosEscolares> = {};
        (pers as PeriodosEscolares[]).forEach((p) => {
          if (p.id) perMap[p.id] = p;
        });
        setPeriodosMap(perMap);
      } catch (e) {
        // ignore silently for table fallback
      }
    };
    loadRefs();
  }, [students]);

  const currentInscripcionByStudent: Record<string, InscripcionSeccion> = React.useMemo(() => {
    const byStudent: Record<string, InscripcionSeccion[]> = {};
    inscripciones.forEach((i) => {
      if (!i.id_estudiante) return;
      byStudent[i.id_estudiante] = byStudent[i.id_estudiante] || [];
      byStudent[i.id_estudiante].push(i);
    });

    const current: Record<string, InscripcionSeccion> = {};
    Object.entries(byStudent).forEach(([studentId, list]) => {
      // Prefer activo, otherwise latest by fecha_inscripcion
      const activo = list.find((l) => l.estado?.toLowerCase() === "activo");
      if (activo) {
        current[studentId] = activo;
      } else {
        const latest = list
          .slice()
          .sort((a, b) => {
            const ta = (a.fecha_inscripcion as any)?.seconds || 0;
            const tb = (b.fecha_inscripcion as any)?.seconds || 0;
            return tb - ta;
          })[0];
        if (latest) current[studentId] = latest;
      }
    });
    return current;
  }, [inscripciones]);

  return (
    <>
      {/* Estilos personalizados para el scroll */}
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

      {/* Contenedor principal con scroll personalizado */}
      <div className="custom-scroll max-h-[600px] overflow-y-auto  rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cedula</TableHead>
              <TableHead>Nombres & Apellidos</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Periodo Escolar</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              students &&
              students.map((student) => {
                const ins = student.id ? currentInscripcionByStudent[student.id] : undefined;
                const seccion = ins?.id_seccion ? seccionesMap[ins.id_seccion] : undefined;
                const periodo = ins?.id_periodo_escolar ? periodosMap[ins.id_periodo_escolar] : undefined;
                const estaInscrito = (ins?.estado || "").toLowerCase() === "activo";
                return (
                <TableRow key={student.id}>
                  <TableCell>{student.cedula}</TableCell>
                  <TableCell>
                    {student.nombres + " " + student.apellidos}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      seccion 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {seccion
                        ? `${seccion.grado_año}° ${seccion.nivel_educativo} ${seccion.seccion}`
                        : "NINGUNO"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      periodo 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {periodo?.periodo || "NINGUNO"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      estaInscrito 
                        ? "bg-green-100 text-green-800" :
                      !estaInscrito && ins 
                        ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {ins ? (estaInscrito ? "INSCRITO" : "RETIRADO") : "SIN ASIGNAR"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CreateUpdateStudents
                      getStudents={getStudents}
                      studentToUpdate={student}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateStudents>
                    <ConfirmDeletion
                      deleteStudent={deleteStudent}
                      student={student}
                    >
                      <Button
                        variant="outline"
                        className="p-0.5 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmDeletion>
                  </TableCell>
                </TableRow>
              );
            })}
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
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && students.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">
              No se encontraron registros existentes
            </h2>
          </div>
        )}
      </div>
    </>
  );
}