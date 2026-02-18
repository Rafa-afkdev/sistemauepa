"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/hooks/use-user";
import { db } from "@/lib/data/firebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { CalendarIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";

export default function ViewAttendance() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Filters
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [allSecciones, setAllSecciones] = useState<any[]>([]);
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([]);
  
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [nivelEducativoSeleccionado, setNivelEducativoSeleccionado] = useState("");
  const [gradoAnioSeleccionado, setGradoAnioSeleccionado] = useState("");
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");

  // State for Date
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Derived Options
  const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);
  const [gradosAnios, setGradosAnios] = useState<string[]>([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<any[]>([]);

  // Data
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  // const [classDates, setClassDates] = useState<Date[]>([]); // Unused for single day view

  // 1. Initial Data Load (Periodos)
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const q = collection(db, "periodos_escolares");
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as { periodo: string; status: string })
        }));
        setPeriodos(data);
        const activo = data.find(p => p.status === "ACTIVO");
        if (activo) setPeriodoSeleccionado(activo.id);
      } catch (error) {
        console.error("Error loading periods:", error);
      }
    };
    cargarPeriodos();
  }, []);

  // 2. Load Sections
  useEffect(() => {
    if (!periodoSeleccionado) return;
    const cargarSecciones = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "secciones"), where("id_periodo_escolar", "==", periodoSeleccionado));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSecciones(data);
        
        setNivelEducativoSeleccionado("");
        setGradoAnioSeleccionado("");
        setSeccionSeleccionada("");
        setMateriaSeleccionada("");
        setEstudiantes([]);
        setAttendanceRecords([]);
      } catch (error) {
         console.error("Error loading sections:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarSecciones();
  }, [periodoSeleccionado]);

  // 3. Filter Cascading Logic
  useEffect(() => {
    if (allSecciones.length > 0) {
      const niveles = [...new Set(allSecciones.map(s => s.nivel_educativo))];
      setNivelesEducativos(niveles);
    } else {
       setNivelesEducativos([]);
    }
  }, [allSecciones]);

  useEffect(() => {
    if (nivelEducativoSeleccionado && allSecciones.length > 0) {
      const grados = [...new Set(
        allSecciones
          .filter(s => s.nivel_educativo === nivelEducativoSeleccionado)
          .map(s => s.grado_año)
      )].sort((a, b) => parseInt(a) - parseInt(b));
      setGradosAnios(grados);
      setGradoAnioSeleccionado("");
    } else {
        setGradosAnios([]);
    }
  }, [nivelEducativoSeleccionado, allSecciones]);

  useEffect(() => {
    if (gradoAnioSeleccionado && nivelEducativoSeleccionado && allSecciones.length > 0) {
      const filtered = allSecciones.filter(
        s => s.nivel_educativo === nivelEducativoSeleccionado && s.grado_año === gradoAnioSeleccionado
      );
      setSeccionesDisponibles(filtered);
      setSeccionSeleccionada("");
    } else {
        setSeccionesDisponibles([]);
    }
  }, [gradoAnioSeleccionado, nivelEducativoSeleccionado, allSecciones]);

  // 4. Load Subjects
  useEffect(() => {
    if (!seccionSeleccionada || !periodoSeleccionado || !user) {
        setMaterias([]);
        setMateriaSeleccionada("");
        return;
    }

    const cargarMaterias = async () => {
        setLoading(true);
        try {
            const seccionObj = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
            if (!seccionObj) return;

            const qAssignments = query(
                collection(db, "asignaciones_docente_materia"),
                where("docente_id", "==", user.uid),
                where("periodo_escolar_id", "==", periodoSeleccionado),
                where("secciones_id", "array-contains", seccionObj.id),
                where("estado", "==", "activa")
            );

            const snapshot = await getDocs(qAssignments);
            const materiaIds = [...new Set(snapshot.docs.map(doc => doc.data().materia_id))];

            if (materiaIds.length === 0) {
                setMaterias([]);
                return;
            }

            const displayMaterias: { id: string; nombre: string }[] = [];
            for (const mId of materiaIds) {
                const mDoc = await getDoc(doc(db, "materias", mId));
                if (mDoc.exists()) {
                    displayMaterias.push({ id: mDoc.id, nombre: mDoc.data().nombre });
                }
            }
            setMaterias(displayMaterias);
            setMateriaSeleccionada("");
        } catch (error) {
            console.error("Error loading subjects:", error);
            showToast.error("Error al cargar materias");
        } finally {
            setLoading(false);
        }
    };
    cargarMaterias();
  }, [seccionSeleccionada, periodoSeleccionado, user, seccionesDisponibles]);

  // 5. Fetch Attendance Data - Auto Trigger
  useEffect(() => {
    if (seccionSeleccionada && materiaSeleccionada && date) {
        handleSearch();
    } else {
        setEstudiantes([]);
        setAttendanceRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionSeleccionada, materiaSeleccionada, date]);

  const handleSearch = async () => {
      if (!seccionSeleccionada || !materiaSeleccionada || !date) return;
      
      setFetchingData(true);
      try {
          // 1. Get Students
          const seccionObj = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
          if (!seccionObj || !seccionObj.estudiantes_ids) {
              setEstudiantes([]);
              setAttendanceRecords([]);
              setFetchingData(false);
              return;
          }

          const promises = seccionObj.estudiantes_ids.map(async (id: string) => {
              const d = await getDoc(doc(db, "estudiantes", id));
              if (d.exists()) return { id: d.id, ...d.data() };
              return null;
          });

          const results = await Promise.all(promises);
          const estudiantesData: any[] = results.filter(e => e !== null);
          estudiantesData.sort((a, b) => parseInt(a.cedula) - parseInt(b.cedula));
          setEstudiantes(estudiantesData);

          // 2. Get Attendance Records
          const qAsist = query(
              collection(db, "asistencias"),
              where("id_seccion", "==", seccionObj.id),
              where("id_materia", "==", materiaSeleccionada)
          );

          const snap = await getDocs(qAsist);
          
          const start = new Date(date);
          start.setHours(0,0,0,0);
          const end = new Date(date);
          end.setHours(23,59,59,999);

          const records = snap.docs
              .map(doc => {
                  const data = doc.data();
                  return {
                      id: doc.id,
                      ...data,
                      dateObj: data.fecha.toDate()
                  };
              })
              .filter(r => r.dateObj >= start && r.dateObj <= end); // Client-side Date Filter (Single Day)

          records.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
          
          setAttendanceRecords(records);
          // setClassDates(records.map(r => r.dateObj));

      } catch (error) {
          console.error("Error fetching data:", error);
          showToast.error("Error al buscar asistencias");
      } finally {
          setFetchingData(false);
      }
  };

  const getStatusIcon = (status: string) => {
      switch (status) {
          case 'P': return <span className="text-green-600 font-bold" title="Presente">P</span>;
          case 'A': return <span className="text-red-500 font-bold" title="Ausente">A</span>;
          case 'R': return <span className="text-yellow-500 font-bold" title="Retraso">R</span>;
          case 'J': return <span className="text-blue-500 font-bold" title="Justificado">J</span>;
          default: return "-";
      }
  };

  // Helper to get status for student in a specific record
  const getStudentStatus = (studentId: string, record: any) => {
      const studentRecord = record.estudiantes.find((e: any) => e.id_estudiante === studentId);
      return studentRecord ? studentRecord.estado : "-";
  };

  return (
    <div className="space-y-6 p-1">
        <h2 className="text-3xl font-bold tracking-tight">Historial de Asistencia</h2>
        
        <Card>
            <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
                <CardDescription>Seleccione los datos para visualizar la asistencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filters reused ... */}
                    
                    <div className="space-y-2">
                        <Label>Período Escolar</Label>
                        <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
                           <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                           <SelectContent>
                             {periodos.map((p) => <SelectItem key={p.id} value={p.id}>{p.periodo}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Nivel</Label>
                         <Select value={nivelEducativoSeleccionado} onValueChange={setNivelEducativoSeleccionado} disabled={nivelesEducativos.length === 0}>
                           <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                           <SelectContent>
                             {nivelesEducativos.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                         <Label>Grado/Año</Label>
                         <Select value={gradoAnioSeleccionado} onValueChange={setGradoAnioSeleccionado} disabled={gradosAnios.length === 0}>
                           <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                           <SelectContent>
                             {gradosAnios.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Sección</Label>
                        <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada} disabled={!gradoAnioSeleccionado}>
                           <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                           <SelectContent>
                             {seccionesDisponibles.map((s) => <SelectItem key={s.id} value={s.seccion}>{s.seccion}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Materia</Label>
                        <Select value={materiaSeleccionada} onValueChange={setMateriaSeleccionada} disabled={!seccionSeleccionada}>
                           <SelectTrigger><SelectValue placeholder={materias.length === 0 && seccionSeleccionada ? "Sin materias" : "Seleccione..."} /></SelectTrigger>
                           <SelectContent>
                             {materias.map((m) => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label className="mb-2">Fecha</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
        </Card>

        {estudiantes.length > 0 && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Reporte Diario: {date ? format(date, "PPP", { locale: es }) : ""}</CardTitle>
                        <CardDescription>
                            {attendanceRecords.length} bloques registrados
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="overflow-auto max-h-[600px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Estudiante</TableHead>
                                {attendanceRecords.map((record) => (
                                    <TableHead key={record.id} className="text-center min-w-[100px]">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold">{format(record.dateObj, "dd/MM")}</span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {record.hora || format(record.dateObj, "HH:mm")}
                                            </span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {estudiantes.map((est) => (
                                <TableRow key={est.id}>
                                    <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                                        {est.apellidos} {est.nombres}
                                    </TableCell>
                                    {attendanceRecords.map((record) => (
                                        <TableCell key={`${est.id}-${record.id}`} className="text-center p-2 border-r last:border-r-0">
                                            {getStatusIcon(getStudentStatus(est.id, record))}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                    {estudiantes.length === 0 && !fetchingData && (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron datos para la selección.
                        </div>
                    )}
                </CardContent>
            </Card>
        )}
    </div>
  );
}
