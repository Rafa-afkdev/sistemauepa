"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { ClipboardEdit } from "lucide-react";
import type { InscripcionSeccion } from "@/interfaces/secciones.interface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { InscribirEstudiante } from "./inscribir-estudiante";
import { TableViewInscritos } from "./table-view-inscritos";

export default function inscripcion() {



  const { user } = useUser();
  const [inscripciones, setInscripciones] = useState<InscripcionSeccion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getInscripciones = async () => {
    const path = `estudiantes_inscritos`;
    setIsLoading(true);
    try {
      const res = (await getCollection(path)) as InscripcionSeccion[];
      console.log(res);
      setInscripciones(res);
    } catch (error) {
      showToast.error("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) getInscripciones();
  }, [user?.uid]);

  const deleteInscripcion = async (inscripcion: InscripcionSeccion) => {
    const path = `estudiantes_inscritos/${inscripcion.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("La inscripción fue eliminada exitosamente");
      const newInscripciones = inscripciones.filter((i) => i.id !== inscripcion.id);
      setInscripciones(newInscripciones);
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Inscripción de Estudiantes</CardTitle>
            <InscribirEstudiante getInscripciones={getInscripciones}>
              <Button variant="outline">
                Inscribir Estudiantes
                <ClipboardEdit className="ml-2 w-5" />
              </Button>
            </InscribirEstudiante>
          </div>
          <CardDescription>
            Gestiona las inscripciones de estudiantes a las secciones
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TableViewInscritos
            deleteInscripcion={deleteInscripcion}
            getInscripciones={getInscripciones}
            inscripciones={inscripciones}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </>
  );
};


