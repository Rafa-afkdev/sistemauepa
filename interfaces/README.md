# Interfaces del Sistema de Control Escolar

Este documento describe la estructura de datos para el sistema de control escolar que soporta tanto **Educación Primaria** como **Educación Media General**.

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

## Niveles Educativos

### Educación Primaria
- **Grados:** 1ro, 2do, 3ro, 4to, 5to, 6to
- **Escala de calificación:** Literal (A, B, C, D, E)
- **Equivalencias:**
  - A (18-20): Excelente - Dominio total de las competencias
  - B (15-17): Bueno - Dominio satisfactorio de las competencias
  - C (12-14): Regular - Dominio básico de las competencias
  - D (10-11): Deficiente - Dominio mínimo de las competencias
  - E (0-9): Insuficiente - No alcanza las competencias mínimas
- **Evaluación:** Incluye descriptores de conocimiento, habilidades y actitudes

### Educación Media General
- **Años:** 1ro, 2do, 3ro, 4to, 5to
- **Escala de calificación:** Numérica (0-20)
- **Aprobación:** Nota mínima 10 puntos

## Flujos Principales

### Inscripción de Estudiante
1. Crear/actualizar documento en `estudiantes` con `nivel_educativo_actual` y `grado_año_actual`
2. Crear documento en `secciones` o actualizar existente
3. Actualizar `estudiantes_inscritos` y `estudiantes_ids` en la sección
4. Crear registro en `historial_secciones` con tipo "inscripcion"

### Cambio de Sección
1. Actualizar `seccion_actual`, `nivel_educativo_actual` y `grado_año_actual` en `estudiantes`
2. Decrementar `estudiantes_inscritos` en sección origen
3. Incrementar `estudiantes_inscritos` en sección destino
4. Actualizar arrays `estudiantes_ids` en ambas secciones
5. Crear registro en `historial_secciones` con tipo "cambio_seccion"

### Promoción de Estudiante (Fin de año escolar)
1. Actualizar `grado_año_actual` en `estudiantes` al siguiente grado/año
2. Si pasa de 6to grado a 1er año, cambiar `nivel_educativo_actual` de 'primaria' a 'media_general'
3. Asignar nueva sección para el próximo período
4. Crear registro en `historial_secciones` con tipo "promocion"

### Retiro de Estudiante
1. Actualizar `estado` a "retirado" en `estudiantes`
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
2. Identificar el `nivel_educativo` del estudiante
3. Para **Primaria**: Registrar `nota_literal` (A, B, C, D, E) con descriptores opcionales
4. Para **Media General**: Registrar `nota_numerica` (0-20)
5. Crear documento en `notas` por cada contenido evaluado
6. Actualizar `ResumenNotasLapso` con el promedio ponderado (numérico) o calificación final (literal)
7. Al finalizar el año, calcular `ResumenNotasAnual`

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

1. `estudiantes`: 
   - `periodo_escolar_actual`, `seccion_actual`, `estado`
   - `nivel_educativo_actual`, `grado_año_actual`
2. `secciones`: 
   - `periodo_escolar_id`, `nivel_educativo`, `grado_año`, `estado`
   - `docente_guia_id`
3. `historial_secciones`: 
   - `estudiante_id`, `periodo_escolar_id`, `fecha_movimiento`
   - `tipo_movimiento`, `nivel_educativo_destino`
4. `asignaciones_docente_materia`: 
   - `docente_id`, `seccion_id`, `periodo_escolar_id`
   - `nivel_educativo`, `grado_año`
5. `notas`: 
   - `estudiante_id`, `materia_id`, `lapso`, `periodo_escolar_id`
   - `nivel_educativo`, `grado_año`
6. `materias`:
   - `nivel_educativo`, `estado`

## Diferencias Clave entre Primaria y Media General

| Aspecto | Educación Primaria | Educación Media General |
|---------|-------------------|------------------------|
| **Grados/Años** | 1ro a 6to grado | 1ro a 5to año |
| **Escala de Notas** | Literal (A, B, C, D, E) | Numérica (0-20) |
| **Evaluación** | Descriptiva con competencias | Cuantitativa |
| **Aprobación** | Nivel C o superior | 10 puntos o más |
| **Promoción** | Automática con refuerzo | Según promedio |
| **Descriptores** | Obligatorios | Opcionales |

## Ejemplos de Uso

### Crear Sección de Primaria
```typescript
const seccionPrimaria: Secciones = {
  nivel_educativo: 'primaria',
  grado_año: '3ro',
  seccion: 'A',
  nombre_completo: '3ro A - Primaria',
  periodo_escolar_id: 'periodo_2024_2025',
  limite_estudiantes: 30,
  estudiantes_inscritos: 0,
  estudiantes_ids: [],
  estado: 'activa',
  turno: 'mañana',
  aula: 'Aula 12'
}
```

### Crear Sección de Media General
```typescript
const seccionMedia: Secciones = {
  nivel_educativo: 'media_general',
  grado_año: '2do',
  seccion: 'B',
  nombre_completo: '2do B - Media General',
  periodo_escolar_id: 'periodo_2024_2025',
  docente_guia_id: 'docente_123',
  docente_guia_nombre: 'Prof. Juan Pérez',
  limite_estudiantes: 35,
  estudiantes_inscritos: 0,
  estudiantes_ids: [],
  estado: 'activa',
  turno: 'tarde'
}
```

### Registrar Nota en Primaria
```typescript
const notaPrimaria: Notas = {
  estudiante_id: 'est_123',
  estudiante_nombre: 'María González',
  materia_id: 'mat_matematica',
  materia_nombre: 'Matemática',
  nivel_educativo: 'primaria',
  grado_año: '4to',
  lapso: 1,
  nota_literal: 'A',
  nota_display: 'A - Excelente',
  descriptores: {
    conocimiento: 'Domina completamente las operaciones básicas',
    habilidades: 'Resuelve problemas con autonomía',
    actitudes: 'Muestra interés y participa activamente'
  },
  // ... otros campos
}
```

### Registrar Nota en Media General
```typescript
const notaMedia: Notas = {
  estudiante_id: 'est_456',
  estudiante_nombre: 'Carlos Rodríguez',
  materia_id: 'mat_fisica',
  materia_nombre: 'Física',
  nivel_educativo: 'media_general',
  grado_año: '3ro',
  lapso: 2,
  nota_numerica: 18,
  nota_display: '18',
  observaciones: 'Excelente desempeño en laboratorio',
  // ... otros campos
}
```
