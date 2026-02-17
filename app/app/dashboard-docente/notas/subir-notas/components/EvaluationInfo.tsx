import { Badge } from "@/components/ui/badge";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface EvaluationInfoProps {
  evaluacion: EvaluacionConDetalles;
}

export function EvaluationInfo({ evaluacion }: EvaluationInfoProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Tipo:</span>
          <p className="font-medium">{evaluacion.tipo_evaluacion}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Materia:</span>
          <p className="font-medium">{evaluacion.materia_nombre}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Sección:</span>
          <p className="font-medium">{evaluacion.seccion_nombre}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Porcentaje:</span>
          <p className="font-medium">{evaluacion.porcentaje}%</p>
        </div>
      </div>

      <div>
        <span className="text-sm text-muted-foreground">Criterios de Evaluación:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {evaluacion.criterios.map((criterio) => (
            <Badge key={criterio.nro_criterio} variant="outline">
              {criterio.nombre} ({criterio.ponderacion} pts)
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
