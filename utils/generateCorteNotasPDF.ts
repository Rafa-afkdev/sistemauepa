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

  // ========== AREA FIRMAS Y VERSÍCULO (AL FINAL DE LA HOJA) ==========
  const bottomY = 120; // Fijo en la parte baja de la página

  const drawCenteredText = (text: string, xObj: number, yObj: number, font: any, size: number) => {
    const textW = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xObj - textW / 2, y: yObj, size, font });
  };

  const center1 = width / 5;   // Movido más a la izquierda
  const center2 = width / 2;
  const center3 = (width / 5) * 4; // Movido más a la derecha

  // Director
  page.drawLine({ start: { x: center1 - 70, y: bottomY }, end: { x: center1 + 70, y: bottomY }, thickness: 1 });
  drawCenteredText("Prof. Rony Brazón", center1, bottomY - 15, helveticaBold, 9);
  drawCenteredText("Director de la Institución", center1, bottomY - 25, helveticaFont, 8);

  // Sello
  drawCenteredText("Sello de la Institución", center2, bottomY - 20, helveticaFont, 9);

  // Coordinador
  page.drawLine({ start: { x: center3 - 80, y: bottomY }, end: { x: center3 + 80, y: bottomY }, thickness: 1 });
  drawCenteredText("Licda. Ana Caldea", center3, bottomY - 15, helveticaBold, 9);
  drawCenteredText("Coordinación de Control", center3, bottomY - 25, helveticaFont, 8);
  drawCenteredText("de Estudio y Evaluación", center3, bottomY - 35, helveticaFont, 8);

  // Versículos Bíblicos para Estudiantes (Académico, Esfuerzo, Sabiduría)
  const versiculos = [
    "Pon en manos del Señor todas tus obras, y tus proyectos se cumplirán. (Proverbios 16:3)",
    "Porque el Señor da la sabiduría; conocimiento y ciencia brotan de sus labios. (Proverbios 2:6)",
    "Todo lo puedo en Cristo que me fortalece. (Filipenses 4:13)",
    "Esfuérzate y sé valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo. (Josué 1:9)",
    "El corazón del entendido adquiere sabiduría; y el oído de los sabios busca la ciencia. (Proverbios 18:15)",
    "Haz todo con excelencia, como si lo hicieras para Dios y no para los hombres. (Colosenses 3:23)",
    "Y el joven Jesús crecía en sabiduría, en estatura y en gracia para con Dios y los hombres. (Lucas 2:52)",
    "Que nadie te menosprecie por ser joven. Al contrario, que los creyentes vean en ti un ejemplo a seguir. (1 Timoteo 4:12)"
  ];
  const randomVersiculo = `"${versiculos[Math.floor(Math.random() * versiculos.length)]}"`;
  
  // Función para envolver el texto si excede el ancho de la página
  const fontSizeVersiculo = 10;
  const maxWidth = width - 80; // 40 de margen a cada lado
  const words = randomVersiculo.split(" ");
  let currentLine = "";
  let baseLineY = bottomY - 65;

  words.forEach((word) => {
    const testLine = currentLine + word + " ";
    const testWidth = helveticaFont.widthOfTextAtSize(testLine, fontSizeVersiculo);
    if (testWidth > maxWidth && currentLine !== "") {
      drawCenteredText(currentLine.trim(), width / 2, baseLineY, helveticaFont, fontSizeVersiculo);
      currentLine = word + " ";
      baseLineY -= 12; // Salto de línea
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine.trim() !== "") {
    drawCenteredText(currentLine.trim(), width / 2, baseLineY, helveticaFont, fontSizeVersiculo);
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Nombre del archivo: corte_notas_APELLIDOS_NOMBRES_DD-MM-YYYY.pdf
  const fechaArchivo = format(new Date(), "dd-MM-yyyy");
  const apellidos = estudiante.apellidos.replace(/\s+/g, "_").toUpperCase();
  const nombres = estudiante.nombres.replace(/\s+/g, "_").toUpperCase();
  const nombreArchivo = `corte_notas_${apellidos}_${nombres}_${fechaArchivo}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
