/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InscripcionSeccion } from "@/interfaces/secciones.interface";
import { useState } from "react";

interface ConfirmDeletionProps {
  children: React.ReactNode;
  inscripcion: InscripcionSeccion;
  deleteInscripcion: (inscripcion: InscripcionSeccion) => Promise<void>;
}

export function ConfirmDeletionInscripcion({
  children,
  inscripcion,
  deleteInscripcion,
}: ConfirmDeletionProps) {
  const [open, setOpen] = useState<boolean>(false);

  const handleDelete = async () => {
    await deleteInscripcion(inscripcion);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta inscripción? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
