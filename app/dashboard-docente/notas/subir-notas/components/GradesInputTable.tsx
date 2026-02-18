import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Save } from "lucide-react";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotasEstudiante {
  estudiante_id: string;
  notas_criterios: { [key: string]: number };
  nota_definitiva: number;
  observacion: string;
}

interface GradesInputTableProps {
  estudiantes: Estudiantes[];
  evaluacion: EvaluacionConDetalles;
  notasEstudiantes: { [key: string]: NotasEstudiante };
  onNotaChange: (estudianteId: string, criterioNumero: string, valor: string) => void;
  onObservacionChange: (estudianteId: string, valor: string) => void;
  onGuardarTodasNotas: () => void;
  isLoading: boolean;
  guardandoNotas: boolean;
}

export function GradesInputTable({
  estudiantes,
  evaluacion,
  notasEstudiantes,
  onNotaChange,
  onObservacionChange,
  onGuardarTodasNotas,
  isLoading,
  guardandoNotas,
}: GradesInputTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Cargando estudiantes...</span>
      </div>
    );
  }

  if (estudiantes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay estudiantes registrados en esta sección
      </div>
    );
  }

  return (
    <>
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
                    (0-{criterio.ponderacion})
                  </span>
                </TableHead>
              ))}
              <TableHead className="text-center">Nota Final</TableHead>
              <TableHead className="w-[250px]">Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estudiantes.map((estudiante, index) => {
              const notasEst = estudiante.id ? notasEstudiantes[estudiante.id] : null;
              if (!notasEst || !estudiante.id) return null;

              return (
                <TableRow key={estudiante.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {estudiante.apellidos}, {estudiante.nombres}
                  </TableCell>
                  <TableCell>
                    {estudiante.tipo_cedula}-{estudiante.cedula}
                  </TableCell>
                  {evaluacion.criterios.map((criterio) => (
                    <TableCell key={criterio.nro_criterio} className="text-center">
                      <Input
                        type="number"
                        min={0}
                        max={criterio.ponderacion}
                        step={1}
                        value={notasEst.notas_criterios[criterio.nro_criterio] || 0}
                        onChange={(e) =>
                          onNotaChange(
                            estudiante.id!,
                            criterio.nro_criterio,
                            e.target.value
                          )
                        }
                        className="w-20 text-center mx-auto"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold">
                    {notasEst.nota_definitiva.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      placeholder="Observaciones (opcional)"
                      value={notasEst.observacion || ""}
                      onChange={(e) => onObservacionChange(estudiante.id!, e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {estudiantes.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onGuardarTodasNotas}
            disabled={guardandoNotas}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Todas las Notas
          </Button>
        </div>
      )}
    </>
  );
}
