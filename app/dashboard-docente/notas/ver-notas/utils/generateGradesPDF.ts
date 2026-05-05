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

  // Dimensiones de página A4 VERTICAL (portrait) para ahorrar hojas
  const pageWidth = 595.28;   // A4 vertical width
  const pageHeight = 841.89;  // A4 vertical height
  const margin = 20;  // Margen reducido para maximizar espacio
  const lineHeight = 16;  // Line height ligeramente reducido para meter más filas
  const bottomMargin = 40;

  // Definir columnas de la tabla para usar TODO el ancho disponible
  const anchoDisponible = pageWidth - (margin * 2);
  const colNumero = 20;
  const colCedula = 50;
  const colNotaFinal = 35;
  
  // Proteger la longitud de criterios por si viene undefined o vacío
  const criterios = evaluacion.criterios || [];
  const numCriterios = criterios.length;
  
  // Calcular dinámicamente el ancho de cada criterio con un máximo de 45px en vertical
  const maxColCriterio = 45;
  const espacioParaCriterios = anchoDisponible - colNumero - colCedula - 130 - colNotaFinal; // 130px min para nombre
  const colCriterio = numCriterios > 0 ? Math.min(maxColCriterio, espacioParaCriterios / numCriterios) : 0;
  const totalCriterios = colCriterio * numCriterios;
  
  // El espacio restante va a la columna de nombre (mínimo 130px)
  const colNombre = anchoDisponible - colNumero - colCedula - totalCriterios - colNotaFinal;
  const anchoTotal = anchoDisponible;

  let currentPage: PDFPage | null = null;
  let currentY = 0;
  let pageStartY = 0;

  // Función para crear nueva página con encabezado
  const addNewPage = () => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const { width, height } = page.getSize();

    // Dibujar logos ajustados al nuevo ancho
    const yLogos = height - 80;
    page.drawImage(logo1Img, { x: margin, y: yLogos, width: 60, height: 50 });
    page.drawImage(logo2Img, { x: width / 2 - 75, y: yLogos + 5, width: 150, height: 35 });
    page.drawImage(logo3Img, { x: width - margin - 50, y: yLogos, width: 50, height: 50 });

    // Título principal
    const titulo = "REPORTE DE NOTAS";
    const tituloWidth = helveticaBold.widthOfTextAtSize(titulo, 18);
    page.drawText(titulo, {
      x: width / 2 - tituloWidth / 2,
      y: height - 105,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Información de la evaluación
    let infoY = height - 130;
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
    const headerY = height - 170;

    // Fondo del encabezado
    page.drawRectangle({
      x: margin,
      y: headerY - 24,
      width: anchoTotal,
      height: 24,
      color: rgb(0.92, 0.92, 0.92),
    });

    // Líneas
    page.drawLine({
      start: { x: margin, y: headerY },
      end: { x: margin + anchoTotal, y: headerY },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: margin, y: headerY - 24 },
      end: { x: margin + anchoTotal, y: headerY - 24 },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });

    // Textos del encabezado
    let xPos = margin;
    
    page.drawText("N°", {
      x: xPos + colNumero / 2 - 5,
      y: headerY - 16,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    xPos += colNumero;

    page.drawText("CÉDULA", {
      x: xPos + colCedula / 2 - 18,
      y: headerY - 16,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    xPos += colCedula;

    page.drawText("APELLIDOS Y NOMBRES", {
      x: xPos + 5,
      y: headerY - 16,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    xPos += colNombre;

    // Criterios (truncados para que quepan en vertical)
    criterios.forEach((criterio) => {
      // Ajuste muy agresivo del texto para el encabezado en modo vertical
      const maxChars = Math.max(1, Math.floor(colCriterio / 4.5));
      let criterioText = criterio.nombre;
      if (criterioText.length > maxChars) {
        criterioText = criterioText.substring(0, maxChars) + ".";
      }
      
      const criterioWidth = helveticaBold.widthOfTextAtSize(criterioText, 7);
      page.drawText(criterioText, {
        x: xPos + colCriterio / 2 - (criterioWidth / 2),
        y: headerY - 15,
        size: 7,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      xPos += colCriterio;
    });

    page.drawText("FINAL", {
      x: xPos + colNotaFinal / 2 - 12,
      y: headerY - 16,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    return { page, currentY: headerY - 24, pageStartY: headerY };
  };

  // Función para dibujar líneas verticales
  const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
    let xPos = margin;
    const drawL = (x: number) => {
      targetPage.drawLine({
        start: { x, y: startY },
        end: { x, y: endY },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
    };

    drawL(xPos);
    xPos += colNumero; drawL(xPos);
    xPos += colCedula; drawL(xPos);
    xPos += colNombre; drawL(xPos);
    for (let i = 0; i < numCriterios; i++) {
      xPos += colCriterio; drawL(xPos);
    }
    xPos += colNotaFinal; drawL(xPos);
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

    // APELLIDOS Y NOMBRES — truncar dinámicamente según el ancho
    const nombreCompleto = `${nota.estudiante?.apellidos || ""} ${nota.estudiante?.nombres || ""}`.trim();
    const maxNombreWidth = colNombre - 6;
    let nombreTruncado = nombreCompleto;
    while (nombreTruncado.length > 3 && helvetica.widthOfTextAtSize(nombreTruncado, 8) > maxNombreWidth) {
      nombreTruncado = nombreTruncado.slice(0, -1);
    }
    currentPage!.drawText(nombreTruncado, {
      x: xPos + 3,
      y: currentY - lineHeight + 5,
      size: 8,
      font: helvetica,
    });
    xPos += colNombre;

    // Notas por criterio
    criterios.forEach((criterio) => {
      const notaCriterio = nota.notas_criterios?.find(
        (nc) => nc.criterio_numero === criterio.nro_criterio
      );
      const notaValor = Math.round(notaCriterio?.nota_obtenida || 0).toString();
      const notaWidth = helvetica.widthOfTextAtSize(notaValor, 8);
      currentPage!.drawText(notaValor, {
        x: xPos + colCriterio / 2 - notaWidth / 2,
        y: currentY - lineHeight + 5,
        size: 8,
        font: helvetica,
      });
      xPos += colCriterio;
    });

    // Nota final (color verde/rojo) recalculada dinámicamente
    const notaCalculada = nota.notas_criterios?.reduce((sum, nc) => sum + (nc.nota_obtenida || 0), 0) ?? 0;
    const notaAprobada = notaCalculada >= 10;
    const notaFinalText = Math.round(notaCalculada).toString();
    const notaFinalWidth = helveticaBold.widthOfTextAtSize(notaFinalText, 9);
    currentPage!.drawText(notaFinalText, {
      x: xPos + colNotaFinal / 2 - notaFinalWidth / 2,
      y: currentY - lineHeight + 5,
      size: 9,
      font: helveticaBold,
      color: notaAprobada ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),
    });

    currentY -= lineHeight;

    // Línea separadora
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
  if (currentY - 120 < bottomMargin) {
    const newPageData = addNewPage();
    currentPage = newPageData.page;
    currentY = pageHeight - 150;
  }

  currentY -= 20;

  // Separador antes de estadísticas
  currentPage!.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + anchoTotal, y: currentY },
    thickness: 1.5,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  currentPage!.drawText("ESTADÍSTICAS GENERALES", {
    x: margin,
    y: currentY,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  currentY -= 20;

  const col1X = margin;
  const col2X = margin + 200;
  
  // Fila 1
  currentPage!.drawText("Promedio:", { x: col1X, y: currentY, size: 10, font: helveticaBold });
  currentPage!.drawText(estadisticas?.promedio || "0", { x: col1X + 70, y: currentY, size: 10, font: helvetica, color: rgb(0, 0, 0) });
  
  currentPage!.drawText("Total de Estudiantes:", { x: col2X, y: currentY, size: 10, font: helveticaBold });
  currentPage!.drawText((estadisticas?.total || 0).toString(), { x: col2X + 110, y: currentY, size: 10, font: helvetica, color: rgb(0, 0, 0) });
  
  currentY -= 15;
  
  // Fila 2
  currentPage!.drawText("Nota Máxima:", { x: col1X, y: currentY, size: 10, font: helveticaBold });
  currentPage!.drawText(estadisticas?.notaMaxima || "0", { x: col1X + 70, y: currentY, size: 10, font: helvetica, color: rgb(0, 0.6, 0) });
  
  currentPage!.drawText("Aprobados:", { x: col2X, y: currentY, size: 10, font: helveticaBold });
  currentPage!.drawText((estadisticas?.aprobados || 0).toString(), { x: col2X + 110, y: currentY, size: 10, font: helvetica, color: rgb(0, 0.6, 0) });
  
  currentY -= 15;
  
  // Fila 3
  currentPage!.drawText("Nota Mínima:", { x: col1X, y: currentY, size: 10, font: helveticaBold });
  currentPage!.drawText(estadisticas?.notaMinima || "0", { x: col1X + 70, y: currentY, size: 10, font: helvetica, color: rgb(0.8, 0, 0) });
  
  currentPage!.drawText("Reprobados:", { x: col2X, y: currentY, size: 10, font: helveticaBold });
  currentPage!.drawText((estadisticas?.reprobados || 0).toString(), { x: col2X + 110, y: currentY, size: 10, font: helvetica, color: rgb(0.8, 0, 0) });

  // Generar PDF
  const pdfBytes = await pdfDoc.save();
  // @ts-expect-error - pdf-lib Uint8Array type incompatible with TS Blob constructor, works fine at runtime
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Construir nombre de archivo
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9\-_áéíóúÁÉÍÓÚñÑüÜ ]/g, "").trim().replace(/\s+/g, "_");
  const fechaFormateada = evaluacion.fecha ? evaluacion.fecha.split("-").reverse().join("-") : "sin-fecha";
  const nombreArchivo = `${sanitize(evaluacion.nombre_evaluacion || "Evaluacion")}_${sanitize(evaluacion.materia_nombre || "Materia")}_${fechaFormateada}.pdf`;

  // Abrir en nueva pestaña
  const newWindow = window.open(url, "_blank");
  if (!newWindow) {
    // Si el navegador bloquea la ventana emergente, lo descargamos
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    link.click();
  }

  // Limpiar el URL después de un tiempo
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
