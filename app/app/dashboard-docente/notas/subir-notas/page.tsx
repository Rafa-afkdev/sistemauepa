"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/use-user";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasCriterios, NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { db } from "@/lib/data/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { Check, ChevronLeft, ChevronsUpDown, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotasEstudiante {
  estudiante_id: string;
  notas_criterios: { [key: string]: number };
  nota_definitiva: number;
  observacion: string;
}

export default function SubirNotas() {
  const { user } = useUser();
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConDetalles[]>([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string>("");
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [notasEstudiantes, setNotasEstudiantes] = useState<{ [key: string]: NotasEstudiante }>({});
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(true);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false);
  const [dialogCompletarOpen, setDialogCompletarOpen] = useState(false);
  const [completandoEvaluacion, setCompletandoEvaluacion] = useState(false);
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  // Cargar evaluaciones pendientes del docente
  useEffect(() => {
    if (user?.uid) {
      loadEvaluacionesPendientes();
    }
  }, [user]);

  // Cargar estudiantes cuando se selecciona una evaluación
  useEffect(() => {
    if (evaluacionSeleccionada) {
      loadEstudiantes();
      loadNotasExistentes();
    } else {
      setEstudiantes([]);
      setNotasEstudiantes({});
    }
  }, [evaluacionSeleccionada]);

  const loadEvaluacionesPendientes = async () => {
    if (!user?.uid) return;

    setIsLoadingEvaluaciones(true);
    try {
      const evaluacionesRef = collection(db, "evaluaciones");
      const q = query(
        evaluacionesRef,
        where("docente_id", "==", user.uid),
        where("status", "==", "POR EVALUAR")
      );

      const snapshot = await getDocs(q);
      const evaluacionesData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as EvaluacionConDetalles;

          // Obtener nombre de materia
          if (data.materia_id) {
            try {
              const materiaDoc = await getDoc(doc(db, "materias", data.materia_id));
              if (materiaDoc.exists()) {
                data.materia_nombre = materiaDoc.data().nombre;
              }
            } catch (error) {
              console.error("Error al obtener materia:", error);
            }
          }

          // Obtener nombre de sección
          if (data.seccion_id) {
            try {
              const seccionDoc = await getDoc(doc(db, "secciones", data.seccion_id));
              if (seccionDoc.exists()) {
                const seccionData = seccionDoc.data();
                data.seccion_nombre = `${seccionData.grado_año} "${seccionData.seccion}"`;
              }
            } catch (error) {
              console.error("Error al obtener sección:", error);
            }
          }

          return data;
        })
      );

      setEvaluaciones(evaluacionesData);
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      showToast.error("Error al cargar evaluaciones pendientes");
    } finally {
      setIsLoadingEvaluaciones(false);
    }
  };

  const loadEstudiantes = async () => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion?.seccion_id) return;

    setIsLoadingEstudiantes(true);
    try {
      const estudiantesRef = collection(db, "estudiantes");
      const q = query(
        estudiantesRef,
        where("seccion_actual", "==", evaluacion.seccion_id),
        where("estado", "==", "activo")
      );

      const snapshot = await getDocs(q);
      const estudiantesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Estudiantes))
        .sort((a, b) => a.apellidos.localeCompare(b.apellidos));

      setEstudiantes(estudiantesData);

      // Inicializar notas vacías para cada estudiante
      const notasIniciales: { [key: string]: NotasEstudiante } = {};
      estudiantesData.forEach((est) => {
        if (est.id) {
          const notasCriterios: { [key: string]: number } = {};
          evaluacion.criterios.forEach((criterio) => {
            notasCriterios[criterio.nro_criterio] = 0;
          });
          notasIniciales[est.id] = {
            estudiante_id: est.id,
            notas_criterios: notasCriterios,
            nota_definitiva: 0,
            observacion: "",
          };
        }
      });
      setNotasEstudiantes(notasIniciales);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      showToast.error("Error al cargar estudiantes");
    } finally {
      setIsLoadingEstudiantes(false);
    }
  };

  const loadNotasExistentes = async () => {
    if (!evaluacionSeleccionada) return;

    try {
      const notasRef = collection(db, "notas_evaluaciones");
      const q = query(notasRef, where("evaluacion_id", "==", evaluacionSeleccionada));
      const snapshot = await getDocs(q);

      const notasExistentes: { [key: string]: NotasEvaluacion } = {};
      snapshot.docs.forEach((doc) => {
        const notaData = { id: doc.id, ...doc.data() } as NotasEvaluacion;
        notasExistentes[notaData.estudiante_id] = notaData;
      });

      // Actualizar estado con notas existentes
      setNotasEstudiantes((prev) => {
        const updated = { ...prev };
        Object.keys(notasExistentes).forEach((estudianteId) => {
          if (updated[estudianteId]) {
            const notaData = notasExistentes[estudianteId];
            const criteriosMap: { [key: string]: number } = {};
            notaData.notas_criterios.forEach((nc) => {
              criteriosMap[nc.criterio_numero] = nc.nota_obtenida;
            });
            updated[estudianteId] = {
              ...updated[estudianteId],
              notas_criterios: criteriosMap,
              nota_definitiva: notaData.nota_definitiva,
              observacion: "",
            };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error("Error al cargar notas existentes:", error);
    }
  };

  const handleObservacionChange = (estudianteId: string, valor: string) => {
    setNotasEstudiantes((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], observacion: valor },
    }));
  };

  const handleNotaChange = (estudianteId: string, criterioNumero: string, valor: string) => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion) return;

    const criterio = evaluacion.criterios.find((c) => c.nro_criterio === criterioNumero);
    if (!criterio) return;

    let nota = parseInt(valor) || 0;
    
    // Asegurar que sea un número entero
    nota = Math.floor(Math.abs(nota));
    
    // Validar que no exceda la ponderación máxima
    if (nota > criterio.ponderacion) {
      nota = criterio.ponderacion;
    }
    if (nota < 0) {
      nota = 0;
    }

    setNotasEstudiantes((prev) => {
      const updated = { ...prev };
      if (updated[estudianteId]) {
        updated[estudianteId] = {
          ...updated[estudianteId],
          notas_criterios: {
            ...updated[estudianteId].notas_criterios,
            [criterioNumero]: nota,
          },
        };

        // Calcular nota definitiva
        const suma = Object.values(updated[estudianteId].notas_criterios).reduce(
          (acc, val) => acc + val,
          0
        );
        updated[estudianteId].nota_definitiva = Math.round(suma * 100) / 100;
      }
      return updated;
    });
  };

  const handleGuardarNota = async (estudianteId: string) => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    const estudiante = estudiantes.find((e) => e.id === estudianteId);
    const notasData = notasEstudiantes[estudianteId];

    if (!evaluacion || !estudiante || !notasData || !user?.uid) return;

    // Marcar como guardando
    setNotasEstudiantes((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], guardando: true },
    }));

    try {
      // Construir array de notas por criterio
      const notasCriterios: NotasCriterios[] = evaluacion.criterios.map((criterio) => ({
        criterio_numero: criterio.nro_criterio,
        criterio_nombre: criterio.nombre,
        ponderacion_maxima: criterio.ponderacion,
        nota_obtenida: notasData.notas_criterios[criterio.nro_criterio] || 0,
      }));

      const notaDoc: Omit<NotasEvaluacion, "id"> = {
        evaluacion_id: evaluacion.id!,
        estudiante_id: estudianteId,
        estudiante_nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
        notas_criterios: notasCriterios,
        nota_definitiva: notasData.nota_definitiva,
        docente_id: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Verificar si ya existe una nota para este estudiante en esta evaluación
      const notasRef = collection(db, "notas_evaluaciones");
      const q = query(
        notasRef,
        where("evaluacion_id", "==", evaluacion.id),
        where("estudiante_id", "==", estudianteId)
      );
      const existingSnapshot = await getDocs(q);

      if (existingSnapshot.empty) {
        // Crear nueva nota
        await addDoc(notasRef, notaDoc);
      } else {
        // Actualizar nota existente
        const docId = existingSnapshot.docs[0].id;
        await updateDoc(doc(db, "notas_evaluaciones", docId), {
          ...notaDoc,
          updatedAt: serverTimestamp(),
        });
      }

      // Marcar como guardado
      setNotasEstudiantes((prev) => ({
        ...prev,
        [estudianteId]: { ...prev[estudianteId], guardado: true, guardando: false },
      }));

      showToast.success("Nota guardada correctamente");
    } catch (error) {
      console.error("Error al guardar nota:", error);
      showToast.error("Error al guardar la nota");
      setNotasEstudiantes((prev) => ({
        ...prev,
        [estudianteId]: { ...prev[estudianteId], guardando: false },
      }));
    }
  };

  const handleGuardarTodasNotas = async () => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion || !user?.uid || estudiantes.length === 0) return;

    setGuardandoNotas(true);
    try {
      const notasRef = collection(db, "notas_evaluaciones");
      let notasGuardadas = 0;

      // Guardar todas las notas en paralelo
      const savePromises = estudiantes.map(async (estudiante) => {
        if (!estudiante.id) return;

        const notasData = notasEstudiantes[estudiante.id];
        if (!notasData) return;

        // Construir array de notas por criterio
        const notasCriterios: NotasCriterios[] = evaluacion.criterios.map((criterio) => ({
          criterio_numero: criterio.nro_criterio,
          criterio_nombre: criterio.nombre,
          ponderacion_maxima: criterio.ponderacion,
          nota_obtenida: notasData.notas_criterios[criterio.nro_criterio] || 0,
        }));

        const notaDoc: Omit<NotasEvaluacion, "id"> = {
          evaluacion_id: evaluacion.id!,
          estudiante_id: estudiante.id,
          estudiante_nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
          notas_criterios: notasCriterios,
          nota_definitiva: notasData.nota_definitiva,
          observacion: notasData.observacion || "",
          docente_id: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Verificar si ya existe una nota para este estudiante
        const q = query(
          notasRef,
          where("evaluacion_id", "==", evaluacion.id),
          where("estudiante_id", "==", estudiante.id)
        );
        const existingSnapshot = await getDocs(q);

        if (existingSnapshot.empty) {
          await addDoc(notasRef, notaDoc);
        } else {
          const docId = existingSnapshot.docs[0].id;
          await updateDoc(doc(db, "notas_evaluaciones", docId), {
            ...notaDoc,
            updatedAt: serverTimestamp(),
          });
        }
        notasGuardadas++;
      });

      await Promise.all(savePromises);
      showToast.success(`Notas guardadas correctamente para ${notasGuardadas} estudiantes`);
    } catch (error) {
      console.error("Error al guardar notas:", error);
      showToast.error("Error al guardar las notas");
    } finally {
      setGuardandoNotas(false);
    }
  };

  const handleCompletarEvaluacion = async () => {
    if (!evaluacionSeleccionada) return;

    setCompletandoEvaluacion(true);
    try {
      await updateDoc(doc(db, "evaluaciones", evaluacionSeleccionada), {
        status: "EVALUADA",
        updatedAt: serverTimestamp(),
      });

      showToast.success("Evaluación completada exitosamente");
      setDialogCompletarOpen(false);
      
      // Recargar evaluaciones y limpiar selección
      await loadEvaluacionesPendientes();
      setEvaluacionSeleccionada("");
      setEstudiantes([]);
      setNotasEstudiantes({});
    } catch (error) {
      console.error("Error al completar evaluación:", error);
      showToast.error("Error al completar la evaluación");
    } finally {
      setCompletandoEvaluacion(false);
    }
  };

  const handleGuardarYCompletar = async () => {
    const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);
    if (!evaluacion || !user?.uid || estudiantes.length === 0) return;

    setGuardandoNotas(true);
    try {
      const notasRef = collection(db, "notas_evaluaciones");
      let notasGuardadas = 0;

      // Paso 1: Guardar todas las notas en paralelo
      const savePromises = estudiantes.map(async (estudiante) => {
        if (!estudiante.id) return;

        const notasData = notasEstudiantes[estudiante.id];
        if (!notasData) return;

        // Construir array de notas por criterio
        const notasCriterios: NotasCriterios[] = evaluacion.criterios.map((criterio) => ({
          criterio_numero: criterio.nro_criterio,
          criterio_nombre: criterio.nombre,
          ponderacion_maxima: criterio.ponderacion,
          nota_obtenida: notasData.notas_criterios[criterio.nro_criterio] || 0,
        }));

        const notaDoc: Omit<NotasEvaluacion, "id"> = {
          evaluacion_id: evaluacion.id!,
          estudiante_id: estudiante.id,
          estudiante_nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
          notas_criterios: notasCriterios,
          nota_definitiva: notasData.nota_definitiva,
          observacion: notasData.observacion || "",
          docente_id: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Verificar si ya existe una nota para este estudiante
        const q = query(
          notasRef,
          where("evaluacion_id", "==", evaluacion.id),
          where("estudiante_id", "==", estudiante.id)
        );
        const existingSnapshot = await getDocs(q);

        if (existingSnapshot.empty) {
          await addDoc(notasRef, notaDoc);
        } else {
          const docId = existingSnapshot.docs[0].id;
          await updateDoc(doc(db, "notas_evaluaciones", docId), {
            ...notaDoc,
            updatedAt: serverTimestamp(),
          });
        }
        notasGuardadas++;
      });

      await Promise.all(savePromises);

      // Paso 2: Marcar evaluación como completada
      await updateDoc(doc(db, "evaluaciones", evaluacion.id!), {
        status: "EVALUADA",
        updatedAt: serverTimestamp(),
      });

      showToast.success(
        `Evaluación completada exitosamente. Se guardaron ${notasGuardadas} calificaciones.`
      );

      // Cerrar dialog y resetear formulario
      setDialogCompletarOpen(false);
      
      // Recargar evaluaciones pendientes y resetear selección
      await loadEvaluacionesPendientes();
      setEvaluacionSeleccionada("");
      setEstudiantes([]);
      setNotasEstudiantes({});

    } catch (error) {
      console.error("Error al guardar y completar evaluación:", error);
      showToast.error("Error al guardar las notas y completar la evaluación");
    } finally {
      setGuardandoNotas(false);
    }
  };


  const evaluacion = evaluaciones.find((e) => e.id === evaluacionSeleccionada);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/app/dashboard-docente">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Subir Notas</h1>
          <p className="text-muted-foreground mt-2">
            Registra las calificaciones de tus estudiantes por evaluación
          </p>
        </div>
      </div>

      {/* Selector de Evaluación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evaluación</CardTitle>
          <CardDescription>
            Elige la evaluación para la cual deseas registrar las notas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label>Evaluación Pendiente</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                  disabled={isLoadingEvaluaciones}
                >
                  {evaluacionSeleccionada ? (
                    <span className="truncate">
                      {evaluaciones.find((ev) => ev.id === evaluacionSeleccionada)?.nombre_evaluacion}
                    </span>
                  ) : isLoadingEvaluaciones ? (
                    "Cargando evaluaciones..."
                  ) : evaluaciones.length === 0 ? (
                    "No hay evaluaciones pendientes"
                  ) : (
                    "Buscar evaluación..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar evaluación..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron evaluaciones.</CommandEmpty>
                    <CommandGroup>
                      {evaluaciones.map((ev) => (
                        <CommandItem
                          key={ev.id}
                          value={`${ev.nombre_evaluacion} ${ev.materia_nombre} ${ev.seccion_nombre}`}
                          onSelect={() => {
                            setEvaluacionSeleccionada(ev.id!);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              evaluacionSeleccionada === ev.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{ev.nombre_evaluacion}</span>
                            <span className="text-xs text-muted-foreground">
                              {ev.materia_nombre} • {ev.seccion_nombre} • {ev.fecha} • {ev.porcentaje}%
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {evaluacion && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium">{evaluacion.tipo_evaluacion}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Materia:</span>
                  <p className="font-medium">{evaluacion.materia_nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sección:</span>
                  <p className="font-medium">{evaluacion.seccion_nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Porcentaje:</span>
                  <p className="font-medium">{evaluacion.porcentaje}%</p>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">Criterios de Evaluación:</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {evaluacion.criterios.map((criterio) => (
                    <Badge key={criterio.nro_criterio} variant="outline">
                      {criterio.nombre} ({criterio.ponderacion} pts)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Estudiantes y Notas */}
      {evaluacion && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Estudiantes de la Sección</CardTitle>
                <CardDescription>
                  Ingresa las calificaciones para cada criterio de evaluación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEstudiantes ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Cargando estudiantes...</span>
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay estudiantes registrados en esta sección
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Cédula</TableHead>
                      {evaluacion.criterios.map((criterio) => (
                        <TableHead key={criterio.nro_criterio} className="text-center">
                          {criterio.nombre}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            (0-{criterio.ponderacion})
                          </span>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Nota Final</TableHead>
                      <TableHead className="w-[250px]">Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantes.map((estudiante, index) => {
                      const notasEst = estudiante.id ? notasEstudiantes[estudiante.id] : null;
                      if (!notasEst || !estudiante.id) return null;

                      return (
                        <TableRow key={estudiante.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {estudiante.apellidos}, {estudiante.nombres}
                          </TableCell>
                          <TableCell>
                            {estudiante.tipo_cedula}-{estudiante.cedula}
                          </TableCell>
                          {evaluacion.criterios.map((criterio) => (
                            <TableCell key={criterio.nro_criterio} className="text-center">
                              <Input
                                type="number"
                                min={0}
                                max={criterio.ponderacion}
                                step={1}
                                value={notasEst.notas_criterios[criterio.nro_criterio] || 0}
                                onChange={(e) =>
                                  handleNotaChange(
                                    estudiante.id!,
                                    criterio.nro_criterio,
                                    e.target.value
                                  )
                                }
                                className="w-20 text-center mx-auto"
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-bold">
                            {notasEst.nota_definitiva.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              placeholder="Observaciones (opcional)"
                              value={notasEst.observacion || ""}
                              onChange={(e) => handleObservacionChange(estudiante.id!, e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {estudiantes.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setDialogCompletarOpen(true)}
                  disabled={guardandoNotas}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Todas las Notas
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Diálogo de Confirmación para Completar Evaluación */}
      <Dialog open={dialogCompletarOpen} onOpenChange={setDialogCompletarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar y Completar Evaluación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas guardar las notas de todos los estudiantes y marcar esta evaluación como completada?
              <br /><br />
              Esta acción guardará las calificaciones y observaciones de <strong>{estudiantes.length} estudiantes</strong> y cambiará el estado de la evaluación a "EVALUADA".
              <br /><br />
              La evaluación ya no aparecerá en la lista de evaluaciones pendientes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCompletarOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarYCompletar}
              disabled={guardandoNotas}
              className="bg-green-600 hover:bg-green-700"
            >
              {guardandoNotas ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar y Completar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
