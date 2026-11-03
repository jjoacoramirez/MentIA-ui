# Cobertura del backlog en el frontend

El frontend consume todos los endpoints de MentIA-api (`openapi.yaml`). No hay datos simulados: la demo local se reemplazó por la integración.

| Backlog | Pantallas | Endpoints |
| --- | --- | --- |
| BACK-01, 03, 03B | Crear cuenta, Ingresar, Recuperar acceso, Perfil (regenerar código) | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/recovery/reset`, `/auth/recovery/regenerate` |
| BACK-02 | Configuración, Perfil | `GET`/`PUT /profile` |
| BACK-04, 05, 06 | Configuración, Áreas de entrenamiento | `/categories`; ejercicios y variantes llegan dentro de cada sesión |
| BACK-07 | Evaluación inicial (saltear solo admin) | `/assessment/start`, `/assessment/skip` |
| BACK-08 | Progreso, Áreas | `/profile/performance` |
| BACK-09, 10, 11 | Preparar entrenamiento, Sesión | `POST /sessions`, `/sessions/{id}`, `/sessions/{id}/start` |
| BACK-12 | Sesión (cada actividad) | `/sessions/{id}/attempts` |
| BACK-13 | Resultado, abandonar | `/sessions/{id}/complete`, `/abandon`, `/result` |
| BACK-14 | Inicio, Historial, Progreso | `GET /sessions`, `/progress/summary`, `/progress/categories` |
| BACK-18 | Inicio, Progreso, Resultado | `/gamification/me` y `gamification` del resultado |
| BACK-19 | Logros, Resultado | `/achievements` y logros desbloqueados del resultado |
| BACK-21 | No aplica | Las métricas se registran del lado del servidor |
| BACK-15, 16, 17, 20 | Fuera del MVP | — |

## Pendiente

1. Validar con el equipo las mecánicas de `src/games/` (tiempos, cantidad de rondas, textos) y agregar audio para `AUDITORY_SEQUENCE`.
2. Rutas reales (deep links) y manejo de expiración del token antes de que venza (hoy se detecta con el 401).
3. CORS en el backend si el front se publica en otro origen (en desarrollo se usa el proxy de Vite).
