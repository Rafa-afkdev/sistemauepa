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

  // Dimensiones de página A4
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const lineHeight = 15;
  const bottomMargin = 50;

  // Definir columnas de la tabla
  const colNumero = 30;
  const colCedula = 70;
  const colNombre = 150;
  
  // Calcular dinámicamente el ancho de cada criterio
  const numCriterios = evaluacion.criterios.length;
  const anchoDisponibleCriterios = 200; // Espacio para criterios
  const colCriterio = Math.min(40, anchoDisponibleCriterios / numCriterios);
  const colNotaFinal = 50;
  
  const anchoTotal = colNumero + colCedula + colNombre + (colCriterio * numCriterios) + colNotaFinal;

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

    // Título principal
    const titulo = "REPORTE DE CALIFICACIONES";
    const tituloWidth = helveticaBold.widthOfTextAtSize(titulo, 18);
    page.drawText(titulo, {
      x: width / 2 - tituloWidth / 2,
      y: height - 135,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0.6),
    });

    // Información de la evaluación
    let infoY = height - 160;
    const infoSize = 9;
    
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
    
    page.drawText(`Fecha: ${evaluacion.fecha || ""}`, {
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

    // Línea superior de la tabla
    page.drawLine({
      start: { x: margin, y: headerY },
      end: { x: margin + anchoTotal, y: headerY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Línea inferior del encabezado
    page.drawLine({
      start: { x: margin, y: headerY - 25 },
      end: { x: margin + anchoTotal, y: headerY - 25 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Textos del encabezado
    let xPos = margin;
    
    // N°
    page.drawText("N°", {
      x: xPos + colNumero / 2 - 5,
      y: headerY - 17,
      size: 9,
      font: helveticaBold,
    });
    xPos += colNumero;

    // CÉDULA
    page.drawText("CÉDULA", {
      x: xPos + colCedula / 2 - 20,
      y: headerY - 17,
      size: 9,
      font: helveticaBold,
    });
    xPos += colCedula;

    // APELLIDOS Y NOMBRES
    page.drawText("APELLIDOS Y NOMBRES", {
      x: xPos + 10,
      y: headerY - 17,
      size: 9,
      font: helveticaBold,
    });
    xPos += colNombre;

    // Criterios (abreviados)
    evaluacion.criterios.forEach((criterio) => {
      const criterioText = criterio.nombre.substring(0, 8);
      const criterioWidth = helveticaBold.widthOfTextAtSize(criterioText, 7);
      page.drawText(criterioText, {
        x: xPos + colCriterio / 2 - criterioWidth / 2,
        y: headerY - 17,
        size: 7,
        font: helveticaBold,
      });
      xPos += colCriterio;
    });

    // FINAL
    page.drawText("FINAL", {
      x: xPos + colNotaFinal / 2 - 12,
      y: headerY - 17,
      size: 9,
      font: helveticaBold,
    });

    return { page, currentY: headerY - 25, pageStartY: headerY };
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
    const numeroWidth = helvetica.widthOfTextAtSize(numeroText, 9);
    currentPage!.drawText(numeroText, {
      x: xPos + colNumero / 2 - numeroWidth / 2,
      y: currentY - lineHeight + 5,
      size: 9,
      font: helvetica,
    });
    xPos += colNumero;

    // CÉDULA
    const cedulaText = `${nota.estudiante?.tipo_cedula || "V"}-${nota.estudiante?.cedula}`;
    const cedulaWidth = helvetica.widthOfTextAtSize(cedulaText, 8);
    currentPage!.drawText(cedulaText, {
      x: xPos + colCedula / 2 - cedulaWidth / 2,
      y: currentY - lineHeight + 5,
      size: 8,
      font: helvetica,
    });
    xPos += colCedula;

    // APELLIDOS Y NOMBRES
    const nombreCompleto = `${nota.estudiante?.apellidos || ""} ${nota.estudiante?.nombres || ""}`.trim().substring(0, 35);
    currentPage!.drawText(nombreCompleto, {
      x: xPos + 5,
      y: currentY - lineHeight + 5,
      size: 8,
      font: helvetica,
    });
    xPos += colNombre;

    // Notas por criterio
    evaluacion.criterios.forEach((criterio) => {
      const notaCriterio = nota.notas_criterios.find(
        (nc) => nc.criterio_numero === criterio.nro_criterio
      );
      const notaValor = (notaCriterio?.nota_obtenida || 0).toFixed(1);
      const notaWidth = helvetica.widthOfTextAtSize(notaValor, 8);
      currentPage!.drawText(notaValor, {
        x: xPos + colCriterio / 2 - notaWidth / 2,
        y: currentY - lineHeight + 5,
        size: 8,
        font: helvetica,
      });
      xPos += colCriterio;
    });

    // Nota final (color verde/rojo según aprobado/reprobado)
    const notaAprobada = nota.nota_definitiva >= 10;
    const notaFinalText = nota.nota_definitiva.toFixed(2);
    const notaFinalWidth = helveticaBold.widthOfTextAtSize(notaFinalText, 9);
    currentPage!.drawText(notaFinalText, {
      x: xPos + colNotaFinal / 2 - notaFinalWidth / 2,
      y: currentY - lineHeight + 5,
      size: 9,
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
  if (currentY - 80 < bottomMargin) {
    const newPageData = addNewPage();
    currentPage = newPageData.page;
    currentY = pageHeight - 150;
  }

  currentY -= 20;

  // Título de estadísticas
  currentPage!.drawText("ESTADÍSTICAS GENERALES", {
    x: margin,
    y: currentY,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0.6),
  });
  
  currentY -= 20;

  // Estadísticas en dos columnas
  const col1X = margin;
  const col2X = margin + 200;
  
  currentPage!.drawText(`Promedio: ${estadisticas.promedio}`, {
    x: col1X,
    y: currentY,
    size: 10,
    font: helvetica,
  });
  
  currentPage!.drawText(`Total de Estudiantes: ${estadisticas.total}`, {
    x: col2X,
    y: currentY,
    size: 10,
    font: helvetica,
  });
  
  currentY -= 15;
  
  currentPage!.drawText(`Nota Máxima: ${estadisticas.notaMaxima}`, {
    x: col1X,
    y: currentY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0.6, 0),
  });
  
  currentPage!.drawText(`Aprobados: ${estadisticas.aprobados}`, {
    x: col2X,
    y: currentY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0.6, 0),
  });
  
  currentY -= 15;
  
  currentPage!.drawText(`Nota Mínima: ${estadisticas.notaMinima}`, {
    x: col1X,
    y: currentY,
    size: 10,
    font: helvetica,
    color: rgb(0.8, 0, 0),
  });
  
  currentPage!.drawText(`Reprobados: ${estadisticas.reprobados}`, {
    x: col2X,
    y: currentY,
    size: 10,
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
