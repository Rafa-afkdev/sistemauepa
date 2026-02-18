"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { Materias } from "@/interfaces/materias.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CorteDeNotasProps {
  estudiante: Estudiantes;
  materias: Materias[];
  evaluaciones: Evaluaciones[];
  notas: NotasEvaluacion[];
  seccionNombre: string;
}

export function CorteDeNotas({
  estudiante,
  materias,
  evaluaciones,
  notas,
  seccionNombre,
}: CorteDeNotasProps) {
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: es });

  return (
    <Card className="w-full">
      <CardHeader className="text-center border-b">
        <div className="mt-4">
          <CardTitle className="uppercase text-lg">Corte de Notas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Student Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <span className="font-bold">Apellidos y Nombres:</span>
            <p className="uppercase">{estudiante.apellidos}, {estudiante.nombres}</p>
          </div>
          <div className="flex justify-between">
            <div className="space-y-1">
              <span className="font-bold">Año/Grado:</span>
              <p>{seccionNombre}</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold">Fecha:</span>
              <p>{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-[300px] font-bold text-black border-r">Asignaturas</TableHead>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableHead key={i} className="text-center font-bold text-black border-r w-[80px]">
                    Eva {i}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materias.map((materia) => {
                // Filter evaluations for this subject, sorted by date
                const subjectEvaluations = evaluaciones
                  .filter((ev) => ev.materia_id === materia.id)
                  .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

                return (
                  <TableRow key={materia.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium border-r">{materia.nombre}</TableCell>
                    {[0, 1, 2, 3, 4].map((index) => {
                      const evaluation = subjectEvaluations[index];
                      let gradeDisplay = "";
                      
                      if (evaluation) {
                        const grade = notas.find(
                          (n) => n.evaluacion_id === evaluation.id && n.estudiante_id === estudiante.id
                        );
                        if (grade) {
                          gradeDisplay = grade.nota_definitiva > 0 ? grade.nota_definitiva.toFixed(0) : "";
                        }
                      }

                      return (
                        <TableCell key={index} className="text-center border-r p-2">
                            {gradeDisplay || "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
