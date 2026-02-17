import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { Edit } from "lucide-react";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotaConEstudiante extends NotasEvaluacion {
  estudiante?: Estudiantes;
}

interface GradesTableProps {
  notas: NotaConEstudiante[];
  evaluacion: EvaluacionConDetalles;
  onEdit?: (nota: NotaConEstudiante) => void;
}

export function GradesTable({ notas, evaluacion, onEdit }: GradesTableProps) {
  if (notas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay calificaciones registradas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Estudiante</TableHead>
            <TableHead>Cédula</TableHead>
            {evaluacion.criterios.map((criterio) => (
              <TableHead key={criterio.nro_criterio} className="text-center">
                {criterio.nombre}
                <br />
                <span className="text-xs text-muted-foreground">
                  (max: {criterio.ponderacion})
                </span>
              </TableHead>
            ))}
            <TableHead className="text-center font-bold">Nota Final</TableHead>
            <TableHead className="w-[200px]">Observaciones</TableHead>
            {onEdit && <TableHead className="w-[80px]">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {notas.map((nota, index) => {
            const notaAprobada = nota.nota_definitiva >= 10;
            return (
              <TableRow key={nota.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {nota.estudiante?.apellidos}, {nota.estudiante?.nombres}
                </TableCell>
                <TableCell>
                  {nota.estudiante?.tipo_cedula}-{nota.estudiante?.cedula}
                </TableCell>
                {evaluacion.criterios.map((criterio) => {
                  const notaCriterio = nota.notas_criterios.find(
                    (nc) => nc.criterio_numero === criterio.nro_criterio
                  );
                  return (
                    <TableCell key={criterio.nro_criterio} className="text-center">
                      {notaCriterio?.nota_obtenida || 0}
                    </TableCell>
                  );
                })}
                <TableCell
                  className={`text-center font-bold ${
                    notaAprobada ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {nota.nota_definitiva.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {nota.observacion || "-"}
                </TableCell>
                {onEdit && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(nota)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
