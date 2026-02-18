import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { Materias } from "@/interfaces/materias.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface GenerateCorteNotasPDFProps {
  estudiante: Estudiantes;
  materias: Materias[];
  evaluaciones: Evaluaciones[];
  notas: NotasEvaluacion[];
  seccionNombre: string;
}

export const generarCorteNotasPDF = async ({
  estudiante,
  materias,
  evaluaciones,
  notas,
  seccionNombre,
}: GenerateCorteNotasPDFProps) => {
  // Create PDF
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

  // Page dimensions (Letter or A4? Defaulting to A4 as in student report)
  const pageWidth = 595.28;   // A4 width
  const pageHeight = 841.89;  // A4 height
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const { width, height } = page.getSize();

  // Logos
  const yLogos = height - 110;
  page.drawImage(logo1Img, { x: 40, y: yLogos, width: 75, height: 65 });
  page.drawImage(logo2Img, { x: width / 2 - 95, y: yLogos, width: 180, height: 45 });
  page.drawImage(logo3Img, { x: width - 40 - 60, y: yLogos, width: 60, height: 60 });

  // Title
  const tituloTexto = "CORTE DE NOTAS";
  const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 16);
  page.drawText(tituloTexto, {
    x: width / 2 - tituloWidth / 2,
    y: height - 140,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Student Info (Manual Grid)
  const startY = height - 180;
  const margenIzquierdo = 40;
  const col1X = margenIzquierdo;
  const col2X = width / 2 + 20;

  // Row 1: Nombre
  page.drawText("APELLIDOS Y NOMBRES:", { x: col1X, y: startY, size: 10, font: helveticaBold });
  
  // Draw Box/Line for Name
  const nombreTexto = `${estudiante.apellidos}, ${estudiante.nombres}`.toUpperCase();
  page.drawText(nombreTexto, { x: col1X + 130, y: startY, size: 10, font: helveticaFont });
  page.drawLine({ start: { x: col1X + 130, y: startY - 2 }, end: { x: width - margenIzquierdo, y: startY - 2 }, thickness: 0.5 });

  // Row 2: Año/Grado & Fecha
  const row2Y = startY - 20;
  page.drawText("AÑO/GRADO:", { x: col1X, y: row2Y, size: 10, font: helveticaBold });
  page.drawText(seccionNombre, { x: col1X + 75, y: row2Y, size: 10, font: helveticaFont });
  page.drawLine({ start: { x: col1X + 75, y: row2Y - 2 }, end: { x: col1X + 250, y: row2Y - 2 }, thickness: 0.5 });

  page.drawText("FECHA:", { x: col2X, y: row2Y, size: 10, font: helveticaBold });
  const fechaTexto = format(new Date(), "dd/MM/yyyy", { locale: es });
  page.drawText(fechaTexto, { x: col2X + 50, y: row2Y, size: 10, font: helveticaFont });
  page.drawLine({ start: { x: col2X + 50, y: row2Y - 2 }, end: { x: width - margenIzquierdo, y: row2Y - 2 }, thickness: 0.5 });

  // === TABLE GENERATION ===
  let currentY = row2Y - 40;
  const tableMarginX = margenIzquierdo;
  const tableWidth = width - (margenIzquierdo * 2); // 515.28
  
  // Column Config
  const cols = [
    { name: "ASIGNATURAS", width: 215 },
    { name: "EVA 1", width: 60 },
    { name: "EVA 2", width: 60 },
    { name: "EVA 3", width: 60 },
    { name: "EVA 4", width: 60 },
    { name: "EVA 5", width: 60 },
  ];

  // Helper to draw cell
  const drawCell = (text: string, x: number, y: number, w: number, h: number, isHeader: boolean = false) => {
    // Border
    page.drawRectangle({
      x, 
      y: y - h + 5, // Adjustment for text baseline vs rectangle bottom-left
      width: w, 
      height: h,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      opacity: 0, // Only border
    });
    // Re-draw border manually to ensure grid look or use drawRectangle border
    // rect borders are inside/outside? 
    // Manual lines are safer for exact grid.
    
    // Let's use lines for the grid to match existing reports better.
  };

  const lineHeight = 20;
  const headerHeight = 25;

  // Draw Header
  let currentX = tableMarginX;
  
  // Top Line
  page.drawLine({ start: { x: tableMarginX, y: currentY + headerHeight - 15 }, end: { x: tableMarginX + tableWidth, y: currentY + headerHeight - 15 }, thickness: 1 });
  // Bottom Line of Header
  page.drawLine({ start: { x: tableMarginX, y: currentY - 15 }, end: { x: tableMarginX + tableWidth, y: currentY - 15 }, thickness: 1 });

  // Vertical Lines & Text
  cols.forEach((col) => {
    // Vertical line before column
    page.drawLine({ start: { x: currentX, y: currentY + headerHeight - 15 }, end: { x: currentX, y: currentY - 15 }, thickness: 1 });
    
    // Text
    const textWidth = helveticaBold.widthOfTextAtSize(col.name, 9);
    const textX = currentX + (col.width / 2) - (textWidth / 2);
    page.drawText(col.name, { x: textX, y: currentY - 5, size: 9, font: helveticaBold });

    currentX += col.width;
  });
  // Final vertical line
  page.drawLine({ start: { x: currentX, y: currentY + headerHeight - 15 }, end: { x: currentX, y: currentY - 15 }, thickness: 1 });
  
  currentY -= 15; // Move down after header

  // Draw Body
  materias.forEach((materia) => {
    const rowHeight = 20;
    
    // Check page bounds
    if (currentY < 50) {
       // Add new page... simplified for single page for now unless requested
       // Assuming it fits on one page for typical subject count (10-15 subjects)
    }

    // Prepare grades
    const subjectEvaluations = evaluaciones
      .filter((ev) => ev.materia_id === materia.id)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const grades = [0, 1, 2, 3, 4].map((index) => {
      const evaluation = subjectEvaluations[index];
      if (evaluation) {
        const grade = notas.find(
          (n) => n.evaluacion_id === evaluation.id && n.estudiante_id === estudiante.id
        );
        return grade && grade.nota_definitiva > 0 ? grade.nota_definitiva.toFixed(0) : "";
      }
      return "";
    });

    // Draw Row
    let rowX = tableMarginX;
    
    // Bottom line of row
    page.drawLine({ start: { x: tableMarginX, y: currentY - rowHeight }, end: { x: tableMarginX + tableWidth, y: currentY - rowHeight }, thickness: 1 });

    // Subject Name
    page.drawLine({ start: { x: rowX, y: currentY }, end: { x: rowX, y: currentY - rowHeight }, thickness: 1 }); // Left vertical
    
    // Truncate subject name if needed
    let subjName = materia.nombre;
    if (helveticaFont.widthOfTextAtSize(subjName, 9) > cols[0].width - 10) {
        subjName = subjName.substring(0, 25) + "...";
    }
    
    page.drawText(subjName, { x: rowX + 5, y: currentY - 13, size: 9, font: helveticaFont });
    rowX += cols[0].width;

    // Grades
    grades.forEach((grade, i) => {
        page.drawLine({ start: { x: rowX, y: currentY }, end: { x: rowX, y: currentY - rowHeight }, thickness: 1 }); // Vertical before cell
        
        if (grade) {
            const textWidth = helveticaFont.widthOfTextAtSize(grade, 9);
            page.drawText(grade, { x: rowX + (cols[i+1].width/2) - (textWidth/2), y: currentY - 13, size: 9, font: helveticaFont });
        }
        rowX += cols[i+1].width;
    });
    
    // Final vertical line
    page.drawLine({ start: { x: rowX, y: currentY }, end: { x: rowX, y: currentY - rowHeight }, thickness: 1 });

    currentY -= rowHeight;
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
