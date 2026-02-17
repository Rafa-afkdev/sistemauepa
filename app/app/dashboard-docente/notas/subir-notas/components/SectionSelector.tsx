import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface Seccion {
  id: string;
  nombre: string;
  evaluacionesCount?: number;
}

interface SectionSelectorProps {
  secciones: Seccion[];
  seccionSeleccionada: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SectionSelector({
  secciones,
  seccionSeleccionada,
  onSelect,
  isLoading,
  open,
  setOpen,
}: SectionSelectorProps) {
  const seccion = secciones.find((s) => s.id === seccionSeleccionada);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Seleccionar Sección</label>
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
                Cargando secciones...
              </span>
            ) : seccion ? (
              <span className="flex items-center gap-2">
                {seccion.nombre}
                {seccion.evaluacionesCount !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {seccion.evaluacionesCount} evaluaciones
                  </Badge>
                )}
              </span>
            ) : (
              "Elige primero la sección"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Buscar sección..." />
            <CommandList>
              <CommandEmpty>No se encontraron secciones.</CommandEmpty>
              <CommandGroup>
                {secciones.map((sec) => (
                  <CommandItem
                    key={sec.id}
                    value={sec.id}
                    onSelect={() => {
                      onSelect(sec.id === seccionSeleccionada ? "" : sec.id || "");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        sec.id === seccionSeleccionada ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{sec.nombre}</span>
                      {sec.evaluacionesCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {sec.evaluacionesCount} evaluaciones
                        </span>
                      )}
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
