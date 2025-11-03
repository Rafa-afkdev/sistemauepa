import { CalendarClock, CalendarPlus,  ClipboardEdit, FileEdit, FilePlus, FileText, LucideArrowLeftRight,  PenBoxIcon,UserPlus2, UserRoundPenIcon, UserRoundPlusIcon, UserX2Icon } from "lucide-react";

export const DataEstudiantesSidebar = [
    {
        icon: UserRoundPlusIcon,
        label: "Registrar",
        href:"/app/dashboard/estudiantes", 
    },
    {
        icon: UserRoundPenIcon,
        label: "Inscribir",
        href:"/dashboard/inscripcion-students", 
    },

    {
        icon: UserX2Icon,
        label: "Retirar",
        href:"/dashboard/retirar-students", 
    },

    {
        icon: LucideArrowLeftRight,
        label: "Cambio De Sección",
        href:"/dashboard/cambio-seccion", 
    },
    
    {
        icon: FileText,
        label: "Generar Constancias",
        href: "/dashboard/create-constancia-student", 
    },

]

export const DataDocenteSidebar = [
    {
        icon: UserPlus2,
        label: "Registrar",
        href: "/dashboard/registrar-docente", 
    },
    {
        icon: PenBoxIcon,
        label: "Asignar Materias",
        href: "/dashboard/asignar-materias", 
    },
]
export const DataSeccionesSidebar = [
    {
        icon: ClipboardEdit,
        label: "Aperturar Sección",
        href: "/dashboard/create-update-seccion", 
    },
    {
        icon: FileText,
        label: "Generar Nómina",
        href: "/dashboard/nomina-secciones", 
    },
]


export const DataMateriasSidebar = [
    {
        icon: ClipboardEdit,
        label: "Registrar",
        href: "/dashboard/materias", 
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