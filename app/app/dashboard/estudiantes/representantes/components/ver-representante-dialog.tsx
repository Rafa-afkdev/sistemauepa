"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Representante } from "@/interfaces/representante.interface";
import { getCollection } from "@/lib/data/firebase";
import { Mail, MapPin, Phone, User, Users } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

export function VerRepresentanteDialog({
  children,
  representante,
}: {
  children: ReactNode;
  representante: Representante;
}) {
  const [open, setOpen] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && representante.estudiantes_ids && representante.estudiantes_ids.length > 0) {
      loadEstudiantes();
    }
  }, [open]);

  const loadEstudiantes = async () => {
    setLoading(true);
    try {
      const allEstudiantes = (await getCollection("estudiantes")) as Estudiantes[];
      const filtered = allEstudiantes.filter((est) =>
        representante.estudiantes_ids.includes(est.id || "")
      );
      setEstudiantes(filtered);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles del Representante</DialogTitle>
          <DialogDescription>
            Información completa y estudiantes asignados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información Personal */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                <p className="text-base font-semibold">
                  {representante.nombres} {representante.apellidos}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cédula</p>
                <p className="text-base">
                  {representante.tipo_cedula}-{representante.cedula}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parentesco</p>
                <p className="text-base">{representante.parentesco}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contacto */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Información de Contacto</h4>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono Principal</p>
                <p className="text-base">{representante.telefono_principal}</p>
              </div>
            </div>

            {representante.telefono_secundario && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teléfono Secundario
                  </p>
                  <p className="text-base">{representante.telefono_secundario}</p>
                </div>
              </div>
            )}

            {representante.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{representante.email}</p>
                </div>
              </div>
            )}

            {representante.direccion && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p className="text-base">{representante.direccion}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Estudiantes Asignados */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">
                Estudiantes Asignados ({representante.estudiantes_ids?.length || 0})
              </h4>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando estudiantes...</p>
            ) : estudiantes.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {estudiantes.map((est) => (
                  <div
                    key={est.id}
                    className="p-2 bg-muted/50 rounded-md border border-border"
                  >
                    <p className="text-sm font-medium">
                      {est.nombres} {est.apellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">CI: {est.cedula}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tiene estudiantes asignados
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
