/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import type { Secciones } from "@/interfaces/secciones.interface";
import { deleteDocument, getCollection, getCollectionCount, getCollectionPaginated } from "@/lib/data/firebase";
import { orderBy } from "firebase/firestore";
import { ClipboardEdit, Search, X } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useCallback, useEffect, useState } from "react";
import { CreateUpdateSecciones } from "./create-update-secciones";
import { TableSeccionView } from "./table-view-secciones";

const PAGE_SIZE = 10;

const Secciones = () => {
  const { user } = useUser();
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"grado" | "seccion">("grado");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalSecciones, setTotalSecciones] = useState<number>(0);
  const [lastDocs, setLastDocs] = useState<Map<number, any>>(new Map());
  const [hasMore, setHasMore] = useState<boolean>(true);

  const totalPages = Math.ceil(totalSecciones / PAGE_SIZE);

  // Obtener el conteo total
  const getTotalCount = useCallback(async () => {
    try {
      const count = await getCollectionCount("secciones");
      setTotalSecciones(count);
    } catch (error) {
      console.error("Error obteniendo conteo:", error);
    }
  }, []);

  // Obtener secciones con paginación
  const getSecciones = useCallback(async (page: number = 1) => {
    const path = "secciones";
    const queryConstraints = [orderBy("grado_año", "asc")];
    setIsLoading(true);
    
    try {
      const lastDoc = page > 1 ? lastDocs.get(page - 1) : undefined;
      
      const result = await getCollectionPaginated(
        path, 
        PAGE_SIZE, 
        lastDoc,
        queryConstraints
      );
      
      setSecciones(result.docs as Secciones[]);
      setHasMore(result.hasMore);
      
      if (result.lastVisible) {
        setLastDocs(prev => new Map(prev).set(page, result.lastVisible));
      }
    } catch (error) {
      console.error(error);
      showToast.error('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [lastDocs]);

  // Búsqueda global
  const searchSecciones = useCallback(async (query: string, type: "grado" | "seccion") => {
    if (!query.trim()) {
      setIsSearching(false);
      await refreshSecciones();
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    
    try {
      const allSecciones = await getCollection("secciones", [orderBy("grado_año", "asc")]) as Secciones[];
      
      const filtered = allSecciones.filter((seccion) => {
        if (type === "grado") {
          const gradoCompleto = `${seccion.grado_año} ${seccion.nivel_educativo}`.toLowerCase();
          return gradoCompleto.includes(query.toLowerCase());
        } else {
          return seccion.seccion.toLowerCase().includes(query.toLowerCase());
        }
      });
      
      setSecciones(filtered);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      showToast.error("Error al buscar secciones");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto inicial
  useEffect(() => {
    if (user?.uid) {
      getTotalCount();
      getSecciones(1);
    }
  }, [user?.uid]);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchSecciones(searchQuery, searchType);
      } else if (isSearching) {
        setIsSearching(false);
        refreshSecciones();
      }
    }, 300);

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
      await getSecciones(page);
    }
  };

  const loadPagesToPage = async (targetPage: number) => {
    const path = "secciones";
    const queryConstraints = [orderBy("grado_año", "asc")];
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
          setSecciones(result.docs as Secciones[]);
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
  const refreshSecciones = async () => {
    await getTotalCount();
    setLastDocs(new Map());
    setCurrentPage(1);
    await getSecciones(1);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refreshSecciones();
  };

  const deleteSeccion = async (seccion: Secciones) => {
    const path = `secciones/${seccion.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("La sección fue eliminada exitosamente");
      if (isSearching) {
        await searchSecciones(searchQuery, searchType);
      } else {
        await refreshSecciones();
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
            <CardTitle className="text-2xl">Secciones</CardTitle>
            <CreateUpdateSecciones getSecciones={refreshSecciones}>
              <Button variant="outline">
                Crear Nueva Sección
                <ClipboardEdit className="ml-2 w-5" />
              </Button>
            </CreateUpdateSecciones>
          </div>
          <CardDescription>
            <div className="flex items-center mt-4 gap-4">
              <Select
                value={searchType}
                onValueChange={(value: "grado" | "seccion") => setSearchType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Buscar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grado">Grado/Año</SelectItem>
                  <SelectItem value="seccion">Sección (A, B, C...)</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
                <Input
                  type="text"
                  placeholder={searchType === "grado" ? "Buscar por grado/año..." : "Buscar por sección..."}
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
                <>Resultados de búsqueda: {secciones.length} sección(es) encontrada(s)</>
              ) : (
                <>
                  Mostrando {secciones.length} de {totalSecciones} secciones
                  {totalPages > 0 && ` • Página ${currentPage} de ${totalPages}`}
                </>
              )}
            </p>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TableSeccionView
            deleteSeccion={deleteSeccion}
            getSecciones={refreshSecciones}
            secciones={secciones}
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
};

export default Secciones;