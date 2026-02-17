import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";

interface EvaluacionConDetalles extends Evaluaciones {
  materia_nombre?: string;
  seccion_nombre?: string;
}

interface NotaConEstudiante extends NotasEvaluacion {
  estudiante?: Estudiantes;
}

interface Estadisticas {
  promedio: string;
  notaMaxima: string;
  notaMinima: string;
  aprobados: number;
  reprobados: number;
  total: number;
}

export async function generarReportePDF(
  evaluacion: EvaluacionConDetalles,
  notas: NotaConEstudiante[],
  estadisticas: Estadisticas
) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Cargar logos del colegio
  const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
  const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
  const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

  const logo1Img = await pdfDoc.embedPng(logo1Bytes);
  const logo2Img = await pdfDoc.embedPng(logo2Bytes);
  const logo3Img = await pdfDoc.embedPng(logo3Bytes);

  // Dimensiones de página A4 HORIZONTAL (landscape)
  const pageWidth = 841.89;   // A4 horizontal width
  const pageHeight = 595.28;  // A4 horizontal height
  const margin = 30;  // Reduced margin for more space
  const lineHeight = 18;  // Increased line height
  const bottomMargin = 40;  // Reduced bottom margin

  // Definir columnas de la tabla para usar TODO el ancho disponible
  const anchoDisponible = pageWidth - (margin * 2);  // Total available width
  const colNumero = 40;
  const colCedula = 85;
  const colNombre = 200;
  const colNotaFinal = 70;
  
  // Calcular dinámicamente el ancho de cada criterio usando el espacio restante
  const numCriterios = evaluacion.criterios.length;
  const anchoRestante = anchoDisponible - colNumero - colCedula - colNombre - colNotaFinal;
  const colCriterio = anchoRestante / numCriterios;  // Distribute remaining space equally
  
  const anchoTotal = anchoDisponible;  // Use full width

  let currentPage: PDFPage | null = null;
  let currentY = 0;
  let pageStartY = 0;

  // Función para crear nueva página con encabezado
  const addNewPage = () => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const { width, height } = page.getSize();

    // Dibujar logos
    const yLogos = height - 110;
    page.drawImage(logo1Img, { x: 60, y: yLogos, width: 75, height: 65 });
    page.drawImage(logo2Img, { x: width / 2 - 95, y: yLogos, width: 180, height: 45 });
    page.drawImage(logo3Img, { x: width - 60 - 60, y: yLogos, width: 60, height: 60 });

    // Título principal - sin azul
    const titulo = "REPORTE DE NOTAS";
    const tituloWidth = helveticaBold.widthOfTextAtSize(titulo, 22);
    page.drawText(titulo, {
      x: width / 2 - tituloWidth / 2,
      y: height - 135,
      size: 22,  // Increased size
      font: helveticaBold,
      color: rgb(0, 0, 0),  // Changed to black
    });

    // Información de la evaluación
    let infoY = height - 160;
    const infoSize = 10;  // Increased from 9
    
    page.drawText(`Evaluación: ${evaluacion.nombre_evaluacion || ""}`, {
      x: margin,
      y: infoY,
      size: infoSize,
      font: helveticaBold,
    });
    
    page.drawText(`Materia: ${evaluacion.materia_nombre || ""}`, {
      x: width / 2,
      y: infoY,
      size: infoSize,
      font: helveticaBold,
    });
    
    infoY -= 12;
    
    page.drawText(`Tipo: ${evaluacion.tipo_evaluacion || ""}`, {
      x: margin,
      y: infoY,
      size: infoSize,
      font: helvetica,
    });
    
    page.drawText(`Sección: ${evaluacion.seccion_nombre || ""}`, {
      x: width / 2,
      y: infoY,
      size: infoSize,
      font: helvetica,
    });
    
    
    infoY -= 12;
    
    // Formatear fecha a dd/mm/yyyy
    const formatearFecha = (fecha: string) => {
      if (!fecha) return "";
      const partes = fecha.split("-");
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return fecha;
    };
    
    page.drawText(`Fecha: ${formatearFecha(evaluacion.fecha || "")}`, {
      x: margin,
      y: infoY,
      size: infoSize,
      font: helvetica,
    });
    
    page.drawText(`Porcentaje: ${evaluacion.porcentaje}%`, {
      x: width / 2,
      y: infoY,
      size: infoSize,
      font: helvetica,
    });

    // Cabecera de la tabla
    const headerY = height - 200;

    // Fondo del encabezado - gris claro en lugar de azul
    page.drawRectangle({
      x: margin,
      y: headerY - 28,
      width: anchoTotal,
      height: 28,  // Increased height
      color: rgb(0.92, 0.92, 0.92), // Light gray instead of blue
    });

    // Línea superior de la tabla (más gruesa)
    page.drawLine({
      start: { x: margin, y: headerY },
      end: { x: margin + anchoTotal, y: headerY },
      thickness: 2,
      color: rgb(0, 0, 0),  // Black instead of blue
    });

    // Línea inferior del encabezado (más gruesa)
    page.drawLine({
      start: { x: margin, y: headerY - 28 },
      end: { x: margin + anchoTotal, y: headerY - 28 },
      thickness: 2,
      color: rgb(0, 0, 0),  // Black instead of blue
    });

    // Textos del encabezado
    let xPos = margin;
    
    // N°
    page.drawText("N°", {
      x: xPos + colNumero / 2 - 6,
      y: headerY - 19,
      size: 11,  // Increased from 10
      font: helveticaBold,
      color: rgb(0, 0, 0),  // Black instead of blue
    });
    xPos += colNumero;

    // CÉDULA
    page.drawText("CÉDULA", {
      x: xPos + colCedula / 2 - 22,
      y: headerY - 19,
      size: 11,  // Increased
      font: helveticaBold,
      color: rgb(0, 0, 0),  // Black
    });
    xPos += colCedula;

    // APELLIDOS Y NOMBRES
    page.drawText("APELLIDOS Y NOMBRES", {
      x: xPos + 10,
      y: headerY - 19,
      size: 11,  // Increased
      font: helveticaBold,
      color: rgb(0, 0, 0),  // Black
    });
    xPos += colNombre;

    // Criterios (nombres completos o casi completos)
    evaluacion.criterios.forEach((criterio) => {
      const maxChars = Math.floor(colCriterio / 5);  // Dynamic based on column width
      const criterioText = criterio.nombre.length > maxChars ? 
        criterio.nombre.substring(0, maxChars) : criterio.nombre;
      const criterioWidth = helveticaBold.widthOfTextAtSize(criterioText, 9);
      page.drawText(criterioText, {
        x: xPos + colCriterio / 2 - criterioWidth / 2,
        y: headerY - 19,
        size: 9,  // Increased
        font: helveticaBold,
        color: rgb(0, 0, 0),  // Black
      });
      xPos += colCriterio;
    });

    // FINAL
    page.drawText("FINAL", {
      x: xPos + colNotaFinal / 2 - 14,
      y: headerY - 19,
      size: 11,  // Increased
      font: helveticaBold,
      color: rgb(0, 0, 0),  // Black
    });

    return { page, currentY: headerY - 28, pageStartY: headerY };
  };

  // Función para dibujar líneas verticales
  const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
    let xPos = margin;

    // Línea izquierda
    targetPage.drawLine({
      start: { x: xPos, y: startY },
      end: { x: xPos, y: endY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Después de N°
    xPos += colNumero;
    targetPage.drawLine({
      start: { x: xPos, y: startY },
      end: { x: xPos, y: endY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Después de Cédula
    xPos += colCedula;
    targetPage.drawLine({
      start: { x: xPos, y: startY },
      end: { x: xPos, y: endY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Después de Nombre
    xPos += colNombre;
    targetPage.drawLine({
      start: { x: xPos, y: startY },
      end: { x: xPos, y: endY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Después de cada criterio
    for (let i = 0; i < numCriterios; i++) {
      xPos += colCriterio;
      targetPage.drawLine({
        start: { x: xPos, y: startY },
        end: { x: xPos, y: endY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Línea derecha (después de FINAL)
    xPos += colNotaFinal;
    targetPage.drawLine({
      start: { x: xPos, y: startY },
      end: { x: xPos, y: endY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  };

  // Crear primera página
  const firstPageData = addNewPage();
  currentPage = firstPageData.page;
  currentY = firstPageData.currentY;
  pageStartY = firstPageData.pageStartY;

  // Renderizar estudiantes
  notas.forEach((nota, index) => {
    if (currentY - lineHeight < bottomMargin) {
      // Cerrar tabla de página actual
      drawVerticalLines(currentPage!, pageStartY, currentY);
      currentPage!.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + anchoTotal, y: currentY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Crear nueva página
      const newPageData = addNewPage();
      currentPage = newPageData.page;
      currentY = newPageData.currentY;
      pageStartY = newPageData.pageStartY;
    }

    let xPos = margin;

    // N°
    const numeroText = `${index + 1}`;
    const numeroWidth = helvetica.widthOfTextAtSize(numeroText, 10);
    currentPage!.drawText(numeroText, {
      x: xPos + colNumero / 2 - numeroWidth / 2,
      y: currentY - lineHeight + 6,
      size: 10,  // Increased from 9
      font: helvetica,
    });
    xPos += colNumero;

    // CÉDULA
    const cedulaText = `${nota.estudiante?.tipo_cedula || "V"}-${nota.estudiante?.cedula}`;
    const cedulaWidth = helvetica.widthOfTextAtSize(cedulaText, 9);
    currentPage!.drawText(cedulaText, {
      x: xPos + colCedula / 2 - cedulaWidth / 2,
      y: currentY - lineHeight + 6,
      size: 9,  // Increased from 8
      font: helvetica,
    });
    xPos += colCedula;

    // APELLIDOS Y NOMBRES
    const nombreCompleto = `${nota.estudiante?.apellidos || ""} ${nota.estudiante?.nombres || ""}`.trim().substring(0, 40);  // More characters
    currentPage!.drawText(nombreCompleto, {
      x: xPos + 5,
      y: currentY - lineHeight + 6,
      size: 9,  // Increased from 8
      font: helvetica,
    });
    xPos += colNombre;

    // Notas por criterio - números enteros
    evaluacion.criterios.forEach((criterio) => {
      const notaCriterio = nota.notas_criterios.find(
        (nc) => nc.criterio_numero === criterio.nro_criterio
      );
      const notaValor = Math.round(notaCriterio?.nota_obtenida || 0).toString();  // Integer
      const notaWidth = helvetica.widthOfTextAtSize(notaValor, 9);
      currentPage!.drawText(notaValor, {
        x: xPos + colCriterio / 2 - notaWidth / 2,
        y: currentY - lineHeight + 6,
        size: 9,  // Increased from 8
        font: helvetica,
      });
      xPos += colCriterio;
    });

    // Nota final (color verde/rojo según aprobado/reprobado) - número entero
    const notaAprobada = nota.nota_definitiva >= 10;
    const notaFinalText = Math.round(nota.nota_definitiva).toString();  // Integer
    const notaFinalWidth = helveticaBold.widthOfTextAtSize(notaFinalText, 10);
    currentPage!.drawText(notaFinalText, {
      x: xPos + colNotaFinal / 2 - notaFinalWidth / 2,
      y: currentY - lineHeight + 6,
      size: 10,  // Increased from 9
      font: helveticaBold,
      color: notaAprobada ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),
    });

    currentY -= lineHeight;

    // Línea separadora (excepto en el último estudiante)
    if (index < notas.length - 1) {
      currentPage!.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + anchoTotal, y: currentY },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
    }
  });

  // Cerrar tabla final
  drawVerticalLines(currentPage!, pageStartY, currentY);
  currentPage!.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + anchoTotal, y: currentY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Sección de estadísticas
  if (currentY - 100 < bottomMargin) {
    const newPageData = addNewPage();
    currentPage = newPageData.page;
    currentY = pageHeight - 150;
  }

  currentY -= 25;

  // Separador antes de estadísticas
  currentPage!.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + anchoTotal, y: currentY },
    thickness: 1.5,
    color: rgb(0, 0, 0),  // Black instead of blue
  });

  currentY -= 15;

  // Título de estadísticas - sin azul
  currentPage!.drawText("ESTADÍSTICAS GENERALES", {
    x: margin,
    y: currentY,
    size: 16,  // Increased from 14
    font: helveticaBold,
    color: rgb(0, 0, 0),  // Black instead of blue
  });
  
  currentY -= 25;

  // Estadísticas en dos columnas con mejor formato
  const col1X = margin;
  const col2X = margin + 250;
  const col3X = margin + 500;
  
  // Fila 1: Promedio y Total
  currentPage!.drawText("Promedio:", {
    x: col1X,
    y: currentY,
    size: 12,  // Increased from 11
    font: helveticaBold,
  });
  
  currentPage!.drawText(estadisticas.promedio, {
    x: col1X + 75,
    y: currentY,
    size: 12,  // Increased
    font: helvetica,
    color: rgb(0, 0, 0),  // Black
  });
  
  currentPage!.drawText("Total de Estudiantes:", {
    x: col2X,
    y: currentY,
    size: 12,  // Increased
    font: helveticaBold,
  });
  
  currentPage!.drawText(estadisticas.total.toString(), {
    x: col2X + 145,
    y: currentY,
    size: 12,  // Increased
    font: helvetica,
    color: rgb(0, 0, 0),  // Black
  });
  
  currentY -= 18;
  
  // Fila 2: Nota Máxima y Aprobados
  currentPage!.drawText("Nota Máxima:", {
    x: col1X,
    y: currentY,
    size: 12,  // Increased
    font: helveticaBold,
  });
  
  currentPage!.drawText(estadisticas.notaMaxima, {
    x: col1X + 75,
    y: currentY,
    size: 12,  // Increased
    font: helvetica,
    color: rgb(0, 0.6, 0),
  });
  
  currentPage!.drawText("Aprobados:", {
    x: col2X,
    y: currentY,
    size: 12,  // Increased
    font: helveticaBold,
  });
  
  currentPage!.drawText(estadisticas.aprobados.toString(), {
    x: col2X + 145,
    y: currentY,
    size: 12,  // Increased
    font: helvetica,
    color: rgb(0, 0.6, 0),
  });
  
  currentY -= 18;
  
  // Fila 3: Nota Mínima y Reprobados
  currentPage!.drawText("Nota Mínima:", {
    x: col1X,
    y: currentY,
    size: 12,  // Increased
    font: helveticaBold,
  });
  
  currentPage!.drawText(estadisticas.notaMinima, {
    x: col1X + 75,
    y: currentY,
    size: 12,  // Increased
    font: helvetica,
    color: rgb(0.8, 0, 0),
  });
  
  currentPage!.drawText("Reprobados:", {
    x: col2X,
    y: currentY,
    size: 12,  // Increased
    font: helveticaBold,
  });
  
  currentPage!.drawText(estadisticas.reprobados.toString(), {
    x: col2X + 145,
    y: currentY,
    size: 12,  // Increased
    font: helvetica,
    color: rgb(0.8, 0, 0),
  });

  // Generar y abrir PDF en el navegador
  const pdfBytes = await pdfDoc.save();
  // @ts-expect-error - pdf-lib Uint8Array type incompatible with TS Blob constructor, works fine at runtime
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Abrir en nueva pestaña
  window.open(url, "_blank");

  // Limpiar el URL después de un tiempo
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
