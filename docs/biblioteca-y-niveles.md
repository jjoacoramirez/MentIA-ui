# Áreas y niveles

La pantalla "Juegos" muestra las áreas activas (`/categories`) con el nivel actual del usuario en cada una (`/profile/performance`). No hay un selector manual de ejercicio ni de dificultad: el servidor arma cada sesión.

- **Punto de partida**: lo fija la evaluación inicial (nivel 1 a 5 por área según la precisión). Un admin puede saltearla (nivel 1 en todas las áreas).
- **Ajuste**: al cerrar cada sesión de entrenamiento, el servidor sube, mantiene o baja el nivel de cada área según la precisión y el tiempo de respuesta (reglas en `MentIA-api/docs/plan-backend.md`, sección 7).
- **Variedad**: el servidor rota ejercicios y variantes según las últimas sesiones.
- El nivel se asigna al generar la sesión y no cambia durante la partida.
- El nivel general (XP) es independiente del nivel de cada área: premia el uso y la constancia.
