
interface Estadisticas {
  promedio: string;
  notaMaxima: string;
  notaMinima: string;
  aprobados: number;
  reprobados: number;
  total: number;
}

interface GradesStatisticsProps {
  estadisticas: Estadisticas;
}

export function GradesStatistics({ estadisticas }: GradesStatisticsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Promedio</p>
        <p className="text-lg font-bold">{estadisticas.promedio}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Nota Máxima</p>
        <p className="text-lg font-bold text-green-600">{estadisticas.notaMaxima}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Nota Mínima</p>
        <p className="text-lg font-bold text-red-600">{estadisticas.notaMinima}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Aprobados</p>
        <p className="text-lg font-bold text-green-600">{estadisticas.aprobados}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Reprobados</p>
        <p className="text-lg font-bold text-red-600">{estadisticas.reprobados}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-lg font-bold">{estadisticas.total}</p>
      </div>
    </div>
  );
}
