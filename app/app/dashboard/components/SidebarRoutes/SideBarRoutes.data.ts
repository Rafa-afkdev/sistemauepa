import { CalendarClock, CalendarPlus,  ClipboardEdit, FileEdit, FilePlus, FileText, LucideArrowLeftRight,  PenBoxIcon,UserPlus2, UserRoundPenIcon, UserRoundPlusIcon, UserX2Icon } from "lucide-react";

export const DataEstudiantesSidebar = [
    {
        icon: UserRoundPlusIcon,
        label: "Mis Estudiantes",
        href:"/app/dashboard/estudiantes", 
    },
    {
        icon: UserRoundPenIcon,
        label: "Estudiantes Inscritos",
        href:"/app/dashboard/estudiantes/inscribir", 
    },

    {
        icon: UserX2Icon,
        label: "Retirar Estudiante",
        href:"/app/dashboard/estudiantes/retirar", 
    },  
    
    {
        icon: FileText,
        label: "Generar Constancias",
        href: "/app/dashboard/estudiantes/constancias", 
    },

]

export const DataDocenteSidebar = [
    {
        icon: UserPlus2,
        label: "Registrar",
        href: "/app/dashboard/docentes", 
    },
    {
        icon: FileText,
        label: "Asignar Grados",
        href: "/app/dashboard/docentes/asignacion-grado", 
    },
    {
        icon: PenBoxIcon,
        label: "Asignar Materias",
        href: "/app/dashboard/docentes/asignacion-materias", 
    },

]
export const DataSeccionesSidebar = [
    {
        icon: ClipboardEdit,
        label: "Aperturar Secciones",
        href: "/app/dashboard/secciones", 
    },
    {
        icon: FileText,
        label: "Generar Nómina",
        href: "/app/dashboard/secciones/nomina", 
    },
]


export const DataMateriasSidebar = [
    {
        icon: ClipboardEdit,
        label: "Registrar",
        href: "/app/dashboard/materias", 
    },
]

export const DataAñoSidebar = [
    {
        icon: CalendarPlus,
        label: "Periodos Escolares",
        href: "/app/dashboard/periodos-escolares", 
    },
    {
        icon: CalendarClock,
        label: "Lapsos",
        href: "/app/dashboard/periodos-escolares/lapsos", 
    },

    
]

export const DataIngresarNotas = [
    {
        icon: FileEdit,
        label: "Cargar Notas",
        href: "/dashboard/asignar-notas", 
    },
    {
        icon: FileEdit,
        label: "Modificar Notas",
        href: "/dashboard/cambiar-notas", 
    },
    {
        icon: FileText,
        label: "Ver Notas",
        href: "/dashboard/ver-notas", 
    }
]

export const DataNotasSidebar = [
    {
        icon: FilePlus,
        label: "Generar Planilla",
        href: "/dashboard/notas",
    },
    
]

export const DataEvaluacionesSidebar = [
    {
        icon: FilePlus,
        label: "Cargar Evaluaciones",
        href: "/dashboard/cargar-evaluaciones", 
    },
    {
        icon: FileEdit,
        label: "Ver Mis Evaluaciones",
        href: "/dashboard/ver-evaluaciones",
    }
]