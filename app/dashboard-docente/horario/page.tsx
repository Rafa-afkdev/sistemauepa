"use client";

import { useUser } from "@/hooks/use-user";
import { HorarioClase } from "@/interfaces/horarios.interface";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { getCollection } from "@/lib/data/firebase";
import { orderBy, where } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useMemo, useState } from "react";
import { GridSchedule } from "./components/grid-schedule";
import { HeaderSchedule } from "./components/header-schedule";
import { StatsSchedule } from "./components/stats-schedule";
import { generateSchedulePDF } from "./utils/generateSchedulePDF";

export default function MiHorarioPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Data State
  const [periodos, setPeriodos] = useState<PeriodosEscolares[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalClasses = horarios.length;
    const uniqueSubjects = new Set(horarios.map(h => h.nombre_materia)).size;
    const uniqueSections = new Set(horarios.map(h => h.nombre_seccion)).size;
    return { totalClasses, uniqueSubjects, uniqueSections };
  }, [horarios]);

  // Initial Load - Fetch Periods
  useEffect(() => {
    const loadPeriods = async () => {
      setLoading(true);
      try {
        const persData = await getCollection("periodos_escolares", [orderBy("createdAt", "desc")]);
        setPeriodos(persData as PeriodosEscolares[]);
        
        // Auto-select active period
        const activePeriod = (persData as PeriodosEscolares[]).find(p => p.status === "ACTIVO");
        if (activePeriod) setSelectedPeriodoId(activePeriod.id!);
        
      } catch (error) {
        console.error(error);
        showToast.error("Error cargando períodos escolares");
      } finally {
        setLoading(false);
      }
    };
    
    loadPeriods();
  }, []);

  // Fetch Teacher Schedule
  useEffect(() => {
    if (!user?.uid || !selectedPeriodoId) {
      setHorarios([]);
      return;
    }

    const loadSchedule = async () => {
      setLoading(true);
      try {
        const schedule = await getCollection("horarios_clase", [
          where("id_docente", "==", user.uid),
          where("id_periodo_escolar", "==", selectedPeriodoId),
        ]);
        setHorarios(schedule as HorarioClase[]);

      } catch (error) {
        console.error(error);
        showToast.error("Error cargando horario");
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
    loadSchedule();
  }, [user, selectedPeriodoId]);

  const handleDownloadPDF = async () => {
    if (!horarios.length || !selectedPeriodoId) {
      showToast.error("No hay horario para descargar");
      return;
    }

    setDownloading(true);
    try {
      const currentPeriod = periodos.find(p => p.id === selectedPeriodoId);
      
      await generateSchedulePDF({
        teacherName: user?.name || "Docente",
        periodName: currentPeriod?.periodo || "Periodo Actual",
        schedules: horarios
      });
      
      showToast.success("PDF generado correctamente");
    } catch (error) {
      console.error(error);
      showToast.error("Error al generar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <HeaderSchedule 
        onDownloadPDF={handleDownloadPDF} 
        downloading={downloading} 
      />

      {/* Stats Cards */}
      {selectedPeriodoId && horarios.length > 0 && (
        <StatsSchedule stats={stats} />
      )}

      {/* Schedule Grid */}
      <GridSchedule 
        loading={loading}
        horarios={horarios}
        periodos={periodos}
        selectedPeriodoId={selectedPeriodoId}
        onPeriodChange={setSelectedPeriodoId}
      />
    </div>
  );
}
