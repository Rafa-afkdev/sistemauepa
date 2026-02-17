import { BookOpen, Calendar, ClipboardList, FileEdit, FileText, Home, Users } from "lucide-react";

// Rutas del Dashboard de Docentes
export const DataDocenteSidebar = [
    {
        icon: Home,
        label: "Inicio",
        href: "/app/dashboard-docente", 
    },
    {
        icon: BookOpen,
        label: "Mis Materias",
        href: "/app/dashboard-docente/mis-materias", 
    },
    {
        icon: Users,
        label: "Mis Secciones",
        href: "/app/dashboard-docente/mis-secciones", 
    },
    {
        icon: FileEdit,
        label: "Cargar Notas",
        href: "/app/dashboard-docente/notas/subir-notas", 
    },
    {
        icon: FileText,
        label: "Ver Notas",
        href: "/app/dashboard-docente/notas/ver-notas", 
    },
    {
        icon: ClipboardList,
        label: "Mis Evaluaciones",
        href: "/app/dashboard-docente/evaluaciones", 
    },
    {
        icon: Calendar,
        label: "Horario",
        href: "/app/dashboard-docente/horario", 
    },
    {
        icon: FileEdit, // Using FileEdit as placeholder, or could use ClipboardCheck if available
        label: "Registrar Asistencia",
        href: "/app/dashboard-docente/asistencia",
    },
    {
        icon: Users, // Using Users as placeholder or ListChecks
        label: "Ver Asistencia",
        href: "/app/dashboard-docente/asistencia/ver",
    },
]
