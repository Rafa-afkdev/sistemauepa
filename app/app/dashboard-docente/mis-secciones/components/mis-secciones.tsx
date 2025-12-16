"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Users,
    School,
    BookOpen,
    Loader2,
    GraduationCap,
    UserCheck
} from "lucide-react";

import { useUser } from "@/hooks/use-user";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { AsignacionDocenteMateria } from "@/interfaces/materias.interface";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

interface SeccionConMaterias {
    id: string;
    grado_año: string;
    seccion: string;
    nivel_educativo: string;
    nombre_completo: string;
    estudiantes_inscritos: number;
    limite_estudiantes: number;
    materias: MateriaInfo[];
    es_docente_guia: boolean;
}

interface MateriaInfo {
    id: string;
    nombre: string;
    codigo?: string;
}

export function MisSecciones() {
    const { user } = useUser();
    const [seccionesConMaterias, setSeccionesConMaterias] = useState<SeccionConMaterias[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filtros
    const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    // Cargar periodos escolares al montar el componente
    useEffect(() => {
        loadPeriodosEscolares();
    }, []);

    // Cargar secciones cuando cambia el periodo o el usuario
    useEffect(() => {
        if (periodoSeleccionado && user?.uid) {
            loadSeccionesDocente(periodoSeleccionado);
        }
    }, [periodoSeleccionado, user]);

    // Cargar periodos escolares
    const loadPeriodosEscolares = async () => {
        setIsLoadingFilters(true);
        try {
            const periodosRef = collection(db, 'periodos_escolares');
            const q = query(periodosRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const periodosData = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            })) as PeriodosEscolares[];

            setPeriodosEscolares(periodosData);

            // Seleccionar el periodo activo por defecto
            const periodoActivo = periodosData.find(p => p.status === 'ACTIVO');
            if (periodoActivo?.id) {
                setPeriodoSeleccionado(periodoActivo.id);
            } else if (periodosData.length > 0 && periodosData[0].id) {
                setPeriodoSeleccionado(periodosData[0].id);
            }
        } catch (error) {
            console.error("Error al cargar periodos escolares:", error);
            showToast.error("Error al cargar periodos escolares");
        } finally {
            setIsLoadingFilters(false);
        }
    };

    // Cargar secciones asignadas al docente
    const loadSeccionesDocente = async (periodoId: string) => {
        if (!user?.uid) return;

        setIsLoading(true);
        try {
            // Obtener asignaciones del docente
            const asignacionesRef = collection(db, 'asignaciones_docente_materia');
            const q = query(
                asignacionesRef,
                where('docente_id', '==', user.uid),
                where('periodo_escolar_id', '==', periodoId)
            );
            const snapshot = await getDocs(q);
            const asignaciones = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            })) as AsignacionDocenteMateria[];

            // Crear un mapa de secciones con sus materias
            const seccionesMap = new Map<string, {
                materias: MateriaInfo[];
                seccionData?: any;
            }>();

            // Recopilar todas las secciones y materias
            for (const asignacion of asignaciones) {
                // Obtener datos de la materia
                let materiaData: MateriaInfo = { id: asignacion.materia_id, nombre: "Materia desconocida" };
                try {
                    const materiaDoc = await getDoc(doc(db, "materias", asignacion.materia_id));
                    if (materiaDoc.exists()) {
                        const data = materiaDoc.data();
                        materiaData = { id: asignacion.materia_id, nombre: data.nombre, codigo: data.codigo };
                    }
                } catch (error) {
                    console.error("Error al obtener materia:", error);
                }

                // Agregar cada sección del array
                if (asignacion.secciones_id && Array.isArray(asignacion.secciones_id)) {
                    for (const seccionId of asignacion.secciones_id) {
                        if (!seccionesMap.has(seccionId)) {
                            seccionesMap.set(seccionId, { materias: [] });
                        }
                        const seccion = seccionesMap.get(seccionId)!;
                        // Evitar duplicados de materias
                        if (!seccion.materias.find(m => m.id === materiaData.id)) {
                            seccion.materias.push(materiaData);
                        }
                    }
                }
            }

            // Obtener datos completos de cada sección
            const seccionesPromises = Array.from(seccionesMap.entries()).map(async ([seccionId, data]) => {
                try {
                    const seccionDoc = await getDoc(doc(db, "secciones", seccionId));
                    if (seccionDoc.exists()) {
                        const seccionData = seccionDoc.data();
                        return {
                            id: seccionId,
                            grado_año: seccionData.grado_año || "",
                            seccion: seccionData.seccion || "",
                            nivel_educativo: seccionData.nivel_educativo || "",
                            nombre_completo: `${seccionData.grado_año} ${seccionData.nivel_educativo} "${seccionData.seccion}"`,
                            estudiantes_inscritos: seccionData.estudiantes_inscritos || 0,
                            limite_estudiantes: seccionData.limite_estudiantes || 0,
                            materias: data.materias,
                            es_docente_guia: seccionData.docente_guia_id === user?.uid
                        } as SeccionConMaterias;
                    }
                    return null;
                } catch (error) {
                    console.error("Error al obtener sección:", error);
                    return null;
                }
            });

            const seccionesResult = (await Promise.all(seccionesPromises))
                .filter((s): s is SeccionConMaterias => s !== null)
                .sort((a, b) => {
                    if (a.grado_año !== b.grado_año) return a.grado_año.localeCompare(b.grado_año);
                    return a.seccion.localeCompare(b.seccion);
                });

            setSeccionesConMaterias(seccionesResult);
        } catch (error) {
            console.error("Error al cargar secciones del docente:", error);
            showToast.error("Error al cargar las secciones");
            setSeccionesConMaterias([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrar secciones por búsqueda
    const seccionesFiltradas = seccionesConMaterias.filter(
        (s) => searchTerm === "" ||
            s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.materias.some(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Estadísticas
    const totalSecciones = seccionesFiltradas.length;
    const totalEstudiantes = seccionesFiltradas.reduce((sum, s) => sum + s.estudiantes_inscritos, 0);
    const seccionesComoGuia = seccionesFiltradas.filter(s => s.es_docente_guia).length;

    // Obtener nombre del periodo actual
    const periodoActualNombre = periodosEscolares.find(p => p.id === periodoSeleccionado)?.periodo || '';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Mis Secciones</h1>
                <p className="text-muted-foreground mt-2">
                    Visualiza las secciones donde impartes clases
                </p>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Secciones</CardTitle>
                        <School className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSecciones}</div>
                        <p className="text-xs text-muted-foreground">
                            {periodoActualNombre}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEstudiantes}</div>
                        <p className="text-xs text-muted-foreground">
                            En todas las secciones
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Docente Guía</CardTitle>
                        <UserCheck className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{seccionesComoGuia}</div>
                        <p className="text-xs text-muted-foreground">
                            Secciones a tu cargo
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Buscador */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Buscar Sección</label>
                        <Input
                            type="text"
                            placeholder="Buscar por sección o materia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Periodo Escolar */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Periodo Escolar</label>
                            <Select
                                value={periodoSeleccionado}
                                onValueChange={setPeriodoSeleccionado}
                                disabled={isLoadingFilters}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un periodo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periodosEscolares.map((periodo) => (
                                        <SelectItem key={periodo.id} value={periodo.id || ""}>
                                            {periodo.periodo} {periodo.status === "ACTIVO" && "(Activo)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de secciones */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <Card className="col-span-full">
                        <CardContent className="p-12 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
                            <p className="mt-4 text-muted-foreground">Cargando secciones...</p>
                        </CardContent>
                    </Card>
                ) : seccionesFiltradas.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="p-12 text-center">
                            <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay secciones asignadas</h3>
                            <p className="text-muted-foreground">
                                No tienes secciones asignadas para este periodo escolar
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    seccionesFiltradas.map((seccion) => (
                        <Card key={seccion.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <School className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-lg">{seccion.nombre_completo}</CardTitle>
                                    </div>
                                    {seccion.es_docente_guia && (
                                        <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                            Docente Guía
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="flex items-center gap-2 mt-2">
                                    <Users className="h-4 w-4" />
                                    {seccion.estudiantes_inscritos} / {seccion.limite_estudiantes} estudiantes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Materias que imparte en esta sección */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Materias que impartes:</p>
                                    {seccion.materias.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {seccion.materias.map((materia) => (
                                                <Badge key={materia.id} variant="secondary" className="flex items-center gap-1">
                                                    <BookOpen className="h-3 w-3" />
                                                    {materia.nombre}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Sin materias asignadas</p>
                                    )}
                                </div>

                                {/* Barra de progreso de cupo */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Cupo</span>
                                        <span>{Math.round((seccion.estudiantes_inscritos / seccion.limite_estudiantes) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min((seccion.estudiantes_inscritos / seccion.limite_estudiantes) * 100, 100)}%` }}
                                        />
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
