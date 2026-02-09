import { BookOpen, FileEdit, FileText, Calendar, Users, ClipboardList, Home } from "lucide-react";

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
        href: "/app/dashboard-docente/notas/cargar-notas", 
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
]
