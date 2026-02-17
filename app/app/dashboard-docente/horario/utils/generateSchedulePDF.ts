import { HorarioClase } from "@/interfaces/horarios.interface";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface GenerateSchedulePDFProps {
  teacherName: string;
  periodName: string;
  schedules: HorarioClase[];
}

const DAYS = [
  { id: 1, name: "LUNES" },
  { id: 2, name: "MARTES" },
  { id: 3, name: "MIERCOLES" },
  { id: 4, name: "JUEVES" },
  { id: 5, name: "VIERNES" },
];

const BLOCKS = [
  { id: 1, time: "07:00 a 07:45" },
  { id: 2, time: "07:45 a 08:30" },
  { id: 3, time: "08:30 a 09:15" },
  { id: 4, time: "09:15 a 10:00" },
  { id: 5, time: "10:00 a 10:45" },
  { id: 6, time: "10:45 a 11:30" },
  { id: 7, time: "11:30 a 12:15" },
  { id: 8, time: "12:15 a 01:00" },
  { id: 9, time: "01:00 a 01:45" },
];

export async function generateSchedulePDF({ teacherName, periodName, schedules }: GenerateSchedulePDFProps) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load Logos
  const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
  const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
  const logo3Bytes = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

  const logo1Img = await pdfDoc.embedPng(logo1Bytes);
  const logo2Img = await pdfDoc.embedPng(logo2Bytes);
  const logo3Img = await pdfDoc.embedPng(logo3Bytes);

  // A4 Landscape
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const margin = 30;

  // --- Header ---
  const yLogos = height - 100; // Adjusted for larger logos
  
  // Left Logo
  page.drawImage(logo1Img, { x: margin, y: yLogos, width: 80, height: 65 });
  
  // Right Logo
  page.drawImage(logo3Img, { x: width - margin - 70, y: yLogos, width: 70, height: 70 });

  // Center Content (Title & Info)
  const title = "HORARIO DEL DOCENTE";
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 20);
  page.drawText(title, {
    x: width / 2 - titleWidth / 2,
    y: height - 55,
    size: 20,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  const subtitle = `Docente: ${teacherName}   -   Período: ${periodName}`;
  const subtitleWidth = helvetica.widthOfTextAtSize(subtitle, 12);
  page.drawText(subtitle, {
    x: width / 2 - subtitleWidth / 2,
    y: height - 80,
    size: 12,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // --- Grid Configuration ---
  const gridStartY = height - 130;
  const gridHeight = 400; // Approximate height for the grid
  const gridWidth = width - (margin * 2);
  
  const colTimeWidth = 90;
  const colDayWidth = (gridWidth - colTimeWidth) / 5;
  
  const headerHeight = 30;
  const rowHeight = (gridHeight - headerHeight) / BLOCKS.length;

  // --- Draw Grid Headers ---
  
  // Header Background
  page.drawRectangle({
    x: margin,
    y: gridStartY - headerHeight,
    width: gridWidth,
    height: headerHeight,
    color: rgb(0.9, 0.9, 0.9), // Light gray background
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // "HORA" Header
  page.drawText("HORA", {
    x: margin + colTimeWidth / 2 - 15,
    y: gridStartY - 20,
    size: 10,
    font: helveticaBold,
  });

  // Days Headers
  DAYS.forEach((day, index) => {
    const xPos = margin + colTimeWidth + (index * colDayWidth);
    
    // Vertical line before this day
    page.drawLine({
      start: { x: xPos, y: gridStartY },
      end: { x: xPos, y: gridStartY - gridHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    const textWidth = helveticaBold.widthOfTextAtSize(day.name, 10);
    page.drawText(day.name, {
      x: xPos + colDayWidth / 2 - textWidth / 2,
      y: gridStartY - 20,
      size: 10,
      font: helveticaBold,
    });
  });

  // --- Draw Grid Rows & Content ---
  
  BLOCKS.forEach((block, index) => {
    const yPos = gridStartY - headerHeight - (index * rowHeight);
    
    // Horizontal line after this row
    page.drawLine({
      start: { x: margin, y: yPos - rowHeight },
      end: { x: width - margin, y: yPos - rowHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Time Cell Content
    const timeTextWidth = helvetica.widthOfTextAtSize(block.time, 10);
    page.drawText(block.time, {
      x: margin + colTimeWidth / 2 - timeTextWidth / 2, // Centered
      y: yPos - (rowHeight / 2) - 3.5,
      size: 10, // Increased size
      font: helvetica,
    });
    
    // Vertical Line after Time Column
    page.drawLine({
      start: { x: margin + colTimeWidth, y: gridStartY },
      end: { x: margin + colTimeWidth, y: gridStartY - gridHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Cells for Days
    DAYS.forEach((day, dayIndex) => {
      const cls = schedules.find(s => s.dia === day.id && s.bloque_horario === block.id);
      
      const xPos = margin + colTimeWidth + (dayIndex * colDayWidth);
      
      if (cls) {
        // Subject Name
        const subject = cls.nombre_materia || "Materia";
        const section = cls.nombre_seccion || "";
        
        // Smart wrapping logic
        const maxWidth = colDayWidth - 10; // Padding
        let line1 = subject;
        let line2 = "";
        
        if (helveticaBold.widthOfTextAtSize(subject, 11) > maxWidth) {
           const words = subject.split(" ");
           line1 = "";
           line2 = "";
           
           // Try to fit words into line 1
           for (const word of words) {
             const testLine = line1 ? `${line1} ${word}` : word;
             if (helveticaBold.widthOfTextAtSize(testLine, 11) <= maxWidth) {
               line1 = testLine;
             } else {
               // If word doesn't fit, put remaining words in line 2
               const remainingWords = words.slice(words.indexOf(word));
               line2 = remainingWords.join(" ");
               break; 
             }
           }
           
           // Fallback: If single word is too long (e.g. extremely long weird word), split by char
           if (!line1 && words.length > 0) {
             const word = words[0];
             // Simple fallback split
             line1 = word.substring(0, 15);
             line2 = word.substring(15) + " " + line2;
           }
        }

        // Adjusted Y position for larger text
        const textY = yPos - (rowHeight / 2) + 6;

        // Center Line 1
        const line1Width = helveticaBold.widthOfTextAtSize(line1, 11);
        page.drawText(line1, {
            x: xPos + colDayWidth / 2 - line1Width / 2,
            y: textY,
            size: 11,
            font: helveticaBold,
            color: rgb(0, 0, 0),
        });

        if (line2) {
             // Center Line 2
             const line2Width = helveticaBold.widthOfTextAtSize(line2, 11);
             page.drawText(line2, {
                x: xPos + colDayWidth / 2 - line2Width / 2,
                y: textY - 13, // Increased spacing
                size: 11,
                font: helveticaBold,
                color: rgb(0, 0, 0),
            });
        }
        
        // Center Section
        const sectionWidth = helvetica.widthOfTextAtSize(section, 10);
        page.drawText(section, {
            x: xPos + colDayWidth / 2 - sectionWidth / 2,
            y: textY - (line2 ? 26 : 15), // Adjusted spacing for larger fonts
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        });
      }
    });

  });

  // Outer Border
  page.drawRectangle({
    x: margin,
    y: gridStartY - gridHeight,
    width: gridWidth,
    height: gridHeight,
    color: undefined,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Save and Download
  const pdfBytes = await pdfDoc.save();
  // @ts-expect-error - pdf-lib Uint8Array vs Blob
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
