"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { BookOpen, Users, Calendar, ClipboardList } from "lucide-react";

export default function DashboardDocentePage() {
  const { user } = useUser();

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
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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
          <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">Cargar Notas</h3>
            <p className="text-sm text-muted-foreground">
              Registra las calificaciones de tus estudiantes
            </p>
          </div>
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