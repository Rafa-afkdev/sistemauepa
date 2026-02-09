"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/data/firebase";
import { differenceInYears, parseISO } from "date-fns";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { FileText, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { showToast } from "nextjs-toast-notify";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { useEffect, useState } from "react";

export const GenerateSectionReport = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [includeAge, setIncludeAge] = useState(false);

  // Data States
  const [periodos, setPeriodos] = useState<{ id: string; periodo: string; status: string }[]>([]);
  const [allSecciones, setAllSecciones] = useState<any[]>([]); // Store all sections for current period
  
  // Selection States
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [nivelEducativoSeleccionado, setNivelEducativoSeleccionado] = useState("");
  const [gradosAniosSeleccionados, setGradosAniosSeleccionados] = useState<string[]>([]);
  const [seccionesSeleccionadasIds, setSeccionesSeleccionadasIds] = useState<string[]>([]);

  // Derived Options (calculated from allSecciones)
  const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);
  const [gradosAnios, setGradosAnios] = useState<string[]>([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<any[]>([]);

  // 1. Cargar Periodos al abrir
  useEffect(() => {
    if (open && periodos.length === 0) {
      const cargarPeriodos = async () => {
        setLoading(true);
        try {
          const q = collection(db, "periodos_escolares");
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as { periodo: string; status: string })
          }));
          setPeriodos(data);
          
          const activo = data.find(p => p.status === "ACTIVO");
          if (activo) setPeriodoSeleccionado(activo.id);
        } catch (error) {
          console.error("Error cargando periodos:", error);
        } finally {
          setLoading(false);
        }
      };
      cargarPeriodos();
    }
  }, [open]);

  // 2. Cargar Secciones del periodo seleccionado
  useEffect(() => {
    if (!periodoSeleccionado) return;

    const cargarSeccionesPeriodo = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "secciones"), where("id_periodo_escolar", "==", periodoSeleccionado));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSecciones(data);

        // Reset selections
        setNivelEducativoSeleccionado("");
        setGradosAniosSeleccionados([]);
        setSeccionesSeleccionadasIds([]);
      } catch (error) {
        console.error("Error cargando secciones:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarSeccionesPeriodo();
  }, [periodoSeleccionado]);

  // 3. Update Niveles based on AllSecciones
  useEffect(() => {
    if (allSecciones.length > 0) {
      const niveles = [...new Set(allSecciones.map(s => s.nivel_educativo))];
      setNivelesEducativos(niveles);
    } else {
      setNivelesEducativos([]);
    }
  }, [allSecciones]);

  // 4. Update Grados based on Nivel
  useEffect(() => {
    if (nivelEducativoSeleccionado && allSecciones.length > 0) {
      const grados = [...new Set(
        allSecciones
          .filter(s => s.nivel_educativo === nivelEducativoSeleccionado)
          .map(s => s.grado_año)
      )].sort((a, b) => parseInt(a) - parseInt(b));
      setGradosAnios(grados);
      setGradosAniosSeleccionados([]);
      setSeccionesSeleccionadasIds([]);
    } else {
      setGradosAnios([]);
    }
  }, [nivelEducativoSeleccionado, allSecciones]);

  // 5. Update Sections based on selected Grados
  useEffect(() => {
    if (gradosAniosSeleccionados.length > 0 && nivelEducativoSeleccionado && allSecciones.length > 0) {
      const filtered = allSecciones.filter(
        s => s.nivel_educativo === nivelEducativoSeleccionado && gradosAniosSeleccionados.includes(s.grado_año)
      );
      setSeccionesDisponibles(filtered);
      setSeccionesSeleccionadasIds([]);
    } else {
      setSeccionesDisponibles([]);
    }
  }, [gradosAniosSeleccionados, nivelEducativoSeleccionado, allSecciones]);

  const calculateAge = (fechaNacimiento: string | undefined) => {
    if (!fechaNacimiento) return "N/A";
    try {
      const birthDate = parseISO(fechaNacimiento);
      return differenceInYears(new Date(), birthDate).toString();
    } catch (e) {
      return "N/A";
    }
  };

  const generarReporte = async () => {
    if (seccionesSeleccionadasIds.length === 0) return;

    try {
      setGenerating(true);
      
      // Create a single PDF document for all sections
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Load images once for reuse
      const logo1Bytes = await fetch("/Logo1.png").then((res) => res.arrayBuffer());
      const logo2Bytes = await fetch("/Logo2.png").then((res) => res.arrayBuffer());
      const logo3Bytes = await fetch("/Logo-COLEGIO.png").then((res) => res.arrayBuffer());

      const logo1Img = await pdfDoc.embedPng(logo1Bytes);
      const logo2Img = await pdfDoc.embedPng(logo2Bytes);
      const logo3Img = await pdfDoc.embedPng(logo3Bytes);

      const margenIzquierdo = 50;
      const anchoColumna1 = 40;  // Columna N°
      const anchoColumna2 = 100; // Columna CÉDULA
      const anchoColumnaEdad = 60; // Columna EDAD
      const anchoTotal = 500;
      
      const anchoColumnaNombres = includeAge 
          ? anchoTotal - anchoColumna1 - anchoColumna2 - anchoColumnaEdad 
          : anchoTotal - anchoColumna1 - anchoColumna2;

      const lineHeight = 15;
      const bottomMargin = 50;

      let sectionsProcessed = 0;
      
      // Process each selected section
      for (const seccionId of seccionesSeleccionadasIds) {
        const seccionData = seccionesDisponibles.find(s => s.id === seccionId);
        
        if (!seccionData || !seccionData.estudiantes_ids || seccionData.estudiantes_ids.length === 0) {
          showToast.warning(`La sección ${seccionData?.seccion || ''} del grado ${seccionData?.grado_año || ''}° no tiene estudiantes inscritos.`);
          continue;
        }

        sectionsProcessed++;

        // Fetch students for this section
        const estudiantesPromises = seccionData.estudiantes_ids.map(async (estudianteId: string) => {
          try {
            const docRef = doc(db, "estudiantes", estudianteId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
               return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
          } catch (e) {
            console.error(`Error loading student ${estudianteId}`, e);
            return null;
          }
        });

        const estudiantesRaw = await Promise.all(estudiantesPromises);
        const estudiantesData: any[] = estudiantesRaw.filter(e => e !== null);
        
        // Sort by Cedula
        estudiantesData.sort((a, b) => parseInt(a.cedula, 10) - parseInt(b.cedula, 10));

        const totalMasculino = estudiantesData.filter(e => e.sexo === "MASCULINO").length;
        const totalFemenino = estudiantesData.filter(e => e.sexo === "FEMENINO").length;

        // Helper function to add a new page for this section
        const addNewPage = () => {
          const page = pdfDoc.addPage([595.28, 841.89]);
          const { width, height } = page.getSize();
          
          // Logos
          const yLogos = height - 110;
          page.drawImage(logo1Img, { x: 60, y: yLogos, width: 75, height: 65 });
          page.drawImage(logo2Img, { x: width / 2 - 95, y: yLogos, width: 180, height: 45 });
          page.drawImage(logo3Img, { x: width - 60 - 60, y: yLogos, width: 60, height: 60 });

          // Título
          const tituloTexto = `${seccionData.grado_año}° ${nivelEducativoSeleccionado} Sección "${seccionData.seccion}"`;
          const tituloWidth = helveticaBold.widthOfTextAtSize(tituloTexto, 20);
          page.drawText(tituloTexto, {
              x: width / 2 - tituloWidth / 2,
              y: height - 135,
              size: 20,
              font: helveticaBold,
              color: rgb(0, 0, 0.6),
          });

          // Header Table
          const headerY = height - 160;
          
          // Lines
          page.drawLine({ start: { x: margenIzquierdo, y: headerY }, end: { x: margenIzquierdo + anchoTotal, y: headerY }, thickness: 1, color: rgb(0, 0, 0) });
          page.drawLine({ start: { x: margenIzquierdo, y: headerY - 25 }, end: { x: margenIzquierdo + anchoTotal, y: headerY - 25 }, thickness: 1, color: rgb(0, 0, 0) });
          
          // Text Headers
          page.drawText("N°", { x: margenIzquierdo + (anchoColumna1 / 2) - 5, y: headerY - 17, size: 12, font: helveticaBold });
          page.drawText("CÉDULA", { x: margenIzquierdo + anchoColumna1 + (anchoColumna2 / 2) - 25, y: headerY - 17, size: 12, font: helveticaBold });
          
          const nombresHeaderX = margenIzquierdo + anchoColumna1 + anchoColumna2 + (anchoColumnaNombres / 2) - 60;
          page.drawText("APELLIDOS Y NOMBRES", { x: nombresHeaderX, y: headerY - 17, size: 12, font: helveticaBold });

          if (includeAge) {
               const edadTextWidth = helveticaBold.widthOfTextAtSize("EDAD", 12);
               const edadHeaderX = margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumnaNombres + (anchoColumnaEdad / 2) - (edadTextWidth / 2);
               page.drawText("EDAD", { x: edadHeaderX, y: headerY - 17, size: 12, font: helveticaBold });
          }
          
          return { page, currentY: headerY - 25 };
        };

        const drawVerticalLines = (targetPage: PDFPage, startY: number, endY: number) => {
          targetPage.drawLine({ start: { x: margenIzquierdo, y: startY }, end: { x: margenIzquierdo, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
          targetPage.drawLine({ start: { x: margenIzquierdo + anchoColumna1, y: startY }, end: { x: margenIzquierdo + anchoColumna1, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
          targetPage.drawLine({ start: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: startY }, end: { x: margenIzquierdo + anchoColumna1 + anchoColumna2, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
          
          if (includeAge) {
               targetPage.drawLine({ start: { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumnaNombres, y: startY }, end: { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumnaNombres, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
               targetPage.drawLine({ start: { x: margenIzquierdo + anchoTotal, y: startY }, end: { x: margenIzquierdo + anchoTotal, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
          } else {
               targetPage.drawLine({ start: { x: margenIzquierdo + anchoTotal, y: startY }, end: { x: margenIzquierdo + anchoTotal, y: endY }, thickness: 1, color: rgb(0, 0, 0) });
          }
        };

        let { page, currentY } = addNewPage();
        const { height: pageHeight } = page.getSize();
        const initialHeaderY = pageHeight - 160;
        let pageStartY = initialHeaderY;

        // Add students to the table
        estudiantesData.forEach((estudiante, index) => {
           if (currentY - lineHeight < bottomMargin) {
               drawVerticalLines(page, pageStartY, currentY);
               page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 1, color: rgb(0, 0, 0) });
               
               const newPageData = addNewPage();
               page = newPageData.page;
               currentY = newPageData.currentY;
               const { height } = page.getSize();
               pageStartY = height - 160;
           }

            const indexText = `${index + 1}`;
            const indexWidth = helveticaFont.widthOfTextAtSize(indexText, 12);
            const cedulaText = `${estudiante.cedula}`;
            const cedulaWidth = helveticaFont.widthOfTextAtSize(cedulaText, 12);
            
            page.drawText(indexText, { x: margenIzquierdo + (anchoColumna1 / 2) - (indexWidth / 2), y: currentY - lineHeight + 5, size: 10, font: helveticaFont });
            page.drawText(cedulaText, { x: margenIzquierdo + anchoColumna1 + (anchoColumna2 / 2) - (cedulaWidth / 2), y: currentY - lineHeight + 5, size: 10, font: helveticaFont });
            page.drawText(`${estudiante.apellidos} ${estudiante.nombres}`.toUpperCase(), { x: margenIzquierdo + anchoColumna1 + anchoColumna2 + 10, y: currentY - lineHeight + 5, size: 10, font: helveticaFont });

            if (includeAge) {
                 const ageText = calculateAge(estudiante.fechaNacimiento);
                 const ageWidth = helveticaFont.widthOfTextAtSize(ageText, 12);
                 page.drawText(ageText, { 
                     x: margenIzquierdo + anchoColumna1 + anchoColumna2 + anchoColumnaNombres + (anchoColumnaEdad / 2) - (ageWidth / 2), 
                     y: currentY - lineHeight + 5, 
                     size: 10, 
                     font: helveticaFont 
                 });
            }

            currentY -= lineHeight;

            if (index < estudiantesData.length - 1) {
                page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 0.5, color: rgb(0, 0, 0) });
            }
        });

        // Close the table
        drawVerticalLines(page, pageStartY, currentY);
        page.drawLine({ start: { x: margenIzquierdo, y: currentY }, end: { x: margenIzquierdo + anchoTotal, y: currentY }, thickness: 1, color: rgb(0, 0, 0) });

        // Add totals
        if (currentY - 60 < bottomMargin) {
            const newPageData = addNewPage();
            page = newPageData.page;
            currentY = pageHeight - 100;
        }
        
        const textoY = currentY - 20;
        page.drawText(`Total de estudiantes: ${estudiantesData.length}`, { x: margenIzquierdo, y: textoY, size: 12, font: helveticaBold });
        page.drawText(`Varones: ${totalMasculino}`, { x: margenIzquierdo, y: textoY - 15, size: 12, font: helveticaBold });
        page.drawText(`Hembras: ${totalFemenino}`, { x: margenIzquierdo, y: textoY - 30, size: 12, font: helveticaBold });
      }

      if (sectionsProcessed === 0) {
        showToast.error("Ninguna de las secciones seleccionadas tiene estudiantes inscritos.");
        setGenerating(false);
        return;
      }

      // Save and open the single consolidated PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url);
      
      showToast.success(`Reporte consolidado generado con ${sectionsProcessed} sección(es).`);
      setOpen(false);

    } catch (error) {
       console.error("Error generating PDF", error);
       showToast.error("Error al generar el reporte");
    } finally {
      setGenerating(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative overflow-hidden group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap text-xs font-medium text-primary"
                >
                  Generar Reporte
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Sección</DialogTitle>
          <DialogDescription>
            Seleccione los filtros para generar la nómina.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
             {/* Periodo */}
             <div className="space-y-2">
                <label className="text-sm font-medium">Período Escolar</label>
                <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.periodo} {p.status === "ACTIVO" ? "(Activo)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Nivel */}
             <div className="space-y-2">
                <label className="text-sm font-medium">Nivel Educativo</label>
                <Select value={nivelEducativoSeleccionado} onValueChange={setNivelEducativoSeleccionado} disabled={!periodoSeleccionado || loading || nivelesEducativos.length === 0}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccione nivel" />
                   </SelectTrigger>
                   <SelectContent>
                     {nivelesEducativos.map((nivel) => (
                       <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                     ))}
                   </SelectContent>
                </Select>
             </div>

             {/* Grado/Año - Multi-select */}
             <div className="space-y-2">
                <label className="text-sm font-medium">Grados / Años (Seleccione uno o más)</label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {gradosAnios.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {!nivelEducativoSeleccionado ? "Seleccione un nivel educativo primero" : "No hay grados disponibles"}
                    </p>
                  ) : (
                    gradosAnios.map((grado) => (
                      <div key={grado} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`grado-${grado}`} 
                          checked={gradosAniosSeleccionados.includes(grado)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGradosAniosSeleccionados([...gradosAniosSeleccionados, grado]);
                            } else {
                              setGradosAniosSeleccionados(gradosAniosSeleccionados.filter(g => g !== grado));
                            }
                          }}
                          disabled={!nivelEducativoSeleccionado || loading}
                        />
                        <Label 
                          htmlFor={`grado-${grado}`} 
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {grado}°
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {gradosAniosSeleccionados.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {gradosAniosSeleccionados.length} grado(s) seleccionado(s): {gradosAniosSeleccionados.map(g => `${g}°`).join(", ")}
                  </p>
                )}
             </div>

             {/* Secciones - Multi-select */}
             <div className="space-y-2">
                <label className="text-sm font-medium">Secciones (Seleccione una o más)</label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {seccionesDisponibles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {gradosAniosSeleccionados.length === 0 ? "Seleccione grado(s)/año(s) primero" : "No hay secciones disponibles"}
                    </p>
                  ) : (
                    seccionesDisponibles.map((seccion) => (
                      <div key={seccion.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`seccion-${seccion.id}`} 
                          checked={seccionesSeleccionadasIds.includes(seccion.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSeccionesSeleccionadasIds([...seccionesSeleccionadasIds, seccion.id]);
                            } else {
                              setSeccionesSeleccionadasIds(seccionesSeleccionadasIds.filter(s => s !== seccion.id));
                            }
                          }}
                          disabled={gradosAniosSeleccionados.length === 0 || loading}
                        />
                        <Label 
                          htmlFor={`seccion-${seccion.id}`} 
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {gradosAniosSeleccionados.length > 1 ? `${seccion.grado_año}° - ` : ""}Sección {seccion.seccion}
                          {seccion.estudiantes_ids && ` (${seccion.estudiantes_ids.length} estudiantes)`}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {seccionesSeleccionadasIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {seccionesSeleccionadasIds.length} sección(es) seleccionada(s)
                  </p>
                )}
             </div>

             {/* Include Age Checkbox */}
             <div className="flex items-center space-x-2">
                <Checkbox id="includeAge" checked={includeAge} onCheckedChange={(c) => setIncludeAge(c === true)} />
                <Label htmlFor="includeAge" className="text-sm font-medium cursor-pointer">
                  Incluir edad de los estudiantes
                </Label>
             </div>
        </div>

        <DialogFooter>
          <Button onClick={generarReporte} disabled={generating || seccionesSeleccionadasIds.length === 0} className="w-full bg-blue-600 hover:bg-blue-700">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />}
            {seccionesSeleccionadasIds.length > 1 ? `Generar ${seccionesSeleccionadasIds.length} Nóminas` : "Generar Nómina"}
          </Button>
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
