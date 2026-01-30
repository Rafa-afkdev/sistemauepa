"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { deleteDocument, getCollection, getDocument, updateDocument } from "@/lib/data/firebase";
import { where } from "firebase/firestore";
import { Mail, MapPin, Phone, User, Users } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Estudiantes | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (estudiante: Estudiantes) => {
    setStudentToDelete(estudiante);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete || !studentToDelete.id) return;
    
    setDeleting(true);
    try {
      const estudianteId = studentToDelete.id;
      
      // 1. Eliminar inscripciones del estudiante
      const inscripciones = await getCollection("estudiantes_inscritos", [
        where("id_estudiante", "==", estudianteId)
      ]);
      
      for (const inscripcion of inscripciones) {
        if (inscripcion.id) {
          await deleteDocument(`estudiantes_inscritos/${inscripcion.id}`);
        }
      }

      // 2. Actualizar la sección (remover del array y decrementar contador)
      if (studentToDelete.seccion_actual) {
        try {
          const seccion = await getDocument(`secciones/${studentToDelete.seccion_actual}`) as any;
          if (seccion) {
            const nuevosEstudiantesIds = (seccion.estudiantes_ids || []).filter(
              (id: string) => id !== estudianteId
            );
            const nuevaCantidad = Math.max(0, (seccion.estudiantes_inscritos || 0) - 1);
            
            await updateDocument(`secciones/${studentToDelete.seccion_actual}`, {
              estudiantes_ids: nuevosEstudiantesIds,
              estudiantes_inscritos: nuevaCantidad,
            });
          }
        } catch (error) {
          console.error("Error actualizando sección:", error);
        }
      }

      // 3. Actualizar representante (remover del array)
      if (representante.id) {
        const nuevosEstudiantesIds = (representante.estudiantes_ids || []).filter(
          id => id !== estudianteId
        );
        
        await updateDocument(`representantes/${representante.id}`, {
          estudiantes_ids: nuevosEstudiantesIds,
        });
      }

      // 4. Eliminar historial de cambios de sección
      const historial = await getCollection("historial_cambios_seccion", [
        where("id_estudiante", "==", estudianteId)
      ]);
      
      for (const cambio of historial) {
        if (cambio.id) {
          await deleteDocument(`historial_cambios_seccion/${cambio.id}`);
        }
      }

      // 5. Eliminar el estudiante
      await deleteDocument(`estudiantes/${estudianteId}`);

      showToast.success("Estudiante eliminado exitosamente");
      
      // Recargar lista de estudiantes
      await loadEstudiantes();
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      
    } catch (error: any) {
      console.error("Error eliminando estudiante:", error);
      showToast.error(error.message || "Error al eliminar estudiante");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
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
                      className="p-2 bg-muted/50 rounded-md border border-border flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {est.nombres} {est.apellidos}
                        </p>
                        <p className="text-xs text-muted-foreground">CI: {est.cedula}</p>
                      </div>
                      {/* Botón de eliminar - comentado temporalmente */}
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(est)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button> */}
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

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>
                  Esta acción <strong>eliminará permanentemente</strong> al estudiante:
                </div>
                {studentToDelete && (
                  <div className="p-3 bg-muted rounded-md my-2">
                    <p className="font-semibold text-foreground">
                      {studentToDelete.nombres} {studentToDelete.apellidos}
                    </p>
                    <p className="text-sm">CI: {studentToDelete.cedula}</p>
                  </div>
                )}
                <div className="text-destructive font-medium">
                  Se eliminarán todos sus datos: inscripciones, historial y referencias en secciones.
                </div>
                <div>Esta acción no se puede deshacer.</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Sí, eliminar estudiante"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
