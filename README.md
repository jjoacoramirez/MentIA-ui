# MentIA UI

Interfaz del MVP de MentIA, desarrollada con React 19, TypeScript, Vite y Tailwind CSS 4. Backend en [MentIA-api](https://github.com/jjoacoramirez/MentIA-api).

## Ejecutar

Node.js 22.12 o superior.

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000. `npm run build` genera `dist/`; `npm run lint` comprueba tipos y `npm test` ejecuta pruebas del recorrido.

## Probar el recorrido

1. Comenzar → crear cuenta de ejemplo con un alias (3–30 caracteres), contraseña de al menos 10 caracteres y rango etario.
2. Guardar el código de ejemplo y confirmar su lectura.
3. Elegir duración y áreas de entrenamiento.
4. Completar la evaluación inicial o elegir “Saltear por ahora”. La evaluación de demostración contiene tres secuencias, con seis segundos para memorizar y treinta para responder cada una.
5. Revisar resultados, inicio, progreso, historial y logros.
6. Entrenar para repetir una sesión; pausar o abandonar para probar esos estados.
7. Desde Perfil cambiar tema, preferencias y cerrar sesión.

El ingreso y la recuperación son simulados; aceptan entradas válidas para recorrer las pantallas. **No se crean cuentas reales ni se verifican credenciales**. No se guardan contraseñas, códigos ni tokens. El alias, las preferencias, el estado de evaluación y los resultados de cada perfil de demostración se guardan en este navegador (localStorage), junto con el tema y la disposición de tarjetas. Al cerrar sesión se elimina la selección activa; al volver a ingresar con el mismo alias se recupera su progreso. La evaluación se ofrece al registrarse y puede saltearse sin sumar XP ni simular resultados. No usar contraseñas reales.

## Alcance y límites

- Recorridos de registro, ingreso, recuperación con código, configuración, evaluación, entrenamiento, resultados, historial, progreso y logros.
- La sesión visual es **provisional**, no la evaluación definitiva. No estima capacidades ni asigna resultados por categoría.
- La duración elegida se conserva como preferencia, pero la demo siempre tiene tres secuencias.
- XP y niveles de ejemplo se calculan localmente: 10 XP por intento y 10 adicionales por acierto; 200 XP por nivel. Abandonar no concede XP.
- No hay rankings, percentiles, inferencias clínicas ni modelos de IA. La adaptación y rotación definitivas pertenecen al backend.
- La navegación integra el historial del navegador; no hay enlaces profundos. Los resultados de la demo se guardan localmente por alias.
- Se conserva el tema y la personalización del dashboard. El diseño se adapta automáticamente al ancho disponible, con navegación lateral en computadora e inferior en celular.
- Fuentes e iconos de Google y la ilustración remota del inicio requieren conexión; el logo es un SVG local. Los recursos de referencia visual están en `docs/design-reference/`.

## Integración posterior

`src/services/api.ts` prepara el transporte y las operaciones de acceso/perfil según el contrato `openapi.yaml` del backend. No está activado en esta demo. `VITE_API_URL` configura la URL para esa futura integración, pero **no cambia la demo a modo real**.

Ver [la cobertura del backlog y próximos pasos](docs/cobertura-mvp.md).

## Verificaciones

```sh
npm run lint
npm test
npm run build
```

Las pruebas automatizadas usan Vitest y jsdom. La revisión visual debe contemplar computadora y celular, ambos temas y los principales recorridos de navegación.
