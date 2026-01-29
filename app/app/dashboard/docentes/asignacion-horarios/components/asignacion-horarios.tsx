"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useUser } from "@/hooks/use-user";
import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/data/firebase";
import { orderBy, Timestamp, where } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";
import { Fragment, useEffect, useState } from "react";

// Interfaces
import { HorarioClase } from "@/interfaces/horarios.interface";
import { AsignacionDocenteMateria, Materias } from "@/interfaces/materias.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { Secciones } from "@/interfaces/secciones.interface";
import { Docente } from "@/interfaces/users.interface";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, Plus, User as UserIcon, X } from "lucide-react";

const DAYS = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
];

const BLOCKS = Array.from({ length: 9 }, (_, i) => i + 1); // 9 bloques

export default function AsignacionHorarios() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [secciones, setSecciones] = useState<Secciones[]>([]);
  
  // Selection State
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>("");
  
  // Assignments & Schedule State
  const [asignaciones, setAsignaciones] = useState<AsignacionDocenteMateria[]>([]);
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);
  
  // UI State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{dia: number, bloque: number} | null>(null);
  const [selectedAsignacionId, setSelectedAsignacionId] = useState<string>("");
  const [selectedSeccionId, setSelectedSeccionId] = useState<string>(""); // Sub-selection from assignment
  const [horaInicio, setHoraInicio] = useState<string>("");
  const [horaFin, setHoraFin] = useState<string>("");

  // Initial Load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [docsData, persData, matsData, secsData] = await Promise.all([
          getCollection("users", [where("rol", "==", "docente")]),
          getCollection("periodos_escolares", [orderBy("createdAt", "desc")]),
          getCollection("materias"),
          getCollection("secciones"),
        ]);
        
        setDocentes(docsData as Docente[]);
        setPeriodos(persData as PeriodosEscolares[]);
        setMaterias(matsData as Materias[]);
        setSecciones(secsData as Secciones[]);
        
        // Auto-select active period
        const activePeriod = (persData as PeriodosEscolares[]).find(p => p.status === "ACTIVO");
        if (activePeriod) setSelectedPeriodoId(activePeriod.id!);
        
      } catch (error) {
        console.error(error);
        showToast.error("Error cargando datos iniciales");
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Fetch Teacher Data (Assignments & Schedule)
  useEffect(() => {
    if (!selectedDocenteId || !selectedPeriodoId) {
      setAsignaciones([]);
      setHorarios([]);
      return;
    }

    const loadTeacherData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Assignments
        const asigs = await getCollection("asignaciones_docente_materia", [
          where("docente_id", "==", selectedDocenteId),
          where("periodo_escolar_id", "==", selectedPeriodoId),
          where("estado", "==", "activa") // Solo activas
        ]);
        setAsignaciones(asigs as AsignacionDocenteMateria[]);

        // 2. Fetch Schedule
        const schedule = await getCollection("horarios_clase", [
          where("id_docente", "==", selectedDocenteId),
          where("id_periodo_escolar", "==", selectedPeriodoId),
        ]);
        setHorarios(schedule as HorarioClase[]);

      } catch (error) {
        console.error(error);
        showToast.error("Error cargando datos del docente");
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [selectedDocenteId, selectedPeriodoId]);

  // Handle Cell Click
  const handleCellClick = (dia: number, bloque: number) => {
    if (!selectedDocenteId || !selectedPeriodoId) return;
    
    // Check if cell is occupied
    const existing = horarios.find(h => h.dia === dia && h.bloque_horario === bloque);
    
    // Si existe, precargar valores (opcional, para edición futura)
    if (existing) {
       // Por ahora sobreescribimos
       // Podríamos cargar existing.hora_inicio en setHoraInicio, etc.
       setHoraInicio(existing.hora_inicio || "");
       setHoraFin(existing.hora_fin || "");
    } else {
       setHoraInicio("");
       setHoraFin("");
    }
    
    setSelectedCell({ dia, bloque });
    if (!existing) {
        setSelectedAsignacionId("");
        setSelectedSeccionId("");
    } else {
        // Pre-select if editing (basic)
        setSelectedAsignacionId(existing.id_asignacion);
        setSelectedSeccionId(existing.id_seccion);
    }
    setDialogOpen(true);
  };

  const handleSaveHorario = async () => {
    if (!selectedCell || !selectedAsignacionId || !selectedSeccionId || !horaInicio || !horaFin) {
       showToast.error("Complete todos los campos (Materia, Sección y Horas)");
       return;
    }
    
    setLoading(true);
    try {
        const asignacion = asignaciones.find(a => a.id === selectedAsignacionId);
        const materia = materias.find(m => m.id === asignacion?.materia_id);
        const seccion = secciones.find(s => s.id === selectedSeccionId);

        // Check for existing to replace or add
        const existingIndex = horarios.findIndex(h => h.dia === selectedCell.dia && h.bloque_horario === selectedCell.bloque);
        
        // Prepare Data
        const scheduleData: Partial<HorarioClase> = {
            id_docente: selectedDocenteId,
            id_periodo_escolar: selectedPeriodoId,
            dia: selectedCell.dia,
            bloque_horario: selectedCell.bloque,
            id_asignacion: selectedAsignacionId,
            id_materia: asignacion?.materia_id!,
            id_seccion: selectedSeccionId,
            nombre_materia: materia?.nombre,
            nombre_seccion: seccion ? `${seccion.grado_año}° ${seccion.seccion}` : "Sección desconocida",
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            updatedAt: Timestamp.now()
        };

        let newSchedule = [...horarios];

        if (existingIndex >= 0) {
            // Update
            const existingId = horarios[existingIndex].id;
            await updateDocument(`horarios_clase/${existingId}`, scheduleData);
            newSchedule[existingIndex] = { ...horarios[existingIndex], ...scheduleData  };
            showToast.success("Horario actualizado");
        } else {
            // Create
            scheduleData.createdAt = Timestamp.now();
            const docRef = await addDocument("horarios_clase", scheduleData);
            newSchedule.push({ ...scheduleData, id: docRef.id } as HorarioClase);
            showToast.success("Horario asignado");
        }
        
        setHorarios(newSchedule);
        setDialogOpen(false);

    } catch (error) {
        console.error(error);
        showToast.error("Error al guardar horario");
    } finally {
        setLoading(false);
    }
  };

  // ... (delete logic unchanged)

  // Helper to render cell content
  const renderCell = (dia: number, bloque: number) => {
     const entry = horarios.find(h => h.dia === dia && h.bloque_horario === bloque);
     
     if (entry) {
         return (
             <div className="h-full w-full p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer relative group flex flex-col justify-between"
                  onClick={() => handleCellClick(dia, bloque)}>
                 <div>
                    <div className="font-bold text-xs text-blue-800 break-words line-clamp-2">
                        {entry.nombre_materia || "Materia"}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px] bg-white border-blue-300 text-blue-700">
                        {entry.nombre_seccion}
                    </Badge>
                 </div>
                 
                 <div className="mt-1 text-[10px] text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.hora_inicio} - {entry.hora_fin}
                 </div>
                 
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        // handleDeleteBlock(entry.id!); // Use existing logic
                         if(confirm("¿Eliminar bloque de horario?")) {
                              setLoading(true);
                              deleteDocument(`horarios_clase/${entry.id}`).then(() => {
                                  setHorarios(prev => prev.filter(h => h.id !== entry.id));
                                  showToast.success("Bloque eliminado");
                                  setLoading(false);
                              });
                         }
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded-full transition-all"
                 >
                     <X className="w-3 h-3" />
                 </button>
             </div>
         );
     }
     
     return (
         <div 
            className="h-full w-full flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors"
            onClick={() => handleCellClick(dia, bloque)}
         >
             <Plus className="w-4 h-4 text-slate-300" />
         </div>
     );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* ... (Header & Selectors Unchanged) ... */}
      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                   <CardTitle>Asignación de Horarios</CardTitle>
                   <CardDescription>Gestione el horario semanal de clases por docente</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" /> Docente
                    </Label>
                    <Select value={selectedDocenteId} onValueChange={setSelectedDocenteId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un docente" />
                        </SelectTrigger>
                        <SelectContent>
                            {docentes.map(d => (
                                <SelectItem key={d.id} value={d.id}>
                                    {d.name} {d.apellidos}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Período Escolar
                    </Label>
                    <Select value={selectedPeriodoId} onValueChange={setSelectedPeriodoId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione período" />
                        </SelectTrigger>
                        <SelectContent>
                            {periodos.map(p => (
                                <SelectItem key={p.id} value={p.id!}>
                                    {p.periodo} {p.status === 'ACTIVO' && '(Activo)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            {selectedDocenteId && selectedPeriodoId ? (
               <div className="border rounded-lg overflow-hidden shadow-sm mt-6">
                   <div className="grid grid-cols-6 divide-x divide-y bg-white">
                       {/* Header Row */}
                       <div className="p-3 bg-slate-50 font-semibold text-center text-sm text-slate-600 flex items-center justify-center">
                           Bloque
                       </div>
                       {DAYS.map(d => (
                           <div key={d.id} className="p-3 bg-slate-50 font-semibold text-center text-sm text-slate-700">
                               {d.name}
                           </div>
                       ))}
                       
                       {/* Rows */}
                       {BLOCKS.map(bloque => (
                           <Fragment key={bloque}>
                               {/* Row Header Cell */}
                               <div key={`header-${bloque}`} className="p-3 bg-slate-50 font-medium text-center text-sm text-slate-500 flex items-center justify-center border-t">
                                   {bloque}°
                               </div>
                               
                               {/* Day Cells */}
                               {DAYS.map(day => (
                                   <div key={`${day.id}-${bloque}`} className="h-24 p-1 border-t relative">
                                       {renderCell(day.id, bloque)}
                                   </div>
                               ))}
                           </Fragment>
                       ))}
                   </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed rounded-lg bg-slate-50">
                    <Clock className="w-12 h-12 mb-3 opacity-50" />
                    <p>Seleccione un docente y un período para visualizar el horario</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                  <DialogTitle>Asignar Clase</DialogTitle>
                  <CardDescription>
                      {DAYS.find(d => d.id === selectedCell?.dia)?.name}, Bloque {selectedCell?.bloque}°
                  </CardDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                       <Label>Materia</Label>
                       <Select 
                          value={selectedAsignacionId} 
                          onValueChange={(val) => {
                              setSelectedAsignacionId(val);
                              setSelectedSeccionId(""); // Reset section
                          }}
                       >
                           <SelectTrigger>
                               <SelectValue placeholder="Seleccione una materia asignada" />
                           </SelectTrigger>
                           <SelectContent>
                               {asignaciones.length > 0 ? (
                                   asignaciones.map(a => {
                                       const mat = materias.find(m => m.id === a.materia_id);
                                       return (
                                           <SelectItem key={a.id} value={a.id!}>
                                               {mat?.nombre || "Sin Nombre"}
                                           </SelectItem>
                                       );
                                   })
                               ) : (
                                   <div className="p-2 text-sm text-center text-muted-foreground">
                                       No hay materias asignadas en este periodo
                                   </div>
                               )}
                           </SelectContent>
                       </Select>
                  </div>
                  
                  {selectedAsignacionId && (
                      <div className="space-y-2">
                          <Label>Sección</Label>
                          <Select value={selectedSeccionId} onValueChange={setSelectedSeccionId}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Seleccione la sección" />
                              </SelectTrigger>
                              <SelectContent>
                                  {(() => {
                                      const asignacion = asignaciones.find(a => a.id === selectedAsignacionId);
                                      if (!asignacion?.secciones_id) return null;
                                      
                                      return asignacion.secciones_id.map(secId => {
                                          const sec = secciones.find(s => s.id === secId);
                                          return (
                                              <SelectItem key={secId} value={secId}>
                                                  {sec ? `${sec.grado_año}° "${sec.seccion}"` : secId}
                                              </SelectItem>
                                          );
                                      });
                                  })()}
                              </SelectContent>
                          </Select>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Hora Inicio</Label>
                          <div className="relative">
                              <input 
                                  type="time" 
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  value={horaInicio}
                                  onChange={(e) => setHoraInicio(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label>Hora Fin</Label>
                          <div className="relative">
                              <input 
                                  type="time" 
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  value={horaFin}
                                  onChange={(e) => setHoraFin(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>
              </div>
              
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={handleSaveHorario} 
                    disabled={!selectedAsignacionId || !selectedSeccionId || !horaInicio || !horaFin || loading}
                  >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Guardar
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
