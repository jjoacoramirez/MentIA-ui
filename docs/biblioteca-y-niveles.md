# Biblioteca y progresión provisional

La biblioteca está disponible en Juegos. El único ejercicio implementado es Secuencias visuales (Memoria). Atención y Memoria de trabajo muestran mecánicas previstas, sin habilitar sesiones ni asignarles resultados ficticios.

El nivel general por XP no determina la dificultad. Al empezar una sesión se calcula el nivel de Memoria a partir de sus entrenamientos completados. La evaluación inicial usa cuatro objetos y no desbloquea niveles.

- Nivel 1: cuatro símbolos.
- Nivel 2: cinco símbolos.
- Nivel 3: seis símbolos (máximo de esta demo).
- Para avanzar: dos entrenamientos completados consecutivos del nivel actual, de tres intentos y con al menos 80 % de precisión. Con tres intentos, esto requiere tres aciertos.
- Un entrenamiento completado por debajo del umbral reinicia la serie. Abandonar no suma avance ni XP. Repetir sesiones del mismo día cuenta para progresión, pero no agrega días a la racha.
- El nivel se asigna al comenzar y no cambia durante la partida. No hay selector manual ni acceso a dificultades superiores.

Reglas de prueba, pendientes de validar con el equipo. El historial y el progreso de cada alias se guardan localmente en este navegador y se restauran al recargar o volver a ingresar. El backend deberá persistirlos y validar la dificultad permitida; el control del frontend no es una autorización de seguridad.

La racha cuenta días consecutivos con sesiones completadas en el calendario de Argentina. Si todavía no se entrenó hoy, se conserva la racha hasta ayer. “Ritmo estable” era texto fijo y se reemplaza por “Resumen de actividad”, sin apariencia de enlace.

Todos los selectores de formularios, historial y progreso usan el mismo componente con menú propio, temas claro/oscuro, navegación por flechas, Enter/Espacio, Escape, selección por toque y cierre al salir del control.
