/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import type { Estudiantes } from "@/interfaces/estudiantes.interface";
import { deleteDocument, getCollection, getCollectionCount, getCollectionPaginated } from "@/lib/data/firebase";
import { orderBy } from "firebase/firestore";
import { Search, UserPlus2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreateUpdateStudents } from "./create-update-students.form";
import { TableStudentView } from "./table-view-student";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { showToast } from "nextjs-toast-notify";

const PAGE_SIZE = 10; // Cantidad de estudiantes por página

const Students = () => {
  const { user } = useUser();
  const [students, setStudents] = useState<Estudiantes[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [lastDocs, setLastDocs] = useState<Map<number, any>>(new Map());
  const [hasMore, setHasMore] = useState<boolean>(true);

  const totalPages = Math.ceil(totalStudents / PAGE_SIZE);

  // Obtener el conteo total de estudiantes
  const getTotalCount = useCallback(async () => {
    try {
      const count = await getCollectionCount("estudiantes");
      setTotalStudents(count);
    } catch (error) {
      console.error("Error obteniendo conteo:", error);
    }
  }, []);

  // Obtener estudiantes con paginación
  const getStudents = useCallback(async (page: number = 1) => {
    const path = "estudiantes";
    const queryConstraints = [orderBy("cedula", "asc")];
    setIsLoading(true);
    
    try {
      const lastDoc = page > 1 ? lastDocs.get(page - 1) : undefined;
      
      const result = await getCollectionPaginated(
        path, 
        PAGE_SIZE, 
        lastDoc,
        queryConstraints
      );
      
      setStudents(result.docs as Estudiantes[]);
      setHasMore(result.hasMore);
      
      if (result.lastVisible) {
        setLastDocs(prev => new Map(prev).set(page, result.lastVisible));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [lastDocs]);

  // Búsqueda en Firebase
  const searchStudents = useCallback(async (query: string, type: "cedula" | "nombres") => {
    if (!query.trim()) {
      setIsSearching(false);
      await refreshStudents();
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    
    try {
      // Obtener todos los estudiantes para búsqueda
      // Firebase no soporta búsqueda parcial, así que traemos todos y filtramos
      const allStudents = await getCollection("estudiantes", [orderBy("cedula", "asc")]) as Estudiantes[];
      
      const filtered = allStudents.filter((student) => {
        if (type === "cedula") {
          return student.cedula.toString().includes(query);
        } else {
          const fullName = `${student.nombres} ${student.apellidos}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        }
      });
      
      setStudents(filtered);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      showToast.error("Error al buscar estudiantes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto inicial
  useEffect(() => {
    if (user) {
      getTotalCount();
      getStudents(1);
    }
  }, [user]);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchStudents(searchQuery, searchType);
      } else if (isSearching) {
        // Si se borró la búsqueda, volver a cargar con paginación
        setIsSearching(false);
        refreshStudents();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  // Navegación de páginas
  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    if (page < currentPage) {
      setLastDocs(new Map());
      setCurrentPage(1);
      await loadPagesToPage(page);
    } else {
      setCurrentPage(page);
      await getStudents(page);
    }
  };

  const loadPagesToPage = async (targetPage: number) => {
    const path = "estudiantes";
    const queryConstraints = [orderBy("cedula", "asc")];
    setIsLoading(true);
    
    try {
      let currentLastDoc: any = undefined;
      const newLastDocs = new Map<number, any>();
      
      for (let p = 1; p <= targetPage; p++) {
        const result = await getCollectionPaginated(
          path,
          PAGE_SIZE,
          currentLastDoc,
          queryConstraints
        );
        
        if (result.lastVisible) {
          newLastDocs.set(p, result.lastVisible);
          currentLastDoc = result.lastVisible;
        }
        
        if (p === targetPage) {
          setStudents(result.docs as Estudiantes[]);
          setHasMore(result.hasMore);
        }
      }
      
      setLastDocs(newLastDocs);
      setCurrentPage(targetPage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Recargar lista
  const refreshStudents = async () => {
    await getTotalCount();
    setLastDocs(new Map());
    setCurrentPage(1);
    await getStudents(1);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refreshStudents();
  };

  const deleteStudent = async (student: Estudiantes) => {
    const path = `estudiantes/${student.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      showToast.success("El estudiante fue eliminado exitosamente");
      if (isSearching) {
        await searchStudents(searchQuery, searchType);
      } else {
        await refreshStudents();
      }
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar números de página
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
        <CardTitle className="text-2xl">Estudiantes</CardTitle>
        <CreateUpdateStudents getStudents={refreshStudents}>
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
                placeholder={searchType === "cedula" ? "Buscar por cédula..." : "Buscar por nombre..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isSearching ? (
              <>Resultados de búsqueda: {students.length} estudiante(s) encontrado(s)</>
            ) : (
              <>
                Mostrando {students.length} de {totalStudents} estudiantes
                {totalPages > 0 && ` • Página ${currentPage} de ${totalPages}`}
              </>
            )}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TableStudentView
          deleteStudent={deleteStudent}
          getStudents={refreshStudents}
          students={students}
          isLoading={isLoading}
        />
      </CardContent>
      <CardFooter className="flex justify-center">
        {totalPages > 1 && !isSearching && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {getPageNumbers().map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pageNum === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={!hasMore || currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
};

export default Students;