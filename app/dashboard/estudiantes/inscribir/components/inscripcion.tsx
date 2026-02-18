"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useUser } from "@/hooks/use-user";
import type { InscripcionSeccion } from "@/interfaces/secciones.interface";
import { deleteDocument, getCollection, getCollectionCount, getCollectionPaginated } from "@/lib/data/firebase";
import { ClipboardEdit, Search, X } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useCallback, useEffect, useState } from "react";
import { InscribirEstudiante } from "./inscribir-estudiante";
import { TableViewInscritos } from "./table-view-inscritos";

const PAGE_SIZE = 10;

export default function Inscripcion() {
  const { user } = useUser();
  const [inscripciones, setInscripciones] = useState<InscripcionSeccion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombre">("cedula");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalInscripciones, setTotalInscripciones] = useState<number>(0);
  const [lastDocs, setLastDocs] = useState<Map<number, any>>(new Map());
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Mapas para búsqueda
  const [estudiantesData, setEstudiantesData] = useState<any[]>([]);

  const totalPages = Math.ceil(totalInscripciones / PAGE_SIZE);

  // Cargar datos de estudiantes para búsqueda
  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        const estudiantes = await getCollection("estudiantes") as any[];
        setEstudiantesData(estudiantes);
      } catch (error) {
        console.error("Error cargando estudiantes:", error);
      }
    };
    loadEstudiantes();
  }, []);

  // Obtener el conteo total
  const getTotalCount = useCallback(async () => {
    try {
      const count = await getCollectionCount("estudiantes_inscritos");
      setTotalInscripciones(count);
    } catch (error) {
      console.error("Error obteniendo conteo:", error);
    }
  }, []);

  // Obtener inscripciones con paginación
  const getInscripciones = useCallback(async (page: number = 1) => {
    const path = "estudiantes_inscritos";
    setIsLoading(true);
    
    try {
      const lastDoc = page > 1 ? lastDocs.get(page - 1) : undefined;
      
      const result = await getCollectionPaginated(
        path, 
        PAGE_SIZE, 
        lastDoc
      );
      
      setInscripciones(result.docs as InscripcionSeccion[]);
      setHasMore(result.hasMore);
      
      if (result.lastVisible) {
        setLastDocs(prev => new Map(prev).set(page, result.lastVisible));
      }
    } catch (error) {
      console.error(error);
      showToast.error("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [lastDocs]);

  // Búsqueda global
  const searchInscripciones = useCallback(async (query: string, type: "cedula" | "nombre") => {
    if (!query.trim()) {
      setIsSearching(false);
      await refreshInscripciones();
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    
    try {
      const allInscripciones = await getCollection("estudiantes_inscritos") as InscripcionSeccion[];
      
      // Filtrar basado en los datos de estudiantes
      const filtered = allInscripciones.filter((inscripcion) => {
        const estudiante = estudiantesData.find(e => e.id === inscripcion.id_estudiante);
        if (!estudiante) return false;
        
        if (type === "cedula") {
          return estudiante.cedula?.toString().includes(query);
        } else {
          const fullName = `${estudiante.nombres || ""} ${estudiante.apellidos || ""}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        }
      });
      
      setInscripciones(filtered);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      showToast.error("Error al buscar inscripciones");
    } finally {
      setIsLoading(false);
    }
  }, [estudiantesData]);

  // Efecto inicial
  useEffect(() => {
    if (user?.uid) {
      getTotalCount();
      getInscripciones(1);
    }
  }, [user?.uid]);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && estudiantesData.length > 0) {
        searchInscripciones(searchQuery, searchType);
      } else if (isSearching) {
        setIsSearching(false);
        refreshInscripciones();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType, estudiantesData]);

  // Navegación de páginas
  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    if (page < currentPage) {
      setLastDocs(new Map());
      setCurrentPage(1);
      await loadPagesToPage(page);
    } else {
      setCurrentPage(page);
      await getInscripciones(page);
    }
  };

  const loadPagesToPage = async (targetPage: number) => {
    const path = "estudiantes_inscritos";
    setIsLoading(true);
    
    try {
      let currentLastDoc: any = undefined;
      const newLastDocs = new Map<number, any>();
      
      for (let p = 1; p <= targetPage; p++) {
        const result = await getCollectionPaginated(
          path,
          PAGE_SIZE,
          currentLastDoc
        );
        
        if (result.lastVisible) {
          newLastDocs.set(p, result.lastVisible);
          currentLastDoc = result.lastVisible;
        }
        
        if (p === targetPage) {
          setInscripciones(result.docs as InscripcionSeccion[]);
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
  const refreshInscripciones = async () => {
    await getTotalCount();
    setLastDocs(new Map());
    setCurrentPage(1);
    await getInscripciones(1);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refreshInscripciones();
  };

  const deleteInscripcion = async (inscripcion: InscripcionSeccion) => {
    const path = `estudiantes_inscritos/${inscripcion.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("La inscripción fue eliminada exitosamente");
      if (isSearching) {
        await searchInscripciones(searchQuery, searchType);
      } else {
        await refreshInscripciones();
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
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Inscripción de Estudiantes</CardTitle>
            <InscribirEstudiante getInscripciones={refreshInscripciones}>
              <Button variant="outline">
                Inscribir Estudiantes
                <ClipboardEdit className="ml-2 w-5" />
              </Button>
            </InscribirEstudiante>
          </div>
          <CardDescription>
            <div className="flex items-center mt-4 gap-4">
              <Select
                value={searchType}
                onValueChange={(value: "cedula" | "nombre") => setSearchType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Buscar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cedula">Cédula</SelectItem>
                  <SelectItem value="nombre">Nombre</SelectItem>
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
                <>Resultados de búsqueda: {inscripciones.length} inscripción(es) encontrada(s)</>
              ) : (
                <>
                  Mostrando {inscripciones.length} de {totalInscripciones} inscripciones
                  {totalPages > 0 && ` • Página ${currentPage} de ${totalPages}`}
                </>
              )}
            </p>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TableViewInscritos
            deleteInscripcion={deleteInscripcion}
            getInscripciones={refreshInscripciones}
            inscripciones={inscripciones}
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
    </>
  );
}
