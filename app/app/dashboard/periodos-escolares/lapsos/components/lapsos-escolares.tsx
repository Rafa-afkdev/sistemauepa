/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { orderBy } from "firebase/firestore";
import type { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateUpdateLapsoEscolar } from "./create-update-lapsos-escolares.form";
import { TableViewLapsoEscolar } from "./table-view-lapsos-escolares";


const LapsosEscolar = () => {
  const { user } = useUser();
  const [lapsosEscolares, setLapsosEscolares] = useState<LapsosEscolares[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getLapsosEscolares = async () => {
    const path = `lapsos`;
    const query = [orderBy("lapso", "asc")];
    setIsLoading(true);
    try {
      const res = (await getCollection(path, query)) as LapsosEscolares[];
      setLapsosEscolares(res);
    } catch (error) {
      showToast.error("Error al obtener lapsos escolares");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getLapsosEscolares();
  }, [user]);

  // ===== ELIMINAR UN LAPSO ESCOLAR ===== //
  const deleteLapsoEscolar = async (lapsoEscolar: LapsosEscolares) => {
    const path = `lapsos/${lapsoEscolar.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("El lapso escolar fue eliminado exitosamente");
      const newLapsosEscolares = lapsosEscolares.filter(
        (item) => item.id !== lapsoEscolar.id
      );
      setLapsosEscolares(newLapsosEscolares);
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
            <CardTitle className="text-2xl">Lapsos Escolares</CardTitle>
            <CreateUpdateLapsoEscolar getLapsosEscolares={getLapsosEscolares}>
              <Button variant="outline">
                Nuevo Lapso
                <CirclePlus className="ml-2 w-5" />
              </Button>
            </CreateUpdateLapsoEscolar>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <TableViewLapsoEscolar 
              deleteLapsoEscolar={deleteLapsoEscolar}
              getLapsosEscolares={getLapsosEscolares}
              lapsos_escolares={lapsosEscolares}
              isLoading={isLoading}
            />
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};

export default LapsosEscolar;