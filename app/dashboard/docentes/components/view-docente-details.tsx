"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@/interfaces/users.interface";
import { Badge } from "@/components/ui/badge";

interface ViewDocenteDetailsProps {
  children: React.ReactNode;
  docente: User;
}

export function ViewDocenteDetails({
  children,
  docente,
}: ViewDocenteDetailsProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "No disponible";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "No disponible";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      activo: { label: "Activo", variant: "default" },
      inactivo: { label: "Inactivo", variant: "secondary" },
      suspendido: { label: "Suspendido", variant: "destructive" },
    };

    const config = statusConfig[status?.toLowerCase()] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRolBadge = (rol: string) => {
    const rolConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      docente: { label: "Docente", variant: "default" },
      admin: { label: "Administrador", variant: "secondary" },
      coordinador: { label: "Coordinador", variant: "outline" },
    };

    const config = rolConfig[rol?.toLowerCase()] || { label: rol, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalles del Docente
          </DialogTitle>
          <DialogDescription>
            Información completa del docente seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sección: Datos Personales */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Datos Personales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cédula</p>
                <p className="text-sm font-medium">{docente.cedula || "No disponible"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Nombre Completo</p>
                <p className="text-sm font-medium">
                  {docente.name} {docente.apellidos}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                <p className="text-sm font-medium">{docente.telefono || "No disponible"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Estado</p>
                <div className="mt-1">
                  {getStatusBadge(docente.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Credenciales */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Credenciales de Acceso
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Correo Electrónico</p>
                <p className="text-sm font-medium break-all">{docente.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Contraseña</p>
                <p className="text-sm font-medium">
                  {docente.password}
                </p>
              </div>
            </div>
          </div>

          {/* Sección: Información del Sistema */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Información del Sistema
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Rol</p>
                <div className="mt-1">
                  {getRolBadge(docente.rol)}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Permiso</p>
                <div className="mt-1">
                  <Badge variant={docente.permiso ? "default" : "destructive"}>
                    {docente.permiso ? "Habilitado" : "Deshabilitado"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">ID de Usuario</p>
                <p className="text-sm font-medium break-all text-gray-600">
                  {docente.uid || docente.id || "No disponible"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha de Registro</p>
                <p className="text-sm font-medium">
                  {formatDate(docente.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
