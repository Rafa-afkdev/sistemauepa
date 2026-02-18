"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, GraduationCap } from "lucide-react";

interface ScheduleStatsProps {
  stats: {
    totalClasses: number;
    uniqueSubjects: number;
    uniqueSections: number;
  };
}

export function StatsSchedule({ stats }: ScheduleStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total de Clases</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalClasses}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Materias</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.uniqueSubjects}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Secciones</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.uniqueSections}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
