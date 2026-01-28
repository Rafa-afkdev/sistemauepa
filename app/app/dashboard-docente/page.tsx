"use client";

import { Card,  CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { AsignacionDocenteMateria } from "@/interfaces/materias.interface";
import { auth, getCollection } from "@/lib/data/firebase";
import { where } from "firebase/firestore";
import { BookOpen, Calendar, ClipboardList, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardDocentePage() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    materias: 0,
    secciones: 0,
    evaluacionesPendientes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Use auth.currentUser directly to ensure we have the UID
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;

      try {
        setIsLoading(true);
        // 1. Fetch Materias y Secciones
        const asignacionesPromise = getCollection("asignaciones_docente_materia", [
          where("docente_id", "==", currentUser.uid),
          where("estado", "==", "activa"),
        ]) as Promise<AsignacionDocenteMateria[]>;

        // 2. Fetch Evaluaciones Pendientes
        // Calculamos rango de fecha para este mes
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const evaluacionesPromise = getCollection("evaluaciones", [
           where("docente_id", "==", currentUser.uid),
           where("status", "==", "POR EVALUAR"),
           // where("fecha", ">=", startOfMonth), // Firestore puede requerir índice compuesto para esto junto con status/docente_id
           // where("fecha", "<=", endOfMonth)    // Por ahora filtramos en cliente si falla el índice o para simplificar
        ]) as Promise<Evaluaciones[]>;

        const [asignaciones, evaluaciones] = await Promise.all([asignacionesPromise, evaluacionesPromise]);

        // Procesar Asignaciones
        const totalMaterias = asignaciones.length;
        let totalSecciones = 0;
        const seccionesUnicas = new Set<string>();

        asignaciones.forEach(a => {
            if (a.secciones_id) {
                totalSecciones += a.secciones_id.length;
                a.secciones_id.forEach(id => seccionesUnicas.add(id));
            }
        });

        // Procesar Evaluaciones (Filtro de mes en cliente por si acaso)
        const evaluacionesMes = evaluaciones.filter(ev => {
             // asumiendo ev.fecha es string "YYYY-MM-DD"
             return ev.fecha >= startOfMonth && ev.fecha <= endOfMonth;
        });
        
        setStats({
          materias: totalMaterias,
          secciones: seccionesUnicas.size,
          evaluacionesPendientes: evaluacionesMes.length,
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchStats();
    }
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {user?.name || "Docente"}</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus materias, secciones y evaluaciones desde aquí.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Materias</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.materias}
            </div>
            <p className="text-xs text-muted-foreground">
              Materias asignadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Secciones</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.secciones}
            </div>
            <p className="text-xs text-muted-foreground">
              Secciones a cargo
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
            <ClipboardList className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.evaluacionesPendientes}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendientes este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Clases</CardTitle>
            <Calendar className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>
            Gestiona tus actividades más frecuentes
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link href="/app/dashboard-docente/asistencia">
            <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <h3 className="font-semibold mb-2">Registrar Asistencia</h3>
              <p className="text-sm text-muted-foreground">
                Control diario de asistencia estudiantil
              </p>
            </div>
          </Link>
          <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">Ver Mis Materias</h3>
            <p className="text-sm text-muted-foreground">
              Consulta las materias que tienes asignadas
            </p>
          </div>
          <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">Mis Evaluaciones</h3>
            <p className="text-sm text-muted-foreground">
              Gestiona tus evaluaciones y exámenes
            </p>
          </div>
          <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">Horario de Clases</h3>
            <p className="text-sm text-muted-foreground">
              Consulta tu horario semanal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}