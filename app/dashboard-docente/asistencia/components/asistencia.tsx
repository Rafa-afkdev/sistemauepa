"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { db } from "@/lib/data/firebase"; // Check import path if needed
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from "firebase/firestore";
import { CalendarIcon, ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added import
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";

export default function AsistenciaPage() {
  const { user } = useUser();
  const router = useRouter(); // Initialize router
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

  // Schedule-based day validation
  const [allowedDays, setAllowedDays] = useState<number[]>([]); // Days (1-5) when teacher teaches this section/subject
  const [scheduleData, setScheduleData] = useState<any[]>([]); // Full schedule data
  const [availableHours, setAvailableHours] = useState<string[]>([]); // Valid time blocks for selected date
  const [selectedHour, setSelectedHour] = useState<string>("");
    
  // Default to current time
  const [inputTime, setInputTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // "HH:mm"
  });
  const [timeError, setTimeError] = useState("");
  const [dateError, setDateError] = useState(""); // New state for date validation

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

  // 5. Load Allowed Days AND Schedule Data
  useEffect(() => {
    if (!seccionSeleccionada || !materiaSeleccionada || !periodoSeleccionado || !user) {
        setAllowedDays([]);
        setScheduleData([]);
        return;
    }

    const cargarHorario = async () => {
        try {
            const seccionObj = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
            if (!seccionObj) return;

            // Query schedule for this teacher, subject, section, and period
            const qSchedule = query(
                collection(db, "horarios_clase"),
                where("id_docente", "==", user.uid),
                where("id_materia", "==", materiaSeleccionada),
                where("id_seccion", "==", seccionObj.id),
                where("id_periodo_escolar", "==", periodoSeleccionado)
            );

            const snapshot = await getDocs(qSchedule);
            const data = snapshot.docs.map(doc => doc.data());
            const days = [...new Set(data.map(d => d.dia as number))];
            
            setScheduleData(data);
            setAllowedDays(days.sort());

        } catch (error) {
            console.error("Error loading schedule:", error);
            setAllowedDays([]);
            setScheduleData([]);
        }
    };

    cargarHorario();
  }, [seccionSeleccionada, materiaSeleccionada, periodoSeleccionado, user, seccionesDisponibles]);

  // 5b. Time Validation & Input Handling
  useEffect(() => {
    if (!materiaSeleccionada || !date) {
        setAvailableHours([]);
        setDateError("");
        setSelectedHour("");
        return;
    }

    // Check if date is allowed
    if (allowedDays.length > 0) {
        const day = date.getDay();
        // Convert Sunday(0)...Saturday(6) to match allowedDays (1=Mon...5=Fri)
        // If allowedDays includes day, it's valid.
        if (!allowedDays.includes(day)) {
             setDateError("La fecha seleccionada no corresponde a los días de clase permitidos.");
             setAvailableHours([]);
             setSelectedHour(""); // Clear selected hour if date is invalid
             // If date is invalid, we should arguably clear students/attendance too, 
             // but let's handle that in the student loading effect to be consistent.
             return;
        }
    }
    
    setDateError("");

    if (scheduleData.length === 0) {
         setAvailableHours([]);
         return;
    }

    const dayOfWeek = date.getDay();
    const dailySchedule = scheduleData.filter(h => h.dia === dayOfWeek);

    // Create readable time options
    const hours = dailySchedule.map(h => `${h.hora_inicio} - ${h.hora_fin}`).sort();
    setAvailableHours(hours);
    
    // Reset specific time states
    setSelectedHour(""); 
    // Do not reset inputTime on date change, keep user preference or current time
    setTimeError("");
    
  }, [date, scheduleData, materiaSeleccionada, allowedDays]);

  // Effect to check time validity whenever inputTime or schedule changes (or available hours)
  useEffect(() => {
      // If no input time, clear selectedHour
      if (!inputTime) {
          setSelectedHour("");
          setTimeError("");
          return;
      }

      if (!date || scheduleData.length === 0) return;

      const dayOfWeek = date.getDay();
      const dailySchedule = scheduleData.filter(h => h.dia === dayOfWeek);
      
      // If no schedule for this day
      if (dailySchedule.length === 0) {
          setSelectedHour("");
          // We can optionally show error here, or rely on allowedDays disabling dates
          return;
      }

      const block = dailySchedule.find(h => inputTime >= h.hora_inicio && inputTime <= h.hora_fin);

      if (block) {
          setSelectedHour(`${block.hora_inicio} - ${block.hora_fin}`);
          setTimeError("");
      } else {
          setSelectedHour("");
          setTimeError("Hora fuera del rango de clase");
      }
  }, [inputTime, date, scheduleData]);

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputTime(e.target.value);
  };

  // 6. Load Students AND Existing Attendance
  useEffect(() => {
     if (!seccionSeleccionada || !date || !materiaSeleccionada || dateError || timeError) {
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
             
             // Check if hour is selected OR input time is provided
             // If we have no selectedHour (no block match) but we have inputTime, we allow loading (off-schedule)
             if (!selectedHour && !inputTime && availableHours.length > 0) {
                 // Only block if we have potential hours but user hasn't typed anything or selected anything
                 setEstudiantes([]);
                 setAsistencia({});
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

             // Modified Query: Query only by DATE to use default single-field index
             // We filter by Section and Subject in memory to avoid ANY composite index requirements.
             const qAssist = query(
                 collection(db, "asistencias"),
                 where("fecha", ">=", Timestamp.fromDate(startOfDay)),
                 where("fecha", "<=", Timestamp.fromDate(endOfDay))
             );
             
             const assistSnap = await getDocs(qAssist);
                          // Client-side Filter for Section and Subject ONLY.
              // We intentionally ignore 'hora' here to enforce the rule:
              // "Only one attendance record per Section + Subject + Date".
              // If a record exists for 8:00 AM, and user selects 10:00 AM, we load the 8:00 AM record.
              // This prevents creating duplicates effectively.
              const matchingDocs = assistSnap.docs.filter(doc => {
                  const d = doc.data();
                  return d.id_seccion === seccionObj.id && d.id_materia === materiaSeleccionada;
              });
              
              const initialAsistencia: any = {};
              
              if (matchingDocs.length > 0) {
                  // Found existing record
                  const docData = matchingDocs[0];
                  setExistingAttendanceId(docData.id);
                  const data = docData.data();
                  
                  // Optional: Update selectedHour to match the existing record if we want to show "This is the block you registered"
                  if (data.hora && availableHours.includes(data.hora)) {
                      setSelectedHour(data.hora);
                  }

                  // Map existing data
                  data.estudiantes.forEach((item: any) => {
                      initialAsistencia[item.id_estudiante] = { 
                          estado: item.estado, 
                          observacion: item.observacion || "" 
                      };
                  });
                  
                  // Ensure new students default to P
                  estudiantesData.forEach(est => {
                      if (!initialAsistencia[est.id]) {
                          initialAsistencia[est.id] = { estado: "P", observacion: "" };
                      }
                  });
                  
                  // Notify user
                  // showToast.info("Cargando asistencia existente para este día."); 
                  // (Commented out to avoid spamming on every date change, but logic stands)

              } else {
                  // No existing record - DEFAULT ALL TO 'P'
                  setExistingAttendanceId(null);
                  estudiantesData.forEach(est => {
                      initialAsistencia[est.id] = { estado: "P", observacion: "" }; // Default Presente
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
  }, [seccionSeleccionada, seccionesDisponibles, date, materiaSeleccionada, dateError, timeError]);


  const handleAttendanceChange = (studentId: string, isChecked: boolean) => {
      setAsistencia(prev => ({
          ...prev,
          [studentId]: {
              ...prev[studentId],
              estado: isChecked ? "P" : "A" // Checked = P, Unchecked = A
          }
      }));
  };
  
  const handleObservationChange = (studentId: string, value: string) => {
      setAsistencia(prev => ({
          ...prev,
          [studentId]: {
              ...prev[studentId],
              observacion: value
          }
      }));
  };

  const handleSave = async () => {
      // Add explicit dateError/timeError checks to prevent saving invalid states
      if (!seccionSeleccionada || !date || estudiantes.length === 0 || !user || !materiaSeleccionada || dateError || timeError) {
          showToast.error("Por favor corrija los errores de fecha u hora antes de guardar.");
          return;
      }
      
      try {
          setSaving(true);
          const seccionObj = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
          
          const asistenciaData = {
              id_seccion: seccionObj.id,
              id_periodo: periodoSeleccionado,
              id_materia: materiaSeleccionada, // Include Subject ID
              hora: selectedHour || inputTime, // Include Selected Hour/Block OR Input Time if off-schedule
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
          
          router.push("/dashboard-docente"); // Redirect after save
          
          
      } catch (error) {
          console.error("Error saving attendance:", error);
          showToast.error("Error al guardar asistencia");
      } finally {
          setSaving(false);
      }
  };

  // Date validation: Only allow dates that match the teacher's schedule days
  const disableDate = (date: Date) => {
    if (allowedDays.length === 0) {
      // If no schedule is set, disable all dates
      return true;
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    // Convert to our format (1 = Monday, 2 = Tuesday, ..., 5 = Friday)
    // Sunday (0) -> not allowed, Saturday (6) -> not allowed
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true; // Disable weekends
    }
    
    const ourDayFormat = dayOfWeek; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri (matches our database)
    
    // Only enable if this day is in the allowed days
    return !allowedDays.includes(ourDayFormat);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard-docente">
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
                        onSelect={(newDate) => {
                            setDate(newDate);
                            if (newDate && scheduleData.length > 0) {
                                // Auto-correct time if needed
                                const day = newDate.getDay();
                                const daySchedule = scheduleData.filter(h => h.dia === day);
                                if (daySchedule.length > 0) {
                                    // Check if current inputTime is valid for new date
                                    const isValid = daySchedule.some(h => inputTime >= h.hora_inicio && inputTime <= h.hora_fin);
                                    if (!isValid) {
                                        // Auto-select first available block
                                        const first = daySchedule.sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio))[0];
                                        setInputTime(first.hora_inicio);
                                        // This ensures timeError is cleared and list loads
                                    }
                                }
                            }
                        }}
                        disabled={disableDate}
                        initialFocus
                        locale={es}
                        />
                    </PopoverContent>
                 </Popover>
                  {/* Show allowed days info */}
                  {allowedDays.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                          Días permitidos: {allowedDays.map(d => {
                              const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
                              return dayNames[d];
                          }).join(', ')}
                      </p>
                  )}
                  {dateError && (
                      <p className="text-xs font-medium text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20">
                          {dateError}
                      </p>
                  )}
                  {allowedDays.length === 0 && materiaSeleccionada && (
                      <p className="text-xs text-amber-600 mt-1">
                          ⚠️ No hay horario asignado para esta materia y sección
                      </p>
                  )}
             </div>

             <div className="space-y-2">
                <Label>Hora de Asistencia</Label>
                <div className="flex flex-col gap-2">
                    <Input 
                        type="time" 
                        value={inputTime}
                        onChange={handleTimeInput}
                    />
                    {selectedHour && (
                        <p className="text-sm text-green-600 font-medium">
                            Bloque detectado: {selectedHour}
                        </p>
                    )}
                    {timeError && (
                         <p className="text-sm text-red-500">
                            {timeError}
                         </p>
                    )}
                    {availableHours.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                             {availableHours.map(range => (
                                 <div 
                                    key={range} 
                                    onClick={() => setInputTime(range.split(" - ")[0])}
                                    className="cursor-pointer bg-secondary px-2 py-1 rounded text-xs hover:bg-secondary/80 border transition-colors"
                                 >
                                     {range}
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
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
                            {estudiantes.map((estudiante, index) => (
                                <TableRow key={estudiante.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{estudiante.cedula}</TableCell>
                                    <TableCell>{estudiante.apellidos} {estudiante.nombres}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`attendance-${estudiante.id}`}
                                                checked={asistencia[estudiante.id]?.estado === "P"}
                                                onCheckedChange={(checked) => handleAttendanceChange(estudiante.id, checked as boolean)}
                                            />
                                            <label 
                                                htmlFor={`attendance-${estudiante.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Asistió
                                            </label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Observación (opcional)"
                                            value={asistencia[estudiante.id]?.observacion || ""}
                                            onChange={(e) => handleObservationChange(estudiante.id, e.target.value)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
            </CardContent>
            <CardFooter className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={saving || estudiantes.length === 0 || !!dateError || !!timeError} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Asistencia
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar guardado?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se registrará la asistencia para {estudiantes.length} estudiantes. ¿Está seguro de continuar?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            </CardFooter>
       </Card>
      )}

    </div>
  );
}
