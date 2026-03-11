import { format } from "date-fns";
import { es } from "date-fns/locale";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SabanaMateria {
  id: string;
  nombre: string;
  abreviatura: string;
}

export interface SabanaFila {
  apellidos: string;
  nombres: string;
  tipo_cedula: string;
  cedula: number;
  notas: Record<string, number | null>; // materia_id → nota
  promedio: number;
  aprobadas: number;
  aplazadas: number;
  posicion?: number;
}

export interface GenerateSabanaNotasPDFProps {
  seccionNombre: string;
  periodoNombre: string;
  lapsoNombre: string;
  materias: SabanaMateria[];
  filas: SabanaFila[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function truncate(text: string, maxW: number, font: any, size: number): string {
  let t = text;
  while (font.widthOfTextAtSize(t, size) > maxW && t.length > 2) {
    t = t.slice(0, -1);
  }
  if (t.length < text.length) t += "…";
  return t;
}

// ─── Generator ───────────────────────────────────────────────────────────────

export const generarSabanaNotasPDF = async ({
  seccionNombre,
  periodoNombre,
  lapsoNombre,
  materias,
  filas,
}: GenerateSabanaNotasPDFProps) => {
  const pdfDoc = await PDFDocument.create();
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Logos
  const logo1Bytes = await fetch("/Logo1.png").then((r) => r.arrayBuffer());
  const logo2Bytes = await fetch("/Logo2.png").then((r) => r.arrayBuffer());
  const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((r) => r.arrayBuffer());
  const logo1 = await pdfDoc.embedPng(logo1Bytes);
  const logo2 = await pdfDoc.embedPng(logo2Bytes);
  const logo3 = await pdfDoc.embedPng(logo3Bytes);

  // ── Dimensions (Landscape A4) ────────────────────────────────────────────
  const pageW = 841.89;
  const pageH = 595.28;
  const marginX = 28;
  const marginTop = pageH - 18;

  // ── Column layout ────────────────────────────────────────────────────────
  const colNro    = 18;
  const colNombre = 175;
  const colCedula = 55;
  // Extra summary columns at the end
  const colProm = 36;
  const colPos  = 24;
  const colApr  = 24;
  const colApl  = 24;

  const fixedW = colNro + colNombre + colCedula + colProm + colPos + colApr + colApl;
  const availableForMaterias = pageW - marginX * 2 - fixedW;
  const matCount = materias.length;
  // Minimum 28, max that fits
  const colMat = matCount > 0
    ? Math.max(24, Math.min(50, availableForMaterias / matCount))
    : 30;

  const tableW = colNro + colNombre + colCedula + colMat * matCount + colProm + colPos + colApr + colApl;

  const rowH     = 15;
  const headerH  = 75; // rotated materia labels
  const subH     = 12; // row for column headers (abreviatura)
  const totalHeaderH = headerH + subH;

  // ── Line helpers ─────────────────────────────────────────────────────────
  const drawPage = () => {
    const page = pdfDoc.addPage([pageW, pageH]);

    // Logos
    const logoY = marginTop - 60;
    page.drawImage(logo1, { x: marginX, y: logoY, width: 52, height: 46 });
    page.drawImage(logo2, { x: pageW / 2 - 75, y: logoY + 8, width: 150, height: 36 });
    page.drawImage(logo3, { x: pageW - marginX - 46, y: logoY, width: 46, height: 46 });

    // Title
    const titleY = logoY - 12;
    const titleText = "SÁBANA DE NOTAS";
    const tW = fontBold.widthOfTextAtSize(titleText, 11);
    page.drawText(titleText, { x: pageW / 2 - tW / 2, y: titleY, size: 11, font: fontBold });

    // Info
    const infoY = titleY - 13;
    page.drawText(`Sección: `, { x: marginX, y: infoY, size: 7.5, font: fontBold });
    page.drawText(seccionNombre, { x: marginX + fontBold.widthOfTextAtSize("Sección: ", 7.5), y: infoY, size: 7.5, font });

    page.drawText(`Período: `, { x: pageW / 3, y: infoY, size: 7.5, font: fontBold });
    page.drawText(periodoNombre, { x: pageW / 3 + fontBold.widthOfTextAtSize("Período: ", 7.5), y: infoY, size: 7.5, font });

    page.drawText(`Lapso: `, { x: (pageW / 3) * 2, y: infoY, size: 7.5, font: fontBold });
    page.drawText(lapsoNombre, { x: (pageW / 3) * 2 + fontBold.widthOfTextAtSize("Lapso: ", 7.5), y: infoY, size: 7.5, font });

    const fechaY = infoY - 11;
    page.drawText(`Fecha: `, { x: marginX, y: fechaY, size: 7.5, font: fontBold });
    page.drawText(format(new Date(), "dd/MM/yyyy", { locale: es }), { x: marginX + fontBold.widthOfTextAtSize("Fecha: ", 7.5), y: fechaY, size: 7.5, font });

    page.drawText(`Total estudiantes: `, { x: pageW / 3, y: fechaY, size: 7.5, font: fontBold });
    page.drawText(`${filas.length}`, { x: pageW / 3 + fontBold.widthOfTextAtSize("Total estudiantes: ", 7.5), y: fechaY, size: 7.5, font });

    // Table start Y
    const tableStartY = fechaY - 10;

    const hLine = (y: number, x1 = marginX, x2 = marginX + tableW) =>
      page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.4 });

    const vLine = (x: number, y1: number, y2: number) =>
      page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.4 });

    const centerText = (text: string, x: number, w: number, y: number, f: any, size: number, color = rgb(0, 0, 0)) => {
      const tw = f.widthOfTextAtSize(text, size);
      page.drawText(text, { x: x + w / 2 - tw / 2, y, size, font: f, color });
    };

    // ── Table header ────────────────────────────────────────────────────────
    const headerTop = tableStartY;
    const headerBot = tableStartY - totalHeaderH;
    const subLineY  = headerBot + subH;

    hLine(headerTop);
    hLine(subLineY);
    hLine(headerBot);

    let cx = marginX;

    // Fixed columns (span full header height)
    const drawFixedHeader = (label: string, w: number) => {
      vLine(cx, headerTop, headerBot);
      const ty = headerBot + totalHeaderH / 2 - 3;
      centerText(label, cx, w, ty, fontBold, 7);
      cx += w;
    };

    drawFixedHeader("Nro", colNro);
    drawFixedHeader("Apellidos y Nombres", colNombre);
    drawFixedHeader("Cédula", colCedula);

    // Materia columns — rotated nombre in top zone, abreviatura in sub-header
    for (const mat of materias) {
      vLine(cx, headerTop, headerBot);

      // Rotated full name
      const fontSize = 6;
      const maxLabelW = headerH - 4;
      const label = truncate(mat.nombre, maxLabelW, fontBold, fontSize);
      const labelW = fontBold.widthOfTextAtSize(label, fontSize);
      const xPos = cx + colMat / 2 + fontSize * 0.35;
      const yPos = subLineY + (headerH - labelW) / 2;
      page.drawText(label, { x: xPos, y: yPos, size: fontSize, font: fontBold, rotate: degrees(90) });

      // Abreviatura in sub-header zone
      const abrevLabel = truncate(mat.abreviatura, colMat - 2, fontBold, 6.5);
      centerText(abrevLabel, cx, colMat, headerBot + subH / 2 - 2.5, fontBold, 6.5);

      cx += colMat;
    }

    // Summary columns
    const drawSummaryHeader = (label: string, w: number, color = rgb(0, 0, 0)) => {
      vLine(cx, headerTop, headerBot);
      const ty = headerBot + totalHeaderH / 2 - 3;
      centerText(label, cx, w, ty, fontBold, 6.5, color);
      cx += w;
    };
    drawSummaryHeader("Prom.", colProm, rgb(0.1, 0.2, 0.6));
    drawSummaryHeader("Pos.",  colPos);
    drawSummaryHeader("Apr.",  colApr, rgb(0.1, 0.5, 0.1));
    drawSummaryHeader("Apl.",  colApl, rgb(0.7, 0.1, 0.1));
    vLine(cx, headerTop, headerBot);

    return { page, tableStartY, headerBot, hLine, vLine, centerText };
  };

  // ── Render pages ──────────────────────────────────────────────────────────

  let { page, tableStartY, headerBot, hLine, vLine, centerText } = drawPage();
  let currentY = headerBot;

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];

    // Start a new page if needed (leave 60pt for footer)
    if (currentY - rowH < 60) {
      // Close current table box
      vLine(marginX, headerBot, currentY);
      vLine(marginX + tableW, headerBot, currentY);
      hLine(currentY);

      const next = drawPage();
      page        = next.page;
      tableStartY = next.tableStartY;
      headerBot   = next.headerBot;
      hLine       = next.hLine;
      vLine       = next.vLine;
      centerText  = next.centerText;
      currentY    = headerBot;
    }

    const rowTop = currentY;
    const rowBot = currentY - rowH;
    const textY  = rowBot + rowH / 2 - 3;

    hLine(rowBot);

    // Alternating row background
    if (i % 2 === 1) {
      page.drawRectangle({ x: marginX, y: rowBot, width: tableW, height: rowH, color: rgb(0.96, 0.96, 0.97), opacity: 1 });
    }

    let rx = marginX;

    const drawCell = (text: string, w: number, f: any = font, size = 7, color = rgb(0, 0, 0), centered = true) => {
      vLine(rx, rowTop, rowBot);
      if (centered) {
        centerText(text, rx, w, textY, f, size, color);
      } else {
        const t = truncate(text, w - 4, f, size);
        page.drawText(t, { x: rx + 3, y: textY, size, font: f, color });
      }
      rx += w;
    };

    // Nro
    drawCell(`${i + 1}`, colNro, font, 7, rgb(0.4, 0.4, 0.4));

    // Apellidos y Nombres
    const nombreCompleto = `${fila.apellidos}, ${fila.nombres}`;
    drawCell(nombreCompleto, colNombre, font, 6.5, rgb(0, 0, 0), false);

    // Cédula
    drawCell(`${fila.tipo_cedula}-${fila.cedula}`, colCedula, font, 6.5);

    // Notas por materia
    for (const mat of materias) {
      const nota = fila.notas[mat.id];
      const color =
        nota === null ? rgb(0.7, 0.7, 0.7) :
        nota >= 15   ? rgb(0.1, 0.5, 0.1) :
        nota >= 10   ? rgb(0.1, 0.2, 0.6) :
        rgb(0.8, 0, 0);
      drawCell(nota !== null ? nota.toFixed(0) : "–", colMat, nota !== null && nota < 10 ? fontBold : font, 7, color);
    }

    // Promedio
    const promColor =
      fila.promedio >= 15 ? rgb(0.1, 0.5, 0.1) :
      fila.promedio >= 10 ? rgb(0.1, 0.2, 0.6) :
      rgb(0.8, 0, 0);
    drawCell(fila.promedio.toFixed(2), colProm, fontBold, 7, promColor);

    // Posición
    drawCell(fila.posicion ? `${fila.posicion}°` : "–", colPos, font, 7);

    // Aprobadas
    drawCell(`${fila.aprobadas}`, colApr, font, 7, rgb(0.1, 0.5, 0.1));

    // Aplazadas
    drawCell(
      `${fila.aplazadas}`,
      colApl,
      fila.aplazadas > 0 ? fontBold : font,
      7,
      fila.aplazadas > 0 ? rgb(0.8, 0, 0) : rgb(0.4, 0.4, 0.4)
    );

    vLine(rx, rowTop, rowBot);
    currentY = rowBot;
  }

  // ── Promedio general footer row ───────────────────────────────────────────
  if (filas.length > 0) {
    const footerH = 16;
    const footerBot = currentY - footerH;
    if (footerBot >= 55) {
      hLine(footerBot);
      page.drawRectangle({ x: marginX, y: footerBot, width: tableW, height: footerH, color: rgb(0.9, 0.92, 0.97), opacity: 1 });
      const ty = footerBot + footerH / 2 - 3;
      let rx = marginX;
      vLine(rx, currentY, footerBot);
      rx += colNro;
      vLine(rx, currentY, footerBot);
      page.drawText("Promedio General", { x: rx + 3, y: ty, size: 7, font: fontBold, color: rgb(0.1, 0.2, 0.6) });
      rx += colNombre;
      vLine(rx, currentY, footerBot);
      rx += colCedula;
      vLine(rx, currentY, footerBot);

      for (const mat of materias) {
        const vals = filas.map(f => f.notas[mat.id]).filter((n): n is number => n !== null);
        const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "–";
        const avgColor =
          vals.length === 0 ? rgb(0.5, 0.5, 0.5) :
          parseFloat(avg) >= 15 ? rgb(0.1, 0.5, 0.1) :
          parseFloat(avg) >= 10 ? rgb(0.1, 0.2, 0.6) :
          rgb(0.8, 0, 0);
        const tw = font.widthOfTextAtSize(avg, 7);
        page.drawText(avg, { x: rx + colMat / 2 - tw / 2, y: ty, size: 7, font, color: avgColor });
        vLine(rx, currentY, footerBot);
        rx += colMat;
      }

      // Overall promedio
      const overallAvg = filas.length > 0 ? (filas.reduce((a, f) => a + f.promedio, 0) / filas.length).toFixed(2) : "–";
      const overallColor = parseFloat(overallAvg) >= 10 ? rgb(0.1, 0.2, 0.6) : rgb(0.8, 0, 0);
      vLine(rx, currentY, footerBot);
      const tw2 = fontBold.widthOfTextAtSize(overallAvg, 7);
      page.drawText(overallAvg, { x: rx + colProm / 2 - tw2 / 2, y: ty, size: 7, font: fontBold, color: overallColor });
      rx += colProm;
      vLine(rx, currentY, footerBot);
      rx += colPos;
      vLine(rx, currentY, footerBot);
      rx += colApr;
      vLine(rx, currentY, footerBot);
      rx += colApl;
      vLine(rx, currentY, footerBot);
      currentY = footerBot;
    }
  }

  // Close table box
  vLine(marginX, headerBot, currentY);
  vLine(marginX + tableW, headerBot, currentY);
  hLine(currentY);

  // ── Signatures ─────────────────────────────────────────────────────────────
  const sigY = 50;
  const drawCentered = (text: string, cx: number, y: number, f: any, size: number) => {
    const tw = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: cx - tw / 2, y, size, font: f });
  };

  const c1 = pageW * 0.2;
  const c2 = pageW * 0.5;
  const c3 = pageW * 0.8;
  page.drawLine({ start: { x: c1 - 60, y: sigY }, end: { x: c1 + 60, y: sigY }, thickness: 0.7 });
  drawCentered("Prof. Rony Brazón", c1, sigY - 11, fontBold, 7.5);
  drawCentered("Director de la Institución", c1, sigY - 20, font, 7);

  drawCentered("Sello de la Institución", c2, sigY - 14, font, 8);

  page.drawLine({ start: { x: c3 - 70, y: sigY }, end: { x: c3 + 70, y: sigY }, thickness: 0.7 });
  drawCentered("Licda. Ana Caldea", c3, sigY - 11, fontBold, 7.5);
  drawCentered("Coordinación de Control", c3, sigY - 20, font, 7);
  drawCentered("de Estudio y Evaluación", c3, sigY - 29, font, 7);

  // ── Save & Open ─────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const fechaArchivo = format(new Date(), "dd-MM-yyyy");
  const seccionSlug  = seccionNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const nombreArchivo = `sabana_notas_${seccionSlug}_${lapsoNombre.replace(/\s+/g, "_")}_${fechaArchivo}.pdf`;

  // Abrir en nueva pestaña (el usuario puede guardar desde ahí)
  window.open(url, "_blank");

  // Crear un link de descarga por si el navegador bloquea la apertura
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
