import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { Check, ChevronsUpDown } from "lucide-react";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface EvaluationSelectorProps {
  evaluaciones: EvaluacionConDetalles[];
  evaluacionSeleccionada: string;
  onSelectEvaluacion: (id: string) => void;
  isLoading: boolean;
}

export function EvaluationSelector({
  evaluaciones,
  evaluacionSeleccionada,
  onSelectEvaluacion,
  isLoading,
}: EvaluationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");

  // Obtener materias únicas de las evaluaciones disponibles
  const materiasUnicas = useMemo(() => {
    const mapa = new Map<string, string>();
    evaluaciones.forEach((ev) => {
      if (ev.materia_id && ev.materia_nombre) {
        mapa.set(ev.materia_id, ev.materia_nombre);
      }
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [evaluaciones]);

  // Filtrar evaluaciones por materia seleccionada
  const evaluacionesFiltradas = useMemo(() => {
    if (materiaFiltro === "todas") return evaluaciones;
    return evaluaciones.filter((ev) => ev.materia_id === materiaFiltro);
  }, [evaluaciones, materiaFiltro]);

  // Cuando cambia la materia, limpiar la evaluación seleccionada si ya no está disponible
  const handleMateriaChange = (value: string) => {
    setMateriaFiltro(value);
    if (value !== "todas") {
      const evaActual = evaluaciones.find((ev) => ev.id === evaluacionSeleccionada);
      if (evaActual && evaActual.materia_id !== value) {
        onSelectEvaluacion("");
      }
    }
  };

  return (
    <div className="flex gap-4 w-full">
      {/* Combobox de Materia */}
      <div className="space-y-2 flex-1">
        <Label>Materia</Label>
        <Select
          value={materiaFiltro}
          onValueChange={handleMateriaChange}
          disabled={isLoading || materiasUnicas.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas las materias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las materias</SelectItem>
            {materiasUnicas.map((materia) => (
              <SelectItem key={materia.id} value={materia.id}>
                {materia.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Combobox de Evaluación Completada */}
      <div className="space-y-2 flex-1">
        <Label>Evaluación Completada</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading}
            >
              {evaluacionSeleccionada ? (
                <span className="truncate">
                  {evaluaciones.find((ev) => ev.id === evaluacionSeleccionada)?.nombre_evaluacion}
                </span>
              ) : isLoading ? (
                "Cargando evaluaciones..."
              ) : evaluacionesFiltradas.length === 0 ? (
                "No hay evaluaciones completadas"
              ) : (
                "Buscar evaluación..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar evaluación..." />
              <CommandList>
                <CommandEmpty>No se encontraron evaluaciones.</CommandEmpty>
                <CommandGroup>
                  {evaluacionesFiltradas.map((ev) => (
                    <CommandItem
                      key={ev.id}
                      value={`${ev.nombre_evaluacion} ${ev.materia_nombre} ${ev.seccion_nombre}`}
                      onSelect={() => {
                        onSelectEvaluacion(ev.id!);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          evaluacionSeleccionada === ev.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{ev.nombre_evaluacion}</span>
                        <span className="text-xs text-muted-foreground">
                          {ev.materia_nombre} • {ev.seccion_nombre} • {ev.fecha.split('-').reverse().join('/')} • {ev.porcentaje}%
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
