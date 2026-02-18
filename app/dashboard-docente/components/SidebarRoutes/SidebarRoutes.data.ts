import { BookOpen, Calendar, ClipboardList, FileEdit, FileText, Home, Users } from "lucide-react";

// Rutas del Dashboard de Docentes
export const DataDocenteSidebar = [
    {
        icon: Home,
        label: "Inicio",
        href: "/dashboard-docente", 
    },
    {
        icon: BookOpen,
        label: "Mis Materias",
        href: "/dashboard-docente/mis-materias", 
    },
    {
        icon: Users,
        label: "Mis Secciones",
        href: "/dashboard-docente/mis-secciones", 
    },
    {
        icon: FileEdit,
        label: "Cargar Notas",
        href: "/dashboard-docente/notas/subir-notas", 
    },
    {
        icon: FileText,
        label: "Ver Notas",
        href: "/dashboard-docente/notas/ver-notas", 
    },
    {
        icon: ClipboardList,
        label: "Mis Evaluaciones",
        href: "/dashboard-docente/evaluaciones", 
    },
    {
        icon: Calendar,
        label: "Horario",
        href: "/dashboard-docente/horario", 
    },
    {
        icon: FileEdit, // Using FileEdit as placeholder, or could use ClipboardCheck if available
        label: "Registrar Asistencia",
        href: "/dashboard-docente/asistencia",
    },
    {
        icon: Users, // Using Users as placeholder or ListChecks
        label: "Ver Asistencia",
        href: "/dashboard-docente/asistencia/ver",
    },
]
