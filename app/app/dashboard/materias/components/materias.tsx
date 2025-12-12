"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useUser } from "@/hooks/use-user";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { Materias } from "@/interfaces/materias.interface";
import { CreateUpdateMaterias } from "./create-update-materias.form";
import { TableMateriasView } from "./table-view-materias";
import { Button } from "@/components/ui/button";
import { Search, NotebookPen } from "lucide-react";
import { orderBy } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { showToast } from "nextjs-toast-notify";

const MateriasComponent = () => {
  const { user } = useUser();
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"nombre" | "codigo">("nombre");

  const getMaterias = async () => {
    const path = "materias";
    const query = [orderBy("nombre", "asc")];
    setIsLoading(true);
    try {
      const res = (await getCollection(path, query)) as Materias[];
      setMaterias(res);
    } catch (error) {
      console.error(error);
      showToast.error("Ocurrió un error al cargar las materias");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getMaterias();
  }, [user]);

  const filteredMaterias = materias.filter((materia) => {
    if (searchType === "codigo") {
      return (materia.codigo || "").toLowerCase().includes(searchQuery.toLowerCase());
    }
    return materia.nombre.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const deleteMateria = async (materia: Materias) => {
    if (!materia.id) return;
    const path = `materias/${materia.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      showToast.success("La materia fue eliminada exitosamente");
      const nuevas = materias.filter((m) => m.id !== materia.id);
      setMaterias(nuevas);
    } catch (error: any) {
      showToast.error(error.message || "Error al eliminar la materia", {
        duration: 2500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Materias</CardTitle>
          <CreateUpdateMaterias getMaterias={getMaterias}>
            <Button variant="outline">
              Agregar Materia
              <NotebookPen className="ml-2 w-5" />
            </Button>
          </CreateUpdateMaterias>
        </div>
        <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Select
              value={searchType}
              onValueChange={(value: "nombre" | "codigo") => setSearchType(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre">Nombre</SelectItem>
                <SelectItem value="codigo">Código</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TableMateriasView
          materias={filteredMaterias}
          getMaterias={getMaterias}
          deleteMateria={deleteMateria}
          isLoading={isLoading}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default MateriasComponent;

