/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { CreateUpdateStudents } from "./create-update-students.form";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { TableStudentView } from "./table-view-student";
import { Button } from "@/components/ui/button";
import { Search, UserPlus2 } from "lucide-react";
import { orderBy } from "firebase/firestore";
import type { Estudiantes } from "@/interfaces/estudiantes.interface";
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

const Students = () => {
  const user = useUser();
  const [students, setStudents] = useState<Estudiantes[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");

  const getStudents = async () => {
    const path = `estudiantes`;
    const query = [orderBy("cedula", "asc")];
    setIsLoading(true);
    try {
      const res = await getCollection(path, query) as Estudiantes[];
      setStudents(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getStudents();
  }, [user]);

  const filteredStudents = students.filter((student) => {
    if (searchType === "cedula") {
      return student.cedula.toString().includes(searchQuery);
    } else {
      return student.nombres.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const deleteStudent = async (student: Estudiantes) => {
    const path = `estudiantes/${student.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      showToast.success("El estudiante fue eliminado exitosamente");
      const newStudents = students.filter((i) => i.id !== student.id);
      setStudents(newStudents);
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
        <CardTitle className="text-2xl">Estudiantes</CardTitle>
        <CreateUpdateStudents getStudents={getStudents}>
            <Button variant="outline">
              Agregar Estudiante
              <UserPlus2 className="ml-2 w-5" />
            </Button>
          </CreateUpdateStudents>
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
        <TableStudentView
          deleteStudent={deleteStudent}
          getStudents={getStudents}
          students={filteredStudents}
          isLoading={isLoading}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default Students;