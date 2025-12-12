// "use client";
// import type { Students } from "@/interfaces/students.interface";
// import { getCollection } from "@/lib/firebase";
// import { where } from "firebase/firestore";
// import { useState } from "react";
// import { Dialog } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// import download from "downloadjs";

// export function CreateConstanciaStudent() {
//   const [students, setStudents] = useState<Students | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [cedula, setCedula] = useState("");
//   const [isOpen, setIsOpen] = useState(true);
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);

//   const getStudents = async () => {
//     const path = `estudiantes`;
//     const query = [where("cedula", "==", Number(cedula))];
//     setIsLoading(true);
//     try {
//       const res = (await getCollection(path, query)) as Students[];
//       setStudents(res.length > 0 ? res[0] : null);
//     } catch (error) {
//       console.error("Error fetching student:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

// // ... (código anterior sin cambios hasta la parte de generatePdfDocument)

// const generatePdfDocument = async (student: Students) => {
//     const pdfDoc = await PDFDocument.create();
//     const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
//     const arialFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
//     const { width, height } = page.getSize();
//     const leftMargin = 60; // Margen izquierdo (1 pulgada)
//     const rightMargin = 60; // Margen derecho (1 pulgada)
//     const marginY = 50;
//     let currentY = height - marginY;

//     // Función auxiliar para detectar si una palabra excede el margen derecho
//     const willExceedRightMargin = (currentX: number, text: string, fontSize: number, font: any) => {
//         const textWidth = font.widthOfTextAtSize(text, fontSize);
//         return currentX + textWidth > width - rightMargin;
//     };

//     // Helper function for underlined text (sin cambios)
//     const drawUnderlinedText = (text: string, x: number, y: number, fontSize: number, font = arialFont) => {
//       const textWidth = font.widthOfTextAtSize(text, fontSize);
//       page.drawText(text, { x, y, size: fontSize, font });
//       page.drawLine({
//         start: { x, y: y - 2 },
//         end: { x: x + textWidth, y: y - 2 },
//         thickness: 1,
//         color: rgb(0, 0, 0),
//       });
//       return textWidth;
//     };

//     // Logos (ajustados para respetar los márgenes)
//     const logoMinisterio = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
//     const logoText = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
//     const logo = await fetch("/Logo.png").then((res) => res.arrayBuffer());

//     const embeddedLogoMinisterio = await pdfDoc.embedPng(logoMinisterio);
//     const embeddedLogoText = await pdfDoc.embedPng(logoText);
//     const embeddedLogo = await pdfDoc.embedPng(logo);

//     page.drawImage(embeddedLogoMinisterio, {
//       x: leftMargin,
//       y: currentY - 60,
//       width: 130,
//       height: 60,
//     });

//     page.drawImage(embeddedLogoText, {
//       x: width / 2 - 70,
//       y: currentY - 60,
//       width: 140,
//       height: 38,
//     });

//     page.drawImage(embeddedLogo, {
//       x: width - rightMargin - 60,
//       y: currentY - 60,
//       width: 60,
//       height: 60,
//     });

//     currentY -= 100;

//     // Header texts (sin cambios excepto por el uso de leftMargin)
//     const headerTexts = [
//       "República Bolivariana de Venezuela",
//       "Ministerio del Poder Popular para la Educación",
//       'U.E. COLEGIO ADVENTISTA "LIBERTADOR"',
//       "Camaguán Estado Guárico",
//       "RIF-J-29797805-4",
//     ];

//     headerTexts.forEach((text) => {
//       const centerX = (width - arialFont.widthOfTextAtSize(text, 12)) / 2;
//       page.drawText(text, {
//         x: centerX,
//         y: currentY,
//         size: 12,
//         font: arialFont,
//         color: rgb(0, 0, 0),
//       });
//       currentY -= 15;
//     });

//     currentY -= 20;

//     // Title (ajustado para mantener centrado)
//     const titleText = "CONSTANCIA DE ESTUDIO";
//     const titleX = (width - boldFont.widthOfTextAtSize(titleText, 16)) / 2;
//     drawUnderlinedText(titleText, titleX, currentY, 16, boldFont);
//     currentY -= 30;

//     // Content with formatted text and strict margin control
//     const contentParts = [
//       { text: "Quien Suscribe, MSc. Efraín Infante, Titular de la C.I: ", font: arialFont },
//       { text: "11.235.943", font: boldFont },
//       { text: ", Director de la Unidad Educativa Colegio Adventista Libertador Código del Plantel PD00911201, Ubicada en el Casco Central Calle Fray Tomas Castro Cruce con Miranda Camaguán Estado Guárico, por medio de la presente hace constar que el (a) Estudiante: ", font: arialFont },
//       { text: `${student.apellidos} ${student.nombres}`, font: boldFont, underline: true },
//       { text: ", Titular de la C.I: V-", font: arialFont },
//       { text: student.cedula.toString(), font: boldFont },
//       { text: ", cursa ", font: arialFont },
//       { text: "ESTUDIOS", font: boldFont, underline: true },
//       { text: ` de ${student.año_actual[0]}° año en el Nivel de Educación Media General, en esta Institución. En el Periodo Escolar ${student.periodo_escolar_actual}.`, font: arialFont },
//     ];

//     let currentLine = "";
//     let currentX = leftMargin + 20;;
//     const effectiveWidth = width - leftMargin - rightMargin; // Ancho efectivo para el texto
//     const lineHeight = 18; // 1.5 line spacing
//     const fontSize = 12;

    
//     for (const part of contentParts) {
//       const words = part.text.split(" ");
      
//       for (const word of words) {
//         const testLine = currentLine + word + " ";
//         const testWidth = part.font.widthOfTextAtSize(testLine, fontSize);

//         if (testWidth > effectiveWidth || willExceedRightMargin(currentX, testLine, fontSize, part.font)) {
//           // Draw current line
//           page.drawText(currentLine, {
//             x: currentX,
//             y: currentY,
//             size: fontSize,
//             font: part.font,
//             color: rgb(0, 0, 0),
//           });
          
//           if (part.underline) {
//             page.drawLine({
//               start: { x: currentX, y: currentY - 2 },
//               end: { x: currentX + part.font.widthOfTextAtSize(currentLine, fontSize), y: currentY - 2 },
//               thickness: 1,
//               color: rgb(0, 0, 0),
//             });
//           }

//           currentY -= lineHeight;
//           currentLine = word + " ";
//           currentX = leftMargin;
//         } else {
//           currentLine = testLine;
//         }
//       }

//       // Draw remaining text for this part
//       if (currentLine) {
//         const textWidth = part.font.widthOfTextAtSize(currentLine, fontSize);
        
//         // Verificar si el texto excederá el margen derecho
//         if (willExceedRightMargin(currentX, currentLine, fontSize, part.font)) {
//           currentY -= lineHeight;
//           currentX = leftMargin;
//         }

//         page.drawText(currentLine, {
//           x: currentX,
//           y: currentY,
//           size: fontSize,
//           font: part.font,
//           color: rgb(0, 0, 0),
//         });

//         if (part.underline) {
//           page.drawLine({
//             start: { x: currentX, y: currentY - 2 },
//             end: { x: currentX + textWidth, y: currentY - 2 },
//             thickness: 1,
//             color: rgb(0, 0, 0),
//           });
//         }

//         currentX += textWidth ;
//         currentLine = "";
//       }
//     }

//     currentY -= lineHeight * 2;

//     // Date (ajustado para respetar márgenes)
//     const dateText = `  Constancia que se expide a petición de parte interesada en Camaguán el día ${formatDate(new Date())}.`;
    
//     // Asegurarse de que la fecha respete el margen derecho
//     const dateWidth = arialFont.widthOfTextAtSize(dateText, fontSize);
//     if (dateWidth > effectiveWidth) {
//       const words = dateText.split(" ");
//       let dateLine = "";
//       let dateX = leftMargin;
      
//       for (const word of words) {
//         const testLine = dateLine + word + " ";
//         if (arialFont.widthOfTextAtSize(testLine, fontSize) > effectiveWidth) {
//           page.drawText(dateLine.trim(), {
//             x: dateX,
//             y: currentY,
//             size: fontSize,
//             font: arialFont,
//             color: rgb(0, 0, 0),
//           });
//           currentY -= lineHeight;
//           dateLine = word + " ";
//           dateX = leftMargin;
//         } else {
//           dateLine = testLine;
//         }
//       }
      
//       if (dateLine.trim()) {
//         page.drawText(dateLine.trim(), {
//           x: dateX,
//           y: currentY,
//           size: fontSize,
//           font: arialFont,
//           color: rgb(0, 0, 0),
//         });
//       }
//     } else {
//       page.drawText(dateText, {
//         x: leftMargin,
//         y: currentY,
//         size: fontSize,
//         font: arialFont,
//         color: rgb(0, 0, 0),
//       });
//     }

//     currentY -= 60;

//     // Signature (ajustado para usar leftMargin)
//     page.drawText("________________________________", {
//       x: leftMargin,
//       y: currentY,
//       size: 12,
//       font: arialFont,
//       color: rgb(0, 0, 0),
//     });
//     currentY -= 15;
//     page.drawText("MSc. Efraín José Infante Garrido", {
//       x: leftMargin,
//       y: currentY,
//       size: 12,
//       font: arialFont,
//       color: rgb(0, 0, 0),
//     });
//     currentY -= 15;
//     page.drawText('DIRECTOR (A) DEL U.E.C.A. "LIBERTADOR"', {
//       x: leftMargin,
//       y: currentY,
//       size: 12,
//       font: arialFont,
//       color: rgb(0, 0, 0),
//     });

//     const pdfBytes = await pdfDoc.save();
//     const blob = new Blob([pdfBytes], { type: "application/pdf" });
//     const url = URL.createObjectURL(blob);
//     setPdfUrl(url);
//   };

// // ... (resto del código sin cambios)

//   const formatDate = (date: Date) => {
//     const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
//     return date.toLocaleDateString("es-VE", options);
//   };

//   // Rest of the component remains the same
//   return (
//     <>
//       <Dialog open={isOpen} onOpenChange={setIsOpen}>
//         <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-200 max-w-md mx-auto">
//           <h2 className="text-2xl font-bold text-gray-700 mb-4">Buscar Estudiante</h2>
//           <Input
//             type="number"
//             placeholder="Ingrese la cédula"
//             value={cedula}
//             onChange={(e) => setCedula(e.target.value)}
//             className="mb-4 border-gray-300 focus:ring-indigo-500"
//           />
//           <Button
//             onClick={getStudents}
//             disabled={isLoading}
//             className={`w-full py-2 ${isLoading ? "bg-gray-300" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
//           >
//             {isLoading ? "Buscando..." : "Buscar"}
//           </Button>
//         </div>
//       </Dialog>
//       {students && (
//         <div className="flex flex-col gap-2 p-4 bg-gray-50 shadow-md rounded-2xl max-w-lg mx-auto mt-4">
//           <h3 className="text-xl font-semibold text-gray-700">Datos del Estudiante</h3>
//           <p className="text-gray-600">
//             <strong>Nombre:</strong> {students.nombres}
//           </p>
//           <p className="text-gray-600">
//             <strong>Apellido:</strong> {students.apellidos}
//           </p>
//           <Button
//             onClick={() => generatePdfDocument(students)}
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
//           >
//             Generar PDF
//           </Button>
//           {pdfUrl && (
//             <div className="mt-4">
//               <iframe src={pdfUrl} width="100%" height="400px" className="border rounded-lg"></iframe>
//               <a
//                 href={pdfUrl}
//                 download={`Constancia_Estudiante_${students.nombres}_${students.apellidos}.pdf`}
//                 className="mt-2 block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-center"
//               >
//                 Descargar Constancia
//               </a>
//             </div>
//           )}
//         </div>
//       )}
//     </>
//   );
// }