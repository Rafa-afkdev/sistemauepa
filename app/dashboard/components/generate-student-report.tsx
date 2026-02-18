"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Estudiantes } from "@/interfaces/estudiantes.interface";
import type { Representante } from "@/interfaces/representante.interface";
import { db, getCollection } from "@/lib/data/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { useEffect, useState } from "react";

export const GenerateStudentReport = () => {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [isCompleteReport, setIsCompleteReport] = useState(false);

  // Data States
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [allSecciones, setAllSecciones] = useState<any[]>([]);
  
  // Selection States
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [nivelEducativoSeleccionado, setNivelEducativoSeleccionado] = useState("");
  const [gradoAnioSeleccionado, setGradoAnioSeleccionado] = useState("");
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("");

  // Derived Options
  const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);
  const [gradosAnios, setGradosAnios] = useState<string[]>([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<any[]>([]);

  // 1. Load Periods when dialog opens
  useEffect(() => {
    if (open && periodos.length === 0) {
      const cargarPeriodos = async () => {
        setLoading(true);
        try {
          const q = collection(db, "periodos_escolares");
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as { periodo: string; status: string })
          }));
          setPeriodos(data);
          
          const activo = data.find(p => p.status === "ACTIVO");
          if (activo) setPeriodoSeleccionado(activo.id);
        } catch (error) {
          console.error("Error loading periods:", error);
        } finally {
          setLoading(false);
        }
      };
      cargarPeriodos();
    }
  }, [open]);

  // 2. Load Sections for selected period
  useEffect(() => {
    if (!periodoSeleccionado) return;

    const cargarSeccionesPeriodo = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "secciones"), where("id_periodo_escolar", "==", periodoSeleccionado));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSecciones(data);

        // Reset selections
        setNivelEducativoSeleccionado("");
        setGradoAnioSeleccionado("");
        setSeccionSeleccionada("");
      } catch (error) {
        console.error("Error loading sections:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarSeccionesPeriodo();
  }, [periodoSeleccionado]);

  // 3. Update Niveles based on AllSecciones
  useEffect(() => {
    if (allSecciones.length > 0) {
      const niveles = [...new Set(allSecciones.map(s => s.nivel_educativo))];
      setNivelesEducativos(niveles);
    } else {
      setNivelesEducativos([]);
    }
  }, [allSecciones]);

  // 4. Update Grados based on Nivel
  useEffect(() => {
    if (nivelEducativoSeleccionado && allSecciones.length > 0) {
      const grados = [...new Set(
        allSecciones
          .filter(s => s.nivel_educativo === nivelEducativoSeleccionado)
          .map(s => s.grado_año)
      )].sort((a, b) => parseInt(a) - parseInt(b));
      setGradosAnios(grados);
      setGradoAnioSeleccionado("");
      setSeccionSeleccionada("");
    } else {
      setGradosAnios([]);
    }
  }, [nivelEducativoSeleccionado, allSecciones]);

  // 5. Update Sections based on Grado
  useEffect(() => {
    if (gradoAnioSeleccionado && nivelEducativoSeleccionado && allSecciones.length > 0) {
      const filtered = allSecciones.filter(
        s => s.nivel_educativo === nivelEducativoSeleccionado && s.grado_año === gradoAnioSeleccionado
      );
      setSeccionesDisponibles(filtered);
      setSeccionSeleccionada("");
    } else {
      setSeccionesDisponibles([]);
    }
  }, [gradoAnioSeleccionado, nivelEducativoSeleccionado, allSecciones]);

  const generarReporteEstudiantes = async () => {
    if (isCompleteReport) {
      await generateCompleteReport();
    } else {
      await generateSimpleReport();
    }
  };

  const generateSimpleReport = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Students and Enrollments
      const [estudiantesDocs, inscripcionesDocs] = await Promise.all([
        getCollection("estudiantes") as Promise<Estudiantes[]>,
        getCollection("estudiantes_inscritos") as Promise<any[]>
      ]);

      // 2. Filter Active Enrollments
      const activeStudentIds = new Set(
        inscripcionesDocs
          .filter(i => (i.estado || "").toLowerCase() === "activo")
          .map(i => i.id_estudiante)
      );

      // 3. Filter and Sort Students
      const docs = estudiantesDocs.filter(est => activeStudentIds.has(est.id));
      let allEstudiantes = docs.sort((a, b) => Number(a.cedula) - Number(b.cedula));

      // 4. Filter by Section if selected
      if (seccionSeleccionada) {
        if (seccionSeleccionada === "TODAS") {
          // Filter by all sections of the selected grade
          const seccionIds = seccionesDisponibles.map(s => s.id);
          const estudiantesEnGrado = inscripcionesDocs
            .filter(i => seccionIds.includes(i.id_seccion) && i.estado?.toLowerCase() === "activo")
            .map(i => i.id_estudiante);
          
          allEstudiantes = allEstudiantes.filter(est => estudiantesEnGrado.includes(est.id));
        } else {
          // Find the section ID from the selected seccion value
          const seccionData = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
          if (seccionData) {
            const estudiantesEnSeccion = inscripcionesDocs
              .filter(i => i.id_seccion === seccionData.id && i.estado?.toLowerCase() === "activo")
              .map(i => i.id_estudiante);
            
            allEstudiantes = allEstudiantes.filter(est => estudiantesEnSeccion.includes(est.id));
          }
        }
      }

      if (allEstudiantes.length === 0) {
        showToast.error("No hay estudiantes activos para generar el reporte");
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalMasculino = allEstudiantes.filter(e => e.sexo === "MASCULINO").length;
      const totalFemenino = allEstudiantes.filter(e => e.sexo === "FEMENINO").length;

      // ===== PDF GENERATION (A4 VERTICAL - ORIGINAL FORMAT) =====
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Load logos
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

      const logo1Img = await pdfDoc.embedPng(logo1Bytes);
      const logo2Img = await pdfDoc.embedPng(logo2Bytes);
      const logo3Img = await pdfDoc.embedPng(logo3Bytes);

      // Page dimensions and table setup
      const pageWidth = 595.28;   // A4 width
      const pageHeight = 841.89;  // A4 height
      const margenIzquierdo = 50;
      const anchoColumna1 = 40;   // N°
      const anchoColumna2 = 100;  // CÉDULA
      const anchoTotal = 500;
      const anchoColumnaNombres = anchoTotal - anchoColumna1 - anchoColumna2; // 360
      const lineHeight = 15;
      const bottomMargin = 50;

      let currentPage: PDFPage | null = null;
      let currentY = 0;
      let pageStartY = 0;

      const addNewPage = () => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { width, height } = page.getSize();

        // Logos
        const yLogos = height - 110;
        page.drawImage(logo1Img, { x: 60, y: yLogos, width: 75, height: 65 });
        page.drawImage(logo2Img, { x: width / 2 - 95, y: yLogos, width: 180, height: 45 });
        page.drawImage(logo3Img, { x: width - 60 - 60, y: yLogos, width: 60, height: 60 });

        // Title
        const tituloTexto = "REPORTE DE ESTUDIANTES ACTIVOS";
        const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 20);
        page.drawText(tituloTexto, {
          x: width / 2 - tituloWidth / 2,
          y: height - 135,
          size: 20,
          font: helveticaBold,
          color: rgb(0, 0, 0.6),
        });

        // Table Header
        const headerY = height - 160;

        // Top horizontal line
        page.drawLine({
          start: { x: margenIzquierdo, y: headerY },
          end: { x: margenIzquierdo + anchoTotal, y: headerY },
          thickness: 1,
          color: rgb(0, 0, 0)
        });

        // Bottom header line
        page.drawLine({
          start: { x: margenIzquierdo, y: headerY - 25 },
          end: { x: margenIzquierdo + anchoTotal, y: headerY - 25 },
          thickness: 1,
          color: rgb(0, 0, 0)
        });

        // Header text
        page.drawText("N°", {
          x: margenIzquierdo + (anchoColumna1 / 2) - 5,
          y: headerY - 17,
          size: 12,
          font: helveticaBold
        });

        page.drawText("CÉDULA", {
          x: margenIzquierdo + anchoColumna1 + (anchoColumna2 / 2) - 25,
          y: headerY - 17,
          size: 12,
          font: helveticaBold
        });

        page.drawText("APELLIDOS Y NOMBRES", {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 + (anchoColumnaNombres / 2) - 60,
          y: headerY - 17,
          size: 12,
          font: helveticaBold
        });

        return { page, currentY: headerY - 25, pageStartY: headerY };
      };

      const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
        // Left border
        targetPage.drawLine({
          start: { x: margenIzquierdo, y: startY },
          end: { x: margenIzquierdo, y: endY },
          thickness: 1,
          color: rgb(0, 0, 0)
        });

        // After N°
        targetPage.drawLine({
          start: { x: margenIzquierdo + anchoColumna1, y: startY },
          end: { x: margenIzquierdo + anchoColumna1, y: endY },
          thickness: 1,
          color: rgb(0, 0, 0)
        });

        // After CÉDULA
        targetPage.drawLine({
          start: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: startY },
          end: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: endY },
          thickness: 1,
          color: rgb(0, 0, 0)
        });

        // Right border
        targetPage.drawLine({
          start: { x: margenIzquierdo + anchoTotal, y: startY },
          end: { x: margenIzquierdo + anchoTotal, y: endY },
          thickness: 1,
          color: rgb(0, 0, 0)
        });
      };

      // Create first page
      const firstPageData = addNewPage();
      currentPage = firstPageData.page;
      currentY = firstPageData.currentY;
      pageStartY = firstPageData.pageStartY;

      // Render students
      allEstudiantes.forEach((estudiante, index) => {
        if (currentY - lineHeight < bottomMargin) {
          // Close current page table
          drawVerticalLines(currentPage!, pageStartY, currentY);
          currentPage!.drawLine({
            start: { x: margenIzquierdo, y: currentY },
            end: { x: margenIzquierdo + anchoTotal, y: currentY },
            thickness: 1,
            color: rgb(0, 0, 0)
          });

          // Create new page
          const newPageData = addNewPage();
          currentPage = newPageData.page;
          currentY = newPageData.currentY;
          pageStartY = newPageData.pageStartY;
        }

        // N°
        const indexText = `${index + 1}`;
        const indexWidth = helveticaFont.widthOfTextAtSize(indexText, 10);
        currentPage!.drawText(indexText, {
          x: margenIzquierdo + (anchoColumna1 / 2) - (indexWidth / 2),
          y: currentY - lineHeight + 5,
          size: 10,
          font: helveticaFont
        });

        // CÉDULA (con tipo)
        const cedulaText = `${estudiante.tipo_cedula || "V"}-${estudiante.cedula}`;
        const cedulaWidth = helveticaFont.widthOfTextAtSize(cedulaText, 10);
        currentPage!.drawText(cedulaText, {
          x: margenIzquierdo + anchoColumna1 + (anchoColumna2 / 2) - (cedulaWidth / 2),
          y: currentY - lineHeight + 5,
          size: 10,
          font: helveticaFont
        });

        // APELLIDOS Y NOMBRES
        const nombreCompleto = `${estudiante.apellidos || ""} ${estudiante.nombres || ""}`.trim().toUpperCase();
        currentPage!.drawText(nombreCompleto, {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 10,
          y: currentY - lineHeight + 5,
          size: 10,
          font: helveticaFont
        });

        currentY -= lineHeight;

        // Horizontal separator line (except after last student)
        if (index < allEstudiantes.length - 1) {
          currentPage!.drawLine({
            start: { x: margenIzquierdo, y: currentY },
            end: { x: margenIzquierdo + anchoTotal, y: currentY },
            thickness: 0.5,
            color: rgb(0, 0, 0)
          });
        }
      });

      // Close final table
      drawVerticalLines(currentPage!, pageStartY, currentY);
      currentPage!.drawLine({
        start: { x: margenIzquierdo, y: currentY },
        end: { x: margenIzquierdo + anchoTotal, y: currentY },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      // Totals section
      if (currentY - 60 < bottomMargin) {
        const newPageData = addNewPage();
        currentPage = newPageData.page;
        currentY = pageHeight - 100;
      }

      const textoY = currentY - 20;
      currentPage!.drawText(`Total de estudiantes: ${allEstudiantes.length}`, {
        x: margenIzquierdo,
        y: textoY,
        size: 12,
        font: helveticaBold
      });
      currentPage!.drawText(`Varones: ${totalMasculino}`, {
        x: margenIzquierdo,
        y: textoY - 15,
        size: 12,
        font: helveticaBold
      });
      currentPage!.drawText(`Hembras: ${totalFemenino}`, {
        x: margenIzquierdo,
        y: textoY - 30,
        size: 12,
        font: helveticaBold
      });

      // Save and open in browser
      const pdfBytes = await pdfDoc.save();
      // @ts-expect-error - pdf-lib Uint8Array type incompatible with TS Blob constructor, works fine at runtime
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      
      // Clean up after a delay to ensure PDF opens
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast.success("Reporte simple generado exitosamente");
    } catch (error) {
      console.error("Error generando reporte simple:", error);
      showToast.error("Error al generar el reporte simple");
    } finally {
      setLoading(false);
    }
  };

  const generateCompleteReport = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Students, Enrollments, and Representatives
      const [estudiantesDocs, inscripcionesDocs, representantesDocs] = await Promise.all([
        getCollection("estudiantes") as Promise<Estudiantes[]>,
        getCollection("estudiantes_inscritos") as Promise<any[]>,
        getCollection("representantes") as Promise<Representante[]>
      ]);

      // 2. Filter Active Enrollments (Status: "activo")
      const activeStudentIds = new Set(
        inscripcionesDocs
          .filter(i => (i.estado || "").toLowerCase() === "activo")
          .map(i => i.id_estudiante)
      );

      // 3. Filter Students Collection by Active IDs
      const docs = estudiantesDocs.filter(est => activeStudentIds.has(est.id));

      // Ordenar por cédula en el cliente
      let allEstudiantes = docs.sort((a, b) => {
        return Number(a.cedula) - Number(b.cedula);
      });

      // 4. Filter by Section if selected
      if (seccionSeleccionada) {
        if (seccionSeleccionada === "TODAS") {
          // Filter by all sections of the selected grade
          const seccionIds = seccionesDisponibles.map(s => s.id);
          const estudiantesEnGrado = inscripcionesDocs
            .filter(i => seccionIds.includes(i.id_seccion) && i.estado?.toLowerCase() === "activo")
            .map(i => i.id_estudiante);
          
          allEstudiantes = allEstudiantes.filter(est => estudiantesEnGrado.includes(est.id));
        } else {
          // Find the section ID from the selected seccion value
          const seccionData = seccionesDisponibles.find(s => s.seccion === seccionSeleccionada);
          if (seccionData) {
            const estudiantesEnSeccion = inscripcionesDocs
              .filter(i => i.id_seccion === seccionData.id && i.estado?.toLowerCase() === "activo")
              .map(i => i.id_estudiante);
            
            allEstudiantes = allEstudiantes.filter(est => estudiantesEnSeccion.includes(est.id));
          }
        }
      }

      if (allEstudiantes.length === 0) {
        showToast.warning("No hay estudiantes registrados para generar el reporte.");
        setLoading(false);
        return;
      }

      // Calculate gender totals
      const totalMasculino = allEstudiantes.filter(e => e.sexo === "MASCULINO").length;
      const totalFemenino = allEstudiantes.filter(e => e.sexo === "FEMENINO").length;

      // Create a map of representatives by ID for quick lookup
      const representantesMap = new Map<string, Representante>();
      representantesDocs.forEach(rep => {
        if (rep.id) {
          representantesMap.set(rep.id, rep);
        }
      });

      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Cargar imágenes una sola vez
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

      const logo1Img = await pdfDoc.embedPng(logo1Bytes);
      const logo2Img = await pdfDoc.embedPng(logo2Bytes);
      const logo3Img = await pdfDoc.embedPng(logo3Bytes);

      // Metadatos de la tabla (TABLOID LANDSCAPE - horizontal)
      const margenIzquierdo = 40;
      const lineHeight = 16;
      const bottomMargin = 50;
      
      // Definir columnas con anchos optimizados para tabloid landscape
      const columns = [
        { header: "N°", width: 25 },
        { header: "CÉDULA", width: 55 },
        { header: "NOMBRES Y APELLIDOS", width: 180 },
        { header: "SEXO", width: 30 },
        { header: "F. NAC.", width: 55 },
        { header: "EDAD", width: 35 },
        { header: "ESTADO NAC.", width: 85 },
        { header: "MUNICIPIO", width: 70 },
        { header: "REPRESENTANTE", width: 120 },
        { header: "CÉD. REP.", width: 50 },
        { header: "TELÉFONO", width: 60 },
        { header: "DIRECCIÓN", width: 350 },
      ];
      
      const anchoTotal = columns.reduce((sum, col) => sum + col.width, 0);

      // Función auxiliar para crear página y cabecera
      const addNewPage = () => {
        // Tabloid Landscape: width=1224, height=792 (11" x 17" en horizontal)
        const page = pdfDoc.addPage([1224, 792]);
        const { width, height } = page.getSize();

        // Dimensiones y posiciones logos
        const logo1Width = 60, logo1Height = 52;
        const logo2Width = 150, logo2Height = 38;
        const logo3Width = 50, logo3Height = 50;
        const yLogos = height - 80;

        // Dibujar logos
        page.drawImage(logo1Img, { x: 50, y: yLogos, width: logo1Width, height: logo1Height });
        page.drawImage(logo2Img, { x: width / 2 - 75, y: yLogos, width: logo2Width, height: logo2Height });
        page.drawImage(logo3Img, { x: width - 50 - logo3Width, y: yLogos, width: logo3Width, height: logo3Height });

        // Título
        const tituloTexto = "REPORTE COMPLETO DE ESTUDIANTES";
        const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 16);
        page.drawText(tituloTexto, {
          x: width / 2 - tituloWidth / 2,
          y: height - 105,
          size: 16,
          font: helveticaBold,
          color: rgb(0, 0, 0.6),
        });

        // Cabecera tabla
        const headerY = height - 130;
        
        // Líneas horizontales cabecera
        page.drawLine({ 
          start: { x: margenIzquierdo, y: headerY }, 
          end: { x: margenIzquierdo + anchoTotal, y: headerY }, 
          thickness: 1, 
          color: rgb(0, 0, 0) 
        });
        page.drawLine({ 
          start: { x: margenIzquierdo, y: headerY - 20 }, 
          end: { x: margenIzquierdo + anchoTotal, y: headerY - 20 }, 
          thickness: 1, 
          color: rgb(0, 0, 0) 
        });

        // Textos cabecera - dibujar cada columna
        let currentX = margenIzquierdo;
        columns.forEach(col => {
          const textWidth = helveticaBold.widthOfTextAtSize(col.header, 8);
          page.drawText(col.header, { 
            x: currentX + (col.width / 2) - (textWidth / 2), 
            y: headerY - 13, 
            size: 8, 
            font: helveticaBold 
          });
          currentX += col.width;
        });

        return { page, currentY: headerY - 20 };
      };

      // Iniciar primera página
      let { page, currentY } = addNewPage();
      const { height: pageHeight } = page.getSize();
      const initialHeaderY = pageHeight - 130;

      // Helper para dibujar líneas verticales dado un rango Y
      const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
        let currentX = margenIzquierdo;
        
        // Línea inicial
        targetPage.drawLine({ 
          start: { x: currentX, y: startY }, 
          end: { x: currentX, y: endY }, 
          thickness: 1, 
          color: rgb(0, 0, 0) 
        });
        
        // Líneas entre columnas
        columns.forEach(col => {
          currentX += col.width;
          targetPage.drawLine({ 
            start: { x: currentX, y: startY }, 
            end: { x: currentX, y: endY }, 
            thickness: 1, 
            color: rgb(0, 0, 0) 
          });
        });
      };

      let pageStartY = initialHeaderY;

      // Helper para formatear fecha
      const formatFecha = (fecha: string) => {
        if (!fecha) return "N/A";
        try {
          const [year, month, day] = fecha.split('-');
          return `${day}/${month}/${year}`;
        } catch {
          return fecha;
        }
      };

      // Helper para calcular edad
      const calcularEdad = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return "N/A";
        try {
          const [year, month, day] = fechaNacimiento.split('-').map(Number);
          const birthDate = new Date(year, month - 1, day);
          const today = new Date();
          let edad = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            edad--;
          }
          return edad.toString();
        } catch {
          return "N/A";
        }
      };

      // Helper para formatear sexo
      const formatSexo = (sexo: string) => {
        if (!sexo) return "N/A";
        const s = sexo.toLowerCase();
        if (s === "masculino" || s === "m") return "M";
        if (s === "femenino" || s === "f") return "F";
        return sexo.charAt(0).toUpperCase();
      };

      // Helper para sanitizar texto (eliminar caracteres no soportados por WinAnsi)
      const sanitizeText = (text: string) => {
        if (!text) return "";
        return text
          .replace(/[\t\n\r]/g, " ") // Reemplazar tabs y newlines con espacio
          .replace(/\s+/g, " ") // Reemplazar múltiples espacios con uno solo
          .trim();
      };

      allEstudiantes.forEach((estudiante, index) => {
        // Verificar si cabe el siguiente registro
        if (currentY - lineHeight < bottomMargin) {
          // Cerrar tabla en página actual
          drawVerticalLines(page, pageStartY, currentY);
          page.drawLine({ 
            start: { x: margenIzquierdo, y: currentY }, 
            end: { x: margenIzquierdo + anchoTotal, y: currentY }, 
            thickness: 1, 
            color: rgb(0, 0, 0) 
          });
          
          // Nueva página
          const newPageData = addNewPage();
          page = newPageData.page;
          currentY = newPageData.currentY;
          const { height } = page.getSize();
          pageStartY = height - 130;
        }

        // Preparar datos
        const representante = estudiante.id_representante 
          ? representantesMap.get(estudiante.id_representante)
          : undefined;

        const datos = [
          `${index + 1}`, // N°
          sanitizeText(`${estudiante.tipo_cedula || "V"}-${estudiante.cedula}`), // CÉDULA CON TIPO
          sanitizeText(`${estudiante.nombres || ""} ${estudiante.apellidos || ""}`.trim() || "N/A"), // NOMBRES Y APELLIDOS
          formatSexo(estudiante.sexo || ""), // SEXO (M/F)
          formatFecha(estudiante.fechaNacimiento), // F. NAC.
          calcularEdad(estudiante.fechaNacimiento), // EDAD
          sanitizeText(estudiante.estado_nacimiento || "N/A"), // ESTADO NAC.
          sanitizeText(estudiante.municipio || "N/A"), // MUNICIPIO
          sanitizeText(representante ? `${representante.nombres} ${representante.apellidos}` : "N/A"), // REPRESENTANTE
          sanitizeText(representante ? `${representante.tipo_cedula}-${representante.cedula}` : "N/A"), // CÉD. REP.
          sanitizeText(representante?.telefono_principal || "N/A"), // TELÉFONO
          sanitizeText(representante?.direccion || "N/A"), // DIRECCIÓN
        ];

        // Dibujar cada celda
        let currentX = margenIzquierdo;
        datos.forEach((dato, colIndex) => {
          const col = columns[colIndex];
          const fontSize = 7;
          
          // Truncar texto si es muy largo
          let displayText = dato;
          const maxWidth = col.width - 4;
          let textWidth = helveticaFont.widthOfTextAtSize(displayText, fontSize);
          
          while (textWidth > maxWidth && displayText.length > 3) {
            displayText = displayText.substring(0, displayText.length - 1);
            textWidth = helveticaFont.widthOfTextAtSize(displayText + "...", fontSize);
          }
          if (displayText !== dato) {
            displayText += "...";
          }
          
          // Centrar para columnas pequeñas, alinear a la izquierda para columnas grandes
          const shouldCenter = col.width < 60;
          const xPos = shouldCenter 
            ? currentX + (col.width / 2) - (helveticaFont.widthOfTextAtSize(displayText, fontSize) / 2)
            : currentX + 2;
          
          page.drawText(displayText, {
            x: xPos,
            y: currentY - lineHeight + 5,
            size: fontSize,
            font: helveticaFont,
          });
          
          currentX += col.width;
        });

        currentY -= lineHeight;

        // Dibujar línea horizontal separadora
        page.drawLine({
          start: { x: margenIzquierdo, y: currentY },
          end: { x: margenIzquierdo + anchoTotal, y: currentY },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
      });

      // Cerrar tabla en la última página
      drawVerticalLines(page, pageStartY, currentY);
      page.drawLine({ 
        start: { x: margenIzquierdo, y: currentY }, 
        end: { x: margenIzquierdo + anchoTotal, y: currentY }, 
        thickness: 1, 
        color: rgb(0, 0, 0) 
      });

      // Totales section
      const textoY = currentY - 20;
      page.drawText(`Total de estudiantes: ${allEstudiantes.length}`, {
        x: margenIzquierdo,
        y: textoY,
        size: 10,
        font: helveticaBold,
      });
      page.drawText(`Varones: ${totalMasculino}`, {
        x: margenIzquierdo,
        y: textoY - 15,
        size: 10,
        font: helveticaBold,
      });
      page.drawText(`Hembras: ${totalFemenino}`, {
        x: margenIzquierdo,
        y: textoY - 30,
        size: 10,
        font: helveticaBold,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error("Error al generar reporte:", error);
      showToast.error("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative overflow-hidden group"
        onClick={() => setOpen(true)}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2">
          <FileText className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ${loading ? 'opacity-50' : ''}`} />
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap text-xs font-medium text-primary"
              >
                Generar Reporte
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Generar Reporte de Estudiantes</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona los filtros (opcional) y el tipo de reporte que deseas generar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* FILTERS SECTION */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="font-semibold text-sm">Filtros (Opcional - para reporte por sección)</h3>
            
            {/* Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período Escolar</label>
              <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.periodo} {p.status === "ACTIVO" ? "(Activo)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nivel */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nivel Educativo</label>
              <Select value={nivelEducativoSeleccionado} onValueChange={setNivelEducativoSeleccionado} disabled={!periodoSeleccionado || loading || nivelesEducativos.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione nivel" />
                </SelectTrigger>
                <SelectContent>
                  {nivelesEducativos.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grado/Año */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Grado / Año</label>
              <Select value={gradoAnioSeleccionado} onValueChange={setGradoAnioSeleccionado} disabled={!nivelEducativoSeleccionado || loading || gradosAnios.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione grado/año" />
                </SelectTrigger>
                <SelectContent>
                  {gradosAnios.map((grado) => (
                    <SelectItem key={grado} value={grado}>{grado}°</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sección */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sección</label>
              <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada} disabled={!gradoAnioSeleccionado || loading || seccionesDisponibles.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las secciones</SelectItem>
                  {seccionesDisponibles.map((seccion) => (
                    <SelectItem key={seccion.id} value={seccion.seccion}>{seccion.seccion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="completeReport" 
                checked={isCompleteReport} 
                onCheckedChange={(checked) => setIsCompleteReport(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="completeReport" className="text-sm font-medium cursor-pointer">
                  Generar reporte completo
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {isCompleteReport ? (
                    <>
                      <strong>Reporte Completo:</strong> Incluye datos del estudiante (Cédula, Nombres, Apellidos, Sexo, Fecha de nacimiento, Edad, Estado y Municipio) y del representante (Nombre, Cédula, Parentesco, Teléfono y Dirección).
                    </>
                  ) : (
                    <>
                      <strong>Reporte Simple:</strong> Incluye solo Número de orden, Cédula completa (con tipo), Apellidos y Nombres.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setOpen(false);
                generarReporteEstudiantes();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generar reporte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
