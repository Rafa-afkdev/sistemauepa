"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasCriterios, NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotaConEstudiante extends NotasEvaluacion {
  estudiante?: Estudiantes;
}

interface EditGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nota: NotaConEstudiante | null;
  evaluacion: EvaluacionConDetalles;
  onSave: (notaId: string, nuevasNotasCriterios: NotasCriterios[], motivo: string) => Promise<void>;
}

export function EditGradeDialog({ open, onOpenChange, nota, evaluacion, onSave }: EditGradeDialogProps) {
  const [notasCriterios, setNotasCriterios] = useState<{ [key: string]: number }>({});
  const [motivo, setMotivo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar notas cuando cambia la nota seleccionada
  useEffect(() => {
    if (nota) {
      const notasObj: { [key: string]: number } = {};
      nota.notas_criterios.forEach((nc) => {
        notasObj[nc.criterio_numero] = nc.nota_obtenida;
      });
      setNotasCriterios(notasObj);
      setMotivo("");
    }
  }, [nota]);

  const handleNotaChange = (criterioNumero: string, valor: string) => {
    const valorNumerico = parseFloat(valor) || 0;
    const criterio = evaluacion.criterios.find((c) => c.nro_criterio === criterioNumero);
    
    if (!criterio) return;

    // Validar que la nota no exceda la ponderación del criterio
    const notaValidada = Math.min(Math.max(valorNumerico, 0), criterio.ponderacion);

    setNotasCriterios((prev) => ({
      ...prev,
      [criterioNumero]: notaValidada,
    }));
  };

  const calcularNotaDefinitiva = () => {
    let total = 0;
    evaluacion.criterios.forEach((criterio) => {
      const notaCriterio = notasCriterios[criterio.nro_criterio] || 0;
      const porcentaje = criterio.ponderacion / evaluacion.criterios.reduce((sum, c) => sum + c.ponderacion, 0);
      total += notaCriterio * porcentaje;
    });
    return total;
  };

  const handleSave = async () => {
    if (!nota) return;

    // Validar motivo
    if (!motivo.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      // Crear array de notas criterios
      const nuevasNotasCriterios: NotasCriterios[] = evaluacion.criterios.map((criterio) => ({
        criterio_numero: criterio.nro_criterio,
        criterio_nombre: criterio.nombre,
        ponderacion_maxima: criterio.ponderacion,
        nota_obtenida: notasCriterios[criterio.nro_criterio] || 0,
      }));

      await onSave(nota.id || "", nuevasNotasCriterios, motivo);
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!nota) return null;

  const notaDefinitiva = calcularNotaDefinitiva();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Calificación</DialogTitle>
          <DialogDescription>
            Estudiante: {nota.estudiante?.apellidos}, {nota.estudiante?.nombres} ({nota.estudiante?.tipo_cedula}-{nota.estudiante?.cedula})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Criterios */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Criterios de Evaluación</Label>
            {evaluacion.criterios.map((criterio) => {
              const notaActual = notasCriterios[criterio.nro_criterio] || 0;
              return (
                <div key={criterio.nro_criterio} className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-sm">
                    {criterio.nombre}
                    <span className="text-xs text-muted-foreground ml-2">(max: {criterio.ponderacion})</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={criterio.ponderacion}
                    step="0.01"
                    value={notaActual}
                    onChange={(e) => handleNotaChange(criterio.nro_criterio, e.target.value)}
                    className="col-span-2"
                  />
                </div>
              );
            })}
          </div>

          {/* Nota Definitiva Calculada */}
          <div className="bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Nota Definitiva:</span>
              <span className={`text-lg font-bold ${notaDefinitiva >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                {notaDefinitiva.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Motivo del Cambio */}
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-base font-semibold">
              Motivo del Cambio <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Explique brevemente el motivo de la modificación..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !motivo.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
