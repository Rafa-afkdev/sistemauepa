import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  return (
    <div className="space-y-2 max-w-md">
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
            ) : evaluaciones.length === 0 ? (
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
                {evaluaciones.map((ev) => (
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
  );
}

import { useState } from "react";

