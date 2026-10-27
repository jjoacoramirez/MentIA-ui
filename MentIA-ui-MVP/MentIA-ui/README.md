# MentIA UI

Prototipo navegable del MVP, basado en el diseño exportado de Google AI Studio. React 19, TypeScript, Vite y Tailwind CSS 4. Backend previsto en [MentIA-api](https://github.com/jjoacoramirez/MentIA-api).

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
4. Completar la evaluación provisional: tres secuencias, seis segundos para memorizar y treinta para responder cada una.
5. Revisar resultados, inicio, progreso, historial y logros.
6. Entrenar para repetir una sesión; pausar o abandonar para probar esos estados.
7. Desde Perfil cambiar tema, preferencias y cerrar sesión.

El ingreso y la recuperación son simulados; aceptan entradas válidas para recorrer las pantallas. **No se crean cuentas reales ni se verifican credenciales**. No se guardan contraseñas, códigos, sesiones ni resultados en almacenamiento persistente. La recarga y el cierre de sesión reinician la demo. Solo tema y disposición de tarjetas se guardan en localStorage. No usar contraseñas reales.

## Alcance y límites

- Recorridos de registro, ingreso, recuperación con código, configuración, evaluación, entrenamiento, resultados, historial, progreso y logros.
- La sesión visual es **provisional**, no la evaluación definitiva. No estima capacidades ni asigna resultados por categoría.
- La duración elegida se conserva como preferencia, pero la demo siempre tiene tres secuencias.
- XP y niveles de ejemplo se calculan localmente: 10 XP por intento y 10 adicionales por acierto; 200 XP por nivel. Abandonar no concede XP.
- No hay rankings, percentiles, inferencias clínicas ni modelos de IA. La adaptación y rotación definitivas pertenecen al backend.
- La navegación actual usa estado React; no hay rutas con enlaces profundos ni persistencia del historial.
- Se conserva el tema y la personalización del dashboard. El marco de teléfono es una vista opcional de presentación, no el modo inicial.
- Fuentes e iconos de Google y la ilustración remota del inicio requieren conexión; el logo es un SVG local. Las imágenes de referencia de AI Studio están en `docs/design-reference/`.

## Integración posterior

`src/services/api.ts` prepara el transporte y las operaciones de acceso/perfil según el contrato `openapi.yaml` del backend. No está activado en esta demo. `VITE_API_URL` configura la URL para esa futura integración, pero **no cambia la demo a modo real**.

Ver [la cobertura del backlog y próximos pasos](docs/cobertura-mvp.md). Backend y contrato no fueron modificados.

## Aplicar al repositorio

Esta entrega no se pudo subir desde la integración de GitHub: la creación de rama devolvió `403 Resource not accessible by integration`. Para aplicarla manualmente, copiar el contenido en un checkout de `MentIA-ui` en una rama nueva, ejecutar las comprobaciones y abrir un PR. No sobrescribir cambios nuevos sin revisar diferencias.

```sh
git switch -c feature/prototipo-recorridos-mvp
npm ci
npm run lint
npm test
npm run build
git add .
git commit -m "feat(ui): incorporar prototipo y recorridos del MVP"
git push -u origin feature/prototipo-recorridos-mvp
```

Las pruebas actuales verifican comportamiento en DOM simulado (jsdom). La revisión visual en navegador móvil/escritorio todavía debe realizarse: el navegador de pruebas no se pudo instalar en el entorno de preparación.
