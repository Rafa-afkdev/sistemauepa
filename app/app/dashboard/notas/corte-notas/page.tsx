"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { Materias } from "@/interfaces/materias.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { generarCorteNotasPDF } from "@/utils/generateCorteNotasPDF";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FileDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CorteDeNotas } from "@/app/dashboard/notas/corte-notas/components/CorteDeNotas";
import { GradesChart } from "@/app/dashboard/notas/corte-notas/components/GradesChart";

interface Seccion {
  id: string;
  nombre: string;
  grado_año: string;
  seccion: string;
}

export default function CorteNotasPage() {
  const { user } = useUser();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluaciones[]>([]);
  const [notas, setNotas] = useState<NotasEvaluacion[]>([]);
  
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string>("");
  
  const [isLoadingSecciones, setIsLoadingSecciones] = useState(true);
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 1. Cargar secciones
  useEffect(() => {
    const loadSecciones = async () => {
      try {
        // En un escenario real, filtraríamos por las secciones asignadas al docente si no es admin
        // Por ahora cargamos todas
        const seccRef = collection(db, "secciones");
        const snapshot = await getDocs(seccRef);
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            nombre: `${doc.data().grado_año} "${doc.data().seccion}"`,
            grado_año: doc.data().grado_año,
            seccion: doc.data().seccion
        }));
        setSecciones(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch (error) {
        console.error("Error loading sections:", error);
      } finally {
        setIsLoadingSecciones(false);
      }
    };
    loadSecciones();
  }, []);

  // 2. Cargar estudiantes cuando cambia la sección
  useEffect(() => {
    if (!seccionSeleccionada) {
      setEstudiantes([]);
      setEstudianteSeleccionado("");
      return;
    }

    const loadEstudiantes = async () => {
      setIsLoadingEstudiantes(true);
      setEstudianteSeleccionado("");
      try {
        const inscripcionesRef = collection(db, "estudiantes_inscritos");
        const q = query(inscripcionesRef, where("id_seccion", "==", seccionSeleccionada), where("estado", "==", "activo"));
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(doc => doc.data().id_estudiante);

        if (ids.length > 0) {
            const estRef = collection(db, "estudiantes");
            // Firestore 'in' limitation is 10, so we might need batching if > 10
            // For simplicity assume fetching all and filtering or simpler batching
            // Let's do simple fetch for now as number of students in section is usually < 40 but > 10
            // Optimization: Fetch all active students directly or batch properly.
            // Using batching of 10 for safety
            const estudiantesLoaded: Estudiantes[] = [];
            for (let i = 0; i < ids.length; i += 10) {
                const chunk = ids.slice(i, i + 10);
                const qEst = query(estRef, where("__name__", "in", chunk));
                const snapEst = await getDocs(qEst);
                snapEst.docs.forEach(d => estudiantesLoaded.push({ id: d.id, ...d.data() } as Estudiantes));
            }
            setEstudiantes(estudiantesLoaded.sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
        } else {
            setEstudiantes([]);
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setIsLoadingEstudiantes(false);
      }
    };
    loadEstudiantes();
  }, [seccionSeleccionada]);

  // 3. Cargar materias, evaluaciones y notas cuando se selecciona estudiante
  useEffect(() => {
    if (!seccionSeleccionada || !estudianteSeleccionado) {
        setMaterias([]);
        setEvaluaciones([]);
        setNotas([]);
        return;
    }

    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const seccion = secciones.find(s => s.id === seccionSeleccionada);
            if (!seccion) return;

            // 3.1 Cargar materias del grado/año
            const materiasRef = collection(db, "materias");
            // Assuming 'grados_años' is an array in DB or singular string? 
            // Interface says `grados_años: string[]`.
            // We need to query where array-contains seccion.grado_año OR if data structure is different.
            // Let's assume array-contains for now based on interface
            const qMaterias = query(materiasRef, where("grados_años", "array-contains", seccion.grado_año));
            const snapMaterias = await getDocs(qMaterias);
            const materiasData = snapMaterias.docs.map(doc => ({ id: doc.id, ...doc.data() } as Materias));
            setMaterias(materiasData);

            // 3.2 Cargar evaluaciones de esas materias (y de esta seccion? Evaluaciones are usually per section)
            const evalRef = collection(db, "evaluaciones");
            const qEval = query(
                evalRef, 
                where("seccion_id", "==", seccionSeleccionada),
                where("status", "==", "EVALUADA") // Only evaluated ones? Maybe all? User said "Ver y generar" implies history.
            );
            const snapEval = await getDocs(qEval);
            const evaluacionesData = snapEval.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluaciones));
            setEvaluaciones(evaluacionesData);

            // 3.3 Cargar notas del estudiante
            const notasRef = collection(db, "notas_evaluaciones");
            const qNotas = query(notasRef, where("estudiante_id", "==", estudianteSeleccionado));
            const snapNotas = await getDocs(qNotas);
            const notasData = snapNotas.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotasEvaluacion));
            setNotas(notasData);

        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };
    loadData();
  }, [estudianteSeleccionado, seccionSeleccionada, secciones]);

  // Chart Data Preparation
  const chartData = materias.map(materia => {
    const materiaEvals = evaluaciones.filter(ev => ev.materia_id === materia.id);
    const materiaNotas = notas.filter(n => materiaEvals.some(ev => ev.id === n.evaluacion_id));
    
    // Calculate average
    // Only count evaluations that have a grade > 0 ? Or all? 
    // Average of grades present.
    const sum = materiaNotas.reduce((acc, curr) => acc + curr.nota_definitiva, 0);
    const count = materiaNotas.length;
    const average = count > 0 ? sum / count : 0;

    return {
        subject: materia.nombre,
        average: parseFloat(average.toFixed(2))
    };
  }).filter(d => d.average > 0); // Opcional: mostrar solo materias con notas

  const selectedStudent = estudiantes.find(e => e.id === estudianteSeleccionado);
  const selectedSection = secciones.find(s => s.id === seccionSeleccionada);

  const handlePrint = async () => {
    if (!selectedStudent || !selectedSection) return;
    setIsGeneratingPDF(true);
    try {
        await generarCorteNotasPDF({
            estudiante: selectedStudent,
            materias,
            evaluaciones,
            notas,
            seccionNombre: selectedSection.nombre
        });
        toast.success("PDF generado correctamente");
    } catch (error) {
        console.error("Error creating PDF", error);
        toast.error("Error al generar el PDF");
    } finally {
        setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Corte de Notas</h1>
           <p className="text-muted-foreground">Generación de reporte de calificaciones por estudiante</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-0 md:flex md:gap-4">
            <div className="w-full md:w-1/3">
                <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada} disabled={isLoadingSecciones}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Sección" />
                    </SelectTrigger>
                    <SelectContent>
                        {secciones.map((sec) => (
                            <SelectItem key={sec.id} value={sec.id}>
                                {sec.nombre}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full md:w-1/3">
                <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado} disabled={isLoadingEstudiantes || !seccionSeleccionada}>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingEstudiantes ? "Cargando estudiantes..." : "Seleccionar Estudiante"} />
                    </SelectTrigger>
                    <SelectContent>
                        {estudiantes.map((est) => (
                            <SelectItem key={est.id} value={est.id!}>
                                {est.apellidos}, {est.nombres}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="w-full md:w-1/3 flex items-center">
                 <Button 
                    variant="default" 
                    className="w-full"
                    disabled={!estudianteSeleccionado || isLoadingData || isGeneratingPDF}
                    onClick={handlePrint}
                 >
                    {isGeneratingPDF ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando PDF...
                        </>
                    ) : (
                        <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Imprimir Corte
                        </>
                    )}
                 </Button>
            </div>
        </CardContent>
      </Card>

      {isLoadingData ? (
        <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : estudianteSeleccionado && selectedStudent && selectedSection ? (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CorteDeNotas 
                        estudiante={selectedStudent}
                        materias={materias}
                        evaluaciones={evaluaciones}
                        notas={notas}
                        seccionNombre={selectedSection.nombre}
                    />
                </div>
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Rendimiento Académico</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GradesChart data={chartData} />
                            <div className="mt-4 text-sm text-muted-foreground text-center">
                                Promedio por Asignatura
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Selecciona una sección y un estudiante</p>
            <p className="text-sm">Para visualizar el corte de notas y generar el reporte.</p>
        </div>
      )}
    </div>
  );
}