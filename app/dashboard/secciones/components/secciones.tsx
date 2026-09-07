/* eslint-disable @typescript-eslint/no-explicit-any */
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import type { Secciones } from "@/interfaces/secciones.interface";
import type { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { deleteDocument, getCollection } from "@/lib/data/firebase";
import { orderBy } from "firebase/firestore";
import { ClipboardEdit, Search, X } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateUpdateSecciones } from "./create-update-secciones";
import { TableSeccionView } from "./table-view-secciones";

const PAGE_SIZE = 10;

const Secciones = () => {
  const { user } = useUser();
  const [rawSecciones, setRawSecciones] = useState<Secciones[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"grado" | "seccion" | "periodo">("grado");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cargar periodos escolares
  const fetchPeriodos = useCallback(async () => {
    try {
      const data = (await getCollection("periodos_escolares")) as PeriodosEscolares[];
      setPeriodos(data);
    } catch (err) {
      console.error("Error al cargar periodos:", err);
    }
  }, []);

  // Cargar secciones
  const fetchSecciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = (await getCollection("secciones", [
        orderBy("grado_año", "asc"),
      ])) as Secciones[];
      setRawSecciones(data);
    } catch (error) {
      console.error(error);
      showToast.error("Ocurrió un error al cargar las secciones.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchPeriodos();
      fetchSecciones();
    }
  }, [user?.uid, fetchPeriodos, fetchSecciones]);

  // Mapa de periodos para búsqueda y visualización
  const periodosMap = useMemo(() => {
    const map: Record<string, string> = {};
    periodos.forEach((p) => {
      if (p.id) map[p.id] = p.periodo;
    });
    return map;
  }, [periodos]);

  // Periodos activos
  const periodosActivos = useMemo(() => {
    return periodos
      .filter((p) => (p.status || "").toUpperCase() === "ACTIVO")
      .slice()
      .sort((a, b) => (b.periodo || "").localeCompare(a.periodo || "", undefined, { numeric: true }));
  }, [periodos]);

  // Otros periodos
  const periodosOtros = useMemo(() => {
    return periodos
      .filter((p) => (p.status || "").toUpperCase() !== "ACTIVO")
      .slice()
      .sort((a, b) => (b.periodo || "").localeCompare(a.periodo || "", undefined, { numeric: true }));
  }, [periodos]);

  // Filtrado de secciones por Periodo Escolar y búsqueda por texto
  const filteredSecciones = useMemo(() => {
    let result = rawSecciones;

    // 1. Filtrar por periodo escolar seleccionado
    if (selectedPeriodo && selectedPeriodo !== "all") {
      result = result.filter((s) => s.id_periodo_escolar === selectedPeriodo);
    }

    // 2. Filtrar por texto de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((seccion) => {
        if (searchType === "grado") {
          const gradoCompleto = `${seccion.grado_año} ${seccion.nivel_educativo}`.toLowerCase();
          return gradoCompleto.includes(q);
        } else if (searchType === "seccion") {
          return (seccion.seccion || "").toLowerCase().includes(q);
        } else if (searchType === "periodo") {
          const nombrePeriodo = (periodosMap[seccion.id_periodo_escolar] || seccion.id_periodo_escolar || "").toLowerCase();
          return nombrePeriodo.includes(q);
        }
        return true;
      });
    }

    return result;
  }, [rawSecciones, selectedPeriodo, searchQuery, searchType, periodosMap]);

  const totalSecciones = filteredSecciones.length;
  const totalPages = Math.max(1, Math.ceil(totalSecciones / PAGE_SIZE));

  // Secciones paginadas para la vista actual
  const paginatedSecciones = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSecciones.slice(start, start + PAGE_SIZE);
  }, [filteredSecciones, currentPage]);

  // Ajustar página si la actual excede el nuevo total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const deleteSeccion = async (seccion: Secciones) => {
    const path = `secciones/${seccion.id}`;
    setIsLoading(true);

    try {
      await deleteDocument(path);
      showToast.success("La sección fue eliminada exitosamente");
      await fetchSecciones();
    } catch (error: any) {
      showToast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar números de página para la paginación
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
            <CreateUpdateSecciones getSecciones={fetchSecciones}>
              <Button variant="outline">
                Crear Nueva Sección
                <ClipboardEdit className="ml-2 w-5" />
              </Button>
            </CreateUpdateSecciones>
          </div>
          <CardDescription>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center mt-4 gap-3 sm:gap-4">
              {/* Selector de Periodo Escolar */}
              <div className="w-full sm:w-[220px]">
                <Select
                  value={selectedPeriodo}
                  onValueChange={(value) => {
                    setSelectedPeriodo(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Periodo Escolar" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value="all">Todos los períodos</SelectItem>
                    {periodosActivos.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Activo</SelectLabel>
                        {periodosActivos.map((periodo) => (
                          <SelectItem key={periodo.id} value={periodo.id!}>
                            {periodo.periodo} (Activo)
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {periodosOtros.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Otros períodos</SelectLabel>
                        {periodosOtros.map((periodo) => (
                          <SelectItem key={periodo.id} value={periodo.id!}>
                            {periodo.periodo}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de Tipo de Búsqueda */}
              <div className="w-full sm:w-[170px]">
                <Select
                  value={searchType}
                  onValueChange={(value: "grado" | "seccion" | "periodo") => setSearchType(value)}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Buscar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grado">Grado/Año</SelectItem>
                    <SelectItem value="seccion">Sección</SelectItem>
                    <SelectItem value="periodo">Periodo Escolar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Input de búsqueda */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder={
                    searchType === "grado"
                      ? "Buscar por grado/año..."
                      : searchType === "seccion"
                      ? "Buscar por sección (A, B, C...)..."
                      : "Buscar por período escolar..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-10 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              Mostrando {paginatedSecciones.length} de {totalSecciones} secciones
              {selectedPeriodo !== "all" && periodosMap[selectedPeriodo] ? ` • Periodo ${periodosMap[selectedPeriodo]}` : ""}
              {searchQuery.trim() ? ` • Filtrado por "${searchQuery}"` : ""}
              {totalSecciones > 0 && ` • Página ${currentPage} de ${totalPages}`}
            </p>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TableSeccionView
            deleteSeccion={deleteSeccion}
            getSecciones={fetchSecciones}
            secciones={paginatedSecciones}
            isLoading={isLoading}
          />
        </CardContent>

        <CardFooter className="flex justify-center">
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={pageNum === currentPage}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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