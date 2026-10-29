# Cobertura inicial del frontend

Referencias: backlog técnico de Drive (`MentIA_Funcionalidades_Backend_Backlog`), `MentIA-api/CLAUDE.md` y `MentIA-api/openapi.yaml`. El backlog de septiembre es preliminar: la API acepta sesiones de 5 a 30 minutos frente a la hipótesis original de 5 a 15. La interfaz permite el rango del contrato. Los códigos de categoría de la demo son provisionales; se deberán obtener de `/categories` al integrar.

| Backlog | Recorrido actual | Integración posterior |
| --- | --- | --- |
| BACK-01, 03, 03B | Formularios de alias, contraseña, rango etario y recuperación. Código mostrado una vez en la simulación. | Registro, JWT, logout, rotación de recuperación y validación del servidor. |
| BACK-02 | Duración y categorías guardadas localmente por alias; edición desde Perfil. | GET/PUT `/profile`, categorías reales. |
| BACK-04, 05, 06 | Un ejercicio provisional de secuencias visuales. | Catálogo, variantes, tipos y modalidades definitivos. |
| BACK-07, 08 | Evaluación de ejemplo antes de entrenar; resultados propios de la demo. | Nivel inicial y perfil de desempeño del servidor. |
| BACK-09, 10, 11 | Preparación de entrenamiento y tres secuencias locales. | Generación, adaptación determinística y rotación del backend. |
| BACK-12, 13 | Aciertos/errores, tiempo activo, pausa, abandono y resultado de sesión. | Registro idempotente de intentos y consolidación por categoría. |
| BACK-14 | Historial con filtros, detalle y gráfico de precisión diaria (7/30 días). | Historial paginado y series temporales de la API. |
| BACK-18, 19 | XP, niveles y tres logros con reglas explícitas de ejemplo. | Recompensas y logros calculados por el servidor. |
| BACK-21 | No implementado. | Eventos mínimos del MVP; no necesita un panel nuevo. |
| BACK-15,16,17,20 | Fuera de esta entrega. | Post-MVP y administración de contenido según alcance. |

## Siguiente etapa

1. Integrar autenticación y perfil cuando existan endpoints ejecutables; no usar la demo como fallback ante errores de autenticación.
2. Sustituir `JourneyContext` por servicios de sesiones, intentos, resultados, progreso y logros usando el contrato de API.
3. Acordar mecánicas, instrucciones, parámetros, modalidades y variantes con el equipo; incorporar componentes por `exerciseType`.
4. Reemplazar las reglas locales de XP y todas las estimaciones por las respuestas del servidor.
5. Definir persistencia de preferencias del dashboard y comportamiento de pausa/reanudación: el contrato actual no expone una pausa de servidor.
6. Añadir rutas reales, errores de red/expiración, estados de carga y pruebas de integración contra el backend.

El cliente HTTP propaga `ProblemDetail.code`, acepta el token por argumento y maneja respuestas 204. No persiste tokens. No incorpora claves de Gemini ni servicios externos de IA.

## Revisión visual

Se mantiene la paleta, tipografía, bienvenida, inicio personalizable y selector de temas. El perfil elimina el percentil y las afirmaciones de seguridad no demostradas. Progreso usa los datos de las sesiones de ejemplo en lugar de valores fijos.
