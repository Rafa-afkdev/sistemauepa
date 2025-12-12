/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { ClipboardEdit } from "lucide-react";
import { orderBy } from "firebase/firestore";
import type { Secciones } from "@/interfaces/secciones.interface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react"; 
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { CreateUpdateSecciones } from "./create-update-secciones";
import { TableSeccionView } from "./table-view-secciones";

const Secciones = () => {

    const { user } = useUser();
    const [secciones, setSecciones] = useState<Secciones[]>([])
    const [isLoading, setisLoading] = useState<boolean>(true)

    const getSecciones = async() => {
        const path = `secciones`
        const query = [
            // orderBy('nivel_educativo', 'asc'),
            
            // orderBy('año_seccion', 'asc'),
            // orderBy('seccion',| 'asc'),
            // where('cedula', '==', 31058014)
        ]
        setisLoading(true);
        try {
           const res = await getCollection(path) as Secciones[];
           console.log(res);

           setSecciones(res)
            
        } catch (error) {
          showToast.error('Ocurrió un error. Intenta nuevamente.');

        }finally{
            setisLoading(false);
        }
    }

    useEffect(() => {
        if (user?.uid) getSecciones();
    }, [user?.uid])

    //TODO ===== // ELIMINAR UN ESTUDIANTE //======== ///

    const deleteSeccion = async (seccion: Secciones) => {
        const path = `secciones/${seccion.id}`;
        setisLoading(true);
    
        try {
    
          await deleteDocument(path);
          showToast.success("La seccion fue eliminado exitosamente");
            const newStudents = secciones.filter(i => i.id !== seccion.id);
            setSecciones(newStudents);
        } catch (error: any) {
          showToast.error(error.message, { duration: 2500 });
        } finally {
          setisLoading(false);
        }
      };
    

      return (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Secciones</CardTitle>
                <CreateUpdateSecciones getSecciones={getSecciones}>
                  <Button variant="outline">
                    Crear Nueva Sección
                    <ClipboardEdit className="ml-2 w-5" />
                  </Button>
                </CreateUpdateSecciones>
              </div>
              <CardDescription>
              </CardDescription>
            </CardHeader>
      
            <CardContent>
              <TableSeccionView
                deleteSeccion={deleteSeccion}
                getSecciones={getSecciones}
                secciones={secciones}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </>
      );
    }
export default Secciones;