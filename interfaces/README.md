# Interfaces del Sistema de Control Escolar

Este documento describe la estructura de datos para el sistema de control escolar del liceo.

## Estructura de Colecciones en Firebase

### 1. **users** (Colección principal de usuarios)
- Almacena todos los usuarios del sistema (admin, control_estudio, docentes)
- Interface: `User`, `Docente`
- Archivo: `users.interface.ts`

### 2. **estudiantes** (Colección de estudiantes)
- Información completa de cada estudiante
- Interface: `Estudiantes`
- Archivo: `estudiantes.interface.ts`
- Estados: activo, retirado, egresado

### 3. **representantes** (Colección de representantes)
- Información de padres/representantes
- Interface: `Representante`
- Archivo: `users.interface.ts`

### 4. **periodos_escolares** (Colección de períodos escolares)
- Años escolares (2023-2024, 2024-2025, etc.)
- Interface: `PeriodosEscolares`
- Archivo: `periodos-escolares.interface.ts`

### 5. **secciones** (Colección de secciones)
- Secciones por año y letra (1ro A, 1ro B, 2do A, etc.)
- Interface: `Secciones`, `InscripcionSeccion`
- Archivo: `secciones.interface.ts`
- Control de cupos y estudiantes inscritos

### 6. **historial_secciones** (Colección de historial)
- Registro de movimientos de estudiantes entre secciones
- Interface: `HistorialSecciones`, `ResumenHistorialEstudiante`
- Archivo: `historial-secciones.interface.ts`
- Tipos: inscripcion, cambio_seccion, retiro, reingreso

### 7. **materias** (Colección de materias)
- Catálogo de materias del liceo
- Interface: `Materias`
- Archivo: `materias.interface.ts`

### 8. **asignaciones_docente_materia** (Colección de asignaciones)
- Asignación de docentes a materias por sección
- Interface: `AsignacionDocenteMateria`
- Archivo: `materias.interface.ts`

### 9. **contenidos_materia** (Colección de contenidos)
- Contenidos/temas de cada materia por lapso
- Interface: `ContenidoMateria`
- Archivo: `materias.interface.ts`

### 10. **notas** (Colección de calificaciones)
- Notas de estudiantes por contenido
- Interface: `Notas`, `ResumenNotasLapso`, `ResumenNotasAnual`
- Archivo: `notas.interface.ts`

### 11. **acceso_registro_notas** (Colección de control de acceso)
- Control de permisos para que docentes registren notas
- Interface: `AccesoRegistroNotas`
- Archivo: `notas.interface.ts`

## Flujos Principales

### Inscripción de Estudiante
1. Crear/actualizar documento en `estudiantes`
2. Crear documento en `secciones` o actualizar existente
3. Actualizar `estudiantes_inscritos` y `estudiantes_ids` en la sección
4. Crear registro en `historial_secciones` con tipo "inscripcion"

### Cambio de Sección
1. Actualizar `seccion_actual` en `estudiantes`
2. Decrementar `estudiantes_inscritos` en sección origen
3. Incrementar `estudiantes_inscritos` en sección destino
4. Actualizar arrays `estudiantes_ids` en ambas secciones
5. Crear registro en `historial_secciones` con tipo "cambio_seccion"

### Retiro de Estudiante
1. Actualizar `estado_estudiante` a "retirado" en `estudiantes`
2. Agregar `fecha_retiro` y `motivo_retiro`
3. Decrementar `estudiantes_inscritos` en la sección
4. Remover ID del array `estudiantes_ids`
5. Crear registro en `historial_secciones` con tipo "retiro"

### Asignación de Docente Guía
1. Actualizar `docente_guia_id` en `secciones`
2. Actualizar `es_docente_guia` y `seccion_guia_id` en `docentes`

### Asignación de Materia a Docente
1. Crear documento en `asignaciones_docente_materia`
2. Actualizar array `materias_asignadas` en `docentes`

### Registro de Notas
1. Verificar `puede_registrar_notas` en `acceso_registro_notas`
2. Crear documento en `notas` por cada contenido evaluado
3. Actualizar `ResumenNotasLapso` con el promedio ponderado
4. Al finalizar el año, calcular `ResumenNotasAnual`

### Restricción de Acceso a Docente
1. Crear/actualizar documento en `acceso_registro_notas`
2. Establecer `puede_registrar_notas` a `false`
3. Actualizar `permiso` en `users` (opcional)

## Consideraciones de Seguridad en Firebase

### Reglas de Firestore recomendadas:
- **Control de estudio**: acceso completo a todas las colecciones
- **Docentes**: 
  - Lectura de sus asignaciones
  - Escritura de notas solo si tienen permiso
  - Lectura de estudiantes de sus secciones
- **Estudiantes/Representantes**: solo lectura de sus propios datos

## Índices Recomendados

1. `estudiantes`: `periodo_escolar_actual`, `seccion_actual`, `estado_estudiante`
2. `secciones`: `periodo_escolar_id`, `año`, `estado`
3. `historial_secciones`: `estudiante_id`, `periodo_escolar_id`, `fecha_movimiento`
4. `asignaciones_docente_materia`: `docente_id`, `seccion_id`, `periodo_escolar_id`
5. `notas`: `estudiante_id`, `materia_id`, `lapso`, `periodo_escolar_id`
