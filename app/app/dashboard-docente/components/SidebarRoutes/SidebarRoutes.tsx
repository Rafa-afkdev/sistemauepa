"use client";

import React from "react";
import SidebarItem from "../SidebarItem/SidebarItem";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BookOpen, Users, Calendar, ClipboardList, FileEdit, FileText, Home } from "lucide-react";
import { motion } from "framer-motion";
import { DataDocenteSidebar } from "./SidebarRoutes.data";

export function SidebarRoutes() {
  return (
    <div className="h-full">
      <div className="px-4 space-y-1">
        <Accordion type="multiple" className="w-full space-y-1">
          <AccordionItem value="inicio" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <SidebarItem
                key={DataDocenteSidebar[0].href}
                item={DataDocenteSidebar[0]}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-slate-700"
              />
            </motion.div>
          </AccordionItem>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

          <AccordionItem value="materias-secciones" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-blue-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-blue-100 [&[data-state=open]]:dark:bg-slate-600">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 group-data-[state=open]:text-blue-700 dark:group-data-[state=open]:text-blue-300" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                  Mis Clases
                </span>
              </AccordionTrigger>
            </motion.div>
            <AccordionContent className="pl-3 pt-2 space-y-2">
              <SidebarItem
                key={DataDocenteSidebar[1].href}
                item={DataDocenteSidebar[1]}
                className="px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              />
              <SidebarItem
                key={DataDocenteSidebar[2].href}
                item={DataDocenteSidebar[2]}
                className="px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              />
            </AccordionContent>
          </AccordionItem>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

          <AccordionItem value="notas" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <AccordionTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:no-underline hover:bg-green-50 dark:hover:bg-slate-700 [&[data-state=open]]:bg-green-100 [&[data-state=open]]:dark:bg-slate-600">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-green-700 group-data-[state=open]:text-green-700 dark:group-data-[state=open]:text-green-300" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                  Notas
                </span>
              </AccordionTrigger>
            </motion.div>
            <AccordionContent className="pl-3 pt-2 space-y-2">
              <SidebarItem
                key={DataDocenteSidebar[3].href}
                item={DataDocenteSidebar[3]}
                className="px-3 py-2 text-sm rounded-md hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              />
              <SidebarItem
                key={DataDocenteSidebar[4].href}
                item={DataDocenteSidebar[4]}
                className="px-3 py-2 text-sm rounded-md hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              />
            </AccordionContent>
          </AccordionItem>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

          <AccordionItem value="evaluaciones" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <SidebarItem
                key={DataDocenteSidebar[5].href}
                item={DataDocenteSidebar[5]}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-purple-50 dark:hover:bg-slate-700"
              />
            </motion.div>
          </AccordionItem>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

          <AccordionItem value="horario" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <SidebarItem
                key={DataDocenteSidebar[6].href}
                item={DataDocenteSidebar[6]}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-orange-50 dark:hover:bg-slate-700"
              />
            </motion.div>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
