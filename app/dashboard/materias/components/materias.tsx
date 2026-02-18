"use client";

import { Button } from "@/components/ui/button";
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
import { useUser } from "@/hooks/use-user";
import { Materias } from "@/interfaces/materias.interface";
import { deleteDocument, getCollection, getCollectionCount, getCollectionPaginated } from "@/lib/data/firebase";
import { orderBy } from "firebase/firestore";
import { NotebookPen, Search, X } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useCallback, useEffect, useState } from "react";
import { CreateUpdateMaterias } from "./create-update-materias.form";
import { TableMateriasView } from "./table-view-materias";

const PAGE_SIZE = 10;

const MateriasComponent = () => {
  const { user } = useUser();
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"nombre" | "codigo">("nombre");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalMaterias, setTotalMaterias] = useState<number>(0);
  const [lastDocs, setLastDocs] = useState<Map<number, any>>(new Map());
  const [hasMore, setHasMore] = useState<boolean>(true);

  const totalPages = Math.ceil(totalMaterias / PAGE_SIZE);

  // Obtener el conteo total
  const getTotalCount = useCallback(async () => {
    try {
      const count = await getCollectionCount("materias");
      setTotalMaterias(count);
    } catch (error) {
      console.error("Error obteniendo conteo:", error);
    }
  }, []);

  // Obtener materias con paginación
  const getMaterias = useCallback(async (page: number = 1) => {
    const path = "materias";
    const queryConstraints = [orderBy("nombre", "asc")];
    setIsLoading(true);
    
    try {
      const lastDoc = page > 1 ? lastDocs.get(page - 1) : undefined;
      
      const result = await getCollectionPaginated(
        path, 
        PAGE_SIZE, 
        lastDoc,
        queryConstraints
      );
      
      setMaterias(result.docs as Materias[]);
      setHasMore(result.hasMore);
      
      if (result.lastVisible) {
        setLastDocs(prev => new Map(prev).set(page, result.lastVisible));
      }
    } catch (error) {
      console.error(error);
      showToast.error("Ocurrió un error al cargar las materias");
    } finally {
      setIsLoading(false);
    }
  }, [lastDocs]);

  // Búsqueda global
  const searchMaterias = useCallback(async (query: string, type: "nombre" | "codigo") => {
    if (!query.trim()) {
      setIsSearching(false);
      await refreshMaterias();
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    
    try {
      const allMaterias = await getCollection("materias", [orderBy("nombre", "asc")]) as Materias[];
      
      const filtered = allMaterias.filter((materia) => {
        if (type === "codigo") {
          return (materia.codigo || "").toLowerCase().includes(query.toLowerCase());
        }
        return materia.nombre.toLowerCase().includes(query.toLowerCase());
      });
      
      setMaterias(filtered);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      showToast.error("Error al buscar materias");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto inicial
  useEffect(() => {
    if (user) {
      getTotalCount();
      getMaterias(1);
    }
  }, [user]);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchMaterias(searchQuery, searchType);
      } else if (isSearching) {
        setIsSearching(false);
        refreshMaterias();
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
      await getMaterias(page);
    }
  };

  const loadPagesToPage = async (targetPage: number) => {
    const path = "materias";
    const queryConstraints = [orderBy("nombre", "asc")];
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
          setMaterias(result.docs as Materias[]);
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
  const refreshMaterias = async () => {
    await getTotalCount();
    setLastDocs(new Map());
    setCurrentPage(1);
    await getMaterias(1);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refreshMaterias();
  };

  const deleteMateria = async (materia: Materias) => {
    if (!materia.id) return;
    const path = `materias/${materia.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      showToast.success("La materia fue eliminada exitosamente");
      if (isSearching) {
        await searchMaterias(searchQuery, searchType);
      } else {
        await refreshMaterias();
      }
    } catch (error: any) {
      showToast.error(error.message || "Error al eliminar la materia", {
        duration: 2500,
      });
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
          <CardTitle className="text-2xl">Materias</CardTitle>
          <CreateUpdateMaterias getMaterias={refreshMaterias}>
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
                placeholder={searchType === "nombre" ? "Buscar por nombre..." : "Buscar por código..."}
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
              <>Resultados de búsqueda: {materias.length} materia(s) encontrada(s)</>
            ) : (
              <>
                Mostrando {materias.length} de {totalMaterias} materias
                {totalPages > 0 && ` • Página ${currentPage} de ${totalPages}`}
              </>
            )}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TableMateriasView
          materias={materias}
          getMaterias={refreshMaterias}
          deleteMateria={deleteMateria}
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

export default MateriasComponent;
