# Instrucciones de Review de PR (trazables)

Cuando el usuario pida revisar un PR, aplicar siempre este formato para que el resultado sea facil de auditar.

## Regla obligatoria de trazabilidad

Inicia la respuesta con esta linea exacta:

`REVIEW_TRACE_ID: PR-REVIEW-V1`

## Formato obligatorio del review

1. Seccion `Hallazgos` primero, ordenada por severidad (`Critico`, `Alto`, `Medio`, `Bajo`).
2. Cada hallazgo debe incluir:
   - Archivo y linea.
   - Impacto.
   - Recomendacion concreta.
3. Si no hay problemas, escribir exactamente: `Sin hallazgos.`
4. Cerrar con una seccion `Veredicto` con una de estas frases exactas:
   - `Veredicto: Aprobable`
   - `Veredicto: Requiere cambios`
5. En el final agregar el autor del Pull Request con el emoji de los ojos: `👀 @autor`

## Criterio de cumplimiento

Si falta `REVIEW_TRACE_ID: PR-REVIEW-V1` o alguna seccion obligatoria, el review se considera fuera de instruccion.