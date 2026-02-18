import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { FileText, GraduationCap, Loader2 } from "lucide-react";

interface HeaderScheduleProps {
  onDownloadPDF?: () => void;
  downloading?: boolean;
}

export function HeaderSchedule({ onDownloadPDF, downloading }: HeaderScheduleProps) {
  const { user } = useUser();

  return (
    <Card className="shadow-lg border-t-4 border-t-indigo-600">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900">
                Mi Horario de Clases
              </CardTitle>
              <CardDescription className="mt-1">
                Bienvenido/a, {user?.name || "Docente"}
              </CardDescription>
            </div>
          </div>
          
          {onDownloadPDF && (
            <Button 
              onClick={onDownloadPDF} 
              disabled={downloading}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Horario
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
