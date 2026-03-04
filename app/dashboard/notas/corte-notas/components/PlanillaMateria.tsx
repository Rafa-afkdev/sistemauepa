"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { Materias } from "@/interfaces/materias.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, CalendarDays, GraduationCap, Users } from "lucide-react";
import React from "react";

interface PlanillaMateriaProps {
  materia: Materias;
  seccionNombre: string;
  estudiantes: Estudiantes[];
  evaluaciones: Evaluaciones[];
  todasLasNotas: NotasEvaluacion[];
  lapso: LapsosEscolares;
  docenteNombre?: string;
}

export function PlanillaMateria({
  materia,
  seccionNombre,
  estudiantes,
  evaluaciones,
  todasLasNotas,
  lapso,
  docenteNombre,
}: PlanillaMateriaProps) {
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: es });

  const evalsSorted = [...evaluaciones].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const estudiantesSorted = [...estudiantes].sort((a, b) => a.cedula - b.cedula);

  // Stats summary
  const aprobados = estudiantesSorted.filter(est => {
    const notasEst = todasLasNotas.filter(n => n.estudiante_id === est.id);
    const vals = notasEst.map(n => n.nota_definitiva).filter(v => v > 0);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return avg >= 10;
  }).length;

  const reprobados = estudiantesSorted.length - aprobados;

  const getApellidosNombresProps = (estudio: Estudiantes) => {
    return {
      nombre: estudio.nombres,
      apellido: estudio.apellidos,
    };
  };

  // Pastel background colors for columns
  const bgColors = [
    "bg-blue-50/50 dark:bg-blue-950/20",
    "bg-green-50/50 dark:bg-green-950/20",
    "bg-amber-50/50 dark:bg-amber-950/20",
    "bg-purple-50/50 dark:bg-purple-950/20",
    "bg-pink-50/50 dark:bg-pink-950/20",
    "bg-cyan-50/50 dark:bg-cyan-950/20",
  ];

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="border-b bg-muted/30 pb-4">
        {/* Institución */}
        <div className="text-center mb-3">
          <CardTitle className="text-lg uppercase tracking-wide">
            Planilla de Notas por Materia
          </CardTitle>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sección</p>
              <p className="text-sm font-semibold truncate">{seccionNombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Materia</p>
              <p className="text-sm font-semibold truncate uppercase">{materia.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lapso</p>
              <p className="text-sm font-semibold">{lapso.lapso}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Estudiantes</p>
              <p className="text-sm font-semibold">{estudiantesSorted.length}</p>
            </div>
          </div>
        </div>

        {/* Docente + Fecha + Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            {docenteNombre && (
              <span><span className="font-medium text-foreground">Docente:</span> {docenteNombre}</span>
            )}
            <span><span className="font-medium text-foreground">Fecha:</span> {currentDate}</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
              ✓ Aprobados: {aprobados}
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
              ✗ Reprobados: {reprobados}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Row 1: fixed cols (rowspan=2) + tipo per eval (colspan=2) + Prom (rowspan=2) */}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead rowSpan={2} className="w-8 text-center font-bold text-foreground border-r align-middle">
                  Nro
                </TableHead>
                <TableHead rowSpan={2} className="w-28 text-center font-bold text-foreground border-r align-middle">
                  Matrícula
                </TableHead>
                <TableHead rowSpan={2} className="min-w-[190px] font-bold text-foreground border-r align-middle">
                  Apellidos y Nombre
                </TableHead>
                {evalsSorted.map((ev, i) => (
                  <TableHead
                    key={ev.id}
                    colSpan={2}
                    className={`text-center border-r min-w-[90px] pb-0 ${bgColors[i % bgColors.length]}`}
                    title={ev.nombre_evaluacion}
                  >
                    <div className="flex flex-col items-center gap-0.5 pb-1">
                      <span className="font-bold text-foreground text-xs leading-tight">
                        {ev.tipo_evaluacion ?? ev.nombre_evaluacion}
                      </span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal bg-background/50">
                        {ev.porcentaje}%
                      </Badge>
                    </div>
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="text-center font-bold text-foreground w-16 align-middle">
                  Prom.
                </TableHead>
              </TableRow>
              {/* Row 2: sub-labels per eval */}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {evalsSorted.map((ev, i) => {
                  const bg = bgColors[i % bgColors.length];
                  return (
                    <React.Fragment key={ev.id}>
                      <TableHead className={`text-center text-[10px] font-medium text-muted-foreground border-r w-10 pt-0 ${bg}`}>
                        Nota
                      </TableHead>
                      <TableHead className={`text-center text-[10px] font-medium text-muted-foreground border-r w-12 pt-0 ${bg}`}>
                        {ev.porcentaje}%
                      </TableHead>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantesSorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3 + evalsSorted.length * 2 + 1}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay estudiantes en esta sección.
                  </TableCell>
                </TableRow>
              ) : (
                estudiantesSorted.map((est, idx) => {
                  const notasEstudiante = todasLasNotas.filter(
                    (n) => n.estudiante_id === est.id
                  );

                  const pairsPerEval = evalsSorted.map((ev) => {
                    const nota = notasEstudiante.find((n) => n.evaluacion_id === ev.id)?.nota_definitiva ?? null;
                    const notaMax = ev.nota_definitiva || 20;
                    const equiv = nota !== null ? (nota / notaMax) * ev.porcentaje : null;
                    return { nota, equiv };
                  });

                  // Promedio = sum of raw notes / count of valid notes
                  const notasValidas = pairsPerEval.map(p => p.nota).filter(v => v !== null) as number[];
                  const promedio = notasValidas.length > 0 ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length : null;
                  
                  const aprobado = promedio !== null && promedio >= 10;

                  return (
                    <TableRow key={est.id} className="group transition-colors">
                      <TableCell className="text-center text-muted-foreground text-xs border-r">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs border-r text-muted-foreground">
                        {est.tipo_cedula}-{est.cedula}
                      </TableCell>
                      <TableCell className="font-medium border-r">
                        <span className="group-hover:text-primary transition-colors">
                          {est.apellidos}, {est.nombres}
                        </span>
                      </TableCell>

                      {pairsPerEval.map(({ nota, equiv }, i) => {
                        const baja = nota !== null && nota < 10;
                        const equivBaja = equiv !== null && equiv < (evalsSorted[i]?.porcentaje ?? 10) / 2;
                        const bg = bgColors[i % bgColors.length];
                        return (
                          <React.Fragment key={i}>
                            {/* Nota sub-col */}
                            <TableCell className={`text-center font-mono text-sm border-r ${bg}`}>
                              {nota !== null ? (
                                <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold shadow-sm ${
                                  baja ? "bg-red-100 dark:bg-red-900/40 text-red-700" : "bg-white dark:bg-background text-foreground"
                                }`}>
                                  {nota.toFixed(0)}
                                </span>
                              ) : <span className="text-muted-foreground/40 text-lg">—</span>}
                            </TableCell>
                            {/* Equivalente sub-col */}
                            <TableCell className={`text-center font-mono text-xs border-r text-muted-foreground ${bg}`}>
                              {equiv !== null ? (
                                <span className={equivBaja ? "text-red-500 font-semibold" : "text-foreground"}>
                                  {equiv.toFixed(2)}
                                </span>
                              ) : <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                          </React.Fragment>
                        );
                      })}

                      <TableCell className="text-center">
                        {promedio !== null ? (
                          <span className={`inline-flex items-center justify-center w-12 h-7 rounded-full text-xs font-bold ${
                            aprobado
                              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                          }`}>
                            {promedio.toFixed(2)}
                          </span>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

      </CardContent>
    </Card>
  );
}
