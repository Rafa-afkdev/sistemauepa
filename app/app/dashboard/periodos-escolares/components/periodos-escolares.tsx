/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { orderBy } from "firebase/firestore";
import type { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { CreateUpdatePeriodoEscolar } from "./create-update-periodos-escolares.form";
import { TableViewPeriodoEscolar } from "./table-view-periodos-escolares";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { ScrollArea } from "@/components/ui/scroll-area";


const PeriodosEscolares = () => {
  const user = useUser();
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getPeriodosEscolares = async () => {
    const path = `periodos_escolares`;
     const query = [orderBy("periodo", "desc")];
    setIsLoading(true);
    try {
      const res = (await getCollection(path,query)) as PeriodosEscolares[];
      setPeriodosEscolares(res);
    } catch (error) {
      showToast.error("Error al obtener periodos escolares");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getPeriodosEscolares();
  }, [user]);

  // ===== ELIMINAR UN PERIODO ESCOLAR ===== //
  const deletePeriodoEscolar = async (periodoEscolar: PeriodosEscolares) => {
    const path = `periodos_escolares/${periodoEscolar.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("El periodo escolar fue eliminado exitosamente");
      const newPeriodosEscolares = periodosEscolares.filter(
        (item) => item.id !== periodoEscolar.id
      );
      setPeriodosEscolares(newPeriodosEscolares);
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
            <CardTitle className="text-2xl">Periodos Escolares</CardTitle>
            <CreateUpdatePeriodoEscolar getPeriodos_Escolares={getPeriodosEscolares}>
              <Button variant="outline">
                Aperturar Nuevo Periodo
                <CirclePlus className="ml-2 w-5" />
              </Button>
            </CreateUpdatePeriodoEscolar>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[600px] pr-4"> {/* Altura ajustable */}
            <TableViewPeriodoEscolar 
              deletePeriodo_escolar={deletePeriodoEscolar}
              // getPeriodo_escolar={getPeriodosEscolares}
              getPeriodosEscolares={getPeriodosEscolares}
              periodos_escolares={periodosEscolares}
              isLoading={isLoading}
            />
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};

export default PeriodosEscolares;
