# Análisis de Principios ACID - Sistema de Gestión Universitaria

Este documento explica cómo se aplican los principios ACID en el proceso de matriculación implementado en el `EnrollmentService`.

## 1. Atomicidad (Atomicity)
La atomicidad garantiza que una operación compleja se realice por completo o no se realice en absoluto ("todo o nada").
- **En la matriculación**: El proceso incluye verificar al estudiante, verificar el cupo, crear el registro de matrícula y actualizar el cupo disponible. Todas estas acciones están envueltas en una transacción de Prisma (`this.prisma.$transaction`). Si la actualización del cupo falla (por ejemplo, por un error de conexión), el registro del estudiante matriculado se revierte automáticamente, evitando estados inconsistentes.

## 2. Consistencia (Consistency)
La consistencia asegura que la base de datos pase de un estado válido a otro estado válido, respetando todas las reglas y restricciones.
- **Garantía de datos**: Antes de realizar cualquier cambio, el sistema valida que el estudiante esté `active` y que la asignatura tenga `capacity > 0`. Además, las restricciones de llave foránea y unicidad en la base de datos (como evitar que el mismo estudiante se matricule dos veces en la misma materia) aseguran que los datos finales sean siempre correctos según las reglas del negocio.

## 3. Aislamiento (Isolation)
El aislamiento asegura que las operaciones concurrentes no interfieran entre sí, comportándose como si se ejecutaran de forma secuencial.
- **Concurrencia**: Cuando varios estudiantes intentan matricularse en la misma asignatura al mismo tiempo, el motor de la base de datos gestiona bloqueos (locks) durante la transacción. Si dos transacciones intentan actualizar la misma fila de `SubjectReference` para descontar el cupo, una deberá esperar a que la otra termine o fallará si los datos ya no son válidos (por ejemplo, si el cupo llegó a cero), manteniendo la integridad del contador de capacidad.

## 4. Durabilidad (Durability)
La durabilidad garantiza que, una vez que una transacción ha sido confirmada (committed), los cambios persistirán incluso en caso de un fallo del sistema (como un corte de energía).
- **Importancia**: En un entorno universitario, es crítico que una vez que un estudiante recibe la confirmación de su matrícula, esta información no se pierda. El motor de base de datos PostgreSQL asegura que los cambios se escriban en el almacenamiento persistente (disco) y en los logs de transacciones antes de dar la operación por terminada.
