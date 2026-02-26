import { CalendarClock, CalendarPlus, ClipboardEdit, FileEdit, FilePlus, FileText, LucideArrowLeftRight, PenBoxIcon, UserPlus2, UserRoundPlusIcon, Users } from "lucide-react";

export const DataEstudiantesSidebar = [
    {
        icon: UserRoundPlusIcon,
        label: "Mis Estudiantes",
        href:"/dashboard/estudiantes", 
    },
    // {
    //     icon: UserRoundPenIcon,
    //     label: "Estudiantes Inscritos",
    //     href:"/app/dashboard/estudiantes/inscribir", 
    // },

    // {
    //     icon: UserX2Icon,
    //     label: "Retirar Estudiante",
    //     href:"/app/dashboard/estudiantes/retirar", 
    // },  
    
    {
        icon: FileText,
        label: "Generar Constancias",
        href: "/dashboard/estudiantes/constancias", 
    },
    
    {
        icon: Users,
        label: "Mis Representantes",
        href: "/dashboard/estudiantes/representantes", 
    },

]

export const DataDocenteSidebar = [
    {
        icon: UserPlus2,
        label: "Registrar Docentes",
        href: "/dashboard/docentes", 
    },
    {
        icon: FileText,
        label: "Asignar Grados",
        href: "/dashboard/docentes/asignacion-grado", 
    },
    {
        icon: PenBoxIcon,
        label: "Asignar Materias",
        href: "/dashboard/docentes/asignacion-materias", 
    },
    {
        icon: CalendarClock,
        label: "Horarios",
        href: "/dashboard/docentes/asignacion-horarios", 
    },

]
export const DataSeccionesSidebar = [
    {
        icon: ClipboardEdit,
        label: "Aperturar Secciones",
        href: "/dashboard/secciones", 
    },
    {
        icon: FileText,
        label: "Generar Nómina",
        href: "/dashboard/secciones/nomina", 
    },
    {
        icon:   LucideArrowLeftRight,
        label: "Historia de Secciones",
        href: "/dashboard/secciones/historial", 
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
        href: "/dashboard/periodos-escolares", 
    },
    {
        icon: CalendarClock,
        label: "Lapsos",
        href: "/dashboard/periodos-escolares/lapsos", 
    },
    {
        icon: CalendarClock,
        label: "Cortes",
        href: "/dashboard/periodos-escolares/cortes", 
    }
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
    {
        icon: FileText,
        label: "Corte de Notas",
        href: "/dashboard/notas/corte-notas",
    },
    {
        icon: FileText,
        label: "Ver Notas",
        href: "/dashboard/ver-notas",
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

export const DataEvaluacionesAdminSidebar = [
    {
        icon: FileText,
        label: "Ver / Editar Evaluaciones",
        href: "/dashboard/ver-evaluaciones",
    },
]