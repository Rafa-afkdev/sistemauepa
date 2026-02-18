"use client";

import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { HistorialCambioSeccion } from "@/interfaces/secciones.interface";
import { db } from "@/lib/data/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

// Componentes UI
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, History, Loader2 } from "lucide-react";

interface HistorialConEstudiante extends HistorialCambioSeccion {
  estudiante?: {
    nombres: string;
    apellidos: string;
    cedula: number;
  };
}

export default function HistorialCambioSeccionPage() {
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>("");
  const [historial, setHistorial] = useState<HistorialConEstudiante[]>([]);
  const [historialFiltrado, setHistorialFiltrado] = useState<HistorialConEstudiante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Cargar periodos escolares
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const periodosRef = collection(db, "periodos_escolares");
        const snapshot = await getDocs(periodosRef);
        const periodosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as { periodo: string; status: string })
        }));

        setPeriodos(periodosData);

        // Seleccionar el periodo activo por defecto
        const periodoActivo = periodosData.find(p => p.status === "ACTIVO");
        if (periodoActivo) {
          setPeriodoSeleccionado(periodoActivo.id);
        }

        setCargando(false);
      } catch (error) {
        console.error("Error al cargar periodos:", error);
        setCargando(false);
      }
    };

    cargarPeriodos();
  }, []);

  // Cargar historial cuando cambia el periodo
  useEffect(() => {
    const cargarHistorial = async () => {
      if (!periodoSeleccionado) {
        setHistorial([]);
        return;
      }

      try {
        setCargando(true);
        const historialRef = collection(db, "historial_cambios_seccion");
        const q = query(
          historialRef,
          where("id_periodo_escolar", "==", periodoSeleccionado)
        );
        const snapshot = await getDocs(q);

        const historialData: HistorialConEstudiante[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data() as HistorialCambioSeccion;
          
          // Cargar datos del estudiante
          let estudianteData = undefined;
          try {
            const estudianteDoc = await getDoc(doc(db, "estudiantes", data.id_estudiante));
            if (estudianteDoc.exists()) {
              const est = estudianteDoc.data() as Estudiantes;
              estudianteData = {
                nombres: est.nombres,
                apellidos: est.apellidos,
                cedula: est.cedula
              };
            }
          } catch (error) {
            console.error("Error al cargar estudiante:", error);
          }

          historialData.push({
            id: docSnapshot.id,
            ...data,
            estudiante: estudianteData
          });
        }

        // Ordenar por fecha de cambio (más reciente primero)
        historialData.sort((a, b) => {
          const fechaA = a.fecha_cambio?.toDate?.() || new Date(0);
          const fechaB = b.fecha_cambio?.toDate?.() || new Date(0);
          return fechaB.getTime() - fechaA.getTime();
        });

        setHistorial(historialData);
        setHistorialFiltrado(historialData);
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar historial:", error);
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [periodoSeleccionado]);

  // Filtrar por búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setHistorialFiltrado(historial);
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    const filtrado = historial.filter(item => {
      const nombreCompleto = `${item.estudiante?.apellidos || ""} ${item.estudiante?.nombres || ""}`.toLowerCase();
      const cedula = String(item.estudiante?.cedula || "");
      const seccionAnterior = item.seccion_anterior_nombre?.toLowerCase() || "";
      const seccionNueva = item.seccion_nueva_nombre?.toLowerCase() || "";
      
      return nombreCompleto.includes(busquedaLower) ||
             cedula.includes(busquedaLower) ||
             seccionAnterior.includes(busquedaLower) ||
             seccionNueva.includes(busquedaLower);
    });

    setHistorialFiltrado(filtrado);
  }, [busqueda, historial]);

  const formatearFecha = (fecha: any) => {
    if (!fecha) return "N/A";
    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Historial de Cambios de Sección</h1>
          <p className="text-muted-foreground">Registro histórico de todos los cambios de sección de estudiantes</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre por período escolar y busque por estudiante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selector de Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período Escolar</label>
              <Select
                value={periodoSeleccionado}
                onValueChange={setPeriodoSeleccionado}
                disabled={cargando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id}>
                      {periodo.periodo} {periodo.status === "ACTIVO" ? "✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Búsqueda */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por nombre, cédula o sección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loader */}
      {cargando && (
        <div className="flex justify-center my-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Tabla de Historial */}
      {!cargando && historialFiltrado.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Registros de Cambios ({historialFiltrado.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">N°</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Sección Anterior</TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Sección Nueva</TableHead>
                  <TableHead>Fecha del Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialFiltrado.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.estudiante?.cedula || "N/A"}</TableCell>
                    <TableCell>
                      {item.estudiante 
                        ? `${item.estudiante.apellidos}, ${item.estudiante.nombres}`
                        : <span className="text-muted-foreground">Estudiante no encontrado</span>
                      }
                    </TableCell>
                    <TableCell>
                      {(() => {
                        if (item.seccion_anterior_nombre === "NUEVO INGRESO") {
                          // Buscar si hay un retiro previo para este estudiante
                          const retiroPrevio = historialFiltrado
                            .slice(index + 1)
                            .find(h => 
                              h.id_estudiante === item.id_estudiante && 
                              h.seccion_nueva_nombre === "RETIRADO"
                            );
                          
                          if (retiroPrevio) {
                            // Extraer solo la sección del registro anterior
                            // asumimos que seccion_anterior_nombre es "Grado - Seccion"
                            return (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                RETIRADO ({retiroPrevio.seccion_anterior_nombre})
                              </Badge>
                            );
                          }
                        }
                        return (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {item.seccion_anterior_nombre}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {item.seccion_nueva_nombre}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatearFecha(item.fecha_cambio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sin resultados */}
      {!cargando && periodoSeleccionado && historialFiltrado.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {busqueda 
                  ? "No se encontraron registros que coincidan con la búsqueda."
                  : "No hay registros de cambios de sección para este período."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
