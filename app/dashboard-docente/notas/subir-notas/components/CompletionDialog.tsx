import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  totalEstudiantes: number;
}

export function CompletionDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  totalEstudiantes,
}: CompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar y Completar Evaluación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas guardar las notas de todos los estudiantes y marcar esta evaluación como completada?
            <br /><br />
            Esta acción guardará las calificaciones y observaciones de <strong>{totalEstudiantes} estudiantes</strong> y cambiará el estado de la evaluación a "EVALUADA".
            <br /><br />
            La evaluación ya no aparecerá en la lista de evaluaciones pendientes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar y Completar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
