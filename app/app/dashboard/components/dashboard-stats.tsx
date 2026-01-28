/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import type { Estudiantes } from "@/interfaces/estudiantes.interface";
import type { LapsosEscolares } from "@/interfaces/lapsos.interface";
import type { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import type { Secciones } from "@/interfaces/secciones.interface";
import type { User } from "@/interfaces/users.interface";
import { getCollection, getCollectionCount, getDocument } from "@/lib/data/firebase";
import {
  Activity,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  School,
  TrendingUp,
  UserCheck,
  Users
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { GenerateRepresentativeReport } from "./generate-representative-report";
import { GenerateSectionReport } from "./generate-section-report";
import { GenerateStudentReport } from "./generate-student-report";
import { GenerateTeacherReport } from "./generate-teacher-report";

interface DashboardStats {
  totalEstudiantes: number;
  estudiantesActivos: number;
  totalDocentes: number;
  docentesActivos: number;
  totalRepresentantes: number;
  totalSecciones: number;
  periodoActivo: string;
  lapsoActivo: string;
  seccionMasEstudiantes: {
    nombre: string;
    cantidad: number;
  };
  cuposTotales: number;
  cuposDisponibles: number;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  subtitle,
  trend,
  action
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  loading: boolean;
  subtitle?: string;
  trend?: string;
  action?: ReactNode;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      <div className="flex items-center gap-2">
        {action}
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      {loading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <Badge variant="secondary" className="mt-1.5 text-xs">
              {trend}
            </Badge>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default function DashboardStats() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalEstudiantes: 0,
    estudiantesActivos: 0,
    totalDocentes: 0,
    docentesActivos: 0,
    totalRepresentantes: 0,
    totalSecciones: 0,
    periodoActivo: "No definido",
    lapsoActivo: "No definido",
    seccionMasEstudiantes: {
      nombre: "N/A",
      cantidad: 0
    },
    cuposTotales: 0,
    cuposDisponibles: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los datos en paralelo
      const [
        estudiantes,
        docentes,
        secciones,
        periodos,
        lapsos,
        representantesCount,
        inscripciones
      ] = await Promise.all([
        getCollection("estudiantes") as Promise<Estudiantes[]>,
        getCollection("users") as Promise<User[]>,
        getCollection("secciones") as Promise<Secciones[]>,
        getCollection("periodos_escolares") as Promise<PeriodosEscolares[]>,
        getCollection("lapsos") as Promise<LapsosEscolares[]>,
        getCollectionCount("representantes"),
        getCollection("estudiantes_inscritos") as Promise<any[]>
      ]);

      // Encontrar periodo activo
      const periodoActivo = periodos.find((p) => p.status === "ACTIVO");
      
      // Filtrar secciones por periodo activo
      const seccionesActivas = periodoActivo 
        ? secciones.filter(s => s.id_periodo_escolar === periodoActivo.id) 
        : [];

      // Calcular estadísticas de estudiantes
      const totalEstudiantes = estudiantes.length;
      const estudiantesActivos = inscripciones.filter(
        (i) => (i.estado || "").toLowerCase() === "activo"
      ).length;

      // Calcular estadísticas de docentes
      const docentesList = docentes.filter((d) => d.rol === "docente");
      const totalDocentes = docentesList.length;
      const docentesActivos = docentesList.filter(
        (d) => d.status === "activo"
      ).length;

      // Calcular estadísticas de secciones
      const totalSecciones = seccionesActivas.length;
      
      // Encontrar sección con más estudiantes
      let seccionMax = seccionesActivas[0];
      seccionesActivas.forEach((seccion) => {
        if ((seccion.estudiantes_inscritos || 0) > (seccionMax?.estudiantes_inscritos || 0)) {
          seccionMax = seccion;
        }
      });

      const seccionMasEstudiantes = seccionMax
        ? {
            nombre: `${seccionMax.grado_año} "${seccionMax.seccion}" - ${seccionMax.nivel_educativo}`,
            cantidad: seccionMax.estudiantes_inscritos || 0
          }
        : {
            nombre: "N/A",
            cantidad: 0
          };

      // Calcular cupos
      const cuposTotales = seccionesActivas.reduce(
        (sum, s) => sum + (s.limite_estudiantes || 0),
        0
      );
      const estudiantesInscritos = seccionesActivas.reduce(
        (sum, s) => sum + (s.estudiantes_inscritos || 0),
        0
      );
      const cuposDisponibles = cuposTotales - estudiantesInscritos;
      
      // Encontrar lapso activo
      const lapsoActivo = lapsos.find((l) => l.status === "ACTIVO");
      
      // Obtener el periodo escolar del lapso activo
      let periodoDelLapso = "";
      if (lapsoActivo?.año_escolar) {
        try {
          const periodoDoc = await getDocument(`periodos_escolares/${lapsoActivo.año_escolar}`) as PeriodosEscolares;
          periodoDelLapso = periodoDoc?.periodo || lapsoActivo.año_escolar;
        } catch (error) {
          console.error("Error al obtener periodo del lapso:", error);
          periodoDelLapso = lapsoActivo.año_escolar;
        }
      }

      setStats({
        totalEstudiantes,
        estudiantesActivos,
        totalDocentes,
        docentesActivos,
        totalRepresentantes: representantesCount,
        totalSecciones,
        periodoActivo: periodoActivo?.periodo || "No definido",
        lapsoActivo: lapsoActivo 
          ? `${lapsoActivo.lapso} (${periodoDelLapso})`
          : "No definido",
        seccionMasEstudiantes,
        cuposTotales,
        cuposDisponibles
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del sistema escolar UEPA
        </p>
      </div>

      {/* Información del Periodo y Lapso Actual */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Periodo Escolar
                </CardTitle>
                <CardDescription className="text-xs">Periodo académico vigente</CardDescription>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="space-y-1.5">
                <div className="text-xl font-bold">
                  {stats.periodoActivo}
                </div>
                <Badge variant="default" className="font-normal text-xs">
                  <Activity className="h-2.5 w-2.5 mr-1" />
                  Activo
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lapso Escolar
                </CardTitle>
                <CardDescription className="text-xs">Lapso en curso</CardDescription>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="space-y-1.5">
                <div className="text-xl font-bold">
                  {stats.lapsoActivo}
                </div>
                <Badge variant="default" className="font-normal text-xs">
                  <Activity className="h-2.5 w-2.5 mr-1" />
                  Activo
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Estadísticas principales */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Estadísticas Generales</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Estudiantes"
            value={stats.totalEstudiantes}
            icon={Users}
            loading={isLoading}
            subtitle={`${stats.estudiantesActivos} activos`}
            action={
              <GenerateStudentReport />
            }
          />
          
      <StatCard
            title="Total Docentes"
            value={stats.totalDocentes}
            icon={GraduationCap}
            loading={isLoading}
            subtitle={`${stats.docentesActivos} activos`}
            action={
              <GenerateTeacherReport />
            }
          />

          <StatCard
            title="Total Representantes"
            value={stats.totalRepresentantes}
            icon={Users}
            loading={isLoading}
            action={
              <GenerateRepresentativeReport />
            }
          />

          <StatCard
            title="Total Secciones"
            value={stats.totalSecciones}
            icon={School}
            loading={isLoading}
            action={
              <GenerateSectionReport />
            }
          />

          <StatCard
            title="Cupos Disponibles"
            value={stats.cuposDisponibles}
            icon={UserCheck}
            loading={isLoading}
            subtitle={`de ${stats.cuposTotales} totales`}
          />
        </div>
      </div>

      <Separator />

      {/* Información adicional */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Detalles Adicionales</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Sección con Más Estudiantes
                </CardTitle>
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-base font-semibold">
                    {stats.seccionMasEstudiantes.nombre}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {stats.seccionMasEstudiantes.cantidad} estudiantes
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Ocupación General
                </CardTitle>
                <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {stats.cuposTotales > 0
                      ? Math.round(
                          ((stats.cuposTotales - stats.cuposDisponibles) /
                            stats.cuposTotales) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 rounded-full"
                        style={{
                          width: `${
                            stats.cuposTotales > 0
                              ? ((stats.cuposTotales - stats.cuposDisponibles) /
                                  stats.cuposTotales) *
                                100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.cuposTotales - stats.cuposDisponibles} de {stats.cuposTotales} cupos ocupados
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
