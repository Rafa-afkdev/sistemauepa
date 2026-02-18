"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    BookOpen,
    ChevronLeft,
    GraduationCap,
    Loader2,
    School,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useUser } from "@/hooks/use-user";
import { AsignacionDocenteMateria } from "@/interfaces/materias.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { db } from "@/lib/data/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";

interface MateriaConSecciones {
    id: string;
    materia_id: string;
    materia_nombre: string;
    materia_codigo?: string;
    secciones: SeccionInfo[];
    estado: string;
    observaciones?: string;
}

interface SeccionInfo {
    id: string;
    grado_año: string;
    seccion: string;
    nivel_educativo: string;
    nombre_completo: string;
}

export function MisMaterias() {
    const { user } = useUser();
    const [materiasConSecciones, setMateriasConSecciones] = useState<MateriaConSecciones[]>([]);
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

    // Cargar materias cuando cambia el periodo o el usuario
    useEffect(() => {
        if (periodoSeleccionado && user?.uid) {
            loadMateriasDocente(periodoSeleccionado);
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

    // Cargar materias asignadas al docente
    const loadMateriasDocente = async (periodoId: string) => {
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

            // Para cada asignación, obtener datos de la materia y secciones
            const materiasPromises = asignaciones.map(async (asignacion) => {
                // Obtener datos de la materia
                let materiaData = { nombre: "Materia desconocida", codigo: "" };
                try {
                    const materiaDoc = await getDoc(doc(db, "materias", asignacion.materia_id));
                    if (materiaDoc.exists()) {
                        const data = materiaDoc.data();
                        materiaData = { nombre: data.nombre, codigo: data.codigo || "" };
                    }
                } catch (error) {
                    console.error("Error al obtener materia:", error);
                }

                // Obtener datos de las secciones
                const seccionesInfo: SeccionInfo[] = [];
                if (asignacion.secciones_id && Array.isArray(asignacion.secciones_id)) {
                    for (const seccionId of asignacion.secciones_id) {
                        try {
                            const seccionDoc = await getDoc(doc(db, "secciones", seccionId));
                            if (seccionDoc.exists()) {
                                const data = seccionDoc.data();
                                seccionesInfo.push({
                                    id: seccionId,
                                    grado_año: data.grado_año || "",
                                    seccion: data.seccion || "",
                                    nivel_educativo: data.nivel_educativo || "",
                                    nombre_completo: `${data.grado_año} ${data.nivel_educativo} "${data.seccion}"`
                                });
                            }
                        } catch (error) {
                            console.error("Error al obtener sección:", error);
                        }
                    }
                }

                return {
                    id: asignacion.id || "",
                    materia_id: asignacion.materia_id,
                    materia_nombre: materiaData.nombre,
                    materia_codigo: materiaData.codigo,
                    secciones: seccionesInfo,
                    estado: asignacion.estado,
                    observaciones: asignacion.observaciones
                } as MateriaConSecciones;
            });

            const materiasResult = await Promise.all(materiasPromises);
            setMateriasConSecciones(materiasResult);
        } catch (error) {
            console.error("Error al cargar materias del docente:", error);
            showToast.error("Error al cargar las materias");
            setMateriasConSecciones([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrar materias por búsqueda
    const materiasFiltradas = materiasConSecciones.filter(
        (m) => searchTerm === "" ||
            m.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.materia_codigo && m.materia_codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Estadísticas
    const totalMaterias = materiasFiltradas.length;
    const totalSecciones = materiasFiltradas.reduce((sum, m) => sum + m.secciones.length, 0);
    const materiasActivas = materiasFiltradas.filter(m => m.estado === 'activa').length;

    // Obtener nombre del periodo actual
    const periodoActualNombre = periodosEscolares.find(p => p.id === periodoSeleccionado)?.periodo || '';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard-docente">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Mis Materias</h1>
                    <p className="text-muted-foreground mt-2">
                        Visualiza las materias y secciones que tienes asignadas
                    </p>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Materias</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMaterias}</div>
                        <p className="text-xs text-muted-foreground">
                            {periodoActualNombre}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Secciones</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSecciones}</div>
                        <p className="text-xs text-muted-foreground">
                            Secciones asignadas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Materias Activas</CardTitle>
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{materiasActivas}</div>
                        <p className="text-xs text-muted-foreground">
                            Con estado activo
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
                        <label className="text-sm font-medium mb-2 block">Buscar Materia</label>
                        <Input
                            type="text"
                            placeholder="Buscar por nombre o código..."
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

            {/* Lista de materias */}
            <div className="grid gap-4">
                {isLoading ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
                            <p className="mt-4 text-muted-foreground">Cargando materias...</p>
                        </CardContent>
                    </Card>
                ) : materiasFiltradas.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay materias asignadas</h3>
                            <p className="text-muted-foreground">
                                No tienes materias asignadas para este periodo escolar
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    materiasFiltradas.map((materia) => (
                        <Card key={materia.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                            <CardTitle className="text-xl">{materia.materia_nombre}</CardTitle>
                                            <Badge
                                                variant="outline"
                                                className={materia.estado === "activa"
                                                    ? "bg-green-100 text-green-800 border-green-300"
                                                    : "bg-gray-100 text-gray-800 border-gray-300"}
                                            >
                                                {materia.estado}
                                            </Badge>
                                        </div>
                                        {materia.materia_codigo && (
                                            <CardDescription>Código: {materia.materia_codigo}</CardDescription>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm text-muted-foreground">
                                            {materia.secciones.length} {materia.secciones.length === 1 ? 'sección' : 'secciones'}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Secciones asignadas */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Secciones Asignadas:</p>
                                    {materia.secciones.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {materia.secciones.map((seccion) => (
                                                <Badge key={seccion.id} variant="secondary" className="flex items-center gap-1">
                                                    <School className="h-3 w-3" />
                                                    {seccion.nombre_completo}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No hay secciones asignadas</p>
                                    )}
                                </div>

                                {/* Observaciones si existen */}
                                {materia.observaciones && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium">Observaciones:</span> {materia.observaciones}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
