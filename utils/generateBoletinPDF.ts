import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoletinMateria {
  id: string;
  nombre: string;
  lapso1: number | null;
  lapso2: number | null;
  lapso3: number | null;
  promedio: number | null;
}

export interface GenerateBoletinPDFProps {
  // Student info
  estudianteNombre: string;
  estudianteCedula: string;
  // Academic info
  seccionNombre: string;
  gradoAño: string;
  nivelEducativo: string;
  periodoNombre: string;
  representanteNombre: string;
  representanteCedula: string;
  // Grades
  materias: BoletinMateria[];
  promedioGeneral: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawHLine(
  page: any,
  x1: number,
  x2: number,
  y: number,
  thickness = 0.5,
  color = rgb(0.7, 0.7, 0.7)
) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

function drawVLine(
  page: any,
  x: number,
  y1: number,
  y2: number,
  thickness = 0.5,
  color = rgb(0.7, 0.7, 0.7)
) {
  page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness, color });
}

function centerText(
  page: any,
  font: any,
  text: string,
  cx: number,
  y: number,
  size: number,
  color = rgb(0, 0, 0)
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export const generarBoletinPDF = async (dataInput: GenerateBoletinPDFProps | GenerateBoletinPDFProps[]) => {
  const dataItems = Array.isArray(dataInput) ? dataInput : [dataInput];
  if (dataItems.length === 0) return;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Logos
  const logo1Bytes = await fetch("/Logo1.png").then((r) => r.arrayBuffer());
  const logo2Bytes = await fetch("/Logo2.png").then((r) => r.arrayBuffer());
  const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((r) => r.arrayBuffer());
  const logo1 = await pdfDoc.embedPng(logo1Bytes);
  const logo2 = await pdfDoc.embedPng(logo2Bytes);
  const logo3 = await pdfDoc.embedPng(logo3Bytes);

  // ── Page setup (Portrait A4) ───────────────────────────────────────────────
  const pageW = 595.28;
  const pageH = 841.89;
  const marginX = 40;
  const contentW = pageW - marginX * 2;

  // Iterate over each student data
  for (const data of dataItems) {
    const {
      estudianteNombre,
      estudianteCedula,
      seccionNombre,
      gradoAño,
      nivelEducativo,
      periodoNombre,
      representanteNombre,
      representanteCedula,
      materias,
      promedioGeneral,
    } = data;

    const page = pdfDoc.addPage([pageW, pageH]);

    // ── Header ────────────────────────────────────────────────────────────────
    const logoSize = 56;
    const logoY = pageH - 20 - logoSize;

    page.drawImage(logo1, { x: marginX, y: logoY, width: logoSize, height: logoSize });
    page.drawImage(logo3, { x: pageW - marginX - logoSize, y: logoY, width: logoSize, height: logoSize });

    // School name + logo2 centered
    const logo2W = 140;
    const logo2H = 30;
    page.drawImage(logo2, {
      x: pageW / 2 - logo2W / 2,
      y: logoY + logoSize - logo2H - 2,
      width: logo2W,
      height: logo2H,
    });

  // School address / subtitle
  // centerText(page, font, "U.E.P.A. ALEJANDRO OROPEZA CASTILLO", pageW / 2, logoY + 14, 7, rgb(0.3, 0.3, 0.3));
  // centerText(page, font, "Maracaibo, Estado Zulia", pageW / 2, logoY + 4, 7, rgb(0.3, 0.3, 0.3));

  // ── Title bar ─────────────────────────────────────────────────────────────
  const titleBarY = logoY - 18;
  const titleBarH = 20;
  page.drawRectangle({
    x: marginX,
    y: titleBarY - titleBarH,
    width: contentW,
    height: titleBarH,
    color: rgb(0.13, 0.22, 0.49),
  });
  centerText(page, fontBold, "BOLETÍN DE CALIFICACIONES", pageW / 2, titleBarY - titleBarH + 6, 11, rgb(1, 1, 1));

  // ── Student info card ─────────────────────────────────────────────────────
  const infoBoxY = titleBarY - titleBarH - 12;
  const infoBoxH = 56;
  page.drawRectangle({
    x: marginX,
    y: infoBoxY - infoBoxH,
    width: contentW,
    height: infoBoxH,
    color: rgb(0.96, 0.97, 1),
    borderColor: rgb(0.13, 0.22, 0.49),
    borderWidth: 0.8,
  });

  const infoLeft = marginX + 10;
  const infoRight = pageW / 2 + 10;
  let infoY = infoBoxY - 12;

  const drawInfoLine = (label: string, value: string, x: number) => {
    page.drawText(label, { x, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49) });
    page.drawText(value, { x: x + fontBold.widthOfTextAtSize(label, 8) + 3, y: infoY, size: 8, font });
    infoY -= 13;
  };

  // Left column
  infoY = infoBoxY - 12;
  page.drawText("Estudiante:", {x: infoLeft, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49)});
  page.drawText(estudianteNombre, {x: infoLeft + fontBold.widthOfTextAtSize("Estudiante:", 8) + 3, y: infoY, size: 8, font});
  infoY -= 13;
  page.drawText("Cédula:", {x: infoLeft, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49)});
  page.drawText(estudianteCedula, {x: infoLeft + fontBold.widthOfTextAtSize("Cédula:", 8) + 3, y: infoY, size: 8, font});
  infoY -= 13;
  page.drawText("Sección:", {x: infoLeft, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49)});
  page.drawText(seccionNombre, {x: infoLeft + fontBold.widthOfTextAtSize("Sección:", 8) + 3, y: infoY, size: 8, font});

  // Right column
  infoY = infoBoxY - 12;
  page.drawText("Período:", {x: infoRight, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49)});
  page.drawText(periodoNombre, {x: infoRight + fontBold.widthOfTextAtSize("Período:", 8) + 3, y: infoY, size: 8, font});
  infoY -= 13;
  page.drawText("Nivel:", {x: infoRight, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49)});
  page.drawText(nivelEducativo, {x: infoRight + fontBold.widthOfTextAtSize("Nivel:", 8) + 3, y: infoY, size: 8, font});
  infoY -= 13;
  page.drawText("Representante:", {x: infoRight, y: infoY, size: 8, font: fontBold, color: rgb(0.13, 0.22, 0.49)});
  page.drawText(`${representanteNombre} (V-${representanteCedula})`, {x: infoRight + fontBold.widthOfTextAtSize("Representante:", 8) + 3, y: infoY, size: 8, font});

  // ── Grades Table ──────────────────────────────────────────────────────────
  const tableTopY = infoBoxY - infoBoxH - 16;
  const rowH = 18;
  const headerH = 22;

  // Columns logic
  const colsCount = 4; // L1, L2, L3, Prom
  const colNotaW = 55;
  const colMatNombre = contentW - (colNotaW * colsCount);

  // Header background
  page.drawRectangle({
    x: marginX,
    y: tableTopY - headerH,
    width: contentW,
    height: headerH,
    color: rgb(0.13, 0.22, 0.49),
  });

  // Header labels
  const headerTextY = tableTopY - headerH + 7;
  page.drawText("MATERIA", { x: marginX + 6, y: headerTextY, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  centerText(page, fontBold, "LAPSO 1", marginX + colMatNombre + colNotaW * 0.5, headerTextY, 8.5, rgb(1, 1, 1));
  centerText(page, fontBold, "LAPSO 2", marginX + colMatNombre + colNotaW * 1.5, headerTextY, 8.5, rgb(1, 1, 1));
  centerText(page, fontBold, "LAPSO 3", marginX + colMatNombre + colNotaW * 2.5, headerTextY, 8.5, rgb(1, 1, 1));
  centerText(page, fontBold, "PROMEDIO", marginX + colMatNombre + colNotaW * 3.5, headerTextY, 8.5, rgb(1, 1, 1));

  // Header border lines
  drawVLine(page, marginX + colMatNombre, tableTopY, tableTopY - headerH, 0.6, rgb(1, 1, 1));
  drawVLine(page, marginX + colMatNombre + colNotaW, tableTopY, tableTopY - headerH, 0.6, rgb(1, 1, 1));
  drawVLine(page, marginX + colMatNombre + colNotaW * 2, tableTopY, tableTopY - headerH, 0.6, rgb(1, 1, 1));
  drawVLine(page, marginX + colMatNombre + colNotaW * 3, tableTopY, tableTopY - headerH, 0.6, rgb(1, 1, 1));

  // Table rows
  let currentY = tableTopY - headerH;

  // Outer border top
  drawHLine(page, marginX, marginX + contentW, tableTopY, 0.8, rgb(0.13, 0.22, 0.49));

  for (let i = 0; i < materias.length; i++) {
    const mat = materias[i];
    const rowBot = currentY - rowH;

    // Alternating background
    if (i % 2 === 1) {
      page.drawRectangle({
        x: marginX,
        y: rowBot,
        width: contentW,
        height: rowH,
        color: rgb(0.95, 0.96, 0.99),
      });
    }

    // Row bottom border
    drawHLine(page, marginX, marginX + contentW, rowBot, 0.4);

    // Vertical dividers
    drawVLine(page, marginX + colMatNombre, currentY, rowBot, 0.4);
    drawVLine(page, marginX + colMatNombre + colNotaW, currentY, rowBot, 0.4);
    drawVLine(page, marginX + colMatNombre + colNotaW * 2, currentY, rowBot, 0.4);
    drawVLine(page, marginX + colMatNombre + colNotaW * 3, currentY, rowBot, 0.4);

    const textY = rowBot + rowH / 2 - 3.5;

    // Materia name
    let materiaText = mat.nombre;
    const maxMateriaW = colMatNombre - 12;
    if (font.widthOfTextAtSize(materiaText, 8.5) > maxMateriaW) {
      const words = materiaText.split(" ");
      while (words.length > 0 && font.widthOfTextAtSize(words.join(" ") + "...", 8.5) > maxMateriaW) {
        words.pop();
      }
      materiaText = words.join(" ") + "...";
    }

    page.drawText(materiaText, { x: marginX + 6, y: textY, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });

    const renderNota = (n: number | null, xOffset: number, isBold: boolean = false) => {
      if (n !== null) {
        const notaStr = n.toFixed(2);
        const notaColor = n >= 15 ? rgb(0.05, 0.45, 0.05) : n >= 10 ? rgb(0.1, 0.2, 0.6) : rgb(0.75, 0.05, 0.05);
        centerText(page, isBold ? fontBold : font, notaStr, marginX + colMatNombre + xOffset, textY, isBold ? 9 : 8.5, notaColor);
      } else {
        centerText(page, font, "–", marginX + colMatNombre + xOffset, textY, 9, rgb(0.6, 0.6, 0.6));
      }
    };

    // Notas
    renderNota(mat.lapso1, colNotaW * 0.5);
    renderNota(mat.lapso2, colNotaW * 1.5);
    renderNota(mat.lapso3, colNotaW * 2.5);
    renderNota(mat.promedio, colNotaW * 3.5, true);

    currentY = rowBot;
  }

  // Outer border bottom and sides
  drawHLine(page, marginX, marginX + contentW, currentY, 0.8, rgb(0.13, 0.22, 0.49));
  drawVLine(page, marginX, tableTopY, currentY, 0.8, rgb(0.13, 0.22, 0.49));
  drawVLine(page, marginX + contentW, tableTopY, currentY, 0.8, rgb(0.13, 0.22, 0.49));

  // ── Bar Chart — Resumen de Calificaciones ────────────────────────────────
  const MATERIAS_CON_NOTA = materias.filter(m => m.promedio !== null);
  const barSectionGap = 14;
  const barRowH = 14;
  const barRowGap = 5;
  const barLabelW = 160;
  const barTrackX = marginX + barLabelW + 6;
  const barTrackW = contentW - barLabelW - 6 - 38; // leave 38 for value
  const barValueX = barTrackX + barTrackW + 5;

  if (MATERIAS_CON_NOTA.length > 0) {
    // Section title
    const chartTitleY = currentY - barSectionGap;
    page.drawRectangle({
      x: marginX,
      y: chartTitleY - 14,
      width: contentW,
      height: 14,
      color: rgb(0.13, 0.22, 0.49),
      opacity: 0.9,
    });
    page.drawText("RESUMEN DE CALIFICACIONES", {
      x: marginX + 6,
      y: chartTitleY - 10,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    let barY = chartTitleY - 14 - barRowGap;

    for (const mat of MATERIAS_CON_NOTA) {
      const nota = mat.promedio!;
      const pct = Math.min(1, nota / 20);

      const barColor =
        nota >= 15 ? rgb(0.18, 0.65, 0.28) :
        nota >= 10 ? rgb(0.12, 0.38, 0.75) :
        rgb(0.82, 0.15, 0.15);

      const rowBot = barY - barRowH;

      // Label
      // Truncate label so it doesn't overflow barLabelW
      let labelText = mat.nombre;
      while (font.widthOfTextAtSize(labelText, 7.5) > barLabelW - 4 && labelText.length > 3) {
        labelText = labelText.slice(0, -1);
      }
      if (labelText.length < mat.nombre.length) labelText += ".";
      page.drawText(labelText, {
        x: marginX,
        y: rowBot + barRowH / 2 - 3,
        size: 7.5,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });

      // Track background
      page.drawRectangle({
        x: barTrackX,
        y: rowBot + 2,
        width: barTrackW,
        height: barRowH - 4,
        color: rgb(0.88, 0.9, 0.93),
      });

      // Filled bar
      if (pct > 0) {
        page.drawRectangle({
          x: barTrackX,
          y: rowBot + 2,
          width: barTrackW * pct,
          height: barRowH - 4,
          color: barColor,
        });
      }

      // Value label
      const notaStr = nota.toFixed(1);
      const notaW = fontBold.widthOfTextAtSize(notaStr, 8);
      page.drawText(notaStr, {
        x: barValueX + (32 - notaW),
        y: rowBot + barRowH / 2 - 3,
        size: 8,
        font: fontBold,
        color: barColor,
      });

      barY = rowBot - barRowGap;
    }

    currentY = barY - 4;
  }

  // ── Promedio General ──────────────────────────────────────────────────────
  const promY = currentY - 14;
  const promBoxH = 28;

  const promColor =
    promedioGeneral >= 15 ? rgb(0.05, 0.45, 0.05) :
    promedioGeneral >= 10 ? rgb(0.1, 0.2, 0.6) :
    rgb(0.75, 0.05, 0.05);

  const promBgColor =
    promedioGeneral >= 15 ? rgb(0.92, 0.98, 0.92) :
    promedioGeneral >= 10 ? rgb(0.93, 0.95, 1) :
    rgb(1, 0.93, 0.93);

  page.drawRectangle({
    x: marginX,
    y: promY - promBoxH,
    width: contentW,
    height: promBoxH,
    color: promBgColor,
    borderColor: promColor,
    borderWidth: 1,
  });

  page.drawText("PROMEDIO GENERAL:", {
    x: marginX + 10,
    y: promY - promBoxH / 2 - 3,
    size: 10,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  const promedioStr = promedioGeneral.toFixed(2);
  centerText(
    page,
    fontBold,
    promedioStr,
    marginX + contentW * 0.75,
    promY - promBoxH / 2 - 3,
    13,
    promColor
  );

  // Condición general
  const condGeneral = promedioGeneral >= 10 ? "APROBADO" : "APLAZADO";
  centerText(page, font, condGeneral, marginX + contentW * 0.88, promY - promBoxH / 2 - 3, 9, promColor);

  // ── Date ──────────────────────────────────────────────────────────────────
  const legendY = promY - promBoxH - 10;
  // ── Legend Removed As Requested ──────────────────────────────────────────

  // ── Issue date ────────────────────────────────────────────────────────────
  const fechaStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  page.drawText(`Fecha de emisión: ${fechaStr}`, {
    x: marginX,
    y: legendY - 12,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ── Signatures ────────────────────────────────────────────────────────────
  const sigY = 90;

  centerText(page, fontBold, "Sello de la Institución", pageW / 2, sigY - 11, 7.5);

  } // <-- End of student loop

  // ── Save & Open ───────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const fecha = format(new Date(), "dd-MM-yyyy");
  
  let nombreArchivo = `boletines_${fecha}.pdf`;
  if (dataItems.length === 1) {
    const data = dataItems[0];
    const nombreSlug = data.estudianteNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    nombreArchivo = `boletin_${nombreSlug}_${fecha}.pdf`;
  } else if (dataItems.length > 1) {
    const secc = dataItems[0].seccionNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    nombreArchivo = `boletines_${secc}_${dataItems.length}_estudiantes_${fecha}.pdf`;
  }

  window.open(url, "_blank");

  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
