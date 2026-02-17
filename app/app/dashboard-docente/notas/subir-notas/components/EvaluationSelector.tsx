import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface EvaluationSelectorProps {
  evaluaciones: EvaluacionConDetalles[];
  evaluacionSeleccionada: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function EvaluationSelector({
  evaluaciones,
  evaluacionSeleccionada,
  onSelect,
  isLoading,
  open,
  setOpen,
}: EvaluationSelectorProps) {
  const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Seleccionar Evaluación</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando evaluaciones...
              </span>
            ) : evaluacion ? (
              <span className="flex items-center gap-2">
                {evaluacion.nombre_evaluacion}
                <Badge variant="secondary" className="ml-2">
                  {evaluacion.materia_nombre}
                </Badge>
              </span>
            ) : (
              "Elige la evaluación para la cual tienes que registrar las notas"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0">
          <Command>
            <CommandInput placeholder="Buscar evaluación..." />
            <CommandList>
              <CommandEmpty>No se encontraron evaluaciones.</CommandEmpty>
              <CommandGroup>
                {evaluaciones.map((ev) => (
                  <CommandItem
                    key={ev.id}
                    value={ev.id}
                    onSelect={() => {
                      onSelect(ev.id === evaluacionSeleccionada ? "" : ev.id || "");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        ev.id === evaluacionSeleccionada ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{ev.nombre_evaluacion}</span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Tipo: {ev.tipo_evaluacion}</span>
                        <span>•</span>
                        <span>Materia: {ev.materia_nombre}</span>
                        <span>•</span>
                        <span>Sección: {ev.seccion_nombre}</span>
                        <span>•</span>
                        <span>Fecha: {ev.fecha.split('-').reverse().join('/')}</span>
                        <span>•</span>
                        <span>Porcentaje: {ev.porcentaje}%</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
