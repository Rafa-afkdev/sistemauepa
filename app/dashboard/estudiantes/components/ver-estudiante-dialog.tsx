import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Secciones } from "@/interfaces/secciones.interface";
import { Representante } from "@/interfaces/users.interface";
import { getDocument } from "@/lib/data/firebase";
import {
    Calendar,
    Eye,
    GraduationCap,
    Home,
    Mail,
    MapPin,
    Phone,
    User,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface VerEstudianteDialogProps {
  student: Estudiantes;
  estatus: string;
}

export function VerEstudianteDialog({ student, estatus }: VerEstudianteDialogProps) {
  const [open, setOpen] = useState(false);
  const [representante, setRepresentante] = useState<Representante | null>(null);
  const [seccion, setSeccion] = useState<Secciones | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch Representante
          if (student.id_representante) {
            const repData = (await getDocument(
              `representantes/${student.id_representante}`
            )) as Representante;
            setRepresentante(repData);
          }

          // Fetch Seccion actual if needed (though we might display IDs or basic info)
          if (student.seccion_actual) {
             const secData = (await getDocument(
                `secciones/${student.seccion_actual}`
             )) as Secciones;
             setSeccion(secData);
          }
        } catch (error) {
          console.error("Error fetching details:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [open, student]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No registrada";
    return new Date(dateString).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 mx-1">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold border-2 border-blue-200">
              {student.nombres.charAt(0)}
              {student.apellidos.charAt(0)}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {student.nombres} {student.apellidos}
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-slate-600 mt-1">
                C.I: {student.tipo_cedula}-{student.cedula}
              </DialogDescription>
              <div className="flex gap-2 mt-2">
                <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                    estatus === "INSCRITO"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : estatus === "SIN ASIGNAR"
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }`}
                >
                    {estatus}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {student.tipo_estudiante?.toUpperCase() || "REGULAR"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="academica">Información Académica</TabsTrigger>
              <TabsTrigger value="representante">Representante</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6 bg-white">
            <TabsContent value="personal" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem icon={<Calendar className="w-4 h-4"/>} label="Fecha de Nacimiento" value={formatDate(student.fechaNacimiento)} />
                    <InfoItem icon={<User className="w-4 h-4"/>} label="Sexo" value={student.sexo === "M" ? "Masculino" : student.sexo === "F" ? "Femenino" : student.sexo} />
                    <InfoItem icon={<MapPin className="w-4 h-4"/>} label="Estado de Nacimiento" value={student.estado_nacimiento} />
                </div>
            </TabsContent>

            <TabsContent value="academica" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem 
                        icon={<GraduationCap className="w-4 h-4"/>} 
                        label="Año / Grado Actual" 
                        value={seccion ? `${seccion.grado_año}° ${seccion.nivel_educativo}` : student.año_actual || "No asignado"} 
                    />
                    <InfoItem 
                        icon={<Users className="w-4 h-4"/>} 
                        label="Sección Actual" 
                        value={seccion ? `"${seccion.seccion}" - ${seccion.turno}` : "No asignada"} 
                    />
                     <InfoItem 
                        icon={<Calendar className="w-4 h-4"/>} 
                        label="Período Escolar Actual" 
                        value={student.periodo_escolar_actual ? "2025-2026" : "No asignado"} // TODO: Fetch period name if only ID is available
                    /> 
                </div>
            </TabsContent>

            <TabsContent value="representante" className="mt-0 space-y-6">
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Cargando datos del representante...</div>
                ) : representante ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoItem icon={<User className="w-4 h-4"/>} label="Nombre Completo" value={`${representante.nombres} ${representante.apellidos}`} fullWidth />
                        <InfoItem icon={<User className="w-4 h-4"/>} label="Cédula" value={`${representante.tipo_cedula}-${representante.cedula}`} />
                        <InfoItem icon={<Users className="w-4 h-4"/>} label="Parentesco" value={representante.parentesco} />
                        
                        <div className="md:col-span-2 pt-2">
                            <Separator className="mb-4" />
                            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4 inline" /> Datos de Contacto
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem icon={<Phone className="w-4 h-4"/>} label="Teléfono Principal" value={representante.telefono_principal} />
                                <InfoItem icon={<Phone className="w-4 h-4"/>} label="Teléfono Secundario" value={representante.telefono_secundario || "No registrado"} />
                                <InfoItem icon={<Mail className="w-4 h-4"/>} label="Correo Electrónico" value={representante.email} fullWidth />
                                <InfoItem icon={<Home className="w-4 h-4"/>} label="Dirección" value={representante.direccion} fullWidth />
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        No hay representante asociado
                    </div>
                )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <div className="p-4 border-t bg-slate-50 flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon, label, value, fullWidth = false }: { icon?: React.ReactNode; label: string; value: string | undefined | null; fullWidth?: boolean }) {
    return (
        <div className={`space-y-1 ${fullWidth ? "col-span-1 md:col-span-2" : ""}`}>
            <p className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1.5">
                {icon && <span className="text-slate-400">{icon}</span>}
                {label}
            </p>
            <p className="font-medium text-slate-900">{value || "No registrado"}</p>
        </div>
    )
}

function SmallInfoItem({ label, value }: { label: string; value: string | undefined | null }) {
    return (
        <div>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium">{value || "-"}</p>
        </div>
    )
}
