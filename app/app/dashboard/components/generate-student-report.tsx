"use client";

import { Button } from "@/components/ui/button";
import type { Estudiantes } from "@/interfaces/estudiantes.interface";
import { getCollection } from "@/lib/data/firebase";
import { FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { useState } from "react";

export const GenerateStudentReport = () => {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const generarReporteEstudiantes = async () => {
    try {
      setLoading(true);
      const docs = (await getCollection("estudiantes")) as Estudiantes[];

      // Ordenar por cédula en el cliente
      const allEstudiantes = docs.sort((a, b) => {
        return Number(a.cedula) - Number(b.cedula);
      });

      if (allEstudiantes.length === 0) {
        showToast.warning("No hay estudiantes registrados para generar el reporte.");
        setLoading(false);
        return;
      }

      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Metadatos de la tabla
      const margenIzquierdo = 50;
      const anchoColumna1 = 40;
      const anchoColumna2 = 100;
      const anchoTotal = 500;
      const lineHeight = 18;
      const bottomMargin = 50; // Margen inferior para cambiar de página

      // Cargar imágenes una sola vez
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

      const logo1Img = await pdfDoc.embedPng(logo1Bytes);
      const logo2Img = await pdfDoc.embedPng(logo2Bytes);
      const logo3Img = await pdfDoc.embedPng(logo3Bytes);

      // Función auxiliar para crear pagina y cabecera
      const addNewPage = () => {
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        const { width, height } = page.getSize();

        // Dimensiones y posiciones logos
        const logo1Width = 75, logo1Height = 65;
        const logo2Width = 180, logo2Height = 45;
        const logo3Width = 60, logo3Height = 60;
        const yLogos = height - 110;

        // Dibujar logos
        page.drawImage(logo1Img, { x: 60, y: yLogos, width: logo1Width, height: logo1Height });
        page.drawImage(logo2Img, { x: width / 2 - 95, y: yLogos, width: logo2Width, height: logo2Height });
        page.drawImage(logo3Img, { x: width - 60 - logo3Width, y: yLogos, width: logo3Width, height: logo3Height });

        // Título
        const tituloTexto = "REPORTE DE ESTUDIANTES";
        const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 18);
        page.drawText(tituloTexto, {
          x: width / 2 - tituloWidth / 2,
          y: height - 135,
          size: 18,
          font: helveticaBold,
          color: rgb(0, 0, 0.6),
        });

        // Cabecera tabla
        const headerY = height - 160;
        
        // Líneas horizontales cabecera
        page.drawLine({ start: { x: margenIzquierdo, y: headerY }, end: { x: margenIzquierdo + anchoTotal, y: headerY }, thickness: 1, color: rgb(0, 0, 0) });
        page.drawLine({ start: { x: margenIzquierdo, y: headerY - 25 }, end: { x: margenIzquierdo + anchoTotal, y: headerY - 25 }, thickness: 1, color: rgb(0, 0, 0) });

        // Textos cabecera
        page.drawText("N°", { x: margenIzquierdo + anchoColumna1 / 2 - 5, y: headerY - 17, size: 12, font: helveticaBold });
        page.drawText("CÉDULA", { x: margenIzquierdo + anchoColumna1 + anchoColumna2 / 2 - 25, y: headerY - 17, size: 12, font: helveticaBold });
        page.drawText("APELLIDOS Y NOMBRES", { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 90, y: headerY - 17, size: 12, font: helveticaBold });

        return { page, currentY: headerY - 25 };
      };

      // Iniciar primera página
      let { page, currentY } = addNewPage();
      const { height: pageHeight } = page.getSize();
      const initialHeaderY = pageHeight - 160; // Posición Y donde empieza la tabla

      // Helper para dibujar líneas verticales dado un rango Y
      const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
        targetPage.drawLine({ start: { x: margenIzquierdo, y: startY }, end: { x: margenIzquierdo, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        targetPage.drawLine({ start: { x: margenIzquierdo + anchoColumna1, y: startY }, end: { x: margenIzquierdo + anchoColumna1, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        targetPage.drawLine({ start: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: startY }, end: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        targetPage.drawLine({ start: { x: margenIzquierdo + anchoTotal, y: startY }, end: { x: margenIzquierdo + anchoTotal, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
      };
      
      let pageStartY = initialHeaderY; // Para saber donde empezaron las líneas verticales en la página actual

      allEstudiantes.forEach((estudiante, index) => {
        // Verificar si cabe el siguiente registro
        if (currentY - lineHeight < bottomMargin) {
          // 1. Cerrar tabla en página actual
          drawVerticalLines(page, pageStartY, currentY);
          page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 1, color: rgb(0, 0, 0) }); // Línea inferior de cierre
          
          // 2. Nueva página
          const newPageData = addNewPage();
          page = newPageData.page;
          currentY = newPageData.currentY;
          const { height } = page.getSize();
          pageStartY = height - 160; // Resetear inicio de líneas verticales para la nueva página
        }

        // Datos del estudiante
        const indexText = `${index + 1}`;
        const indexWidth = helveticaFont.widthOfTextAtSize(indexText, 12);
        const cedulaText = `${estudiante.cedula}`;
        const cedulaWidth = helveticaFont.widthOfTextAtSize(cedulaText, 12);

        page.drawText(indexText, {
          x: margenIzquierdo + anchoColumna1 / 2 - indexWidth / 2,
          y: currentY - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });

        page.drawText(cedulaText, {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 / 2 - cedulaWidth / 2,
          y: currentY - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });

        const fullName = `${estudiante.apellidos} ${estudiante.nombres}`.toUpperCase();
        
        // Truncar nombre si es muy largo (opcional, pero buena práctica)
        // Por ahora lo dejamos simple
        page.drawText(fullName, {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 30,
          y: currentY - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });

        currentY -= lineHeight;

        // Dibujar línea horizontal separadora (excepto si es el mismo final de la tabla, que se dibuja afuera)
         page.drawLine({
            start: { x: margenIzquierdo, y: currentY },
            end: { x: margenIzquierdo + anchoTotal, y: currentY },
            thickness: 0.5, // Más fina para separar filas
            color: rgb(0, 0, 0),
          });
      });

      // Cerrar tabla en la última página
      drawVerticalLines(page, pageStartY, currentY);
      page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 1, color: rgb(0, 0, 0) });

      // Totales
      page.drawText(`Total de estudiantes: ${allEstudiantes.length}`, {
        x: margenIzquierdo,
        y: currentY - 20,
        size: 12,
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
    <Button
      variant="ghost"
      size="sm"
      className="relative overflow-hidden group"
      onClick={generarReporteEstudiantes}
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
  );
};
