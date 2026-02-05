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
import type { Estudiantes } from "@/interfaces/estudiantes.interface";
import type { Representante } from "@/interfaces/representante.interface";
import { getCollection } from "@/lib/data/firebase";
import { FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { useState } from "react";

export const GenerateStudentReport = () => {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const generarReporteEstudiantes = async () => {
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
      const allEstudiantes = docs.sort((a, b) => {
        return Number(a.cedula) - Number(b.cedula);
      });

      if (allEstudiantes.length === 0) {
        showToast.warning("No hay estudiantes registrados para generar el reporte.");
        setLoading(false);
        return;
      }

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
        { header: "CÉDULA", width: 80 },
        { header: "NOMBRES Y APELLIDOS", width: 180 },
        { header: "SEXO", width: 30 },
        { header: "F. NAC.", width: 65 },
        { header: "EDAD", width: 35 },
        { header: "ESTADO NAC.", width: 85 },
        { header: "MUNICIPIO", width: 95 },
        { header: "REPRESENTANTE", width: 150 },
        { header: "CÉD. REP.", width: 75 },
        { header: "PARENTESCO", width: 70 },
        { header: "TELÉFONO", width: 75 },
        { header: "DIRECCIÓN", width: 150 },
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
          sanitizeText(representante?.parentesco || "N/A"), // PARENTESCO
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

      // Totales
      page.drawText(`Total de estudiantes: ${allEstudiantes.length}`, {
        x: margenIzquierdo,
        y: currentY - 20,
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
        onClick={() => setShowConfirmDialog(true)}
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generar Reporte Completo de Estudiantes</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea generar el reporte con absolutamente todos los datos de los estudiantes activos y sus representantes?
            </AlertDialogDescription>
            <div className="text-sm text-muted-foreground mt-3">
              <strong>Datos del estudiante:</strong> Cédula completa, Apellidos y nombres, Sexo, Fecha de nacimiento, Edad, Lugar de nacimiento (Estado y Municipio).
              <br />
              <strong>Datos del representante:</strong> Nombre completo, Cédula, Parentesco, Teléfono de contacto y Dirección.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowConfirmDialog(false);
                generarReporteEstudiantes();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sí, generar reporte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
