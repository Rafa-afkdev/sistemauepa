/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import type { Representante } from "@/interfaces/representante.interface";
import { deleteDocument, getCollection, getCollectionCount, getCollectionPaginated } from "@/lib/data/firebase";
import { orderBy } from "firebase/firestore";
import { Search, UserPlus2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";


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
import { CreateUpdateRepresentante } from "./create-update-representante.form";
import { TableRepresentanteView } from "./table-view-representante";

const PAGE_SIZE = 10;

const Representantes = () => {
  const { user } = useUser();
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"cedula" | "nombres">("cedula");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRepresentantes, setTotalRepresentantes] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const lastDocsRef = useRef<Map<number, any>>(new Map());

  const totalPages = Math.ceil(totalRepresentantes / PAGE_SIZE);

  const getTotalCount = useCallback(async () => {
    try {
      const count = await getCollectionCount("representantes");
      setTotalRepresentantes(count);
    } catch (error) {
      console.error("Error obteniendo conteo:", error);
    }
  }, []);

  const loadPage = useCallback(async (targetPage: number, forceReload: boolean = false) => {
    const path = "representantes";
    const queryConstraints = [orderBy("cedula", "asc")];
    setIsLoading(true);
    
    try {
      if (targetPage === 1) {
        lastDocsRef.current = new Map();
        const result = await getCollectionPaginated(path, PAGE_SIZE, undefined, queryConstraints);
        setRepresentantes(result.docs as Representante[]);
        setHasMore(result.hasMore);
        if (result.lastVisible) {
          lastDocsRef.current.set(1, result.lastVisible);
        }
        setCurrentPage(1);
        return;
      }
      
      const cachedLastDoc = lastDocsRef.current.get(targetPage - 1);
      
      if (cachedLastDoc && !forceReload) {
        const result = await getCollectionPaginated(path, PAGE_SIZE, cachedLastDoc, queryConstraints);
        setRepresentantes(result.docs as Representante[]);
        setHasMore(result.hasMore);
        if (result.lastVisible) {
          lastDocsRef.current.set(targetPage, result.lastVisible);
        }
        setCurrentPage(targetPage);
      } else {
        lastDocsRef.current = new Map();
        let currentLastDoc: any = undefined;
        
        for (let p = 1; p <= targetPage; p++) {
          const result = await getCollectionPaginated(path, PAGE_SIZE, currentLastDoc, queryConstraints);
          
          if (result.lastVisible) {
            lastDocsRef.current.set(p, result.lastVisible);
            currentLastDoc = result.lastVisible;
          }
          
          if (p === targetPage) {
            setRepresentantes(result.docs as Representante[]);
            setHasMore(result.hasMore);
          }
        }
        
        setCurrentPage(targetPage);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchRepresentantes = useCallback(async (query: string, type: "cedula" | "nombres") => {
    if (!query.trim()) {
      setIsSearching(false);
      await loadPage(1, true);
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    
    try {
      const allRepresentantes = await getCollection("representantes", [orderBy("cedula", "asc")]) as Representante[];
      
      const filtered = allRepresentantes.filter((rep) => {
        if (type === "cedula") {
          return rep.cedula.toString().includes(query);
        } else {
          const fullName = `${rep.nombres} ${rep.apellidos}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        }
      });
      
      setRepresentantes(filtered);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      showToast.error("Error al buscar representantes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      getTotalCount();
      loadPage(1, true);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchRepresentantes(searchQuery, searchType);
      } else if (isSearching) {
        setIsSearching(false);
        loadPage(1, true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    await loadPage(page, false);
  };

  const refreshRepresentantes = async (keepCurrentPage: boolean = false) => {
    await getTotalCount();
    
    if (keepCurrentPage && currentPage > 0) {
      await loadPage(currentPage, true);
    } else {
      await loadPage(1, true);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refreshRepresentantes();
  };

  const deleteRepresentante = async (representante: Representante) => {
    const path = `representantes/${representante.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      showToast.success("El representante fue eliminado exitosamente");
      if (isSearching) {
        await searchRepresentantes(searchQuery, searchType);
      } else {
        await refreshRepresentantes();
      }
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

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
        <CardTitle className="text-2xl">Representantes</CardTitle>
        <CreateUpdateRepresentante getRepresentantes={() => refreshRepresentantes(true)}>
            <Button variant="outline">
              Agregar Representante
              <UserPlus2 className="ml-2 w-5" />
            </Button>
          </CreateUpdateRepresentante>
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
              <>Resultados de búsqueda: {representantes.length} representante(s) encontrado(s)</>
            ) : (
              <>
                Mostrando {representantes.length} de {totalRepresentantes} representantes
                {totalPages > 0 && ` • Página ${currentPage} de ${totalPages}`}
              </>
            )}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TableRepresentanteView
          deleteRepresentante={deleteRepresentante}
          getRepresentantes={() => refreshRepresentantes(true)}
          representantes={representantes}
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

export default Representantes;
