/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Search, UserPlus2 } from "lucide-react";
import { orderBy } from "firebase/firestore";
import React from "react";

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
import { Input } from "@/components/ui/input"; // Importamos el componente Input de shadcn/ui
import { showToast } from "nextjs-toast-notify";
import { User } from "@/interfaces/users.interface";
import { CreateUpdateDocentes } from "./create-update-docentes-form";
import { TableDocentesView } from "./table-view-docentes";

const Docentes = () => {
  const { user } = useUser();
  const [docentes, setDocentes] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");

  const getDocentes = async () => {
    const path = `users`;
    const query = [orderBy("cedula", "asc")];
    setIsLoading(true);
    try {
      const res = await getCollection(path, query) as User[];
      setDocentes(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getDocentes();
  }, [user]);

  const filteredDocentes = docentes.filter((docente) => {
    if (searchType === "cedula") {
      return docente.cedula.toString().includes(searchQuery);
    } else {
      return docente.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const deleteDocente = async (docente: User) => {
    const path = `users/${docente.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      showToast.success("El docente fue eliminado exitosamente");
      const newDocentes = docentes.filter((i) => i.id !== docente.id);
      setDocentes(newDocentes);
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
        <CardTitle className="text-2xl">Docentes</CardTitle>
        <CreateUpdateDocentes getDocentes={getDocentes}>
            <Button variant="outline">
              Agregar Docente
              <UserPlus2 className="ml-2 w-5" />
            </Button>
          </CreateUpdateDocentes>
        </div>
        <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Select
              value={searchType}
              onValueChange={(value: "cedula" | "nombres") => setSearchType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cedula">Cédula</SelectItem>
                <SelectItem value="nombres">Nombres</SelectItem>
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
        <TableDocentesView
        //   deleteDocente={deleteDocente}
          getDocentes={getDocentes}
          docentes={filteredDocentes}
          isLoading={isLoading}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default Docentes;