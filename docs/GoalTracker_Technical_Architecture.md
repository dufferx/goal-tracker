# Goal Tracker — Technical Architecture

> **Status:** Technical Definition — Round 1
>
> Este documento registra las decisiones técnicas del proyecto. Complementa al PRD funcional y no lo reemplaza.

---

# 1. Principios técnicos

## 1.1 Filosofía general

La arquitectura debe ser:

- lo más simple posible;
- suficientemente preparada para crecer;
- clara y mantenible;
- libre de sobreingeniería;
- adecuada para una instancia pequeña de uso personal y entre amigos.

La prioridad no es diseñar para una escala hipotética, sino construir una base sólida que pueda evolucionar sin rehacerse por completo.

## 1.2 Principio rector

La claridad del código tiene prioridad sobre:

- minimizar líneas;
- introducir abstracciones prematuras;
- preparar funcionalidades que todavía no existen;
- perseguir flexibilidad innecesaria.

---

# 2. Escala esperada

El caso de uso principal es:

- un usuario principal;
- algunos amigos;
- múltiples usuarios aislados dentro de una misma instancia;
- baja concurrencia;
- volumen moderado de objetivos y eventos.

La arquitectura no se optimizará inicialmente para cientos o miles de usuarios, aunque no deberá impedir una evolución futura razonable.

---

# 3. Distribución y self-hosting

## 3.1 Método oficial

La aplicación ofrecerá:

1. **Docker Compose** como método de despliegue oficial y documentado.
2. Un instalador o script simplificado como capa opcional posterior.

Docker Compose será la referencia canónica para:

- desarrollo local;
- producción self-hosted;
- pruebas reproducibles;
- documentación de infraestructura.

## 3.2 Objetivo operativo

Un usuario técnico deberá poder desplegar la aplicación con:

- configuración mínima;
- variables de entorno documentadas;
- pasos reproducibles;
- actualización segura mediante migraciones.

---

# 4. Backend

## 4.1 Decisión pendiente controlada

La arquitectura evaluará objetivamente:

- Backend-as-a-Service;
- backend tradicional;
- enfoque híbrido.

Existe una preferencia explícita del propietario del producto por **Supabase**, debido a:

- experiencia previa;
- autenticación integrada;
- PostgreSQL;
- Row Level Security;
- almacenamiento;
- migraciones;
- rapidez de desarrollo.

## 4.2 Criterio de decisión

Supabase será la opción preferida si cumple satisfactoriamente con:

- self-hosting viable;
- control de lógica de negocio;
- aislamiento por usuario;
- transferencias atómicas;
- eventos financieros;
- offline parcial;
- migraciones claras;
- portabilidad razonable;
- baja complejidad operativa.

No se elegirá Supabase únicamente por familiaridad si introduce dependencias o límites innecesarios.

---

# 5. Base de datos

PostgreSQL será la base de datos oficial.

No se diseñará una capa multi-base de datos.

Motivos:

- integridad transaccional;
- constraints;
- índices;
- JSONB cuando sea necesario;
- funciones y RPC;
- Row Level Security;
- madurez;
- compatibilidad con Supabase.

---

# 6. Licencia

La licencia objetivo será **MIT**.

La decisión deberá confirmarse antes de publicar el repositorio, pero esta es la opción predeterminada.

---

# 7. Dependencias externas

El proyecto minimizará servicios externos obligatorios.

Principios:

- toda dependencia crítica debe poder documentarse;
- evitar servicios propietarios sin alternativa;
- preferir componentes self-hosted;
- no depender de servicios de IA en el MVP;
- no depender de proveedores bancarios;
- no depender de servicios externos para cálculos esenciales.

---

# 8. Offline

El MVP soportará offline únicamente para:

- visualizar datos previamente cargados;
- registrar aportes;
- sincronizar aportes después.

Quedan fuera del MVP offline:

- edición completa de objetivos;
- compras;
- transferencias;
- cambios de checkpoints;
- importación y exportación;
- simulaciones persistentes.

---

# 9. Autenticación

El MVP implementará:

- correo;
- contraseña;
- recuperación por correo.

La arquitectura deberá permitir agregar OAuth posteriormente sin rediseñar el modelo de usuario.

Proveedores futuros posibles:

- Google;
- GitHub;
- Apple.

No se implementarán en el MVP.

---

# 10. API futura

No se publicará una API pública en el MVP.

La arquitectura deberá evitar acoplamientos que hagan difícil exponer una API futura.

La lógica de negocio no debe depender exclusivamente de componentes visuales del frontend.

---

# 11. Ubicación de la lógica de negocio

La lógica central vivirá en el backend.

Incluye:

- cálculos monetarios;
- saldos;
- checkpoints;
- cobertura;
- proyecciones;
- tranquilidad;
- siguiente acción;
- validaciones;
- transferencias;
- anulaciones;
- cierre de objetivos.

Motivos:

- una sola fuente de verdad;
- resultados consistentes;
- futura app móvil;
- futura API;
- futura integración con IA;
- menor riesgo de manipulación desde el cliente.

El frontend podrá calcular previews temporales para UX, pero el backend siempre validará y producirá el resultado definitivo.

---

# 12. Cliente web

La aplicación será una SPA.

Motivos:

- producto privado;
- sin necesidad relevante de SEO;
- experiencia tipo aplicación;
- PWA;
- navegación rápida;
- menor complejidad que SSR.

---

# 13. Componentes de interfaz

Se utilizará **shadcn/ui** como base de componentes.

Principios:

- reutilizar componentes cuando aporte claridad;
- evitar crear abstracciones genéricas prematuras;
- mantener componentes enfocados;
- adaptar shadcn/ui a los flujos reales;
- no imponer reutilización donde complique la lectura.

---

# 14. Observabilidad

El MVP tendrá logs básicos.

Debe incluir como mínimo:

- errores de servidor;
- errores de sincronización;
- fallos de importación;
- fallos de autenticación;
- errores de operaciones financieras;
- identificadores de correlación cuando sea práctico.

Métricas avanzadas y trazas distribuidas quedan fuera del MVP.

---

# 15. Repositorio

El proyecto usará un monorepo.

Debe permitir albergar:

- aplicación web;
- backend o funciones;
- lógica compartida;
- migraciones;
- pruebas;
- documentación;
- herramientas de desarrollo.

La estructura exacta se definirá después de elegir el stack.

---

# 16. Plataformas

Soporte oficial del MVP:

- web;
- PWA.

La arquitectura debe dejar una vía razonable para una app móvil futura.

No se construirá una app móvil nativa en el MVP.

---

# 17. Decisiones técnicas registradas

## T-001 — Simplicidad con crecimiento controlado

**Decisión:** construir la solución más simple que permita crecer sin sobreingeniería.

## T-002 — Escala pequeña como caso principal

**Decisión:** optimizar el MVP para el usuario principal y algunos amigos.

## T-003 — Docker Compose como despliegue oficial

**Decisión:** Docker Compose será la referencia canónica de self-hosting.

## T-004 — PostgreSQL obligatorio

**Decisión:** no se soportarán múltiples motores de base de datos.

## T-005 — MIT como licencia objetivo

**Decisión:** usar MIT salvo cambio explícito antes de publicar.

## T-006 — Backend como fuente de verdad

**Decisión:** la lógica de negocio central se ejecutará y validará en el backend.

## T-007 — SPA + PWA

**Decisión:** la aplicación web será una SPA instalable como PWA.

## T-008 — Monorepo

**Decisión:** frontend, backend, migraciones, pruebas y documentación convivirán en un único repositorio.

## T-009 — shadcn/ui

**Decisión:** utilizar shadcn/ui como base de componentes visuales.

## T-010 — Offline limitado

**Decisión:** el MVP soportará offline principalmente para aportes y lectura de datos cacheados.

## T-011 — OAuth preparado, no implementado

**Decisión:** el modelo de identidad deberá admitir proveedores futuros sin incluirlos en el MVP.

## T-012 — API futura, no pública en MVP

**Decisión:** evitar acoplamientos que bloqueen una API, pero no implementarla todavía.

## T-013 — Supabase como candidato preferido

**Decisión:** Supabase será la primera opción evaluada, sujeta a validación técnica y operativa.

---

# 18. Decisiones pendientes para la siguiente ronda

- elección definitiva entre Supabase y backend tradicional;
- estructura del monorepo;
- framework frontend;
- estrategia de backend;
- ubicación exacta del motor financiero;
- modelo de datos;
- uso de RPC, funciones o API;
- estrategia de migraciones;
- estrategia de correo;
- manejo de secretos;
- almacenamiento local y sincronización;
- pruebas y CI.

---

# 19. Arquitectura y stack — Ronda técnica 2

## 19.1 Frontend

Se utilizará:

- React;
- Vite;
- TypeScript;
- shadcn/ui;
- SPA instalable como PWA.

No se utilizará un meta-framework con SSR en el MVP.

## 19.2 Arquitectura backend preferida

La dirección seleccionada es híbrida:

- Supabase como plataforma principal de datos e identidad.
- Backend TypeScript ligero como capa de lógica de negocio.

Responsabilidades previstas de Supabase:

- PostgreSQL;
- autenticación;
- recuperación de contraseña;
- Row Level Security;
- Storage preparado para adjuntos futuros;
- migraciones;
- funciones de integridad cuando sean estrictamente necesarias.

Responsabilidades previstas del backend TypeScript:

- motor financiero;
- motor de proyecciones;
- estados de tranquilidad;
- siguiente acción recomendada;
- simulaciones;
- transferencias;
- anulaciones;
- importación y exportación;
- validaciones de negocio;
- futura interfaz de herramientas para IA.

Esta elección deberá validarse contra el modelo de dominio y los requisitos de despliegue self-hosted antes de considerarse definitiva.

## 19.3 Lógica de negocio

La lógica central no residirá en el frontend ni se distribuirá en componentes visuales.

La fuente de verdad será el backend.

La base de datos aplicará:

- constraints;
- claves foráneas;
- restricciones de unicidad;
- transacciones;
- políticas de acceso;
- invariantes críticas.

El backend aplicará:

- reglas de negocio;
- cálculos;
- orquestación;
- validaciones contextuales;
- respuestas derivadas.

## 19.4 Acceso a datos

Se utilizará **Drizzle ORM** como capa de acceso tipada a PostgreSQL.

Motivos:

- tipado excelente en TypeScript;
- muy cercano a SQL;
- baja abstracción;
- fácil integración con Supabase;
- control explícito de consultas complejas.

Las migraciones seguirán siendo responsabilidad de **Supabase**; Drizzle se utilizará para acceso tipado y composición de consultas, no como fuente de verdad del esquema.

La elección concreta queda cerrada hasta definir:

- framework del backend;
- forma de conexión con Supabase;
- necesidades transaccionales;
- estrategia de tipado;
- compatibilidad con migraciones de Supabase.

La solución deberá priorizar:

- cercanía a SQL;
- buen tipado TypeScript;
- baja abstracción;
- soporte claro para transacciones;
- ausencia de migraciones paralelas.

## 19.5 Migraciones

Las migraciones de Supabase serán la única fuente de verdad del esquema.

No se mantendrá un segundo sistema de migraciones desde ORM o query builder.

## 19.6 Módulos de dominio

Existirán módulos independientes para:

### Financial Engine

Responsable de:

- aportes;
- retiros;
- transferencias;
- compras;
- gastos;
- devoluciones;
- anulaciones;
- disponible;
- invertido;
- financiado;
- aportes históricos.

### Projection Engine

Responsable de:

- periodos;
- aportes mínimos;
- aporte ideal;
- fecha proyectada;
- tranquilidad;
- siguiente acción.

### Simulation Engine

Responsable de:

- escenarios temporales;
- aplicación de overrides;
- comparación contra el estado real;
- resultados sin efectos secundarios.

### Serialization Module

Responsable de:

- backups;
- restauración;
- plantillas;
- JSON;
- CSV;
- versionado;
- validación de archivos.

## 19.7 Persistencia de datos derivados

Se persistirán únicamente resultados derivados con valor histórico o de auditoría.

Ejemplos:

- fecha en que se alcanzó un checkpoint;
- estado histórico de cumplimiento;
- revisiones;
- anulaciones;
- referencias entre transferencias.

Los resultados que dependen del estado actual se recalcularán.

Ejemplos:

- saldo disponible;
- financiado;
- cobertura actual;
- tranquilidad;
- aporte recomendado;
- fecha proyectada;
- siguiente acción.

## 19.8 Cache

El MVP tendrá cache ligera en el cliente.

Objetivos:

- experiencia rápida;
- lectura offline de datos previamente cargados;
- reducción de solicitudes repetidas;
- soporte para aportes offline.

No habrá una capa de cache distribuida en el servidor durante el MVP.

## 19.9 Archivos de usuario

Las exportaciones, backups y plantillas se generarán y descargarán directamente desde el navegador cuando sea seguro hacerlo.

No se almacenarán automáticamente en Supabase Storage.

## 19.10 Storage futuro

Supabase Storage quedará preparado para futuras funcionalidades como:

- recibos;
- facturas;
- imágenes de componentes;
- archivos adjuntos.

No habrá adjuntos en el MVP.

## 19.11 Correo

El correo será configurable mediante SMTP o una interfaz compatible definida por variables de entorno.

No se acoplará el proyecto a un único proveedor.

## 19.12 Configuración

La configuración de instancia se hará mediante variables de entorno.

No habrá panel administrativo en el MVP.

## 19.13 IA futura

La IA BYOK nunca tendrá acceso directo a PostgreSQL.

Solo podrá interactuar mediante herramientas controladas expuestas por el backend.

Cada herramienta deberá:

- limitar el alcance;
- validar permisos;
- devolver datos mínimos;
- requerir confirmación para mutaciones;
- generar trazabilidad.

---

# 20. Nuevas decisiones técnicas

## T-014 — React + Vite

**Decisión:** usar React, Vite y TypeScript para la SPA/PWA.

## T-015 — Arquitectura híbrida preferida

**Decisión:** Supabase será la plataforma de datos e identidad y un backend TypeScript ligero contendrá la lógica de negocio.

**Estado:** preferida, pendiente de validación final.

## T-015A — Drizzle para acceso tipado

**Decisión:** usar Drizzle ORM para acceso tipado a PostgreSQL sin reemplazar las migraciones de Supabase.

## T-016 — Migraciones exclusivamente con Supabase

**Decisión:** no existirán migraciones paralelas gestionadas por otra herramienta.

## T-017 — Motores de dominio separados

**Decisión:** Financial Engine, Projection Engine y Simulation Engine serán módulos independientes.

## T-018 — Simulaciones sin efectos secundarios

**Decisión:** los escenarios trabajarán sobre modelos temporales y nunca modificarán el estado real sin confirmación.

## T-019 — Serialización centralizada

**Decisión:** importaciones, exportaciones, backups y plantillas usarán un módulo único y formatos versionados.

## T-020 — Persistir solo derivados históricos

**Decisión:** los cálculos actuales se recalculan; los logros y revisiones históricas se persisten.

## T-021 — Cache solo en cliente durante el MVP

**Decisión:** no se añadirá cache distribuida de servidor.

## T-022 — Descarga directa de archivos

**Decisión:** plantillas y backups no se almacenarán automáticamente en el servidor.

## T-023 — Storage preparado, adjuntos posteriores

**Decisión:** la infraestructura podrá admitir adjuntos futuros sin incluirlos en el MVP.

## T-024 — Correo desacoplado del proveedor

**Decisión:** la configuración será compatible con SMTP o adaptadores equivalentes.

## T-025 — IA mediante herramientas de backend

**Decisión:** ningún modelo tendrá acceso directo a la base de datos.

---

# 21. Decisión pendiente

## Acceso tipado a PostgreSQL

Se elegirá después de definir el backend entre alternativas como:

- query builder tipado;
- cliente generado;
- acceso SQL explícito con tipos;
- combinación mínima con el cliente de Supabase.

No se escogerá una herramienta que duplique el sistema de migraciones.

---

# 22. Modelo de dominio técnico — Ronda técnica 3

## 22.1 Organización del backend

El backend seguirá una arquitectura modular orientada por dominio y funcionalidad.

Módulos previstos:

- goals;
- components;
- checkpoints;
- financial;
- projections;
- simulations;
- serialization;
- auth;
- users;
- offline-sync.

Cada módulo podrá contener:

- casos de uso;
- servicios de dominio;
- validaciones;
- repositorios;
- tipos;
- pruebas;
- adaptadores.

No se organizará exclusivamente como una estructura CRUD horizontal global.

## 22.2 Financial Engine

Existirá un único `FinancialEngine` como punto público para operaciones monetarias.

Operaciones iniciales:

- deposit;
- withdraw;
- transfer;
- purchaseComponent;
- registerBudgetExpense;
- refund;
- voidEvent;
- restoreVoidedEvent.

El motor:

- valida invariantes;
- crea eventos;
- coordina transacciones;
- recalcula snapshots;
- devuelve el estado actualizado.

## 22.3 Projection Engine

El `ProjectionEngine` no accederá directamente a PostgreSQL.

Recibirá objetos de dominio y snapshots ya cargados.

Esto permitirá:

- pruebas unitarias puras;
- simulaciones;
- reutilización;
- futura exposición mediante API;
- futura integración con IA.

## 22.4 Resultado de proyección

El motor de proyecciones devolverá un resultado compuesto.

Ejemplo conceptual:

```ts
type ProjectionResult = {
  status: TranquilityStatus
  reason: string
  nextAction: RecommendedAction
  projectedDate: string | null
  minimumContribution: Money | null
  idealContribution: Money | null
  checkpointProjection: CheckpointProjection | null
  finalGoalProjection: GoalProjection
}
```

La forma exacta se definirá en la especificación del motor.

## 22.5 Eventos como fuente de verdad financiera

Los movimientos monetarios se representarán mediante eventos financieros.

El objetivo no se modificará directamente para alterar saldos.

El estado financiero se deriva de:

- aportes;
- retiros;
- transferencias;
- compras;
- gastos;
- devoluciones;
- anulaciones.

Esto no implica implementar Event Sourcing completo para todo el sistema.

## 22.6 Snapshots de saldo

Los saldos derivados podrán persistirse como snapshots o caché de lectura.

Deben poder reconstruirse desde eventos financieros válidos.

Los snapshots nunca serán la fuente de verdad.

Snapshots previstos:

- availableAmount;
- investedAmount;
- fundedAmount;
- historicalContributions;
- historicalWithdrawals;
- lastRecalculatedAt.

## 22.7 Transferencias

Toda transferencia será una única operación atómica.

La transacción debe:

1. validar propiedad y moneda;
2. validar saldo suficiente;
3. crear evento de salida;
4. crear evento de entrada;
5. relacionar ambos eventos;
6. actualizar snapshots;
7. confirmar todo o revertir todo.

## 22.8 Simulaciones

Las simulaciones vivirán únicamente en memoria durante el MVP.

No se persistirán automáticamente.

Trabajarán sobre una copia inmutable del estado de dominio y una colección de overrides temporales.

## 22.9 Estrategia de cálculo

Los valores derivados se calcularán cuando se necesiten.

Solo se persistirán:

- hechos históricos;
- eventos;
- revisiones;
- fechas de logro;
- snapshots justificables por rendimiento.

## 22.10 Agregados y servicios

El agregado `Goal` mantendrá consistencia estructural, pero no concentrará toda la lógica del producto.

Responsabilidades aproximadas:

### Goal aggregate

- identidad;
- propiedad;
- estado;
- configuración;
- meta;
- moneda;
- fechas;
- relaciones estructurales.

### Financial Engine

- movimientos;
- saldos;
- transferencias;
- anulaciones;
- devoluciones.

### Projection Engine

- periodos;
- proyecciones;
- tranquilidad;
- siguiente acción.

### Checkpoint domain service

- orden;
- cobertura;
- logro histórico;
- componentes vinculados.

### Simulation Engine

- escenarios temporales.

### Serialization module

- importación;
- exportación;
- backups;
- plantillas;
- versionado.

## 22.11 Regla de unicidad de negocio

Toda regla de negocio importante deberá existir en un único lugar del código.

El frontend podrá mostrar previews, pero no definirá reglas autoritativas.

La IA futura, la API y cualquier app móvil consumirán los mismos motores del backend.

---

# 23. Nuevas decisiones técnicas

## T-026 — Arquitectura modular orientada por dominio

**Decisión:** organizar el backend por módulos funcionales y no únicamente por capas CRUD horizontales.

## T-027 — Financial Engine único

**Decisión:** todas las mutaciones monetarias pasarán por una única interfaz de dominio.

## T-028 — Projection Engine puro

**Decisión:** el motor de proyecciones trabajará con objetos de dominio y no accederá directamente a la base de datos.

## T-029 — Resultado compuesto de proyección

**Decisión:** tranquilidad, razón, acción y cifras relacionadas se devolverán juntas.

## T-030 — Eventos financieros como fuente de verdad

**Decisión:** los saldos se derivan de eventos válidos.

## T-031 — Snapshots reconstruibles

**Decisión:** los saldos persistidos serán cachés reconstruibles y no la fuente de verdad.

## T-032 — Transferencias atómicas

**Decisión:** origen y destino se confirman o revierten como una sola transacción.

## T-033 — Simulaciones en memoria

**Decisión:** los escenarios del MVP no se persisten.

## T-034 — Cálculo bajo demanda

**Decisión:** evitar persistir derivados salvo valor histórico o necesidad de rendimiento.

## T-035 — Agregados pequeños y servicios especializados

**Decisión:** `Goal` no concentrará toda la lógica del sistema.

## T-036 — Regla de negocio única

**Decisión:** cada regla autoritativa deberá existir exactamente en un solo módulo.

---

# 24. Modelo de datos e integridad — Ronda técnica 4

## 24.1 Profiles

Se utilizará una tabla `profiles` separada del proveedor de autenticación.

Campos principales:

- `id` — mismo identificador que el usuario autenticado;
- `display_name`;
- `default_currency`;
- `effective_timezone`;
- `created_at`;
- `updated_at`.

## 24.2 Goals

La tabla `goals` almacenará:

- `id`;
- `owner_id`;
- `name`;
- `description`;
- `currency`;
- `target_mode`;
- `manual_target_amount`;
- `final_date`;
- `saving_frequency`;
- `planned_contribution_amount`;
- `priority`;
- `status`;
- `manual_order`;
- `created_at`;
- `updated_at`.

La configuración principal permanecerá en una sola tabla mientras no exista una razón clara para dividirla.

## 24.3 Representación monetaria

Todos los montos se almacenarán como enteros en la unidad menor de la moneda.

Ejemplo:

- $10.50 se almacena como `1050`.

Reglas:

- no usar `float` o `double`;
- operaciones monetarias exactas;
- validación de overflow;
- dos decimales durante el MVP.

## 24.4 Components

Se utilizará una sola tabla `components`.

Campos principales:

- `id`;
- `goal_id`;
- `type`;
- `name`;
- `description`;
- `estimated_amount`;
- `status`;
- `is_required`;
- `manual_order`;
- `created_at`;
- `updated_at`.

Tipos:

- `one_time_purchase`;
- `budget`.

Los gastos de componentes tipo presupuesto se registrarán como eventos financieros vinculados.

## 24.5 Checkpoints

Tabla `checkpoints`:

- `id`;
- `goal_id`;
- `name`;
- `due_date`;
- `due_month`;
- `manual_extra_amount`;
- `type`;
- `manual_order`;
- `is_archived`;
- `created_at`;
- `updated_at`.

Tipos:

- `intermediate`;
- `final`.

El monto calculado no se persiste como fuente de verdad.

## 24.6 Checkpoint components

Tabla puente `checkpoint_components`.

Restricción única:

- `(checkpoint_id, component_id)`.

Ambas entidades deben pertenecer al mismo objetivo.

## 24.7 Tasks

Tabla `tasks`:

- `id`;
- `goal_id`;
- `checkpoint_id` opcional;
- `component_id` opcional;
- `title`;
- `description`;
- `status`;
- `manual_order`;
- `created_at`;
- `updated_at`.

Regla:

- una tarea puede vincularse a un checkpoint o a un componente, pero no a ambos simultáneamente.

## 24.8 Financial events

Se utilizará una única tabla `financial_events`.

Tipos iniciales:

- `deposit`;
- `withdrawal`;
- `transfer_in`;
- `transfer_out`;
- `purchase`;
- `budget_expense`;
- `refund`;
- `adjustment`.

Campos principales:

- `id`;
- `owner_id`;
- `goal_id`;
- `component_id` opcional;
- `transfer_id` opcional;
- `reverses_event_id` opcional;
- `type`;
- `amount`;
- `effective_date`;
- `status`;
- `idempotency_key`;
- `metadata`;
- `created_at`;
- `updated_at`.

## 24.9 Financial event revisions

Las ediciones de eventos financieros:

- actualizan el evento vigente;
- crean una entrada en `financial_event_revisions`;
- conservan el estado anterior;
- registran quién y cuándo realizó el cambio.

## 24.10 Voiding

Una anulación:

- marca el evento original como anulado;
- no crea un gasto inverso ficticio;
- recalcula snapshots;
- conserva trazabilidad.

Una devolución real sí crea un nuevo evento financiero.

## 24.11 Transfers

Tabla `transfers`:

- `id`;
- `owner_id`;
- `source_goal_id`;
- `destination_goal_id`;
- `amount`;
- `effective_date`;
- `status`;
- `created_at`.

Cada transferencia relaciona exactamente:

- un evento `transfer_out`;
- un evento `transfer_in`.

La operación es atómica.

## 24.12 Financial snapshots

Tabla `goal_financial_snapshots`, con una fila por objetivo.

Campos:

- `goal_id`;
- `available_amount`;
- `invested_amount`;
- `funded_amount`;
- `historical_contributions_amount`;
- `historical_withdrawals_amount`;
- `last_event_id`;
- `recalculated_at`.

Los snapshots son reconstruibles y nunca son la fuente de verdad.

## 24.13 Checkpoint achievements

Tabla `checkpoint_achievements`.

Campos:

- `id`;
- `checkpoint_id`;
- `achieved_amount`;
- `achieved_at`;
- `target_version`;
- `status`;
- `created_at`.

Se registrará cada recuperación válida de cobertura, no únicamente la primera.

## 24.14 Activity events

Se utilizará `activity_events` para eventos no financieros.

Tipos:

- meta modificada;
- fecha modificada;
- checkpoint creado, modificado o archivado;
- componente creado, modificado o cancelado;
- tarea creada o completada;
- nota;
- cierre;
- restauración.

Los logs técnicos no reemplazan este historial funcional.

## 24.15 Eliminación y papelera

- Los objetivos usan estados para archivado y papelera.
- Componentes, checkpoints y tareas no requieren `deleted_at` universal.
- Las eliminaciones que afecten historial se representan como cancelación, archivo o evento.
- Los eventos financieros y revisiones no se eliminan desde flujos normales.

## 24.16 Constraints

PostgreSQL aplicará restricciones estructurales:

- montos positivos cuando corresponda;
- claves foráneas;
- unicidad;
- una sola fila de snapshot por objetivo;
- un solo checkpoint final por objetivo;
- origen y destino diferentes;
- IDs de usuario propietarios;
- relaciones internas coherentes;
- RLS.

El backend aplicará reglas contextuales:

- misma moneda en transferencias;
- saldo suficiente;
- orden acumulativo de checkpoints;
- cambios de estado válidos;
- cierre;
- impacto de cambios;
- validaciones de negocio transaccionales.

## 24.17 JSONB

JSONB se usará solo para:

- metadata no esencial;
- payloads versionados;
- compatibilidad futura;
- detalles secundarios.

Los datos críticos tendrán columnas y constraints explícitos.

## 24.18 Identificadores

Se utilizará **UUID v4**.

Motivos:

- amplia compatibilidad;
- generación sencilla;
- soporte nativo en Supabase/PostgreSQL;
- suficiente para la escala del producto;
- menor riesgo operativo que introducir UUID v7 sin necesidad real.

## 24.19 Timestamps

Reglas:

- `created_at` y `updated_at` en UTC;
- `effective_date` para la fecha elegida por el usuario;
- fechas calendario como tipo `date`;
- timestamps técnicos como `timestamptz`;
- las fechas de negocio no se reinterpretan retroactivamente por cambios de zona horaria.

---

# 25. Nuevas decisiones técnicas

## T-037 — Profiles separados de Auth

**Decisión:** los datos de perfil vivirán fuera de la tabla de autenticación.

## T-038 — Montos como enteros

**Decisión:** guardar dinero en unidades menores, nunca en punto flotante.

## T-039 — Componentes con discriminador

**Decisión:** compra única y presupuesto comparten tabla con reglas por tipo.

## T-040 — Checkpoints calculados

**Decisión:** el monto vigente del checkpoint se deriva y no se persiste como verdad autoritativa.

## T-041 — Relación many-to-many

**Decisión:** componentes y checkpoints se conectan mediante tabla puente.

## T-042 — Contexto único por tarea

**Decisión:** una tarea puede vincularse a checkpoint o componente, no a ambos.

## T-043 — Tabla única de eventos financieros

**Decisión:** todos los movimientos monetarios comparten un modelo común.

## T-044 — Revisiones separadas

**Decisión:** las ediciones conservan historial en una tabla de revisiones.

## T-045 — Anulación por estado

**Decisión:** los errores se anulan; las devoluciones reales crean nuevos eventos.

## T-046 — Transfer entity

**Decisión:** las transferencias tienen entidad propia y dos eventos relacionados.

## T-047 — Snapshot separado

**Decisión:** la caché financiera vive fuera de `goals`.

## T-048 — Múltiples logros de checkpoint

**Decisión:** cada recuperación de cobertura puede quedar registrada.

## T-049 — Activity events

**Decisión:** el historial funcional no financiero tendrá tabla propia.

## T-050 — Soft delete selectivo

**Decisión:** no todas las tablas tendrán `deleted_at`.

## T-051 — Constraints estructurales en PostgreSQL

**Decisión:** integridad simple en base de datos y reglas contextuales en backend.

## T-052 — JSONB limitado

**Decisión:** evitar usar JSONB para datos centrales.

## T-053 — UUID v4

**Decisión:** usar UUID v4 por simplicidad y compatibilidad.

## T-054 — Fechas estables

**Decisión:** separar fechas de negocio y timestamps técnicos.

---

# 26. Motor financiero y transacciones — Ronda técnica 5

## 26.1 Escrituras financieras

Toda mutación monetaria pasará por el backend y por casos de uso del `FinancialEngine`.

El frontend no insertará eventos financieros directamente en Supabase.

Casos de uso iniciales:

- `deposit`;
- `withdraw`;
- `transfer`;
- `purchaseComponent`;
- `registerBudgetExpense`;
- `refund`;
- `voidEvent`;
- `restoreVoidedEvent`.

## 26.2 Acceso transaccional

El backend utilizará Drizzle para ejecutar operaciones sobre PostgreSQL.

Las operaciones simples podrán ejecutarse directamente mediante Drizzle.

Las operaciones complejas deberán usar transacciones explícitas.

No se convertirá cada mutación en una RPC SQL.

## 26.3 Consistencia inmediata

La creación del evento financiero y la actualización del snapshot ocurrirán dentro de la misma transacción.

La respuesta al cliente debe representar un estado ya consistente.

## 26.4 Reconstrucción automática

Si un snapshot no coincide con los eventos válidos:

1. se registra un error técnico;
2. se reconstruye automáticamente;
3. se sustituye el snapshot;
4. se devuelve el estado corregido.

El snapshot nunca prevalece sobre los eventos.

## 26.5 Deltas y verificaciones

En operaciones normales:

- aplicar delta al snapshot;
- validar invariantes;
- confirmar transacción.

Además:

- reconstrucciones completas periódicas o bajo demanda;
- comparación entre snapshot y eventos;
- alerta técnica ante divergencias.

## 26.6 Ediciones y anulaciones históricas

Cuando se edita o anula un evento antiguo:

- se reconstruye el snapshot completo del objetivo;
- se recalculan logros históricos;
- se recalculan coberturas;
- se recalculan proyecciones actuales.

No se aplicará únicamente una diferencia incremental.

## 26.7 Orden cronológico

Para reconstrucciones y logros históricos:

1. `effective_date`;
2. `created_at`;
3. `id` como desempate estable.

El saldo final puede obtenerse por suma, pero la secuencia histórica debe ser determinista.

## 26.8 Eventos retroactivos

Un aporte o movimiento con fecha pasada puede cambiar:

- fecha de logro de checkpoints;
- secuencia histórica;
- estado anterior de cobertura;
- proyección actual.

El sistema recalculará esos resultados.

## 26.9 Invariante de saldo histórico

Toda edición, anulación o movimiento retroactivo debe preservar:

- saldo disponible no negativo en cada punto de la secuencia;
- invertido no negativo;
- financiado no negativo.

Si la operación produciría sobregiro histórico, se rechaza.

## 26.10 Validación cronológica completa

Antes de confirmar una mutación histórica:

1. cargar eventos relevantes;
2. ordenar cronológicamente;
3. simular la secuencia completa;
4. validar invariantes;
5. confirmar o rechazar.

## 26.11 Eventos de ajuste

El tipo `adjustment` no estará disponible para usuarios normales.

Se reserva para:

- migraciones;
- restauraciones;
- reparación interna;
- herramientas administrativas de mantenimiento fuera de la UI.

Toda utilización deberá dejar trazabilidad técnica.

## 26.12 Devoluciones

Las devoluciones pueden ser:

- totales;
- parciales.

Reglas:

- deben referenciar el evento original;
- no pueden superar el monto neto todavía no devuelto;
- restauran saldo disponible;
- reducen invertido;
- recalculan componente y checkpoints.

## 26.13 Estado después de devolución

Si una compra única se devuelve completamente:

- si el saldo disponible cubre el costo vigente, el componente queda `Listo para comprar`;
- si no lo cubre, queda `Ahorrando`;
- si fue cancelado explícitamente, permanece `Cancelado`.

El estado será derivado, no elegido manualmente.

## 26.14 Sobrecosto en componentes de presupuesto

Un gasto puede superar el presupuesto estimado si:

- existe saldo suficiente;
- el usuario confirma el sobrecosto;
- se muestra el impacto en meta y checkpoints;
- la operación se registra normalmente.

## 26.15 Anulación de transferencias

Anular una transferencia:

1. bloquea objetivos y snapshots involucrados;
2. valida que la reversión no produzca inconsistencia;
3. anula ambos eventos;
4. anula la entidad `transfer`;
5. recalcula ambos snapshots;
6. confirma todo de forma atómica.

## 26.16 Idempotencia universal

Toda mutación financiera requiere `idempotency_key`.

Aplica a:

- aportes;
- retiros;
- compras;
- gastos;
- transferencias;
- devoluciones;
- anulaciones.

## 26.17 Reintentos idempotentes

Si llega una clave ya procesada:

- no se crea una nueva operación;
- se devuelve el resultado original;
- si el payload difiere del original, se devuelve error de conflicto.

## 26.18 Concurrencia

Antes de consumir saldo:

- bloquear la fila de snapshot con `SELECT ... FOR UPDATE`;
- volver a validar saldo dentro de la transacción;
- ejecutar la mutación;
- actualizar snapshot;
- confirmar.

Esto evita doble gasto por concurrencia.

## 26.19 Moneda heredada

Los eventos heredan la moneda del objetivo.

No se duplicará la moneda en cada evento.

Después del primer evento financiero, la moneda del objetivo será inmutable.

## 26.20 Auditoría técnica

Cada mutación financiera registrará como mínimo:

- correlation/request ID;
- usuario;
- tipo de operación;
- objetivo;
- componente opcional;
- transferencia opcional;
- resultado;
- duración;
- error técnico si existe.

No se registrarán notas privadas ni payloads sensibles completos.

---

# 27. Nuevas decisiones técnicas

## T-055 — Escrituras financieras solo por backend

**Decisión:** el frontend no inserta eventos directamente.

## T-056 — Drizzle con transacciones explícitas

**Decisión:** usar Drizzle para acceso y transacciones, sin convertir toda operación en RPC SQL.

## T-057 — Evento y snapshot atómicos

**Decisión:** ambos se confirman dentro de la misma transacción.

## T-058 — Snapshot autocorregible

**Decisión:** reconstruir automáticamente cuando exista divergencia.

## T-059 — Deltas más reconstrucción periódica

**Decisión:** usar actualizaciones incrementales y validación completa periódica.

## T-060 — Reconstrucción tras cambios históricos

**Decisión:** ediciones y anulaciones retroactivas recalculan toda la secuencia.

## T-061 — Orden cronológico determinista

**Decisión:** ordenar por fecha efectiva, creación e ID.

## T-062 — Sin sobregiro histórico

**Decisión:** rechazar cualquier mutación que vuelva negativa la secuencia.

## T-063 — Adjustment reservado

**Decisión:** no exponer ajustes manuales en la UI.

## T-064 — Devoluciones parciales

**Decisión:** permitir devoluciones totales o parciales con referencia al evento original.

## T-065 — Estado derivado después de devolución

**Decisión:** recalcular el estado del componente según saldo y costo vigentes.

## T-066 — Sobrecosto confirmado

**Decisión:** permitir superar presupuesto con saldo suficiente y confirmación.

## T-067 — Anulación atómica de transferencias

**Decisión:** ambos lados se anulan juntos.

## T-068 — Idempotencia en toda mutación financiera

**Decisión:** todas las operaciones requieren clave idempotente.

## T-069 — Reintento devuelve resultado original

**Decisión:** claves repetidas no duplican operaciones.

## T-070 — Bloqueo pesimista de snapshot

**Decisión:** usar bloqueo transaccional para evitar doble gasto.

## T-071 — Moneda heredada

**Decisión:** no repetir moneda por evento.

## T-072 — Auditoría técnica mínima

**Decisión:** registrar contexto técnico sin exponer información sensible.

---

# 28. Projection Engine — Ronda técnica 6

## Principios

El Projection Engine será un motor **puro, determinista y sin efectos secundarios**.

Siempre recibirá un snapshot del dominio y devolverá un único resultado compuesto.

No realizará:

- escrituras en base de datos;
- llamadas HTTP;
- consultas directas a Supabase;
- registro de logs;
- mutaciones del estado.

## API pública

Existirá un único punto de entrada:

`ProjectionEngine.calculate(snapshot, overrides?)`

`overrides` permitirá simulaciones temporales sin modificar el estado real.

## Resultado

El resultado incluirá, como mínimo:

- tranquilidad;
- explicación estructurada;
- lista priorizada de acciones recomendadas;
- checkpoint crítico;
- fecha proyectada;
- aporte mínimo;
- aporte ideal;
- días de margen;
- períodos restantes;
- períodos consumidos;
- porcentaje esperado;
- porcentaje real.

## Modelo temporal

Internamente el motor trabajará con una secuencia abstracta de períodos (no meses), permitiendo soportar nuevas frecuencias sin reescribir algoritmos.

## Checkpoint crítico

Siempre calculará el checkpoint que representa el cuello de botella actual del objetivo, no necesariamente el siguiente cronológicamente.

## Recomendaciones

Las recomendaciones serán estructuras tipadas con prioridad, título, descripción y datos necesarios para la UI.

El motor podrá devolver múltiples recomendaciones ordenadas; la interfaz mostrará normalmente la primera.

## Explicabilidad

Toda decisión incluirá un árbol de explicación reutilizable por:

- interfaz;
- futuras notificaciones;
- IA BYOK;
- API.

## Simulaciones

El Simulation Engine reutilizará el Projection Engine mediante `overrides`, evitando duplicar lógica.

## Testabilidad

El Projection Engine podrá probarse únicamente con:

- snapshot de entrada;
- resultado esperado.

No requerirá mocks de infraestructura.

---

# 29. Nuevas decisiones técnicas

## T-073 — Punto de entrada único

El Projection Engine expone una sola función pública.

## T-074 — Resultado compuesto

Todos los cálculos relacionados se devuelven en un único objeto.

## T-075 — Períodos abstractos

Los algoritmos trabajan sobre períodos y no sobre meses.

## T-076 — Checkpoint crítico

El motor identifica el cuello de botella actual del objetivo.

## T-077 — Recomendaciones estructuradas

Las acciones recomendadas son entidades tipadas y priorizadas.

## T-078 — Explicaciones estructuradas

Toda decisión del motor debe ser explicable mediante un árbol de causas.

## T-079 — Motor puro

El Projection Engine no depende de infraestructura.

## T-080 — Reutilización por IA

La IA futura consumirá el Projection Engine; nunca implementará reglas propias.

