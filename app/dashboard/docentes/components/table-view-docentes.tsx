import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/interfaces/users.interface";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { where } from "firebase/firestore";
import { Eye, LayoutList, SquarePen, Trash2 } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useState } from "react";
import { CreateUpdateDocentes } from "./create-update-docentes-form";
import { ViewDocenteDetails } from "./view-docente-details";

  export function TableDocentesView({
    docentes,
    getDocentes,
    isLoading,
  }: {
    docentes: User[];
    getDocentes: () => Promise<void>;
    isLoading: boolean;
  }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (uid?: string) => {
      if (!uid) return;
      setIsDeleting(true);
      try {
        // 0. Validar si tiene materias o grados asignados
        
        // Verificar asignaciones de materias
        const asignacionesQuery = await getCollection("asignaciones_docente_materia", [
          where("docente_id", "==", uid),
          where("estado", "==", "activa") // Solo asignaciones activas? O todas? El usuario dijo "tenga asignados". Mejor todas para seguridad.
        ]);
        
        if (asignacionesQuery.length > 0) {
            showToast.warning("No se puede eliminar: El docente tiene materias asignadas. Elimine las asignaciones primero.");
            setIsDeleting(false);
            return;
        }

        // Verificar asignaciones de grados (Maestra de grado)
        const asignacionesGradoQuery = await getCollection("asignaciones_docente_grado", [
          where("docente_id", "==", uid),
          where("estado", "==", "activa")
        ]);

        if (asignacionesGradoQuery.length > 0) {
            showToast.warning("No se puede eliminar: El docente tiene un grado asignado. Elimine la asignación de grado primero.");
            setIsDeleting(false);
            return;
        }

        // Verificar si es docente guía de alguna sección
        const seccionesGuiaQuery = await getCollection("secciones", [
            where("docente_guia_id", "==", uid)
        ]);

        if (seccionesGuiaQuery.length > 0) {
            showToast.warning("No se puede eliminar: El docente es guía de una o más secciones. Retire el grado asignado primero.");
            setIsDeleting(false);
            return;
        }

        // 1. Eliminar de Auth via API
        const apiRes = await fetch("/api/admin/delete-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        
        if (!apiRes.ok) {
           const errorData = await apiRes.json();
           // Si el error es que el usuario no existe, continuamos para borrarlo de la BD
           if (errorData.error.code !== 'auth/user-not-found') {
             throw new Error(errorData.error || "Error al eliminar usuario de Auth");
           }
        }

        // 2. Eliminar de Firestore
        await deleteDocument(`users/${uid}`);
        
        showToast.success("Docente eliminado correctamente");
        await getDocentes();

      } catch (error: any) {
        console.error("Error deleting docente:", error);
        showToast.error(`Error al eliminar: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    };

    return (
        <>

        <style>
        {`
          /* Estilo general del scroll */
          .custom-scroll {
            scrollbar-width: thin; /* Ancho del scroll */
            scrollbar-color: white transparent; /* Color del thumb y track */
          }

          /* Estilo para navegadores basados en WebKit (Chrome, Safari, etc.) */
          .custom-scroll::-webkit-scrollbar {
            width: 8px; /* Ancho del scroll */
          }

          .custom-scroll::-webkit-scrollbar-track {
            background: transparent; /* Fondo del track */
          }

          .custom-scroll::-webkit-scrollbar-thumb {
            background: white; /* Color del thumb */
            border-radius: 4px; /* Bordes redondeados */
          }

          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #f0f0f0; /* Cambio de color al pasar el mouse */
          }
        `}
      </style>
      <div className="custom-scroll max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Contraseña</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              docentes &&
              docentes.map((docente) => (
                <TableRow key={docente.id}>
                  <TableCell>{docente.cedula}</TableCell>
                  <TableCell>{docente.name}</TableCell>
                  <TableCell>{docente.apellidos}</TableCell>                 
                  <TableCell>{docente.email}</TableCell>  
                  <TableCell>{docente.password}</TableCell>               
                  <TableCell>{docente.telefono}</TableCell>
                  <TableCell className="flex items-center">
                    <ViewDocenteDetails docente={docente}>
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </ViewDocenteDetails>
                    <CreateUpdateDocentes
                      getDocentes={getDocentes}
                      docenteToUpdate={docente}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdateDocentes>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="p-0.5 mx-1 border-0 text-red-500 hover:text-red-700 hover:bg-red-50" variant="outline" disabled={isDeleting}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro de eliminar este docente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará al docente <strong>{docente.name} {docente.apellidos}</strong> permanentemente de la base de datos y del sistema de autenticación. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              // Prevent closing immediately to allow async if needed, but 
                              // standard AlertDialogAction closes on click. 
                              // We just trigger deletion.
                              handleDelete(docente.id);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </TableCell>
                </TableRow>
              ))}
            {isLoading &&
              [1, 1, 1].map((e, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && docentes.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron registros existentes</h2>
          </div>
        )}
      </div>
      </>

    );
  }