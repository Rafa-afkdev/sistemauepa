// "use client"
// import type { Students } from "@/interfaces/students.interface"
// import { getCollection } from "@/lib/firebase"
// import { where } from "firebase/firestore"
// import React from "react"; // <-- Agrega esto
// import { useState } from "react"
// import { Dialog } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header, WidthType, TableCell, TableRow, BorderStyle, Table } from "docx"




// export function CreateConstanciaStudent() {
//   const [students, setStudents] = useState<Students | null>(null)
//   const [isLoading, setIsLoading] = useState<boolean>(false)
//   const [cedula, setCedula] = useState("")
//   const [isOpen, setIsOpen] = useState(true);

//   const formatDate = (date: Date) => {
//     const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
//     return date.toLocaleDateString("es-VE", options)
//   }

//   const getStudents = async () => {
//     const path = `estudiantes`
//     const query = [where("cedula", "==", Number(cedula))]
//     setIsLoading(true)
//     try {
//       const res = (await getCollection(path, query)) as Students[]
//       setStudents(res.length > 0 ? res[0] : null)
//     } catch (error) {
//       console.error("Error fetching student:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }
 

//   const convertImageToBase64 = (url: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       fetch(url)
//         .then(response => response.blob())
//         .then(blob => {
//           const reader = new FileReader();
//           reader.onloadend = () => {
//             const base64data = reader.result as string;
//             resolve(base64data.split(",")[1]); // Solo el contenido Base64
//           };
//           reader.onerror = reject;
//           reader.readAsDataURL(blob);
//         })
//         .catch(reject);
//     });
//   };

//   const generateWordDocument = async (student: Students) => {
//     try {
//       setIsLoading(true);
//       // Convertir imágenes a base64
//       const logo1Base64 = convertImageToBase64("/Logo1.png")
//       const logo2Base64 = convertImageToBase64("/Logo2.png")
//       const logo3Base64 = convertImageToBase64("/Logo.png")

//       // Crear párrafo para las imágenes
//       const headerTable = new Table({
//         width: {
//           size: 100,
//           type: WidthType.PERCENTAGE,
//         },
//         borders: {
//           top: { style: BorderStyle.NONE },
//           bottom: { style: BorderStyle.NONE },
//           left: { style: BorderStyle.NONE },
//           right: { style: BorderStyle.NONE },
//           insideHorizontal: { style: BorderStyle.NONE },
//           insideVertical: { style: BorderStyle.NONE },
//         },
        
//         rows: [
//           new TableRow({
//             children: [
//               // Left logo cell
//               new TableCell({
//                 width: {
//                   size: 33,
//                   type: WidthType.PERCENTAGE,
//                 },
//                 children: [
//                   new Paragraph({
//                     alignment: AlignmentType.LEFT,
//                     children: [
//                       new ImageRun({
//                         data: logo1Base64,
//                         fileType: "png",
//                         transformation: {
//                           width: 100,
//                           height: 50
//                         }
//                       }),
//                     ],
//                   }),
//                 ],
//               }),
//               // Center logo cell
//               new TableCell({
//                 width: {
//                   size: 34,
//                   type: WidthType.PERCENTAGE,
//                 },
//                 children: [
//                   new Paragraph({
//                     alignment: AlignmentType.CENTER,
//                     children: [
//                       new ImageRun({
//                         data: logo2Base64,
//                         fileType: "png",
//                         transformation: {
//                           width: 250,
//                           height: 40
//                         }
//                       }),
//                     ],
//                   }),
//                 ],
//               }),
//               // Right logo cell
//               new TableCell({
//                 width: {
//                   size: 33,
//                   type: WidthType.PERCENTAGE,
//                 },
//                 children: [
//                   new Paragraph({
//                     alignment: AlignmentType.RIGHT,
//                     children: [
//                       new ImageRun({
//                         data: logo3Base64,
//                         fileType: "png",
//                         transformation: {
//                           width: 60,
//                           height: 50
//                         }
//                       }),
//                     ],
//                   }),
//                 ],
//               }),
//             ],
//           }),
//         ],
//       })

//       const header = new Header({
//         children: [headerTable],
//       })

//       // Create header paragraphs
//       const headerParagraphs = [
//         "República Bolivariana de Venezuela",
//         "Ministerio del Poder Popular para la Educación",
//         'U.E. COLEGIO ADVENTISTA "LIBERTADOR"',
//         "Camaguán Estado Guárico",
//         "RIF-J-29797805-4",
//       ].map(
//         (text) =>
//           new Paragraph({
//             alignment: AlignmentType.CENTER,
//             children: [
//               new TextRun({
//                 text,
//                 size: 24,
//                 font: "Calibri",
//               }),
//             ],
//           })
//       )

//       // Create title
//       const titleParagraph = new Paragraph({
//         alignment: AlignmentType.CENTER,
//         spacing: {
//     before: 400, 
//     after: 400,
//   },
//         children: [
//           new TextRun({
//             text: "CONSTANCIA DE ESTUDIO",
//             bold: true,
//             size: 36,
//             font: "Calibri",
//             underline: {},
//           }),
//         ],
//       })

//       // Create content paragraphs
//       const contentParagraph = new Paragraph({
//         alignment: AlignmentType.JUSTIFIED,
//         spacing: {
//           before: 400,
//           after: 400,
//         },
//         indent: {
//           firstLine: 720,
//         },
//         children: [
//           new TextRun({
//             text: "Quien Suscribe, MSc. Efraín Infante, Titular de la C.I: ",
//             size: 28,
//             font: "Calibri",
//           }),
//           new TextRun({
//             text: "11.235.943,",
//             bold: true,
//             size: 28,
//             font: "Calibri",
//           }),
//           new TextRun({
//             text: " Director de la Unidad Educativa Colegio Adventista Libertador Código del Plantel PD00911201, Ubicada en el Casco Central Calle Fray Tomas Castro Cruce con Miranda Camaguán Estado Guárico, por medio de la presente hace constar que el (a) Estudiante: ",
//             size: 28,
//             font: "Calibri",
//           }),
//           new TextRun({
//             text: `${student.apellidos} ${student.nombres}`,
//             bold: true,
//             size: 28,
//             font: "Calibri",
//             underline: {}
//           }),
//           new TextRun({
//             text: ", Titular de la C.I: V-",
//             size: 28,
//             font: "Calibri",
//           }),
//           new TextRun({
//             text: `${student.cedula}`,
//             bold: true,
//             size: 28,
//             font: "Calibri",
//           }),
//           new TextRun({
//             text: ", cursa ",
//             size: 28,
//             font: "Calibri",
//           }),
//           new TextRun({
//             text: "ESTUDIOS",
//             bold: true,
//             size: 28,
//             font: "Calibri",
//             underline: {},
//           }),
//           new TextRun({
//             text: ` de ${student.año_actual[0]}° año en el Nivel de Educación Media General, en esta Institución. En el Periodo Escolar ${student.periodo_escolar_actual}`,
//             size: 28,
//             font: "Calibri",
//           }),
//         ],
//       })

//       const dateParagraph = new Paragraph({
//         alignment: AlignmentType.JUSTIFIED,
//         spacing: {
//           before: 400,
//           after: 400,
//         },
//         indent: {
//           firstLine: 720,
//         },
//         children: [
//           new TextRun({
//             text: `Constancia que se expide a petición de parte interesada en Camaguán el día ${formatDate(new Date())}.`,
//             size: 28,
//             font: "Calibri",
//           }),
//         ],
//       })

//       // Create signature paragraphs
//       const signatureParagraphs = [
//         new Paragraph({
//           text: "", // Espacio adicional antes de la firma
//           spacing: { before: 800 }, // Aumenta la distancia
//         }),
//         new Paragraph({
//           text: "", // Otro espacio para asegurarnos de que está bien abajo
//           spacing: { before: 800 },
//         }),
//         ...[
//           "________________________________",
//           "MSc. Efraín José Infante Garrido",
//           'DIRECTOR (A) DEL U.E.C.A. "LIBERTADOR"',
//         ].map(
//           (text) =>
//             new Paragraph({
//               alignment: AlignmentType.CENTER,
//               spacing: { before: 200 }, // Espacio antes de cada línea de la firma
//               children: [
//                 new TextRun({
//                   text,
//                   size: 24,
//                   font: "Calibri",
//                 }),
//               ],
//             })
//         ),
//       ]
      

//       // Create document
//       const doc = new Document({
//         sections: [
//           {
//             properties: {
//               page: {
//                 margin: {
//                   top: 1500, // Increase top margin to accommodate header
//                   bottom: 1440,
//                   left: 1440,
//                   right: 1440,
//                 },
//               },
//             },
//             headers: {
//               default: header, // Set the header we created
//             },
//             children: [
//               ...headerParagraphs,
//               new Paragraph({ text: "" }), // Spacing
//               titleParagraph,
//               new Paragraph({ text: "" }), // Spacing
//               contentParagraph,
//               new Paragraph({ text: "" }), // Spacing
//               dateParagraph,
//               new Paragraph({ text: "" }), // Spacing
//               ...signatureParagraphs,
//             ],
//           },
//         ],
//       })

      

//       // Generate and download the document
//       const blob = await Packer.toBlob(doc)
//       const url = URL.createObjectURL(blob)
//       const link = document.createElement("a")
//       link.href = url
//       link.download = `Constancia De Estudio ${student.nombres}_${student.apellidos}.docx`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       setTimeout(() => URL.revokeObjectURL(url), 1000);
//       URL.revokeObjectURL(url)
//     } catch (error) {
//       console.error("Error generating document:", error)
//     }finally{
//           setIsLoading(false);

//     }
//   }
  

  

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
//             onClick={() => generateWordDocument(students)} 
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
//           >
//             Generar Word
//           </Button>
          
//         </div>
//       )}
//     </>
//   )
// }