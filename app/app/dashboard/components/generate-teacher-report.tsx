"use client";

import { Button } from "@/components/ui/button";
import type { User } from "@/interfaces/users.interface";
import { getCollection } from "@/lib/data/firebase";
import { where } from "firebase/firestore";
import { FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useState } from "react";

export const GenerateTeacherReport = () => {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const generarReporteDocentes = async () => {
    try {
      setLoading(true);
      const docs = (await getCollection("users", [
        where("rol", "==", "docente"),
      ])) as User[];

      // Ordenar por cédula en el cliente
      const allDocentes = docs.sort((a, b) => {
        return Number(a.cedula) - Number(b.cedula);
      });

      if (allDocentes.length === 0) {
        showToast.warning("No hay docentes registrados para generar el reporte.");
        setLoading(false);
        return;
      }

      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();

      // Cargar imágenes
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

      const logo1 = await pdfDoc.embedPng(logo1Bytes);
      const logo2 = await pdfDoc.embedPng(logo2Bytes);
      const logo3 = await pdfDoc.embedPng(logo3Bytes);

      // Dimensiones y posiciones
      const logo1Width = 75,
        logo1Height = 65;
      const logo2Width = 180,
        logo2Height = 45;
      const logo3Width = 60,
        logo3Height = 60;
      const yLogos = height - 110;

      // Dibujar logos
      page.drawImage(logo1, {
        x: 60,
        y: yLogos,
        width: logo1Width,
        height: logo1Height,
      });

      page.drawImage(logo2, {
        x: width / 2 - 95,
        y: yLogos,
        width: logo2Width,
        height: logo2Height,
      });

      page.drawImage(logo3, {
        x: width - 60 - logo3Width,
        y: yLogos,
        width: logo3Width,
        height: logo3Height,
      });

      // Título
      const tituloTexto = "REPORTE DE PERSONAL DOCENTE";
      const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 18);
      page.drawText(tituloTexto, {
        x: width / 2 - tituloWidth / 2,
        y: height - 135,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0.6),
      });

      // Tabla
      const margenIzquierdo = 50;
      const anchoColumna1 = 40;
      const anchoColumna2 = 100;
      const anchoTotal = 500;

      // Cabecera tabla
      page.drawLine({
        start: { x: margenIzquierdo, y: height - 160 },
        end: { x: margenIzquierdo + anchoTotal, y: height - 160 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: margenIzquierdo, y: height - 185 },
        end: { x: margenIzquierdo + anchoTotal, y: height - 185 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawText("N°", {
        x: margenIzquierdo + anchoColumna1 / 2 - 5,
        y: height - 177,
        size: 12,
        font: helveticaBold,
      });

      page.drawText("CÉDULA", {
        x: margenIzquierdo + anchoColumna1 + anchoColumna2 / 2 - 25,
        y: height - 177,
        size: 12,
        font: helveticaBold,
      });

      page.drawText("APELLIDOS Y NOMBRES", {
        x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 90,
        y: height - 177,
        size: 12,
        font: helveticaBold,
      });

      let yPosition = height - 185;
      const lineHeight = 18;

      const finalTableYPosition = yPosition - allDocentes.length * lineHeight;

      // Líneas verticales
      page.drawLine({
        start: { x: margenIzquierdo, y: height - 160 },
        end: { x: margenIzquierdo, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: margenIzquierdo + anchoColumna1, y: height - 160 },
        end: { x: margenIzquierdo + anchoColumna1, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: height - 160 },
        end: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: margenIzquierdo + anchoTotal, y: height - 160 },
        end: { x: margenIzquierdo + anchoTotal, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Datos
      yPosition = height - 185;

      allDocentes.forEach((docente, index) => {
        if (index < allDocentes.length - 1) {
          page.drawLine({
            start: { x: margenIzquierdo, y: yPosition - lineHeight },
            end: { x: margenIzquierdo + anchoTotal, y: yPosition - lineHeight },
            thickness: 0.9,
            color: rgb(0, 0, 0),
          });
        }

        const indexText = `${index + 1}`;
        const indexWidth = helveticaFont.widthOfTextAtSize(indexText, 12);
        const cedulaText = `${docente.cedula}`;
        const cedulaWidth = helveticaFont.widthOfTextAtSize(cedulaText, 12);

        page.drawText(indexText, {
          x: margenIzquierdo + anchoColumna1 / 2 - indexWidth / 2,
          y: yPosition - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });

        page.drawText(cedulaText, {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 / 2 - cedulaWidth / 2,
          y: yPosition - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });

        page.drawText(`${docente.apellidos} ${docente.name}`.toUpperCase(), {
          x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 30,
          y: yPosition - lineHeight + 5,
          size: 10,
          font: helveticaFont,
        });

        yPosition -= lineHeight;
      });

      // Línea final
      page.drawLine({
        start: { x: margenIzquierdo, y: finalTableYPosition },
        end: { x: margenIzquierdo + anchoTotal, y: finalTableYPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Totales
      page.drawText(`Total de docentes: ${allDocentes.length}`, {
        x: margenIzquierdo,
        y: finalTableYPosition - 20,
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
      onClick={generarReporteDocentes}
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
