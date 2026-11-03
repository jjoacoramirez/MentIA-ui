# MentIA UI

Interfaz del MVP de MentIA, desarrollada con React 19, TypeScript, Vite y Tailwind CSS 4. Consume [MentIA-api](https://github.com/jjoacoramirez/MentIA-api) según su contrato `openapi.yaml`.

## Ejecutar

Node.js 22.12 o superior y MentIA-api corriendo en `http://localhost:8080` (ver su README: `docker compose up -d db` y `./mvnw spring-boot:run`).

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000. En desarrollo, Vite reenvía `/api` a `http://localhost:8080`, así que el navegador ve un solo origen y no hace falta CORS. Para apuntar a otro backend: `MENTIA_API_TARGET=http://otro-host:8080 npm run dev`. Fuera de desarrollo, `VITE_API_URL` define la URL base de la API (por defecto `/api/v1`, mismo origen).

## Recorrido

1. **Crear cuenta**: alias, contraseña y rango etario. El servidor devuelve el código de recuperación, que se muestra una sola vez.
2. **Configurar**: duración de sesión y áreas (las categorías vienen de `/categories`).
3. **Evaluación inicial**: 2 actividades por área, en el mismo nivel para todos. Al cerrarla, el servidor fija el nivel de partida por área. Se puede dejar para más tarde, pero sin ella no se puede entrenar. **Saltearla es solo para admins** (herramienta de debug; el rol viene del login).
4. **Entrenar**: desde Juegos se juega un área sola o una sesión combinada de todas. El servidor arma la sesión según el nivel de cada área, con rotación de ejercicios y variantes. Al cerrarla ajusta el nivel de las áreas jugadas y suma XP.
5. **Resultado, historial, progreso y logros**: todo sale del servidor.
6. **Perfil**: tema, preferencias, evaluación y regenerar el código de recuperación (pide la contraseña actual).

Pausar detiene el tiempo de la actividad (es local; el contrato no tiene pausa de servidor). Abandonar cierra la sesión en el servidor: no suma XP ni cambia el nivel. Si se recarga en medio de una sesión, al volver a entrenar se retoma la misma y se saltean las actividades ya respondidas.

## Actividades

Cada actividad es un componente por `exerciseType` en `src/games/`. Los estímulos se generan en el cliente a partir de `params` (según el nivel), `content` (según la variante) y el `seed` de la sesión, con un generador determinístico: con el mismo seed, los mismos estímulos.

| `exerciseType` | Actividad | Qué se reporta |
| --- | --- | --- |
| `REVERSE_SEQUENCE` | Secuencia inversa | Posiciones correctas / largo |
| `VISUAL_RECOGNITION` | Reconocimiento visual | (aciertos − falsos reconocimientos) / imágenes vistas |
| `SPATIAL_GRID` | Cuadrícula | Casillas correctas / casillas a recordar |
| `ODD_ONE_OUT` | Elemento diferente (5 rondas) | Rondas correctas / 5; tiempo promedio de aciertos |
| `STROOP` | Color y palabra | Estímulos correctos / total; tiempo promedio de aciertos |
| `N_BACK` | N-back | (aciertos + rechazos correctos) / estímulos evaluables |
| `AUDITORY_SEQUENCE` | Secuencia (visual, hasta tener audio) | Posiciones correctas / largo |

Son una primera versión funcional para validar con el equipo (mecánica, tiempos y textos).

## Sesión y datos guardados

El token, el alias y el rol se guardan en `sessionStorage`: sobreviven a una recarga y se borran al cerrar la pestaña o la sesión. No se guardan contraseñas ni códigos de recuperación. Si el servidor responde 401 (token vencido o revocado), se vuelve al ingreso. En `localStorage` solo quedan el tema y la disposición de tarjetas de Inicio.

## Verificaciones

```sh
npm run lint      # tipos
npm test          # recorridos y actividades contra una API simulada (tests/fakeApi.ts)
npm run build
npm run test:e2e  # punta a punta contra MentIA-api real (requiere backend y `npm run dev` levantados)
```

Para `test:e2e`, `VITE_API_URL` tiene que ser absoluta, por ejemplo `VITE_API_URL=http://localhost:3000/api/v1 npm run test:e2e`.

La revisión visual debe contemplar computadora y celular, ambos temas y los principales recorridos de navegación.

Ver [la cobertura del backlog](docs/cobertura-mvp.md).
