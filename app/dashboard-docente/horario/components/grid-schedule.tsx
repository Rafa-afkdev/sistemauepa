"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HorarioClase } from "@/interfaces/horarios.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Fragment, useMemo } from "react";

const DAYS = [
  { id: 1, name: "Lunes", short: "LUN" },
  { id: 2, name: "Martes", short: "MAR" },
  { id: 3, name: "Miércoles", short: "MIÉ" },
  { id: 4, name: "Jueves", short: "JUE" },
  { id: 5, name: "Viernes", short: "VIE" },
];

const BLOCKS = Array.from({ length: 9 }, (_, i) => i + 1);

// Palette for subtle professional accents (Border & Text)
const ACCENT_COLORS = [
  { border: "border-l-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50/30", badge: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
  { border: "border-l-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50/30", badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  { border: "border-l-amber-500", text: "text-amber-700", bg: "bg-amber-50/30", badge: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  { border: "border-l-rose-500", text: "text-rose-700", bg: "bg-rose-50/30", badge: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
  { border: "border-l-cyan-500", text: "text-cyan-700", bg: "bg-cyan-50/30", badge: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200" },
  { border: "border-l-violet-500", text: "text-violet-700", bg: "bg-violet-50/30", badge: "bg-violet-100 text-violet-700 hover:bg-violet-200" },
  { border: "border-l-slate-500", text: "text-slate-700", bg: "bg-slate-50/30", badge: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
];

interface GridScheduleProps {
  loading: boolean;
  horarios: HorarioClase[];
  periodos: PeriodosEscolares[];
  selectedPeriodoId: string;
  onPeriodChange: (value: string) => void;
}

export function GridSchedule({ loading, horarios, periodos, selectedPeriodoId, onPeriodChange }: GridScheduleProps) {
  
  // Map subjects to accent colors consistently
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, typeof ACCENT_COLORS[0]>();
    const uniqueSubjects = Array.from(new Set(horarios.map(h => h.nombre_materia).filter(Boolean)));
    uniqueSubjects.forEach((subject, index) => {
      map.set(subject!, ACCENT_COLORS[index % ACCENT_COLORS.length]);
    });
    return map;
  }, [horarios]);

  // Helper to render cell content
  const renderCell = (dia: number, bloque: number) => {
    const entry = horarios.find(h => h.dia === dia && h.bloque_horario === bloque);
    
    if (entry) {
      const colors = subjectColorMap.get(entry.nombre_materia || "") || ACCENT_COLORS[0];
      
      return (
        <div className={`h-full w-full p-2.5 ${colors.bg} rounded-lg border ${colors.border} flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden`}>
          {/* Subject and Section */}
          <div className="z-10">
            <div className={`font-bold text-xs ${colors.text} break-words line-clamp-2 group-hover:line-clamp-none transition-all`}>
              {entry.nombre_materia || "Materia"}
            </div>
            <Badge className={`mt-1.5 text-[10px] ${colors.badge} border-0 px-2 py-0.5`}>
              {entry.nombre_seccion}
            </Badge>
          </div>
          
          {/* Time Display - Improved */}
          <div className="z-10 mt-2 bg-white rounded-md shadow-sm border border-gray-200 px-2 py-1.5">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-bold text-slate-700">
                {entry.hora_inicio}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">-</span>
              <span className="text-[11px] font-bold text-slate-700">
                {entry.hora_fin}
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
        <span className="text-slate-400 text-xs font-medium">Libre</span>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Horario Semanal
            </CardTitle>
            <CardDescription className="mt-1">
              Visualiza tu distribución de clases por día y bloque horario
            </CardDescription>
          </div>
          
          {/* Period Selector */}
          <div className="w-full md:w-64">
            <Select value={selectedPeriodoId} onValueChange={onPeriodChange}>
              <SelectTrigger className="bg-white shadow-sm">
                <SelectValue placeholder="Seleccione período" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map(p => (
                  <SelectItem key={p.id} value={p.id!}>
                    {p.periodo} {p.status === 'ACTIVO' && '(Activo)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        {/* Schedule Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed rounded-xl bg-slate-50">
            <Loader2 className="w-14 h-14 mb-4 animate-spin text-slate-400" />
            <p className="text-lg font-medium">Cargando horario...</p>
          </div>
        ) : selectedPeriodoId ? (
          <div className="rounded-lg overflow-hidden border border-slate-300 bg-white shadow-sm">
            <div className="grid grid-cols-6 divide-x divide-slate-200 bg-white">
              {/* Header Row */}
              <div className="p-4 bg-slate-100 font-semibold text-center text-sm text-slate-700 flex items-center justify-center border-b border-slate-300">
                Bloque
              </div>
              {DAYS.map(d => (
                <div key={d.id} className="p-4 bg-slate-100 font-semibold text-center text-sm text-slate-700 border-b border-slate-300">
                  <div className="hidden md:block">{d.name}</div>
                  <div className="md:hidden">{d.short}</div>
                </div>
              ))}
              
              {/* Rows */}
              {BLOCKS.map((bloque, bloqueIndex) => (
                <Fragment key={bloque}>
                  {/* Row Header Cell */}
                  <div className={`p-3 ${bloqueIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'} font-medium text-center text-sm text-slate-600 flex items-center justify-center border-b border-slate-200`}>
                    {bloque}°
                  </div>
                  
                  {/* Day Cells */}
                  {DAYS.map(day => (
                    <div key={`${day.id}-${bloque}`} className={`h-32 md:h-36 p-2 border-b border-slate-200 ${bloqueIndex % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} transition-colors`}>
                      {renderCell(day.id, bloque)}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed rounded-xl bg-slate-50">
            <Clock className="w-14 h-14 mb-4 opacity-50" />
            <p className="text-lg font-medium">Seleccione un período para visualizar su horario</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
