# Goal Tracker — Product Requirements Document

> **Status:** Functionally Audited Master
>
> Este documento es la fuente única de verdad para la definición funcional del producto. Toda decisión futura deberá actualizar este archivo en lugar de crear versiones paralelas.

---

# 1. Visión del producto

Goal Tracker es una aplicación para planificar, ejecutar y completar objetivos económicos personales.

La aplicación no pretende reemplazar sistemas de presupuesto, contabilidad personal o conexión bancaria. Su foco principal es ayudar al usuario a responder:

- ¿Cuánto he avanzado?
- ¿Voy bien?
- ¿Cuánto debo ahorrar por quincena o por mes?
- ¿Llegaré a tiempo al siguiente checkpoint?
- ¿Puedo realizar una compra sin comprometer el objetivo?
- ¿Qué debería hacer a continuación?

La entidad principal del producto es el **Objetivo**.

---

# 2. Objetivo general

Permitir que una persona gestione múltiples objetivos económicos de forma separada, cada uno con:

- una meta;
- una fecha opcional;
- checkpoints monetarios;
- componentes;
- tareas;
- aportes;
- compras;
- historial;
- proyecciones;
- estado de tranquilidad.

Casos principales:

- viaje;
- home gym;
- computadora;
- fondo de emergencia;
- compra grande;
- proyecto por componentes.

---

# 3. Principios de producto

1. El objetivo es la entidad principal.
2. El progreso monetario depende únicamente del dinero.
3. Las tareas no afectan el porcentaje.
4. El historial se basa en eventos.
5. El estado de tranquilidad debe ser explicable.
6. La siguiente acción recomendada es más importante que el porcentaje aislado.
7. Registrar un aporte debe ser extremadamente rápido.
8. La aplicación debe sentirse como un asistente, no solo como un tracker.
9. La privacidad entre usuarios es obligatoria.
10. El MVP debe ser simple, útil y self-hosted.

---

# 4. Alcance del MVP

## Incluido

- cuentas de usuario;
- registro abierto;
- correo y contraseña;
- recuperación por correo;
- objetivos privados;
- múltiples objetivos por usuario;
- meta manual o calculada por componentes;
- checkpoints monetarios;
- componentes;
- tareas;
- aportes;
- retiros;
- transferencias entre objetivos con la misma moneda;
- compras de componentes de compra única;
- gastos múltiples en componentes de presupuesto;
- historial de eventos;
- proyecciones;
- simulaciones;
- estados de tranquilidad;
- dashboard;
- PWA;
- funcionamiento offline parcial;
- exportación JSON;
- exportación CSV;
- exportación e importación de plantillas vacías;
- objetivos archivados;
- papelera;
- inglés como idioma inicial;
- estructura preparada para internacionalización.

## Fuera del MVP

- conexión bancaria;
- colaboración en tiempo real;
- objetivos compartidos;
- roles de administrador;
- panel administrativo;
- múltiples monedas dentro del mismo objetivo;
- objetivos completamente no monetarios;
- notificaciones push;
- búsqueda textual en historial;
- pagos parciales en componentes de tipo compra única;
- checkpoints repetitivos;
- IA integrada;
- recomendaciones globales de distribución entre objetivos.

---

# 5. Usuarios y acceso

## 5.1 Modelo de usuario

Todos los usuarios tienen el mismo nivel de permisos dentro de la aplicación.

No existe un rol de administrador en la interfaz.

Cada usuario solo puede ver y modificar sus propios datos.

## 5.2 Autenticación

- correo y contraseña;
- registro abierto;
- recuperación de contraseña por correo.

## 5.3 Perfil

El perfil incluye:

- nombre;
- correo;
- moneda predeterminada.

La zona horaria se obtiene del navegador y se guarda como preferencia efectiva del usuario.

Si el navegador reporta otra zona horaria, la aplicación pedirá confirmar el cambio antes de recalcular fechas o periodos.

## 5.4 Privacidad

Los objetivos, movimientos, componentes, checkpoints y tareas son privados por usuario.

---

# 6. Modelo de dominio

## 6.1 Objetivo

Representa una meta económica personal.

Contiene:

- nombre;
- descripción opcional;
- moneda;
- meta económica;
- modo de cálculo;
- fecha final opcional;
- estado;
- prioridad;
- frecuencia de ahorro;
- aporte planificado opcional;
- checkpoints;
- componentes;
- tareas;
- eventos.

Estados válidos:

1. Borrador
2. Activo
3. Completado pendiente de cierre
4. Archivado
5. En papelera

Las simulaciones son resultados temporales y no forman parte persistente del objetivo salvo que el usuario aplique explícitamente un escenario.

## 6.2 Meta económica

Puede definirse de dos maneras:

1. Manualmente.
2. Calculada como suma de componentes.

El usuario elige el modo.

### Modo manual

- La meta es independiente de la suma de componentes.
- La diferencia entre la meta y los componentes se muestra como presupuesto no asignado o sobreasignación.
- Cambiar componentes no modifica automáticamente la meta.

### Modo calculado

- La meta es la suma de todos los componentes activos con precio definido.
- Los componentes cancelados y los componentes sin precio no cuentan.
- Un cambio confirmado en costos recalcula meta, checkpoint final y proyecciones.

## 6.3 Progreso monetario

El progreso se calcula exclusivamente con dinero.

No existe progreso combinado.

## 6.4 Componentes

Representan partes económicas del objetivo. Existen dos tipos visibles bajo la misma entidad:

### Compra única

Representa un gasto concreto que se realiza una vez.

Ejemplos:

- vuelos;
- rack;
- barra olímpica;
- reserva de hotel.

Estados:

1. Planeado
2. Ahorrando
3. Listo para comprar
4. Comprado
5. Cancelado

Los estados `Ahorrando` y `Listo para comprar` son derivados:

- `Ahorrando`: el componente está activo y aún no existe saldo suficiente para cubrirlo.
- `Listo para comprar`: existe saldo disponible suficiente para cubrir su costo actual.
- `Comprado` y `Cancelado` requieren una acción explícita.

### Presupuesto

Representa una bolsa económica destinada a gastos distribuidos o variables.

Ejemplos:

- comida;
- transporte;
- emergencias;
- souvenirs.

Estados:

1. Planeado
2. En uso
3. Completado
4. Cancelado

Reglas:

- `En uso` se deriva cuando existe al menos un gasto válido.
- `Completado` requiere confirmación explícita o el cierre del objetivo.
- Los gastos pueden superar el presupuesto estimado si existe saldo suficiente y el usuario confirma el impacto.

Un componente puede:

- pertenecer a varios checkpoints;
- no pertenecer a ningún checkpoint intermedio;
- tener precio desconocido;
- no afectar la meta hasta que tenga precio.

El tipo del componente determina cómo se registra su uso y qué estados son válidos.

### Operaciones por tipo

**Compra única**

- admite una única compra final;
- no admite pagos parciales en el MVP;
- la acción principal es “Comprar componente”.

**Presupuesto**

- admite múltiples gastos;
- cada gasto reduce el saldo disponible y aumenta el monto utilizado;
- muestra presupuesto previsto, gastado y restante;
- la acción principal es “Registrar gasto”.

Estas diferencias son una consecuencia del tipo de componente y no constituyen un tercer tipo.

## 6.5 Checkpoints monetarios

Representan montos acumulados que deben alcanzarse para una fecha.

Pueden:

- calcularse por suma de componentes;
- incluir un monto manual adicional;
- existir solo con monto manual;
- incluir componentes compartidos con otros checkpoints.

Todo objetivo monetario tiene exactamente un checkpoint final automático.

- En modo manual, su monto es igual a la meta manual.
- En modo calculado, su monto es igual a la meta calculada.
- Si el objetivo tiene fecha final, el checkpoint final hereda esa fecha.
- Si el objetivo no tiene fecha final, el checkpoint final es abierto y no requiere mes ni año.
- Un checkpoint final abierto proyecta una fecha estimada usando el aporte planificado, pero no puede quedar atrasado por fecha.

## 6.6 Tareas

Las tareas son organizativas.

Pueden vincularse a:

- un checkpoint;
- un componente.

No afectan el progreso monetario.

## 6.7 Eventos

Todo cambio relevante genera un evento.

Categorías:

### Dinero

- aporte;
- retiro;
- transferencia enviada;
- transferencia recibida.

### Compras

- compra;
- anulación;
- devolución.

### Objetivo

- meta modificada;
- fecha modificada;
- checkpoint creado, modificado o archivado;
- componente creado, modificado o cancelado;
- modo de cálculo modificado.

### Organización

- tarea creada;
- tarea completada;
- nota agregada.

Cada evento debe registrar como mínimo:

- identificador;
- usuario propietario;
- tipo y categoría;
- fecha efectiva;
- fecha de creación;
- monto y moneda cuando aplique;
- referencia al objetivo;
- referencia opcional a componente o checkpoint;
- estado activo o anulado;
- revisión anterior cuando haya sido editado.

Los eventos financieros no se eliminan desde el flujo normal: se editan con historial o se anulan.

---

# 7. Reglas del dinero

## 7.1 Métricas

La aplicación distingue:

- **Disponible:** dinero neto que todavía puede utilizarse.
- **Invertido:** dinero neto utilizado correctamente dentro del objetivo.
- **Financiado:** disponible + invertido. Es la cifra que determina el progreso.
- **Aportes históricos:** suma bruta de aportes válidos, sin descontar retiros.
- **Retiros históricos:** suma bruta de retiros válidos.

Las métricas históricas son secundarias. La cabecera principal usa `Disponible`, `Invertido` y `Financiado`.

## 7.2 Progreso después de comprar

Comprar un componente:

- reduce el disponible;
- aumenta lo invertido;
- mantiene el financiado;
- no reduce el progreso financiado.

## 7.3 Compras

Una compra:

1. descuenta saldo disponible;
2. registra dinero invertido;
3. cambia el componente a comprado;
4. crea un evento.

No se permite comprar sin saldo suficiente.

El saldo no puede quedar negativo.

## 7.4 Precio real

Si el precio real es mayor al estimado:

- se permite si existe saldo suficiente;
- se muestra el impacto;
- se recalcula después de confirmar.

Si el precio real es menor:

- la meta disminuye automáticamente cuando el objetivo está en modo calculado por componentes;
- en modo de meta manual, la diferencia queda disponible.

## 7.5 Correcciones

Una compra registrada por error puede anularse.

La anulación:

- restaura el saldo;
- revierte el estado del componente;
- conserva la trazabilidad.

## 7.6 Transferencias

Solo se permiten entre objetivos con la misma moneda.

Una transferencia:

- muestra el efecto en ambos objetivos;
- requiere confirmación;
- genera eventos relacionados.

No se permiten transferencias hacia objetivos archivados.

## 7.7 Retiros

Los retiros reducen el disponible.

El motivo es opcional.

## 7.8 Reservas internas

El dinero no se reserva internamente por componente.

Todo el saldo pertenece al objetivo general.

## 7.9 Fórmulas de integridad monetaria

Para eventos activos:

- Disponible = aportes recibidos + transferencias recibidas + devoluciones − retiros − transferencias enviadas − compras − gastos.
- Invertido = compras + gastos − devoluciones válidas.
- Financiado = Disponible + Invertido.
- Aportes históricos = suma de aportes recibidos, sin restar retiros.

Invariantes:

- Disponible nunca puede ser negativo.
- Invertido nunca puede ser negativo.
- Financiado nunca puede ser negativo.
- Una anulación debe revertir exactamente el efecto del evento original.
- Una transferencia debe confirmarse de forma atómica en origen y destino.

---

# 8. Reglas de checkpoints

## 8.1 Naturaleza

Los checkpoints son acumulativos.

Ejemplo:

- octubre: $1,500;
- febrero: $2,200;
- abril: $3,000.

## 8.2 Orden

Cada checkpoint intermedio posterior debe tener:

- fecha posterior;
- monto igual o mayor.

El checkpoint final abierto, al no tener fecha, siempre se presenta al final del roadmap.

## 8.3 Monto

Puede componerse de:

- suma de componentes;
- monto manual adicional opcional;
- monto totalmente manual.

## 8.4 Estados del checkpoint

Cada checkpoint mantiene lecturas separadas:

1. **Logro histórico**
   - indica si el monto requerido fue alcanzado alguna vez;
   - conserva la fecha en que se alcanzó.

2. **Cobertura actual**
   - indica si hoy sigue existiendo suficiente dinero disponible o invertido en componentes vinculados para cubrir el checkpoint;
   - puede volver a estado no cubierto después de haber sido alcanzado.

3. **Componentes completados**
   - indica si todos los componentes vinculados fueron completados.

Ejemplo:

- Alcanzado el 10 de septiembre.
- Actualmente no cubierto: faltan $1,000.

## 8.5 Progreso y cobertura del checkpoint

Para cada checkpoint:

- **Invertido relacionado:** compras y gastos netos de componentes vinculados.
- **Disponible aplicable:** saldo general disponible, limitado al monto restante del checkpoint.
- **Cobertura actual:** invertido relacionado + disponible aplicable.
- **Porcentaje actual:** cobertura actual / monto vigente, limitado a 100%.

Las compras o gastos de componentes compartidos cuentan para todos los checkpoints relacionados.

Como el dinero no está reservado, el mismo saldo disponible puede demostrar cobertura en checkpoints acumulativos. La interfaz debe aclarar que esto no representa fondos bloqueados.

El logro histórico se registra cuando `Financiado` alcanzó el monto vigente del checkpoint en una fecha determinada.

## 8.6 Cumplimiento

Si se alcanza antes de tiempo:

- se marca como adelantado.

Si vence sin alcanzarse:

- se marca como atrasado.

Si posteriormente cambia la meta:

- se conserva el cumplimiento histórico;
- se muestra la nueva brecha actual.

## 8.7 Cambios

Cambiar fecha, monto o componentes vinculados:

- muestra impacto;
- requiere confirmación;
- recalcula proyecciones;
- registra evento.

Eliminar un checkpoint lo archiva.

## 8.8 Visualización

Cada checkpoint muestra:

- nombre;
- fecha;
- monto requerido;
- monto cubierto;
- porcentaje;
- tranquilidad;
- componentes;
- faltante;
- aporte recomendado.

---

# 9. Proyecciones

## 9.1 Frecuencias

El usuario puede elegir:

- quincenal: dos periodos por mes;
- mensual: un periodo por mes.

Periodos predeterminados:

- primera quincena: días 1 al 15;
- segunda quincena: día 16 al último día del mes;
- mensual: mes calendario completo.

La fecha límite de cada periodo es el último día del periodo. Las proyecciones usan la zona horaria efectiva del usuario.

## 9.2 Recomendaciones separadas

La aplicación muestra por separado:

- aporte requerido para el siguiente checkpoint;
- aporte requerido para completar la meta total.

## 9.3 Aporte mínimo e ideal

- **Mínimo del próximo checkpoint:** faltante del checkpoint dividido entre periodos restantes, redondeado hacia arriba a la precisión monetaria.
- **Mínimo total:** faltante de la meta final dividido entre periodos restantes hasta su fecha.
- **Ideal:** el mayor entre el mínimo del próximo checkpoint y el mínimo total.

Si no existe una fecha límite:

- el usuario debe indicar un aporte planificado para obtener fecha proyectada;
- sin aporte planificado no existe estado de puntualidad ni aporte mínimo, solo progreso.

El MVP no añade un porcentaje arbitrario de colchón. El margen se expresa mediante la diferencia entre fecha proyectada y fecha límite.

## 9.4 Recalculo dinámico

Si el usuario aporta más:

- disminuyen aportes futuros;
- mejora la proyección.

Si aporta menos o deja pasar periodos:

- aumenta el aporte recomendado;
- puede empeorar la tranquilidad.

## 9.5 Objetivos sin fecha

Cualquier objetivo puede no tener fecha final.

En ese caso, la aplicación puede proyectar una fecha estimada según el aporte planificado.

## 9.6 Simulaciones

Las simulaciones no modifican el objetivo hasta confirmación.

Permiten probar:

- mayor o menor aporte;
- cambio de fecha final;
- cambio de checkpoint;
- cambio de meta;
- cambio de costo de componentes.

Muestran impacto en:

- fecha estimada;
- mínimo;
- ideal;
- siguiente checkpoint;
- tranquilidad.

---

# 10. Estado de tranquilidad

La tranquilidad es un estado derivado y determinista.

## 10.1 Prioridad de evaluación

1. Siguiente checkpoint intermedio activo.
2. Checkpoint final.
3. Ritmo planificado en objetivos sin fecha.

## 10.2 Estados

1. **Atrasado**
   - existe un checkpoint vencido y actualmente no cubierto; o
   - la fecha final ya pasó y el objetivo no está financiado.

2. **En riesgo**
   - la fecha proyectada supera la fecha límite; o
   - no quedan periodos suficientes bajo el aporte planificado actual.

3. **Justo**
   - la fecha proyectada llega dentro del último periodo disponible; o
   - el margen es menor o igual a un periodo de ahorro.

4. **En buen camino**
   - la proyección cumple la fecha con más de un periodo de margen.

5. **Adelantado**
   - el checkpoint ya está cubierto antes de su fecha; o
   - la proyección tiene al menos dos periodos completos de margen.

En objetivos abiertos sin fecha:

- `Atrasado` no aplica.
- `En riesgo` solo aplica si el usuario definió un aporte planificado y el ritmo real está por debajo de él.
- Sin aporte planificado, la tranquilidad se muestra como `Sin plan` y no forma parte de los cinco estados de cumplimiento.

## 10.3 Explicabilidad

Todo estado debe incluir:

- causa principal;
- cifra relevante;
- fecha o checkpoint afectado;
- acción sugerida cuando corresponda.

# 11. Siguiente acción recomendada

Cada objetivo debe mostrar una acción concreta.

Orden de prioridad:

1. Resolver un checkpoint atrasado.
2. Aumentar o ajustar el aporte si está en riesgo.
3. Registrar el aporte mínimo del periodo.
4. Comprar o gastar en un componente listo y próximo.
5. Completar configuración pendiente.
6. Confirmar el cierre del objetivo.
7. Mostrar que no requiere acción inmediata.

Ejemplos:

- Aporta $120 esta quincena.
- Ya puedes comprar los vuelos.
- Aumenta $40 por quincena.
- Retrasa el checkpoint un mes.
- Ya alcanzaste el siguiente checkpoint.

---

# 12. Pantallas y experiencia

## 12.1 Dashboard

Debe combinar:

- tarjetas de objetivos;
- tranquilidad;
- siguiente acción;
- progreso;
- próximo checkpoint;
- aporte recomendado;
- resumen global secundario.

La composición visual final se delegará al agente de diseño.

## 12.2 Orden

El usuario puede ordenar por:

- orden manual;
- prioridad;
- urgencia;
- riesgo.

## 12.3 Creación rápida

Campos:

- nombre;
- moneda;
- meta;
- fecha opcional;
- plantilla.

Después se ofrece:

- Terminar configuración.
- Hacerlo después.

## 12.4 Plantillas

Incluidas:

- ahorro simple;
- viaje;
- proyecto por componentes;
- fondo continuo.

Las plantillas:

- sugieren componentes;
- sugieren checkpoints;
- realizan preguntas específicas;
- permiten editar todo.

## 12.5 Detalle del objetivo

Cabecera:

- tranquilidad;
- siguiente acción;
- progreso;
- disponible;
- invertido;
- financiado;
- meta;
- mínimo;
- ideal.

Secciones:

- resumen;
- roadmap;
- componentes;
- tareas;
- historial;
- simulaciones.

## 12.6 Navegación

- escritorio: pestañas o navegación expandida;
- móvil: secciones optimizadas.

## 12.7 Acción principal

Botón global con:

- agregar aporte;
- retiro;
- transferencia;
- compra;
- nota.

“Agregar aporte” aparece primero.

## 12.8 Aporte rápido

Solicita únicamente monto.

La fecha actual se asigna automáticamente.

Puede editarse después.

## 12.9 Historial

Filtros por:

- dinero;
- compras;
- objetivo;
- organización.

## 12.10 Roadmap

- línea temporal en escritorio;
- lista en móvil.

## 12.11 Cierre

Un objetivo pasa a `Completado pendiente de cierre` cuando:

- el checkpoint final está actualmente cubierto; y
- todos los componentes obligatorios están comprados, completados o cancelados.

El usuario también puede solicitar cierre anticipado con justificación.

Al cerrar:

1. se muestra resumen;
2. se resuelve cualquier saldo disponible;
3. el usuario confirma;
4. el objetivo se archiva.

Resumen:

- fecha prevista;
- fecha real;
- tiempo ganado;
- financiado;
- total invertido;
- aportes históricos;
- diferencia frente al presupuesto.

## 12.12 Sobrante

Al cerrar con saldo disponible, el usuario puede:

- transferirlo;
- retirarlo;
- mantenerlo registrado.

## 12.13 Objetivo completado por debajo de la meta

La aplicación:

- sugiere ajustar la meta real;
- conserva la meta original en historial;
- permite cerrar.

## 12.14 Archivados y papelera

- archivados en sección separada;
- eliminados pasan a papelera;
- papelera elimina automáticamente después de 30 días;
- eliminación manual permanente requiere escribir el nombre.

## 12.15 Fondos continuos

Muestran:

- saldo;
- crecimiento por periodo;
- aportes recientes;
- saldo mínimo opcional.

---

# 13. Exportación e importación

## 13.1 Exportación de datos personales

Formatos:

- JSON;
- CSV.

## 13.2 Exportación de plantilla vacía

Cada archivo incluye:

- versión del esquema;
- fecha de exportación;
- idioma de origen.

Incluye:

- tipo;
- componentes;
- checkpoints;
- tareas;
- relaciones;
- configuración reutilizable.

No incluye:

- aportes;
- saldo;
- compras;
- historial financiero;
- notas privadas;
- datos sensibles.

## 13.3 Importación

Flujo:

1. seleccionar archivo;
2. previsualizar;
3. elegir elementos;
4. ajustar moneda, meta y fechas;
5. confirmar;
6. validar compatibilidad del esquema;
7. crear objetivo vacío.

La importación nunca ejecuta movimientos financieros. Los archivos incompatibles deben rechazarse con una explicación clara, sin importar parcialmente datos ambiguos.

## 13.4 Duplicación

El usuario puede duplicar un objetivo propio como estructura vacía.

---

# 14. Offline y sincronización

## 14.1 PWA

La aplicación será una PWA.

## 14.2 Offline

Debe permitir:

- visualizar datos previamente cargados;
- registrar aportes offline;
- sincronizarlos después.

## 14.3 Conflictos

El MVP usa “último cambio confirmado gana” para ediciones no financieras.

Para aportes offline:

- cada operación usa un identificador único e idempotente;
- sincronizar dos veces no puede duplicar el aporte;
- si el objetivo fue archivado o enviado a papelera antes de sincronizar, el aporte queda pendiente de revisión y no se aplica automáticamente.

La interfaz mostrará advertencias cuando una edición pueda sobrescribir información más reciente.

---

# 15. Datos y formato

## 15.1 Moneda

- una moneda por objetivo;
- moneda predeterminada por usuario;
- dos decimales en el MVP;
- la moneda puede cambiarse solo mientras el objetivo no tenga eventos financieros activos;
- después del primer evento financiero, cambiar moneda requiere duplicar o recrear el objetivo.

## 15.2 Fechas

- aportes reales: fechas pasadas o presentes;
- fechas futuras no cuentan como dinero real;
- checkpoints: fecha exacta o mes/año;
- zona horaria efectiva del usuario, detectada inicialmente desde el navegador;
- las fechas efectivas se guardan de forma estable y no cambian retroactivamente si cambia la zona horaria.

## 15.3 Objetivos sin fecha

Permitidos para cualquier tipo.

---

# 16. Accesibilidad e idioma

## 16.1 Accesibilidad

El MVP tendrá accesibilidad básica verificable:

- navegación por teclado;
- etiquetas;
- contraste razonable;
- estados comprensibles;
- controles utilizables en móvil.

## 16.2 Idioma

Idioma inicial: inglés.

La arquitectura debe quedar preparada para traducciones futuras.

---

# 17. Copias de seguridad

La aplicación permitirá:

- descargar una copia completa de los datos del usuario en JSON versionado;
- restaurar esa copia en una cuenta vacía o mediante un flujo de reemplazo explícitamente confirmado.

La restauración debe validar el esquema antes de modificar datos.

La infraestructura self-hosted podrá implementar backups adicionales fuera de la aplicación.

---

# 18. IA BYOK — Feature posterior al MVP

La siguiente gran funcionalidad propuesta será un chat con IA BYOK.

Casos de uso:

- explicar progreso;
- responder preguntas;
- sugerir ajustes;
- ejecutar simulaciones;
- comparar escenarios;
- resumir historial;
- analizar checkpoints.

Queda fuera del MVP.

Requerirá una fase independiente de planificación sobre:

- privacidad;
- permisos;
- claves;
- proveedores;
- herramientas;
- confirmaciones;
- seguridad;
- trazabilidad;
- costos;
- límites.

La IA nunca podrá ejecutar cambios irreversibles sin confirmación explícita.

---

# 19. Diseño visual

Se utilizará Claude Design como agente especializado.

El agente podrá definir:

- jerarquía;
- layout;
- responsive;
- estados vacíos;
- componentes;
- prototipos.

No podrá modificar reglas de negocio sin aprobación.

---

# 20. Criterios de éxito del MVP

El MVP se considera listo cuando:

1. El usuario puede gestionar completamente los casos reales:
   - viaje a Japón;
   - construcción de home gym.
2. Un usuario nuevo puede:
   - registrarse;
   - crear un objetivo;
   - configurarlo;
   - registrar aportes;
   - gestionar checkpoints;
   - registrar compras;
   - entender si va bien;
   - completar y cerrar el objetivo;
   - hacerlo sin ayuda externa.

---

# 21. Decisiones de producto

## P-001

El objetivo es la entidad principal.

## P-002

El progreso monetario depende solo del dinero.

## P-003

Los checkpoints representan el roadmap financiero.

## P-004

La meta puede ser manual o calculada.

## P-005

Las compras conservan el progreso logrado.

## P-006

No se permiten compras sin fondos suficientes.

## P-007

No existen reservas internas por componente.

## P-008

Los cambios importantes requieren confirmación.

## P-009

Los componentes representan gastos futuros.

## P-010

Los componentes de compra única no admiten pagos parciales en el MVP; los componentes de presupuesto admiten múltiples gastos.

## P-011

El historial es una función central.

## P-012

Todo objetivo tiene checkpoint final automático.

## P-013

Los checkpoints separan logro histórico, cobertura actual y componentes completados.

## P-014

La proyección del checkpoint y la total son independientes.

## P-015

Se muestran aportes mínimo e ideal.

## P-016

Las simulaciones no modifican datos sin confirmación.

## P-017

Todo estado de tranquilidad debe explicarse.

## P-018

La siguiente acción recomendada es una métrica principal.

## P-019

La IA BYOK es la siguiente gran feature posterior al MVP.

## P-020

El registro de aportes debe solicitar solo el monto.

## P-021

Los objetivos no monetarios quedan fuera del MVP.

## P-022

Exportar datos y exportar plantillas son funciones diferentes.

## P-023

No existe rol de administrador dentro de la aplicación.

## P-024

El diseño visual se delega a una fase especializada.

## P-025

Los componentes tienen dos tipos: compra única y presupuesto.

**Motivo:** distinguir gastos concretos de bolsas económicas distribuidas sin complicar la interfaz principal.

## P-026

Los checkpoints separan logro histórico y cobertura actual.

**Motivo:** conservar el historial sin comunicar una seguridad falsa cuando el dinero ya fue utilizado en otra parte del objetivo.


## P-027

El progreso usa `Financiado`; los aportes brutos se conservan como `Aportes históricos`.

**Motivo:** evitar que un retiro haga ambiguo cuánto dinero sigue destinado al objetivo frente a cuánto se aportó durante toda su vida.

## P-028

El checkpoint final puede ser fechado o abierto.

**Motivo:** conservar un modelo uniforme para objetivos con y sin fecha límite.

## P-029

Los estados de tranquilidad se calculan mediante reglas deterministas y explicables.

**Motivo:** evitar resultados opacos o dependientes de criterios arbitrarios.

## P-030

Las operaciones financieras offline son idempotentes.

**Motivo:** impedir aportes duplicados durante reintentos de sincronización.

## P-031

La moneda queda bloqueada después del primer evento financiero.

**Motivo:** evitar conversiones implícitas e inconsistencias históricas.

## P-032

La importación, exportación y restauración usan archivos versionados.

**Motivo:** preservar compatibilidad y prevenir cargas parciales ambiguas.

---

# 22. Glosario

**Objetivo:** meta económica personal.

**Meta:** cantidad total necesaria.

**Checkpoint:** monto acumulado requerido para una fecha.

**Componente:** parte económica del objetivo, de tipo compra única o presupuesto.

**Disponible:** dinero no gastado.

**Invertido:** dinero gastado dentro del objetivo.

**Financiado:** disponible + invertido; cifra usada para el progreso.

**Aportes históricos:** suma bruta de aportes válidos, sin descontar retiros.

**Tranquilidad:** evaluación del riesgo de cumplimiento.

**Evento:** registro trazable de un cambio.

**Plantilla vacía:** estructura reutilizable sin datos financieros.

---

# 23. Resultado de auditoría funcional

## 23.1 Estado

La auditoría funcional integral se considera completada.

El modelo es suficientemente consistente para iniciar la fase técnica, sujeto a validación mediante pruebas de casos de uso.

## 23.2 Correcciones aplicadas

- Separación entre `Financiado` y `Aportes históricos`.
- Componentes diferenciados entre compra única y presupuesto.
- Gastos múltiples permitidos solo en componentes de presupuesto.
- Checkpoints con logro histórico, cobertura actual y componentes completados.
- Checkpoint final abierto para objetivos sin fecha.
- Fórmulas de integridad monetaria.
- Estados derivados y explícitos para objetivos y componentes.
- Reglas deterministas de tranquilidad.
- Fórmulas de aporte mínimo e ideal.
- Periodos quincenales definidos.
- Prioridad determinista para la siguiente acción.
- Operaciones offline idempotentes.
- Bloqueo de moneda después de actividad financiera.
- Archivos de importación, plantilla y backup versionados.
- Criterios de cierre y cierre anticipado.
- Confirmación de cambio de zona horaria.

## 23.3 Riesgos aceptados para el MVP

- `Último cambio confirmado gana` para ediciones no financieras.
- Sin reservas internas por componente.
- Sin pagos parciales para compras únicas.
- Solo dos decimales para todas las monedas.
- Registro abierto sin panel administrativo.
- Accesibilidad básica en lugar de cumplimiento formal WCAG AA.
- Solo aportes disponibles offline; otras operaciones requieren conexión.
- No hay asignación automática de dinero entre objetivos.

## 23.4 Casos obligatorios de validación antes del desarrollo

1. Viaje con checkpoints acumulativos, compras únicas y presupuestos variables.
2. Home gym con compras por componentes y cambios de precios.
3. Retiro después de haber alcanzado un checkpoint.
4. Componente compartido entre varios checkpoints.
5. Objetivo sin fecha con aporte planificado.
6. Objetivo sin fecha sin aporte planificado.
7. Compra anulada y devolución real.
8. Gasto de presupuesto superior al estimado.
9. Aporte offline sincronizado más de una vez.
10. Transferencia entre objetivos y reversión por error.
11. Importación de plantilla con esquema compatible e incompatible.
12. Cierre con sobrante.
13. Cierre por debajo de la meta original.
14. Cambio de zona horaria.
15. Papelera y eliminación permanente.

