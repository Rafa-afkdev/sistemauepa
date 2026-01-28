/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Estudiantes } from "@/interfaces/estudiantes.interface";
import type { InscripcionSeccion } from "@/interfaces/secciones.interface";
import { Representante } from "@/interfaces/users.interface";
import { getCollection, getDocument } from "@/lib/data/firebase";
import { where } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useState } from "react";

export function CreateConstanciaStudent() {
  const [estudiantes, setEstudiantes] = useState<Estudiantes | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cedula, setCedula] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedConstanciaType, setSelectedConstanciaType] = useState<'estudio' | 'inscripcion' | 'asistencia'>('estudio');
  const [inscripcionActual, setInscripcionActual] = useState<InscripcionSeccion | null>(null);
  const [periodoNombre, setPeriodoNombre] = useState<string | null>(null);
  const [gradoAño, setGradoAño] = useState<string | null>(null);
  const [nivelEducativo, setNivelEducativo] = useState<string | null>(null);
  const [seccionNombre, setSeccionNombre] = useState<string | null>(null);
  const [isLoadingLookups, setIsLoadingLookups] = useState<boolean>(false);

  const handleGenerateConstancia = () => {
    if (!estudiantes) return;

    console.log("Generando constancia con datos:", {
      periodoNombre,
      gradoAño,
      nivelEducativo,
      inscripcionActual
    });

    // Verificar inscripción del estudiante en la colección estudiantes_inscritos
    if (!inscripcionActual) {
      showToast.error("El estudiante no posee una inscripción registrada en el periodo actual");
      return;
    }

    // Verificar que la inscripción esté activa
    if (inscripcionActual.estado !== "activo") {
      showToast.error("El estudiante no tiene una inscripción activa");
      return;
    }
    
    if (selectedConstanciaType === 'estudio') {
      generatePdfDocumentConstanciaDeEstudio(estudiantes);
    } else if (selectedConstanciaType === 'inscripcion') {
      generatePdfDocumentConstanciaDeInscripcion(estudiantes);
    } else if (selectedConstanciaType === 'asistencia') {
      // Logic for asistencia - requires representative
      const fetchRepresentative = async () => {
        setIsLoading(true);
        try {
          // First check: does student have id_representante?
          let representante: Representante | null = null;

          if (estudiantes.id_representante) {
             const repDoc = await getDocument(`representantes/${estudiantes.id_representante}`);
             if (repDoc) representante = repDoc as Representante;
          }

          // Second check: search in collection by estudiantes_ids
          if (!representante && estudiantes.id) {
             const repQuery = [where("estudiantes_ids", "array-contains", estudiantes.id)];
             const res = await getCollection("representantes", repQuery) as Representante[];
             if (res.length > 0) representante = res[0];
          }

          if (representante) {
            generatePdfDocumentConstanciaDeAsistencia(estudiantes, representante);
          } else {
             showToast.error("El estudiante no tiene un representante asignado. No se puede generar la constancia.");
          }

        } catch (error) {
           console.error("Error finding representative:", error);
           showToast.error("Error al buscar datos del representante");
        } finally {
           setIsLoading(false);
        }
      };
      
      fetchRepresentative();
    }
  };

  const getStudents = async () => {
    if (!cedula.trim()) {
      showToast.error("Por favor, ingrese una cédula válida");
      return;
    }

    setIsLoading(true);

    try {
      const path = `estudiantes`;
      const query = [where("cedula", "==", Number(cedula))];
      const res = (await getCollection(path, query)) as any[];

      if (res.length > 0) {
        const estudiante = res[0];
        setEstudiantes(estudiante); // Guardamos el primer resultado
        // Buscar inscripción más reciente del estudiante para obtener periodo y nivel educativo
        if (estudiante?.id) {
          const insc = (await getCollection(
            "estudiantes_inscritos",
            [where("id_estudiante", "==", estudiante.id)]
          )) as InscripcionSeccion[];
          const latest = [...(insc || [])].sort((a: any, b: any) => {
            const ta = a?.fecha_inscripcion?.toMillis ? a.fecha_inscripcion.toMillis() : 0;
            const tb = b?.fecha_inscripcion?.toMillis ? b.fecha_inscripcion.toMillis() : 0;
            return tb - ta;
          })[0];
          setInscripcionActual(latest ?? null);

          // Obtener datos adicionales si existe inscripción
          if (latest) {
            console.log("Inscripción encontrada:", latest);
            setIsLoadingLookups(true);
            
            let periodoNombreTemp = latest.id_periodo_escolar;
            let gradoAñoTemp = "N/A";
            
            // Obtener nombre del periodo escolar
            if (latest.id_periodo_escolar) {
              try {
                const periodoDoc = (await getDocument(`periodos_escolares/${latest.id_periodo_escolar}`)) as any;
                console.log("Periodo documento:", periodoDoc);
                periodoNombreTemp = periodoDoc?.periodo ?? latest.id_periodo_escolar;
                setPeriodoNombre(periodoNombreTemp);
              } catch (error) {
                console.error("Error obteniendo periodo:", error);
                setPeriodoNombre(latest.id_periodo_escolar);
              }
            }

            // Obtener grado/año de la sección
            if (latest.id_seccion) {
              try {
                const seccionDoc = (await getDocument(`secciones/${latest.id_seccion}`)) as any;
                console.log("Sección documento:", seccionDoc);
                gradoAñoTemp = seccionDoc?.grado_año ?? "N/A";
                setGradoAño(gradoAñoTemp);
                setSeccionNombre(seccionDoc?.seccion ?? "U");
              } catch (error) {
                console.error("Error obteniendo sección:", error);
                setGradoAño("N/A");
                setSeccionNombre("U");
              }
            }

            // Determinar nivel educativo
            setNivelEducativo(latest.nivel_educativo);
            console.log("Datos cargados - Periodo:", periodoNombreTemp, "Grado:", gradoAñoTemp, "Nivel:", latest.nivel_educativo);
            setIsLoadingLookups(false);
          } else {
            setPeriodoNombre(null);
            setGradoAño(null);
            setNivelEducativo(null);
            setIsLoadingLookups(false);
          }
        } else {
          setInscripcionActual(null);
          setPeriodoNombre(null);
          setGradoAño(null);
          setNivelEducativo(null);
          setIsLoadingLookups(false);
        }
      } else {
        showToast.error("Estudiante no encontrado"); // Mostramos el mensaje si no se encuentra
        setEstudiantes(null); // Limpiamos el estado
        setInscripcionActual(null);
        setPeriodoNombre(null);
        setGradoAño(null);
        setSeccionNombre(null);
        setNivelEducativo(null);
        setIsLoadingLookups(false);
      }
    } catch (error: any) {
      console.error("Error fetching student:", error);
      showToast.error("Ocurrió un error al buscar el estudiante");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdfDocumentConstanciaDeEstudio = async (estudiante: Estudiantes) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
    const arialFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const leftMargin = 60; // Margen izquierdo (1 pulgada)
    const rightMargin = 60; // Margen derecho (1 pulgada)
    const marginY = 50;
    let indentSize = 0; // Tamaño de la sangría (modificable para primera línea)
    let currentY = height - marginY;

    const getWordWidth = (word: string, fontSize: number, font: any) => {
      return font.widthOfTextAtSize(word, fontSize);
    };

     // Helper function to justify line of text
  const drawJustifiedLine = (
    words: { text: string; font: any; underline?: boolean }[],
    y: number,
    maxWidth: number,
    fontSize: number,
    isLastLine: boolean = false
  ) => {
    if (words.length === 0) return;

    // Calculate total width of words
    const totalWordsWidth = words.reduce(
      (sum, word) => sum + getWordWidth(word.text, fontSize, word.font),
      0
    );

    // Calculate spacing
    const totalSpaces = words.length - 1;
    const spaceWidth = isLastLine
      ? getWordWidth(" ", fontSize, arialFont)
      : (maxWidth - totalWordsWidth) / totalSpaces;

      let currentX = indentSize? leftMargin + indentSize : leftMargin;
      words.forEach((word, index) => {
      page.drawText(word.text, {
        x: currentX,
        y,
        size: fontSize,
        font: word.font,
        color: rgb(0, 0, 0),
      });

      if (word.underline) {
        page.drawLine({
          start: { x: currentX, y: y - 2 },
          end: { x: currentX + getWordWidth(word.text, fontSize, word.font), y: y - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }

      currentX += getWordWidth(word.text, fontSize, word.font);
      if (index < words.length - 1) {
        currentX += spaceWidth;
      }
    });
  };


  let isFirstLineOfContent = true;
    // Función auxiliar para detectar si una palabra excede el margen derecho
    // const willExceedRightMargin = (currentX: number, text: string, fontSize: number, font: any) => {
    //     const textWidth = font.widthOfTextAtSize(text, fontSize);
    //     return currentX + textWidth > width - rightMargin;
    // };

    // Helper function for underlined text (sin cambios)
    const drawUnderlinedText = (text: string, x: number, y: number, fontSize: number, font = arialFont) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x, y, size: fontSize, font });
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + textWidth, y: y - 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      return textWidth;
    };

    // Logos (ajustados para respetar los márgenes)
    const logoAdventista = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
    const logoText = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
    const logo = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

    const embeddedLogoAdventista = await pdfDoc.embedPng(logoAdventista);
    const embeddedLogoText = await pdfDoc.embedPng(logoText);
    const embeddedLogo = await pdfDoc.embedPng(logo);

    page.drawImage(embeddedLogoAdventista, {
      x: leftMargin,
      y: currentY - 60,
      width: 75,
      height: 65,
    });

    page.drawImage(embeddedLogoText, {
      x: width / 2 - 95,
      y: currentY - 60,
      width: 180,
      height: 45,
    });

    page.drawImage(embeddedLogo, {
      x: width - rightMargin - 60,
      y: currentY - 60,
      width: 60,
      height: 60,
    });

    currentY -= 100;

    // Header texts (sin cambios excepto por el uso de leftMargin)
    // const headerTexts = [
    //   "República Bolivariana de Venezuela",
    //   "Ministerio del Poder Popular para la Educación",
    //   'U.E. COLEGIO ADVENTISTA "LIBERTADOR"',
    //   "Camaguán Estado Guárico",
    //   "RIF-J-29797805-4",
    // ];

    // headerTexts.forEach((text) => {
    //   const centerX = (width - arialFont.widthOfTextAtSize(text, 12)) / 2;
    //   page.drawText(text, {
    //     x: centerX,
    //     y: currentY,
    //     size: 12,
    //     font: arialFont,
    //     color: rgb(0, 0, 0),
    //   });
    //   currentY -= 15;
    // });

    currentY -= 60;

    // Title (ajustado para mantener centrado)
    const titleText = "CONSTANCIA DE ESTUDIO";
    const titleX = (width - boldFont.widthOfTextAtSize(titleText, 16)) / 2;
    drawUnderlinedText(titleText, titleX, currentY, 16, boldFont);
    currentY -= 30;

    // Content with formatted text and strict margin control
    const contentParts = [
      { text: "Quien Suscribe, el ciudadano", font: arialFont },
      { text: "RONY DANIEL BRAZON MATA", font: boldFont },
      { text: ", Titular de la C.I: ", font: arialFont },
      { text: "16.273.472", font: boldFont },
      { text: ", Director de la Unidad Educativa Privada Adventista", font: arialFont },
      { text: "ALEJANDRO OROPEZA CASTILLO", font: boldFont },
      { text: ", que funciona en Guarenas, hace constar por este medio que el (a) Estudiante: ", font: arialFont },
      { text: `${estudiante.apellidos} ${estudiante.nombres}`, font: boldFont, underline: true },
      { text: ", Titular de la C.I: ", font: arialFont },
      { text:"V-" + estudiante.cedula.toString(), font: boldFont },
      { text: ", cursa ", font: arialFont },
      { text: "ESTUDIOS", font: boldFont, underline: true },
      { text: ` de ${gradoAño ?? "N/A"} ${nivelEducativo ?? "N/A"}, en el Nivel de ${nivelEducativo === "Grado" ? "Educación Primaria" : "Educación Media General"}, en esta Institución. En el Periodo Escolar ${periodoNombre ?? "N/A"}.`, font: arialFont },
    ];

    const effectiveWidth = width - leftMargin - rightMargin - indentSize; // Ajustado para la sangría
    const lineHeight = 18;
    const fontSize = 12;
  
    let currentLineWords: any[] = [];
    let currentLineWidth = 0;
    // let isFirstLineOfContent = true; // Para la primera línea de "Quien Suscribe"



    
    contentParts.forEach(part => {
      const words = part.text.trim().split(/\s+/);
      
      words.forEach(word => {
        const wordWidth = getWordWidth(word, fontSize, part.font);
        const spaceWidth = getWordWidth(" ", fontSize, part.font);
        
        if (currentLineWidth + wordWidth + (currentLineWords.length > 0 ? spaceWidth : 0) > effectiveWidth) {
          // Dibujar línea actual; si es la primera línea, aplicar sangría y no justificar
          if (isFirstLineOfContent) indentSize = 28;
          drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
          currentY -= lineHeight;
          currentLineWords = [];
          currentLineWidth = 0;
          if (isFirstLineOfContent) {
            indentSize = 0;
            isFirstLineOfContent = false;
          }
        }
        
        currentLineWords.push({
          text: word,
          font: part.font,
          underline: part.underline
        });
        currentLineWidth += wordWidth + (currentLineWords.length > 1 ? spaceWidth : 0);
      });
    });
  
    // Draw last line (not justified). Si es la primera línea, aplicar sangría.
    if (currentLineWords.length > 0) {
      if (isFirstLineOfContent) indentSize = 28;
      drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, true);
      if (isFirstLineOfContent) {
        indentSize = 0;
        isFirstLineOfContent = false;
      }
      // currentY -= lineHeight;
    }
    currentY -= lineHeight * 2;

    // Date (ajustado para respetar márgenes)
    const dateText = `Constancia que se expide a petición de parte interesada en Guarenas el día ${formatDate(new Date())}.`;
    const dateWords = dateText.split(/\s+/).map(word => ({
      text: word,
      font: arialFont
    }));
    
    let dateLine: any[] = [];
  let dateLineWidth = 0;
  let isFirstLineOfDate = true;



    // Asegurarse de que la fecha respete el margen derecho
 dateWords.forEach(word => {
    const wordWidth = getWordWidth(word.text, fontSize, word.font);
    const spaceWidth = getWordWidth(" ", fontSize, word.font);
    
    if (dateLineWidth + wordWidth + (dateLine.length > 0 ? spaceWidth : 0) > effectiveWidth) {
      drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, isFirstLineOfDate);
      currentY -= lineHeight;
      dateLine = [];
      dateLineWidth = 0;
      isFirstLineOfDate = false;
    }
    
    dateLine.push(word);
    dateLineWidth += wordWidth + (dateLine.length > 1 ? spaceWidth : 0);
  });
  
  if (dateLine.length > 0) {
    drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, true);
  }

  currentY -= lineHeight * 3; // Espacio antes de la firma

  // Firma con imagen
  {
    const titulo = "DIRECTOR";
    const tituloWidth = boldFont.widthOfTextAtSize(titulo, fontSize);
    const tituloX = (width - tituloWidth) / 2;
    page.drawText(titulo, {
      x: tituloX,
      y: currentY,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight * 1.2;

    const firmaBytes = await fetch("/0.jpg").then(res => res.arrayBuffer());
    const firmaImg = await pdfDoc.embedJpg(firmaBytes);
    const scale = 140 / firmaImg.width;
    const dims = firmaImg.scale(scale);
    const imgX = (width - dims.width) / 2;
    const imgY = currentY - dims.height;
    page.drawImage(firmaImg, { x: imgX, y: imgY, width: dims.width, height: dims.height });

    currentY = imgY - lineHeight * 0.8;

    const nombre = "PROF. RONY BRAZON";
    const nombreWidth = boldFont.widthOfTextAtSize(nombre, fontSize);
    const nombreX = (width - nombreWidth) / 2;
    page.drawText(nombre, {
      x: nombreX,
      y: currentY,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }

  // Footer address
  {
    const footer1 = "Zona 1, frente a vereda 21, Urbanización Oropeza Castillo.";
    const footer2 = "Guarenas, estado Miranda. Teléfonos 0212-6424472-6425312-4359752";
    const footerSize = 10;
    const footerColor = rgb(0.4, 0.4, 0.4);

    const w1 = arialFont.widthOfTextAtSize(footer1, footerSize);
    const x1 = (width - w1) / 2;
    page.drawText(footer1, { x: x1, y: 40, size: footerSize, font: arialFont, color: footerColor });

    const w2 = arialFont.widthOfTextAtSize(footer2, footerSize);
    const x2 = (width - w2) / 2;
    page.drawText(footer2, { x: x2, y: 28, size: footerSize, font: arialFont, color: footerColor });
  }

  // Footer address
  {
    const footer1 = "Zona 1, frente a vereda 21, Urbanización Oropeza Castillo.";
    const footer2 = "Guarenas, estado Miranda. Teléfonos 0212-6424472-6425312-4359752";
    const footerSize = 10;
    const footerColor = rgb(0.4, 0.4, 0.4);

    const w1 = arialFont.widthOfTextAtSize(footer1, footerSize);
    const x1 = (width - w1) / 2;
    page.drawText(footer1, { x: x1, y: 40, size: footerSize, font: arialFont, color: footerColor });

    const w2 = arialFont.widthOfTextAtSize(footer2, footerSize);
    const x2 = (width - w2) / 2;
    page.drawText(footer2, { x: x2, y: 28, size: footerSize, font: arialFont, color: footerColor });
  }

  const dataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  setPdfUrl(dataUri);
};

const generatePdfDocumentConstanciaDeInscripcion = async (student: Estudiantes) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  const arialFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const leftMargin = 60; // Margen izquierdo (1 pulgada)
    const rightMargin = 60; // Margen derecho (1 pulgada)
    const marginY = 50;
    let indentSize = 0; // Tamaño de la sangría (modificable para primera línea)
    let currentY = height - marginY;

    const getWordWidth = (word: string, fontSize: number, font: any) => {
      return font.widthOfTextAtSize(word, fontSize);
    };

     // Helper function to justify line of text
  const drawJustifiedLine = (
    words: { text: string; font: any; underline?: boolean }[],
    y: number,
    maxWidth: number,
    fontSize: number,
    isLastLine: boolean = false
  ) => {
    if (words.length === 0) return;

    // Calculate total width of words
    const totalWordsWidth = words.reduce(
      (sum, word) => sum + getWordWidth(word.text, fontSize, word.font),
      0
    );

    // Calculate spacing
    const totalSpaces = words.length - 1;
    const spaceWidth = isLastLine
      ? getWordWidth(" ", fontSize, arialFont)
      : (maxWidth - totalWordsWidth) / totalSpaces;

      let currentX = indentSize? leftMargin + indentSize : leftMargin;
      words.forEach((word, index) => {
      page.drawText(word.text, {
        x: currentX,
        y,
        size: fontSize,
        font: word.font,
        color: rgb(0, 0, 0),
      });

      if (word.underline) {
        page.drawLine({
          start: { x: currentX, y: y - 2 },
          end: { x: currentX + getWordWidth(word.text, fontSize, word.font), y: y - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }

      currentX += getWordWidth(word.text, fontSize, word.font);
      if (index < words.length - 1) {
        currentX += spaceWidth;
      }
    });
  };


  let isFirstLineOfContent = true;
    // Función auxiliar para detectar si una palabra excede el margen derecho
    // const willExceedRightMargin = (currentX: number, text: string, fontSize: number, font: any) => {
    //     const textWidth = font.widthOfTextAtSize(text, fontSize);
    //     return currentX + textWidth > width - rightMargin;
    // };

    // Helper function for underlined text (sin cambios)
    const drawUnderlinedText = (text: string, x: number, y: number, fontSize: number, font = arialFont) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x, y, size: fontSize, font });
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + textWidth, y: y - 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      return textWidth;
    };

    // Logos (ajustados para respetar los márgenes)
    const logoAdventista = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
    const logoText = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
    const logo = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

    const embeddedLogoAdventista = await pdfDoc.embedPng(logoAdventista);
    const embeddedLogoText = await pdfDoc.embedPng(logoText);
    const embeddedLogo = await pdfDoc.embedPng(logo);

    page.drawImage(embeddedLogoAdventista, {
      x: leftMargin,
      y: currentY - 60,
      width: 75,
      height: 65,
    });

    page.drawImage(embeddedLogoText, {
      x: width / 2 - 95,
      y: currentY - 60,
      width: 180,
      height: 45,
    });

    page.drawImage(embeddedLogo, {
      x: width - rightMargin - 60,
      y: currentY - 60,
      width: 60,
      height: 60,
    });

    currentY -= 100;

    // Header texts (sin cambios excepto por el uso de leftMargin)
    // const headerTexts = [
    //   "República Bolivariana de Venezuela",
    //   "Ministerio del Poder Popular para la Educación",
    //   'U.E. COLEGIO ADVENTISTA "Dr. JACINTO CONVIT GARCIA"',
    //   "Calabozo Estado Guárico",
    //   "RIF-J-J411658740",
    // ];

    // headerTexts.forEach((text) => {
    //   const centerX = (width - arialFont.widthOfTextAtSize(text, 12)) / 2;
    //   page.drawText(text, {
    //     x: centerX,
    //     y: currentY,
    //     size: 12,
    //     font: arialFont,
    //     color: rgb(0, 0, 0),
    //   });
    //   currentY -= 15;
    // });

    currentY -= 60;

    // Title (ajustado para mantener centrado)
    const titleText = "CONSTANCIA DE INSCRIPCIÓN";
    const titleX = (width - boldFont.widthOfTextAtSize(titleText, 16)) / 2;
    drawUnderlinedText(titleText, titleX, currentY, 16, boldFont);
    currentY -= 30;

    // Content with formatted text and strict margin control
    const contentParts = [
      { text: "Quien Suscribe, el ciudadano", font: arialFont },
      { text: "RONY DANIEL BRAZON MATA", font: boldFont },
      { text: ", Titular de la C.I: ", font: arialFont },
      { text: "16.273.472", font: boldFont },
      { text: ", Director de la Unidad Educativa Privada Adventista", font: arialFont },
      { text: "ALEJANDRO OROPEZA CASTILLO", font: boldFont },
      { text: ", que funciona en Guarenas, hace constar por este medio que el (a) Estudiante: ", font: arialFont },
      { text: `${student.apellidos} ${student.nombres}`, font: boldFont, underline: true },
      { text: ", Titular de la C.I: ", font: arialFont },
      { text:"V-" + student.cedula.toString(), font: boldFont },
      { text: ", ha sido ", font: arialFont },
      { text: "INSCRITO", font: boldFont, underline: true },
      { text: ` de ${gradoAño ?? "N/A"} ${nivelEducativo ?? "N/A"}, en el Nivel de ${nivelEducativo === "Grado" ? "Educación Primaria" : "Educación Media General"}, en esta Institución. En el Periodo Escolar ${periodoNombre ?? "N/A"}.`, font: arialFont },
    ];

    const effectiveWidth = width - leftMargin - rightMargin - indentSize; // Ajustado para la sangría
    const lineHeight = 18;
    const fontSize = 12;
  
    let currentLineWords: any[] = [];
    let currentLineWidth = 0;
    // let isFirstLineOfContent = true; // Para la primera línea de "Quien Suscribe"



    
    contentParts.forEach(part => {
      const words = part.text.trim().split(/\s+/);
      
      words.forEach(word => {
        const wordWidth = getWordWidth(word, fontSize, part.font);
        const spaceWidth = getWordWidth(" ", fontSize, part.font);
        
        if (currentLineWidth + wordWidth + (currentLineWords.length > 0 ? spaceWidth : 0) > effectiveWidth) {
          // Dibujar línea actual; si es la primera línea, aplicar sangría y no justificar
          if (isFirstLineOfContent) indentSize = 28;
          drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
          currentY -= lineHeight;
          currentLineWords = [];
          currentLineWidth = 0;
          if (isFirstLineOfContent) {
            indentSize = 0;
            isFirstLineOfContent = false;
          }
        }
        
        currentLineWords.push({
          text: word,
          font: part.font,
          underline: part.underline
        });
        currentLineWidth += wordWidth + (currentLineWords.length > 1 ? spaceWidth : 0);
      });
    });
  
    // Draw last line (not justified). Si es la primera línea, aplicar sangría.
    if (currentLineWords.length > 0) {
      if (isFirstLineOfContent) indentSize = 28;
      drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, true);
      if (isFirstLineOfContent) {
        indentSize = 0;
        isFirstLineOfContent = false;
      }
      // currentY -= lineHeight;
    }
    currentY -= lineHeight * 2;

    // Date (ajustado para respetar márgenes)
    const dateText = `Constancia que se expide a petición de parte interesada en Guarenas el día ${formatDate(new Date())}.`;
    const dateWords = dateText.split(/\s+/).map(word => ({
      text: word,
      font: arialFont
    }));
    
    let dateLine: any[] = [];
  let dateLineWidth = 0;
  let isFirstLineOfDate = true;



    // Asegurarse de que la fecha respete el margen derecho
 dateWords.forEach(word => {
    const wordWidth = getWordWidth(word.text, fontSize, word.font);
    const spaceWidth = getWordWidth(" ", fontSize, word.font);
    
    if (dateLineWidth + wordWidth + (dateLine.length > 0 ? spaceWidth : 0) > effectiveWidth) {
      drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, isFirstLineOfDate);
      currentY -= lineHeight;
      dateLine = [];
      dateLineWidth = 0;
      isFirstLineOfDate = false;
    }
    
    dateLine.push(word);
    dateLineWidth += wordWidth + (dateLine.length > 1 ? spaceWidth : 0);
  });
  
  if (dateLine.length > 0) {
    drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, true);
  }

  currentY -= lineHeight * 3; // Espacio antes de la firma

  // Firma con imagen
  {
    const titulo = "DIRECTOR";
    const tituloWidth = boldFont.widthOfTextAtSize(titulo, fontSize);
    const tituloX = (width - tituloWidth) / 2;
    page.drawText(titulo, {
      x: tituloX,
      y: currentY,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight * 1.2;

    const firmaBytes = await fetch("/0.jpg").then(res => res.arrayBuffer());
    const firmaImg = await pdfDoc.embedJpg(firmaBytes);
    const scale = 140 / firmaImg.width;
    const dims = firmaImg.scale(scale);
    const imgX = (width - dims.width) / 2;
    const imgY = currentY - dims.height;
    page.drawImage(firmaImg, { x: imgX, y: imgY, width: dims.width, height: dims.height });

    currentY = imgY - lineHeight * 0.8;

    const nombre = "PROF. RONY BRAZON";
    const nombreWidth = boldFont.widthOfTextAtSize(nombre, fontSize);
    const nombreX = (width - nombreWidth) / 2;
    page.drawText(nombre, {
      x: nombreX,
      y: currentY,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }

  // Footer address (igual que constancia de estudio)
  {
    const footer1 = "Zona 1, frente a vereda 21, Urbanización Oropeza Castillo.";
    const footer2 = "Guarenas, estado Miranda. Teléfonos 0212-6424472-6425312-4359752";
    const footerSize = 10;
    const footerColor = rgb(0.4, 0.4, 0.4);

    const w1 = arialFont.widthOfTextAtSize(footer1, footerSize);
    const x1 = (width - w1) / 2;
    page.drawText(footer1, { x: x1, y: 40, size: footerSize, font: arialFont, color: footerColor });

    const w2 = arialFont.widthOfTextAtSize(footer2, footerSize);
    const x2 = (width - w2) / 2;
    page.drawText(footer2, { x: x2, y: 28, size: footerSize, font: arialFont, color: footerColor });
  }

  const dataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  setPdfUrl(dataUri);
};

  const generatePdfDocumentConstanciaDeAsistencia = async (student: Estudiantes, representante: Representante) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

    const arialFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const leftMargin = 60;
    const rightMargin = 60;
    const marginY = 50;
    let indentSize = 0;
    let currentY = height - marginY;

    const getWordWidth = (word: string, fontSize: number, font: any) => {
      return font.widthOfTextAtSize(word, fontSize);
    };

    // Helper function to justify line of text
    const drawJustifiedLine = (
      words: { text: string; font: any; underline?: boolean }[],
      y: number,
      maxWidth: number,
      fontSize: number,
      isLastLine: boolean = false
    ) => {
      if (words.length === 0) return;

      const totalWordsWidth = words.reduce(
        (sum, word) => sum + getWordWidth(word.text, fontSize, word.font),
        0
      );

      const totalSpaces = words.length - 1;
      const spaceWidth = isLastLine
        ? getWordWidth(" ", fontSize, arialFont)
        : (maxWidth - totalWordsWidth) / totalSpaces;

        let currentX = indentSize? leftMargin + indentSize : leftMargin;
        words.forEach((word, index) => {
        page.drawText(word.text, {
          x: currentX,
          y,
          size: fontSize,
          font: word.font,
          color: rgb(0, 0, 0),
        });

        if (word.underline) {
          page.drawLine({
            start: { x: currentX, y: y - 2 },
            end: { x: currentX + getWordWidth(word.text, fontSize, word.font), y: y - 2 },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }

        currentX += getWordWidth(word.text, fontSize, word.font);
        if (index < words.length - 1) {
          currentX += spaceWidth;
        }
      });
    };

    let isFirstLineOfContent = true;

    // Helper function for underlined text
    const drawUnderlinedText = (text: string, x: number, y: number, fontSize: number, font = arialFont) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x, y, size: fontSize, font });
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + textWidth, y: y - 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      return textWidth;
    };

    // Logos
    const logoAdventista = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
    const logoText = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
    const logo = await fetch("/LOGO-COLEGIO.png").then((res) => res.arrayBuffer());

    const embeddedLogoAdventista = await pdfDoc.embedPng(logoAdventista);
    const embeddedLogoText = await pdfDoc.embedPng(logoText);
    const embeddedLogo = await pdfDoc.embedPng(logo);

    page.drawImage(embeddedLogoAdventista, {
      x: leftMargin,
      y: currentY - 60,
      width: 75,
      height: 65,
    });

    page.drawImage(embeddedLogoText, {
      x: width / 2 - 95,
      y: currentY - 60,
      width: 180,
      height: 45,
    });

    page.drawImage(embeddedLogo, {
      x: width - rightMargin - 60,
      y: currentY - 60,
      width: 60,
      height: 60,
    });

    currentY -= 160;

    // Title
    const titleText = "CONSTANCIA DE ASISTENCIA";
    const titleX = (width - boldFont.widthOfTextAtSize(titleText, 16)) / 2;
    drawUnderlinedText(titleText, titleX, currentY, 16, boldFont);
    currentY -= 30;

    // Content
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate); // e.g., "27 de enero de 2026"
    // Extract parts of the date for the custom footer
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString('es-ES', { month: 'long' });
    const year = currentDate.getFullYear();


    const contentParts: { text: string; font: any; underline?: boolean }[] = [
      { text: "Quién suscribe, el ciudadano", font: arialFont },
      { text: "RONY DANIEL BRAZON MATA", font: boldFont },
      { text: ", Titular de la C.I", font: arialFont },
      { text: "16.273.472,", font: boldFont },
      { text: "Director de la Unidad Educativa Privada Adventista", font: arialFont },
      { text: '"ALEJANDRO OROPEZA CASTILLO"', font: boldFont },
      { text: ", inscrita en el Ministerio del Poder Popular para la Educación, bajo el código DEA PD 16121517, por medio de la presente, hace constar que el Señor (a):", font: arialFont },
      { text: `${representante.apellidos} ${representante.nombres}`, font: boldFont },
      { text: ", titular de la Cédula de Identidad N°:", font: arialFont },
      { text: `${representante.tipo_cedula}-${representante.cedula}`, font: boldFont },
      { text: " Representante de:", font: arialFont },
      { text: `${student.apellidos} ${student.nombres}`, font: boldFont },
      { text: ", cursante de:", font: arialFont },
      { text: `${gradoAño ?? "N/A"} "${seccionNombre ?? "U"}"`, font: boldFont },
      { text: " asistió el:", font: arialFont },
      { text: `${formattedDate}`, font: boldFont },
      { text: " a esta institución, para atender asuntos relacionados con su representado.", font: arialFont },
    ];

    const effectiveWidth = width - leftMargin - rightMargin - indentSize;
    const lineHeight = 18;
    const fontSize = 12;
  
    let currentLineWords: any[] = [];
    let currentLineWidth = 0;

    contentParts.forEach(part => {
      const words = part.text.trim().split(/\s+/);
      
      words.forEach(word => {
        const wordWidth = getWordWidth(word, fontSize, part.font);
        const spaceWidth = getWordWidth(" ", fontSize, part.font);
        
        if (currentLineWidth + wordWidth + (currentLineWords.length > 0 ? spaceWidth : 0) > effectiveWidth) {
          if (isFirstLineOfContent) indentSize = 28;
          drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, isFirstLineOfContent);
          currentY -= lineHeight;
          currentLineWords = [];
          currentLineWidth = 0;
          if (isFirstLineOfContent) {
            indentSize = 0;
            isFirstLineOfContent = false;
          }
        }
        
        currentLineWords.push({
          text: word,
          font: part.font,
          underline: part.underline
        });
        currentLineWidth += wordWidth + (currentLineWords.length > 1 ? spaceWidth : 0);
      });
    });
  
    if (currentLineWords.length > 0) {
      if (isFirstLineOfContent) indentSize = 28;
      drawJustifiedLine(currentLineWords, currentY, effectiveWidth, fontSize, true);
      if (isFirstLineOfContent) {
        indentSize = 0;
        isFirstLineOfContent = false;
      }
    }
    currentY -= lineHeight * 2;

    // Date Footer
    const dateText = `Constancia que se expide a la solicitud de la parte interesada en Guarenas, a los ${day} días del mes de ${month} de ${year}.`;
    const dateWords = dateText.split(/\s+/).map(word => ({
      text: word,
      font: arialFont
    }));
    
    let dateLine: any[] = [];
    let dateLineWidth = 0;
    let isFirstLineOfDate = true;

    dateWords.forEach(word => {
      const wordWidth = getWordWidth(word.text, fontSize, word.font);
      const spaceWidth = getWordWidth(" ", fontSize, word.font);
      
      if (dateLineWidth + wordWidth + (dateLine.length > 0 ? spaceWidth : 0) > effectiveWidth) {
        drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, isFirstLineOfDate);
        currentY -= lineHeight;
        dateLine = [];
        dateLineWidth = 0;
        isFirstLineOfDate = false;
      }
      
      dateLine.push(word);
      dateLineWidth += wordWidth + (dateLine.length > 1 ? spaceWidth : 0);
    });
    
    if (dateLine.length > 0) {
      drawJustifiedLine(dateLine, currentY, effectiveWidth, fontSize, true);
    }

    currentY -= lineHeight * 3;

    // Firma
    {
      const titulo = "DIRECTOR";
      const tituloWidth = boldFont.widthOfTextAtSize(titulo, fontSize);
      const tituloX = (width - tituloWidth) / 2;
      page.drawText(titulo, {
        x: tituloX,
        y: currentY,
        size: fontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight * 1.2;

      const firmaBytes = await fetch("/0.jpg").then(res => res.arrayBuffer());
      const firmaImg = await pdfDoc.embedJpg(firmaBytes);
      const scale = 140 / firmaImg.width;
      const dims = firmaImg.scale(scale);
      const imgX = (width - dims.width) / 2;
      const imgY = currentY - dims.height;
      page.drawImage(firmaImg, { x: imgX, y: imgY, width: dims.width, height: dims.height });

      currentY = imgY - lineHeight * 0.8;

      const nombre = "PROF. RONY BRAZON";
      const nombreWidth = boldFont.widthOfTextAtSize(nombre, fontSize);
      const nombreX = (width - nombreWidth) / 2;
      page.drawText(nombre, {
        x: nombreX,
        y: currentY,
        size: fontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }

    // Footer address
    {
      const footer1 = "Zona 1, frente a vereda 21, Urbanización Oropeza Castillo.";
      const footer2 = "Guarenas, estado Miranda. Teléfonos 0212-6424472-6425312-4359752";
      const footerSize = 10;
      const footerColor = rgb(0.4, 0.4, 0.4);

      const w1 = arialFont.widthOfTextAtSize(footer1, footerSize);
      const x1 = (width - w1) / 2;
      page.drawText(footer1, { x: x1, y: 40, size: footerSize, font: arialFont, color: footerColor });

      const w2 = arialFont.widthOfTextAtSize(footer2, footerSize);
      const x2 = (width - w2) / 2;
      page.drawText(footer2, { x: x2, y: 28, size: footerSize, font: arialFont, color: footerColor });
    }

    const dataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    setPdfUrl(dataUri);
  };


  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("es-VE", options);
  };

  // Rest of the component remains the same
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-200 max-w-md mx-auto">
          <CardTitle>Buscar Estudiante</CardTitle><br />

          <Input
  type="number"
  placeholder="Ingrese la cédula"
  value={cedula}
  maxLength={11} // Evita que se escriban más de 11 caracteres
  onInput={(e) => {
    const input = e.target as HTMLInputElement;
    if (input.value.length > 11) {
      input.value = input.value.slice(0, 11);
    }
  }}
  onChange={(e) => setCedula(e.target.value)}
  onWheel={(e) => {
    // Previene el comportamiento predeterminado del scroll
    e.currentTarget.blur(); // Quita el foco del input para evitar cambios
  }}
  className="mb-4 border-gray-300 focus:ring-indigo-500"
/>
          <Button
            onClick={getStudents}
            disabled={isLoading}
            className={`w-full py-2 }`}
          >
            {isLoading ? "Buscando..." : "Buscar Estudiante "}
          </Button>
        </div>
      </Dialog>
      {estudiantes && (
        <div className="flex flex-col gap-4 p-4 bg-background shadow-md rounded-2xl max-w-lg mx-auto mt-4">
          <h3 className="text-xl font-semibold text-foreground">Datos del Estudiante</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Nombre:</span> {estudiantes.nombres}
            </p>
            <p className="text-sm">
              <span className="font-medium">Apellido:</span> {estudiantes.apellidos}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Select 
              value={selectedConstanciaType}
              onValueChange={(value) => setSelectedConstanciaType(value as 'estudio' | 'inscripcion' | 'asistencia')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione el tipo de constancia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estudio">Constancia de Estudio</SelectItem>
                <SelectItem value="inscripcion">Constancia de Inscripción</SelectItem>
                <SelectItem value="asistencia">Constancia de Asistencia</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGenerateConstancia}
              disabled={isLoadingLookups || !periodoNombre || !gradoAño}
              className="w-full"
            >
              {isLoadingLookups ? "Cargando datos..." : "Generar Constancia"}
            </Button>
          </div>

          {pdfUrl && (
            <div className="mt-4">
              <iframe 
                src={pdfUrl} 
                width="100%" 
                height="500px" 
                className="border rounded-lg"
                title="Vista previa de la constancia"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}