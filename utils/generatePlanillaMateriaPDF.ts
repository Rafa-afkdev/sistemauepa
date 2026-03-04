import { Estudiantes } from "@/interfaces/estudiantes.interface";
import { Evaluaciones } from "@/interfaces/evaluaciones.interface";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { Materias } from "@/interfaces/materias.interface";
import { NotasEvaluacion } from "@/interfaces/notas-evaluaciones.interface";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface GeneratePlanillaMateriaProps {
  materia: Materias;
  seccionNombre: string;
  estudiantes: Estudiantes[];
  evaluaciones: Evaluaciones[]; // evaluaciones de esta materia en el lapso
  todasLasNotas: NotasEvaluacion[];
  lapso: LapsosEscolares;
  docenteNombre?: string;
}

export const generarPlanillaPorMateriaPDF = async ({
  materia,
  seccionNombre,
  estudiantes,
  evaluaciones,
  todasLasNotas,
  lapso,
  docenteNombre,
}: GeneratePlanillaMateriaProps) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load logos
  const logo1Bytes = await fetch("/Logo1.png").then((r) => r.arrayBuffer());
  const logo2Bytes = await fetch("/Logo2.png").then((r) => r.arrayBuffer());
  const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((r) => r.arrayBuffer());

  const logo1 = await pdfDoc.embedPng(logo1Bytes);
  const logo2 = await pdfDoc.embedPng(logo2Bytes);
  const logo3 = await pdfDoc.embedPng(logo3Bytes);

  // Landscape A4: 841.89 x 595.28
  const pageW = 841.89;
  const pageH = 595.28;
  const page = pdfDoc.addPage([pageW, pageH]);

  const marginX = 30;
  const marginTop = pageH - 20;

  // ---- Logos ----
  const logoY = marginTop - 65;
  page.drawImage(logo1, { x: marginX, y: logoY, width: 55, height: 50 });
  page.drawImage(logo2, { x: pageW / 2 - 80, y: logoY + 10, width: 160, height: 38 });
  page.drawImage(logo3, { x: pageW - marginX - 50, y: logoY, width: 50, height: 50 });

  // ---- Titulo ----
  const titleY = logoY - 14;
  const titleText = "PLANILLA DE NOTAS POR MATERIA";
  const titleW = fontBold.widthOfTextAtSize(titleText, 11);
  page.drawText(titleText, {
    x: pageW / 2 - titleW / 2,
    y: titleY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ---- Info header ----
  const infoY = titleY - 16;
  const drawInfo = (label: string, value: string, x: number, y: number) => {
    page.drawText(`${label}`, { x, y, size: 8, font: fontBold });
    page.drawText(value, { x: x + fontBold.widthOfTextAtSize(label, 8) + 3, y, size: 8, font });
  };

  const col1 = marginX;
  const col2 = pageW / 3;
  const col3 = (pageW / 3) * 2;

  drawInfo("Sección:", seccionNombre, col1, infoY);
  drawInfo("Materia:", materia.nombre.toUpperCase(), col2, infoY);
  drawInfo("Lapso:", lapso.lapso, col3, infoY);

  const infoY2 = infoY - 13;
  if (docenteNombre) {
    drawInfo("Docente:", docenteNombre.toUpperCase(), col1, infoY2);
  }
  drawInfo(
    "Fecha:",
    format(new Date(), "dd/MM/yyyy", { locale: es }),
    col3,
    infoY2
  );

  // ---- Table ----
  const evalsSorted = [...evaluaciones].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const estudiantesSorted = [...estudiantes].sort((a, b) => a.cedula - b.cedula);

  // Column widths — each eval has 2 sub-cols (nota + equivalente)
  const colNro = 20;
  const colMatricula = 58;
  const colNombre = 198; // absorbed 36 from colPromedio
  const evalCols = evalsSorted.length;
  const fixedW = colNro + colMatricula + colNombre;
  const availableForEvals = pageW - marginX * 2 - fixedW;
  // Each eval total width = colSubNota + colSubEquiv
  const colEvalTotal = evalCols > 0 ? Math.min(46, availableForEvals / evalCols) : availableForEvals;
  const colSubNota   = Math.round(colEvalTotal * 0.5);
  const colSubEquiv  = colEvalTotal - colSubNota;

  const tableStartY = infoY2 - 18;
  const rowH = 16;
  // Header: vertical tipo zone + sub-header row
  const mainHeaderH = 90; // INCREASED: zone for rotated tipo label to fit more text
  const subH = 14;        // zone for "Nota" | "Equiv." labels
  const headerH = mainHeaderH + subH;

  const drawHLine = (y: number, x1 = marginX, x2 = pageW - marginX) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5 });

  const drawVLine = (x: number, y1: number, y2: number) =>
    page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.5 });

  const centerText = (
    text: string,
    x: number,
    w: number,
    y: number,
    f: typeof font | typeof fontBold,
    size: number,
    color = rgb(0, 0, 0)
  ) => {
    const tw = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x + w / 2 - tw / 2, y, size, font: f, color });
  };

  // Header: top = headerTop, mid-line (sub-header) = headerBot + subH, bottom = headerBot
  const headerTop = tableStartY;
  const headerBot = tableStartY - headerH;
  const subLineY  = headerBot + subH; // horizontal line separating tipo zone from sub-header

  drawHLine(headerTop);
  drawHLine(subLineY);   // thin line above sub-header labels
  drawHLine(headerBot);

  let cx = marginX;

  // Draw a regular (horizontal) header cell spanning full headerH, vertically centered
  const drawHeaderCell = (label: string, w: number) => {
    drawVLine(cx, headerTop, headerBot);
    const textY = headerBot + headerH / 2 - 3;
    centerText(label, cx, w, textY, fontBold, 7);
    cx += w;
  };

  // Draw a vertical header cell for an evaluation:
  // ─ tipo_evaluacion rotated 90° spans both sub-cols (colEvalTotal) in the top zone
  // ─ sub-header zone shows "Nota" and "Equiv." side by side with a divider
  const fontSize = 6.5;
  const pctZoneH = subH; // reuse subH

  const drawVerticalHeaderCell = (tipoLabel: string, notaMaxEv: number, porcentaje: number) => {
    // Left border
    drawVLine(cx, headerTop, headerBot);
    // Sub-divider (mid vertical only in sub-header zone)
    drawVLine(cx + colSubNota, subLineY, headerBot);

    const fullW = colEvalTotal;
    const cellCenterX = cx + fullW / 2;

    // Truncate tipo label so it fits in mainHeaderH
    const maxW = mainHeaderH - 4;
    let label = tipoLabel;
    while (fontBold.widthOfTextAtSize(label, fontSize) > maxW && label.length > 2) {
      label = label.slice(0, -1);
    }
    if (label.length < tipoLabel.length) label += "…";

    const textW = fontBold.widthOfTextAtSize(label, fontSize);
    const xPos = cellCenterX + fontSize * 0.35;
    const yPos = subLineY + (mainHeaderH - textW) / 2;

    page.drawText(label, {
      x: xPos,
      y: yPos,
      size: fontSize,
      font: fontBold,
      rotate: degrees(90),
      color: rgb(0, 0, 0),
    });

    // Sub-header labels (horizontal, small)
    const subTextY = headerBot + subH / 2 - 2.5;
    centerText("Nota", cx,            colSubNota,  subTextY, font, 5.5, rgb(0.2, 0.2, 0.2));
    centerText(`${porcentaje}%`, cx + colSubNota, colSubEquiv, subTextY, font, 5.5, rgb(0.2, 0.2, 0.2));

    cx += fullW;
  };

  drawHeaderCell("Nro", colNro);
  drawHeaderCell("Matrícula", colMatricula);
  drawHeaderCell("Apellidos y Nombre", colNombre);

  for (const ev of evalsSorted) {
    drawVerticalHeaderCell(
      ev.tipo_evaluacion ?? ev.nombre_evaluacion,
      ev.nota_definitiva || 20,
      ev.porcentaje
    );
  }

  drawVLine(cx, headerTop, headerBot);

  // Body rows
  let currentY = headerBot;
  const bodyTop = headerBot;

  for (let i = 0; i < estudiantesSorted.length; i++) {
    const est = estudiantesSorted[i];
    const rowTop = currentY;
    const rowBot = currentY - rowH;

    // Check if page is full (leave room for signatures)
    if (rowBot < 80) break;

    drawHLine(rowBot);

    const notasEst = todasLasNotas.filter((n) => n.estudiante_id === est.id);

    // Build nota + equivalente per evaluation
    const pairsPerEval = evalsSorted.map((ev) => {
      const n = notasEst.find((x) => x.evaluacion_id === ev.id);
      const nota = n?.nota_definitiva ?? null;
      const notaMax = ev.nota_definitiva || 20;
      const equiv = nota !== null ? (nota / notaMax) * ev.porcentaje : null;
      return { nota, equiv };
    });



    let rx = marginX;
    const textY = rowBot + rowH / 2 - 3;

    const drawBodyCell = (text: string, w: number, isBold = false, color = rgb(0, 0, 0), centered = true, isNameCol = false) => {
      drawVLine(rx, rowTop, rowBot);
      
      if (centered) {
        centerText(text, rx, w, textY, isBold ? fontBold : font, 7, color);
      } else if (isNameCol) {
        // Keep name in one line, but shrink font if too long
        const f = isBold ? fontBold : font;
        const availableW = w - 4; 
        
        // Calculate max font size that fits, min size 5
        let currentSize = 7;
        while (f.widthOfTextAtSize(text, currentSize) > availableW && currentSize > 4) {
          currentSize -= 0.5;
        }
        
        let t = text;
        if (f.widthOfTextAtSize(t, currentSize) > availableW) {
          // Even at max shrink it doesn't fit, we have to truncate
          while (f.widthOfTextAtSize(t, currentSize) > availableW - 4 && t.length > 3) {
            t = t.slice(0, -1);
          }
          t += "…";
        }
        
        // Vertically adjust for the smaller font if necessary, but we can reuse textY
        // textY is calculated for size 7: rowBot + rowH / 2 - 3
        const yAdjust = (7 - currentSize) / 2;
        page.drawText(t, { x: rx + 3, y: textY - yAdjust, size: currentSize, font: f, color });
      } else {
        let t = text;
        while (font.widthOfTextAtSize(t, 7) > w - 4 && t.length > 3) t = t.slice(0, -1);
        if (t.length < text.length) t += "…";
        page.drawText(t, { x: rx + 3, y: textY, size: 7, font: isBold ? fontBold : font, color });
      }
      rx += w;
    };

    // Alternating background for the WHOLE row (non-eval columns will show this)
    const isOdd = i % 2 === 1;
    if (isOdd) {
      page.drawRectangle({
        x: marginX,
        y: rowBot,
        width: pageW - marginX * 2,
        height: rowH,
        color: rgb(0.96, 0.96, 0.96),
        opacity: 1,
      });
    }

    drawBodyCell(`${i + 1}`, colNro, false, rgb(0.4, 0.4, 0.4));
    drawBodyCell(`${est.tipo_cedula}-${est.cedula}`, colMatricula);
    drawBodyCell(`${est.apellidos}, ${est.nombres}`, colNombre, false, rgb(0, 0, 0), false, true);

    for (let j = 0; j < pairsPerEval.length; j++) {
      const { nota, equiv } = pairsPerEval[j];
      
      // Nota sub-col
      const notaColor = nota === null ? rgb(0.7, 0.7, 0.7) : nota < 10 ? rgb(0.8, 0, 0) : rgb(0, 0, 0);
      drawBodyCell(nota !== null ? nota.toFixed(0) : "–", colSubNota, false, notaColor);
      
      // Equivalente sub-col
      const equivColor = equiv === null ? rgb(0.7, 0.7, 0.7) : equiv < (evalsSorted[j]?.porcentaje ?? 10) / 2 ? rgb(0.8, 0, 0) : rgb(0, 0, 0);
      drawBodyCell(equiv !== null ? equiv.toFixed(2) : "–", colSubEquiv, false, equivColor);
    }

    drawVLine(rx, rowTop, rowBot);

    currentY = rowBot;
  }

  // Close table top line
  drawVLine(marginX, bodyTop, currentY);
  drawVLine(pageW - marginX, bodyTop, currentY);
  drawHLine(currentY);

  // ---- Save & Download ----
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const fechaArchivo = format(new Date(), "dd-MM-yyyy");
  const nombreMateria = materia.nombre.replace(/\s+/g, "_").toUpperCase();
  const nombreArchivo = `planilla_${nombreMateria}_${seccionNombre.replace(/\s+/g, "_")}_${fechaArchivo}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  
  // Abrir en nueva pestaña
  window.open(url, "_blank");

  // Opcional: descargar también
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
