"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCollection } from "@/lib/data/firebase";
import { FileText, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { useState } from "react";

export const GenerateRepresentativeReport = () => {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [incluirFirma, setIncluirFirma] = useState(false);

  const generarReporte = async () => {
    try {
      setGenerating(true);

      const [representantesDocs, periodosDocs, inscripcionesDocs] = await Promise.all([
         getCollection("representantes"),
         getCollection("periodos_escolares"),
         getCollection("estudiantes_inscritos") // We'll filter in memory or fetch all. Better to fetch all for now or optimize later.
      ]);
      
      const periodos = periodosDocs as any[];
      const activePeriod = periodos.find(p => p.status === 'ACTIVO');
      
      if (!activePeriod) {
          showToast.warning("No hay un periodo escolar activo.");
          setGenerating(false);
          return;
      }
      
      const activeEnrollments = (inscripcionesDocs as any[]).filter(
          ins => ins.id_periodo_escolar === activePeriod.id && ins.estado === 'activo'
      );
      
      const activeStudentIds = new Set(activeEnrollments.map(ins => ins.id_estudiante));

      const processedRepresentantes = (representantesDocs as any[]).map(rep => {
          const activeStudents = (rep.estudiantes_ids || []).filter((studentId: string) => activeStudentIds.has(studentId));
          return {
              ...rep,
              activeStudentCount: activeStudents.length
          };
      }).filter(rep => rep.activeStudentCount > 0);

      // Sort by Cedula
      const representantes = processedRepresentantes.sort((a, b) => {
        return Number(a.cedula) - Number(b.cedula);
      });

      if (representantes.length === 0) {
        showToast.warning("No hay representantes con estudiantes activos en el periodo actual.");
        setGenerating(false);
        return;
      }

      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Tabla configuration
      const margenIzquierdo = 50;
      const anchoTotal = 500;
      
      // Column widths depend on if signature is included
      const anchoColumna1 = 30;  // N°
      const anchoColumna2 = 60;  // Cédula
      // If signature included, reduce name width
      const anchoColumna4 = 40; // # Estudiantes
      const anchoColumna5 = incluirFirma ? 100 : 0; // Firma
      const anchoColumna3 = anchoTotal - anchoColumna1 - anchoColumna2 - anchoColumna4 - anchoColumna5; // Nombre/Apellido takes remaining space

      const lineHeight = 18;
      const bottomMargin = 50;

      // Cargar imágenes
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

      const logo1Img = await pdfDoc.embedPng(logo1Bytes);
      const logo2Img = await pdfDoc.embedPng(logo2Bytes);
      const logo3Img = await pdfDoc.embedPng(logo3Bytes);

      const addNewPage = () => {
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        const { width, height } = page.getSize();

        // Logos
        const yLogos = height - 110;
        page.drawImage(logo1Img, { x: 60, y: yLogos, width: 75, height: 65 });
        page.drawImage(logo2Img, { x: width / 2 - 95, y: yLogos, width: 180, height: 45 });
        page.drawImage(logo3Img, { x: width - 60 - 60, y: yLogos, width: 60, height: 60 });

        // Título
        const tituloTexto = "REPORTE DE REPRESENTANTES";
        const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 18);
        page.drawText(tituloTexto, {
          x: width / 2 - tituloWidth / 2,
          y: height - 135,
          size: 18,
          font: helveticaBold,
          color: rgb(0, 0, 0.6),
        });

        const headerY = height - 160;

        // Header lines
        page.drawLine({ start: { x: margenIzquierdo, y: headerY }, end: { x: margenIzquierdo + anchoTotal, y: headerY }, thickness: 1, color: rgb(0, 0, 0) });
        page.drawLine({ start: { x: margenIzquierdo, y: headerY - 25 }, end: { x: margenIzquierdo + anchoTotal, y: headerY - 25 }, thickness: 1, color: rgb(0, 0, 0) });

        // Header Text
        page.drawText("N°", { x: margenIzquierdo + 5, y: headerY - 17, size: 10, font: helveticaBold });
        page.drawText("CÉDULA", { x: margenIzquierdo + anchoColumna1 + 5, y: headerY - 17, size: 10, font: helveticaBold });
        page.drawText("APELLIDOS Y NOMBRES", { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 5, y: headerY - 17, size: 10, font: helveticaBold });
        page.drawText("# EST", { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumna3 + 5, y: headerY - 17, size: 10, font: helveticaBold });
        
        if (incluirFirma) {
            page.drawText("FIRMA", { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumna3 + anchoColumna4 + 30, y: headerY - 17, size: 10, font: helveticaBold });
        }

        return { page, currentY: headerY - 25 };
      };

      let { page, currentY } = addNewPage();
      const { height: pageHeight } = page.getSize();
      const initialHeaderY = pageHeight - 160;

      const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
        let currentX = margenIzquierdo;
        // Left border
        targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        
        // After N°
        currentX += anchoColumna1;
        targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });

        // After Cedula
        currentX += anchoColumna2;
        targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });

        // After Name
        currentX += anchoColumna3;
        targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        
        // After # Est
        currentX += anchoColumna4;
        targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });

        if (incluirFirma) {
             // After Firma (Right border)
             currentX += anchoColumna5;
             targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        } else {
             // Right border (reusing line above logically, but drawing explicit closes it)
             // The loop logic handles internal dividers. We just need the final right border.
             // Actually drawing line at 'currentX' is correct, as currentX represents end of the table now.
             // Wait, if !incluirFirma, currentX is at end of anchoColumna4, which is end of table.
             // So we need to draw it.
             targetPage.drawLine({ start: { x: currentX, y: startY }, end: { x: currentX, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
        }
      };

      let pageStartY = initialHeaderY;

      representantes.forEach((rep, index) => {
        if (currentY - lineHeight < bottomMargin) {
            drawVerticalLines(page, pageStartY, currentY);
            page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 1, color: rgb(0, 0, 0) }); // Close current page table

            const newPageData = addNewPage();
            page = newPageData.page;
            currentY = newPageData.currentY;
            const { height } = page.getSize();
            pageStartY = height - 160;
        }

        const indexText = `${index + 1}`;
        const cedulaText = `${rep.cedula}`;
        const nombreCompleto = `${rep.apellidos} ${rep.nombres}`.toUpperCase();
        const numEstudiantes = `${rep.activeStudentCount}`;

        // Truncate name if too long to fit in column 3
        let safeName = nombreCompleto;
        // Simple heuristic: font size 10, avg char width ~6.
        const maxChars = Math.floor(anchoColumna3 / 6);
        if (safeName.length > maxChars) {
            safeName = safeName.substring(0, maxChars - 3) + "...";
        }

        page.drawText(indexText, { x: margenIzquierdo + 5, y: currentY - lineHeight + 5, size: 10, font: helveticaFont });
        page.drawText(cedulaText, { x: margenIzquierdo + anchoColumna1 + 5, y: currentY - lineHeight + 5, size: 10, font: helveticaFont });
        page.drawText(safeName, { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 5, y: currentY - lineHeight + 5, size: 10, font: helveticaFont });
        page.drawText(numEstudiantes, { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumna3 + 15, y: currentY - lineHeight + 5, size: 10, font: helveticaFont });

        currentY -= lineHeight;
        
        // Horizontal separator
        if (index < representantes.length - 1) {
             page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 0.5, color: rgb(0, 0, 0) });
        }
      });

      // Close final table
      drawVerticalLines(page, pageStartY, currentY);
      page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 1, color: rgb(0, 0, 0) });

      // Total text
      const totalY = currentY - 20;
      page.drawText(`Total de Representantes: ${representantes.length}`, { x: margenIzquierdo, y: totalY, size: 12, font: helveticaBold });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url);
      setOpen(false);

    } catch (error) {
      console.error("Error generating representative report:", error);
      showToast.error("Error al generar el reporte");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative overflow-hidden group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Representantes</DialogTitle>
          <DialogDescription>
            Configure las opciones del reporte.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="terms" 
            checked={incluirFirma}
            onCheckedChange={(c) => setIncluirFirma(!!c)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Incluir columna para firma
          </label>
        </div>

        <DialogFooter>
          <Button onClick={generarReporte} disabled={generating} className="w-full bg-blue-600 hover:bg-blue-700">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />}
            Generar Reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
