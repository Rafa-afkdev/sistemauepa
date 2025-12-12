"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Calendar, 
  BookOpen, 
  Users, 
  FileText,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CrearEvaluacionDialog } from "./crear-evaluacion-dialog";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

export function MisEvaluaciones() {
  const { user } = useUser();
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lapsoSeleccionado, setLapsoSeleccionado] = useState<string>("1");
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");

  // Datos de ejemplo (aquí conectarías con Firebase)
  useEffect(() => {
    loadEvaluaciones();
  }, [user]);

  const loadEvaluaciones = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    
    try {
      const evaluacionesRef = collection(db, 'evaluaciones');
      const q = query(
        evaluacionesRef,
        where('docente_id', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const evaluacionesSnapshot = await getDocs(q);
      
      // Cargar detalles de materias y secciones
      const evaluacionesConDetalles: EvaluacionConDetalles[] = [];
      
      for (const docSnap of evaluacionesSnapshot.docs) {
        const evaluacion = {
          id: docSnap.id,
          ...docSnap.data()
        } as EvaluacionConDetalles;
        
        // Obtener nombre de la materia
        if (evaluacion.materia_id) {
          try {
            const materiaDoc = await getDoc(doc(db, "materias", evaluacion.materia_id));
            if (materiaDoc.exists()) {
              evaluacion.materia_nombre = materiaDoc.data().nombre;
            }
          } catch (error) {
            console.error("Error al obtener materia:", error);
          }
        }
        
        // Obtener nombre de la sección
        if (evaluacion.seccion_id) {
          try {
            const seccionDoc = await getDoc(doc(db, "secciones", evaluacion.seccion_id));
            if (seccionDoc.exists()) {
              const seccionData = seccionDoc.data();
              evaluacion.seccion_nombre = `${seccionData.grado_año} ${seccionData.nivel_educativo} "${seccionData.seccion}"`;
            }
          } catch (error) {
            console.error("Error al obtener sección:", error);
          }
        }
        
        evaluacionesConDetalles.push(evaluacion);
      }
      
      console.log("Evaluaciones cargadas:", evaluacionesConDetalles);
      setEvaluaciones(evaluacionesConDetalles);
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      showToast.error("Error al cargar las evaluaciones");
      setEvaluaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar evaluaciones
  const evaluacionesFiltradas = evaluaciones.filter(
    (ev) => ev.lapsop_id === lapsoSeleccionado && 
    (materiaFiltro === "todas" || ev.materia_id === materiaFiltro)
  );

  // Obtener lista única de materias
  const materias = Array.from(
    new Set(evaluaciones.map((ev) => ev.materia_id).filter(Boolean))
  ).map((id) => {
    const evaluacion = evaluaciones.find(ev => ev.materia_id === id);
    return { id: id as string, nombre: evaluacion?.materia_nombre || `Materia ${id}` };
  });

  // Estadísticas por lapso
  const estadisticasLapso = {
    total: evaluacionesFiltradas.length,
    evaluadas: evaluacionesFiltradas.filter((ev) => ev.status === "EVALUADA").length,
    porEvaluar: evaluacionesFiltradas.filter((ev) => ev.status === "POR EVALUAR").length,
    ponderacionTotal: evaluacionesFiltradas.reduce((sum, ev) => {
      return sum + ev.criterios.reduce((criterioSum, c) => criterioSum + c.ponderacion, 0);
    }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y programa las evaluaciones de tus estudiantes
          </p>
        </div>
        <CrearEvaluacionDialog onEvaluacionCreada={loadEvaluaciones}>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Evaluación
          </Button>
        </CrearEvaluacionDialog>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.total}</div>
            <p className="text-xs text-muted-foreground">
              Lapso {lapsoSeleccionado}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.evaluadas}</div>
            <p className="text-xs text-muted-foreground">
              Completamente calificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Evaluar</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.porEvaluar}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes de calificar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ponderación Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasLapso.ponderacionTotal} pts</div>
            <p className="text-xs text-muted-foreground">
              Suma de todas las evaluaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Lapso</label>
            <Select
              value={lapsoSeleccionado}
              onValueChange={setLapsoSeleccionado}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Lapso 1</SelectItem>
                <SelectItem value="2">Lapso 2</SelectItem>
                <SelectItem value="3">Lapso 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Materia</label>
            <Select value={materiaFiltro} onValueChange={setMateriaFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las materias</SelectItem>
                {materias.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de evaluaciones */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando evaluaciones...</p>
            </CardContent>
          </Card>
        ) : evaluacionesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay evaluaciones</h3>
              <p className="text-muted-foreground mb-4">
                No tienes evaluaciones programadas para este lapso
              </p>
              <CrearEvaluacionDialog onEvaluacionCreada={loadEvaluaciones}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Evaluación
                </Button>
              </CrearEvaluacionDialog>
            </CardContent>
          </Card>
        ) : (
          evaluacionesFiltradas.map((evaluacion) => (
            <Card key={evaluacion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{evaluacion.nombre_evaluacion}</CardTitle>
                      <Badge 
                        variant="outline"
                        className={evaluacion.status === "EVALUADA" 
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-yellow-100 text-yellow-800 border-yellow-300"}
                      >
                        {evaluacion.status}
                      </Badge>
                    </div>
                    <CardDescription>ID: {evaluacion.id_evaluacion}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium capitalize">{evaluacion.tipo_evaluacion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(evaluacion.fecha), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nota Definitiva</p>
                    <p className="font-medium">{evaluacion.nota_definitiva} pts</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lapso</p>
                    <p className="font-medium">Lapso {evaluacion.lapsop_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Materia</p>
                    <p className="font-medium">{evaluacion.materia_nombre || evaluacion.materia_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sección</p>
                    <p className="font-medium">{evaluacion.seccion_nombre || evaluacion.seccion_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criterios</p>
                    <p className="font-medium">{evaluacion.criterios.length} criterios</p>
                  </div>
                </div>

                {/* Criterios de Evaluación */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Criterios de Evaluación:</p>
                  <div className="grid gap-2">
                    {evaluacion.criterios.map((criterio) => (
                      <div 
                        key={criterio.nro_criterio} 
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            #{criterio.nro_criterio}
                          </span>
                          <span className="text-sm">{criterio.nombre}</span>
                        </div>
                        <Badge variant="secondary">{criterio.ponderacion} pts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
