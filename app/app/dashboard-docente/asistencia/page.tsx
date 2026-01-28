"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/hooks/use-user";
import { db } from "@/lib/data/firebase"; // Check import path if needed
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from "firebase/firestore";
import { CalendarIcon, ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";

export default function AsistenciaPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // States for Selections
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [allSecciones, setAllSecciones] = useState<any[]>([]);
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([]);
  
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [nivelEducativoSeleccionado, setNivelEducativoSeleccionado] = useState("");
  const [gradoAnioSeleccionado, setGradoAnioSeleccionado] = useState("");
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Derived Options
  const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);
  const [gradosAnios, setGradosAnios] = useState<string[]>([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<any[]>([]);

  // Students and Attendance State
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [asistencia, setAsistencia] = useState<{ [key: string]: { estado: string; observacion: string } }>({});
  const [existingAttendanceId, setExistingAttendanceId] = useState<string | null>(null);

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

  // 2. Load Sections for Period
  useEffect(() => {
    if (!periodoSeleccionado) return;
    const cargarSecciones = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "secciones"), where("id_periodo_escolar", "==", periodoSeleccionado));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSecciones(data);
        
        // Reset
        setNivelEducativoSeleccionado("");
        setGradoAnioSeleccionado("");
        setSeccionSeleccionada("");
        setMateriaSeleccionada("");
        setEstudiantes([]);
        setAsistencia({});
      } catch (error) {
         console.error("Error loading sections:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarSecciones();
  }, [periodoSeleccionado]);

  // 3. Derived Filter Logic (Same as report)
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

  // 4. Load Subjects (Materias) for Selected Section & User
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

            // Fetch assignments for this teacher in this section
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
                setMateriaSeleccionada("");
                return;
            }

            // Fetch actual subject names
            const displayMaterias: { id: string; nombre: string }[] = [];
            for (const mId of materiaIds) {
                const mDoc = await getDoc(doc(db, "materias", mId));
                if (mDoc.exists()) {
                    displayMaterias.push({ id: mDoc.id, nombre: mDoc.data().nombre });
                }
            }
            
            setMaterias(displayMaterias);
            setMateriaSeleccionada(""); // Reset selection logic or auto-select if only 1? Let's leave clear.

        } catch (error) {
            console.error("Error loading subjects:", error);
            showToast.error("Error al cargar materias");
        } finally {
            setLoading(false);
        }
    };
    
    cargarMaterias();

  }, [seccionSeleccionada, periodoSeleccionado, user, seccionesDisponibles]);

  // 5. Load Students AND Existing Attendance
  useEffect(() => {
     if (!seccionSeleccionada || !date || !materiaSeleccionada) {
         setEstudiantes([]);
         return;
     }

     const cargarDatos = async () => {
         setLoading(true);
         try {
             // 1. Get Section Data
             const seccionObj = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
             if (!seccionObj || !seccionObj.estudiantes_ids || seccionObj.estudiantes_ids.length === 0) {
                 setEstudiantes([]);
                 setAsistencia({});
                 setExistingAttendanceId(null);
                 return;
             }

             // 2. Load Students
             const promises = seccionObj.estudiantes_ids.map(async (id: string) => {
                 const d = await getDoc(doc(db, "estudiantes", id));
                 if (d.exists()) return { id: d.id, ...d.data() };
                 return null;
             });

             const results = await Promise.all(promises);
             const estudiantesData: any[] = results.filter(e => e !== null);
             estudiantesData.sort((a, b) => parseInt(a.cedula) - parseInt(b.cedula));
             setEstudiantes(estudiantesData);

             // 3. Check for Existing Attendance for this Date/Section/Subject
             const startOfDay = new Date(date);
             startOfDay.setHours(0, 0, 0, 0);
             const endOfDay = new Date(date);
             endOfDay.setHours(23, 59, 59, 999);

             const qAssist = query(
                 collection(db, "asistencias"),
                 where("id_seccion", "==", seccionObj.id),
                 where("id_materia", "==", materiaSeleccionada), // check by subject
                 where("fecha", ">=", Timestamp.fromDate(startOfDay)),
                 where("fecha", "<=", Timestamp.fromDate(endOfDay))
             );
             
             const assistSnap = await getDocs(qAssist);
             
             const initialAsistencia: any = {};
             
             if (!assistSnap.empty) {
                 // Found existing record
                 const docData = assistSnap.docs[0];
                 setExistingAttendanceId(docData.id);
                 const data = docData.data();
                 
                 // Map existing data
                 data.estudiantes.forEach((item: any) => {
                     initialAsistencia[item.id_estudiante] = { 
                         estado: item.estado, 
                         observacion: item.observacion || "" 
                     };
                 });
                 
                 // Ensure any new students also have a default state
                 estudiantesData.forEach(est => {
                     if (!initialAsistencia[est.id]) {
                         initialAsistencia[est.id] = { estado: "P", observacion: "" };
                     }
                 });

             } else {
                 // No existing record
                 setExistingAttendanceId(null);
                 estudiantesData.forEach(est => {
                     initialAsistencia[est.id] = { estado: "P", observacion: "" };
                 });
             }
             
             setAsistencia(initialAsistencia);

         } catch (error) {
             console.error("Error loading data:", error);
             showToast.error("Error al cargar datos");
         } finally {
             setLoading(false);
         }
     };

     cargarDatos();
  }, [seccionSeleccionada, seccionesDisponibles, date, materiaSeleccionada]);


  const handleAttendanceChange = (studentId: string, field: 'estado' | 'observacion', value: string) => {
      setAsistencia(prev => ({
          ...prev,
          [studentId]: {
              ...prev[studentId],
              [field]: value
          }
      }));
  };

  const handleSave = async () => {
      if (!seccionSeleccionada || !date || estudiantes.length === 0 || !user || !materiaSeleccionada) return;
      
      try {
          setSaving(true);
          const seccionObj = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
          
          const asistenciaData = {
              id_seccion: seccionObj.id,
              id_periodo: periodoSeleccionado,
              id_materia: materiaSeleccionada, // Include Subject ID
              fecha: Timestamp.fromDate(date),
              user_id: user.uid,
              estudiantes: estudiantes.map(est => ({
                  id_estudiante: est.id,
                  estado: asistencia[est.id]?.estado || "P",
                  observacion: asistencia[est.id]?.observacion || ""
              })),
              updatedAt: Timestamp.now()
          };
          
          if (existingAttendanceId) {
              // Update
              await setDoc(doc(db, "asistencias", existingAttendanceId), { 
                  ...asistenciaData, 
                  createdAt: (await getDoc(doc(db, "asistencias", existingAttendanceId))).data()?.createdAt // Preserve creation
              }, { merge: true });
              showToast.success("Asistencia actualizada correctamente");
          } else {
              // Create
              await addDoc(collection(db, "asistencias"), {
                  ...asistenciaData,
                  createdAt: Timestamp.now()
              });
              showToast.success("Asistencia guardada correctamente");
          }
          
      } catch (error) {
          console.error("Error saving attendance:", error);
          showToast.error("Error al guardar asistencia");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/dashboard-docente">
            <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
            </Button>
        </Link>
        <h1 className="text-3xl font-bold">Registro de Asistencia</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Datos de la Clase</CardTitle>
            <CardDescription>Seleccione los datos para cargar la lista de estudiantes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {/* Same Filters Reuse - Ideally Componentize this */}
             <div className="space-y-2">
                <Label>Período Escolar</Label>
                <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.periodo} {p.status === "ACTIVO" ? "(Activo)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={nivelEducativoSeleccionado} onValueChange={setNivelEducativoSeleccionado} disabled={!periodoSeleccionado}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccione..." />
                   </SelectTrigger>
                   <SelectContent>
                     {nivelesEducativos.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>

             <div className="space-y-2">
                <Label>Grado/Año</Label>
                <Select value={gradoAnioSeleccionado} onValueChange={setGradoAnioSeleccionado} disabled={!nivelEducativoSeleccionado}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccione..." />
                   </SelectTrigger>
                   <SelectContent>
                     {gradosAnios.map((g) => <SelectItem key={g} value={g}>{g}°</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>

             <div className="space-y-2">
                <Label>Sección</Label>
                <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada} disabled={!gradoAnioSeleccionado}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccione..." />
                   </SelectTrigger>
                   <SelectContent>
                     {seccionesDisponibles.map((s) => <SelectItem key={s.id} value={s.seccion}>{s.seccion}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-2">
                <Label>Materia</Label>
                <Select value={materiaSeleccionada} onValueChange={setMateriaSeleccionada} disabled={!seccionSeleccionada}>
                   <SelectTrigger>
                     <SelectValue placeholder={materias.length === 0 && seccionSeleccionada ? "Sin materias asignadas" : "Seleccione..."} />
                   </SelectTrigger>
                   <SelectContent>
                     {materias.map((m) => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>

             <div className="space-y-2 flex flex-col pt-1">
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
                        />
                    </PopoverContent>
                 </Popover>
             </div>
        </CardContent>
      </Card>

      {/* Student List Table */}
      {estudiantes.length > 0 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Listado de Estudiantes</CardTitle>
                      <CardDescription>{estudiantes.length} estudiantes encontrados</CardDescription>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                      Guardar Asistencia
                  </Button>
              </CardHeader>
              <CardContent>
                  <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">N°</TableHead>
                                <TableHead className="w-[100px]">Cédula</TableHead>
                                <TableHead className="w-[300px]">Estudiante</TableHead>
                                <TableHead>Asistencia</TableHead>
                                <TableHead className="w-[200px]">Observación</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {estudiantes.map((est, index) => (
                                <TableRow key={est.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{est.cedula}</TableCell>
                                    <TableCell className="font-medium">{est.apellidos} {est.nombres}</TableCell>
                                    <TableCell>
                                        <RadioGroup 
                                            value={asistencia[est.id]?.estado || "P"} 
                                            onValueChange={(val) => handleAttendanceChange(est.id, 'estado', val)}
                                            className="flex items-center space-x-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="P" id={`p-${est.id}`} className="text-green-600 border-green-600 focus:ring-green-600" />
                                                <Label htmlFor={`p-${est.id}`} className="text-green-700 font-bold shrink-0">P</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="A" id={`a-${est.id}`} className="text-red-600 border-red-600 focus:ring-red-600" />
                                                <Label htmlFor={`a-${est.id}`} className="text-red-700 font-bold shrink-0">A</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="R" id={`r-${est.id}`} className="text-yellow-600 border-yellow-600 focus:ring-yellow-600" />
                                                <Label htmlFor={`r-${est.id}`} className="text-yellow-700 font-bold shrink-0">R</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="J" id={`j-${est.id}`} className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                                                <Label htmlFor={`j-${est.id}`} className="text-blue-700 font-bold shrink-0">J</Label>
                                            </div>
                                        </RadioGroup>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            placeholder="Opcional..."
                                            value={asistencia[est.id]?.observacion || ""}
                                            onChange={(e) => handleAttendanceChange(est.id, 'observacion', e.target.value)}
                                            className="h-8"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
