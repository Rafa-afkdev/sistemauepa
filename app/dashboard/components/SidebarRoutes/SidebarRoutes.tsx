"use client";

import React from "react";
import { DataAñoSidebar, DataDocenteSidebar, DataEstudiantesSidebar, DataEvaluacionesSidebar, DataIngresarNotas, DataMateriasSidebar, DataNotasSidebar, DataSeccionesSidebar } from "./SideBarRoutes.data";
import SidebarItem from "../SidebarItem/SidebarItem";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Users, BookOpen, Calendar, UsersRound, ClipboardEdit, FileText, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { Separator } from "@/components/ui/separator";

export function SidebarRoutes() {
  const { user } = useUser();
  const isDocente = user?.rol === "DOCENTE";

  return (
    <div className="h-full">
      <div className="px-4 space-y-1">
        <Accordion type="multiple" className="w-full space-y-1">
          {isDocente ? (
            <>

            <AccordionItem value="evaluaciones" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                > 
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-green-50 dark:hover:bg-slate-700 data-[state=open]:bg-green-100 data-[state=open]:dark:bg-slate-600">
                    <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-green-700 group-data-[state=open]:text-green-600 dark:group-data-[state=open]:text-green-400" />
                    <span className="text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Evaluaciones
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataEvaluacionesSidebar.map((item) => (
                    <SidebarItem
                      key={item.label}
                      item={item}
                      className="px-3 py-2 text-sm rounded-md transition-colors text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

            <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

            <AccordionItem value="ingreso-notas" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              > 
                <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-blue-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-blue-100 [&[data-state=open]]:dark:bg-slate-600">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 group-data-[state=open]:text-blue-700 dark:group-data-[state=open]:text-blue-300" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                    Notas
                  </span>
                </AccordionTrigger>
              </motion.div>
              <AccordionContent className="pl-3 pt-2 space-y-2">
                {DataIngresarNotas.map((item) => (
                  <SidebarItem
                    key={item.label}
                    item={item}
                    className="px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
            </>

            



          ) : (
            // Resto de elementos para otros roles
            <>
              <AccordionItem value="estudiantes" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-blue-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-blue-100 [&[data-state=open]]:dark:bg-slate-600">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 group-data-[state=open]:text-blue-700 dark:group-data-[state=open]:text-blue-300" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Estudiantes
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataEstudiantesSidebar.map((item) => (
                    <SidebarItem 
                      key={item.label} 
                      item={item}
                      className="px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

              <AccordionItem value="docentes" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-green-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-green-100 [&[data-state=open]]:dark:bg-slate-600">
                    <UsersRound className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-green-700 group-data-[state=open]:text-green-700 dark:group-data-[state=open]:text-green-300" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Docentes
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataDocenteSidebar.map((item) => (
                    <SidebarItem
                      key={item.label}
                      item={item}
                      className="px-3 py-2 text-sm rounded-md hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

              <AccordionItem value="secciones" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-purple-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-purple-100 [&[data-state=open]]:dark:bg-slate-600">
                    <ClipboardEdit className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 group-data-[state=open]:text-purple-700 dark:group-data-[state=open]:text-purple-300" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Secciones
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataSeccionesSidebar.map((item) => (
                    <SidebarItem
                      key={item.label}
                      item={item}
                      className="px-3 py-2 text-sm rounded-md hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

              <AccordionItem value="materias" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-green-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-green-100 [&[data-state=open]]:dark:bg-slate-600">
                    <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-green-700 group-data-[state=open]:text-green-700 dark:group-data-[state=open]:text-green-300" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Materias
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataMateriasSidebar.map((item) => (
                    <SidebarItem
                      key={item.label}
                      item={item}
                      className="px-3 py-2 text-sm rounded-md hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

              <AccordionItem value="ano-escolar" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-blue-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-orange-100 [&[data-state=open]]:dark:bg-slate-600">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:text-orange-700 group-data-[state=open]:text-orange-700 dark:group-data-[state=open]:text-orange-300" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Año Escolar
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataAñoSidebar.map((item) => (
                    <SidebarItem
                      key={item.label}
                      item={item}
                      className="px-3 py-2 text-sm rounded-md hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

              <AccordionItem value="notas" className="group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-blue-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-blue-100 [&[data-state=open]]:dark:bg-slate-600">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 group-data-[state=open]:text-blue-700 dark:group-data-[state=open]:text-blue-300" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      Notas
                    </span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="pl-3 pt-2 space-y-2">
                  {DataNotasSidebar.map((item) => (
                    <SidebarItem 
                      key={item.label} 
                      item={item}
                      className="px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </>
          )}
        </Accordion>
      </div>
    </div>
  );
}