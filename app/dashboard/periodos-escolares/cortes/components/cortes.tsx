"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import type { CortesEscolares } from "@/interfaces/cortes.interface";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { CirclePlus } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { CreateUpdateCorte } from "./create-update-cortes.form";
import { TableViewCortes } from "./table-view-cortes";

const CortesMain = () => {
  const { user } = useUser();
  const [cortes, setCortes] = useState<CortesEscolares[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getCortes = async () => {
    const path = `cortes`;
    // We typically want to sort by latest or sort by lapso.
    // getCollection doesn't allow multiple mixed sorts easily if we don't have indexes.
    // For now we just get them all and sort in client.
    setIsLoading(true);
    try {
      const res = (await getCollection(path)) as CortesEscolares[];
      const sorted = res.sort((a,b) => new Date(b.createdAt?.toMillis() || Date.now()).getTime() - new Date(a.createdAt?.toMillis() || Date.now()).getTime());
      setCortes(sorted);
    } catch (error) {
      showToast.error("Error al obtener los cortes de notas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getCortes();
  }, [user]);

  // ELIMINAR UN CORTE
  const deleteCorte = async (corte: CortesEscolares) => {
    const path = `cortes/${corte.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("El corte fue eliminado exitosamente");
      const newCortes = cortes.filter(
        (item) => item.id !== corte.id
      );
      setCortes(newCortes);
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
            <CardTitle className="text-2xl">Cortes de Notas</CardTitle>
            <CreateUpdateCorte getCortesEscolares={getCortes}>
              <Button variant="outline">
                Nuevo Corte
                <CirclePlus className="ml-2 w-5" />
              </Button>
            </CreateUpdateCorte>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <TableViewCortes 
              deleteCorte={deleteCorte}
              getCortes={getCortes}
              cortes={cortes}
              isLoading={isLoading}
            />
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};

export default CortesMain;
