# Adaptación a computadora y celular

El diseño se adapta con CSS al ancho disponible, sin detectar el sistema operativo ni requerir un selector de dispositivo.

- Menos de 768 px: ocupa toda la pantalla; contenido en una columna; navegación inferior y controles táctiles. El selector de vista previa se oculta.
- Desde 768 px: mayor espacio interior, biblioteca e historial en dos columnas. La vista previa de 390 px sigue disponible para demostraciones desde computadora.
- Desde 1100 px: navegación lateral, dashboard en columnas y perfil distribuido. La vista previa conserva su presentación de celular aunque la ventana sea ancha.

El contenido usa un área de desplazamiento independiente entre encabezado y navegación, con altura dinámica `100dvh`, para adaptarse a las barras del navegador móvil. Cambiar de pantalla reinicia el desplazamiento de su contenido. Los ejercicios limitan su ancho para mantener legibles los símbolos. La navegación inferior respeta el área segura del dispositivo.

La implementación se basa en main (9f5ca8d). En el momento de prepararla solo se veía esa rama en MentIA-ui; no se encontró la rama ni el botón para omitir la evaluación inicial. No se cambió ese recorrido ni se simuló una evaluación aprobada.

Validación realizada: TypeScript, compilación y 12 pruebas del recorrido. Pendiente: comprobar el diseño en un navegador real a 320, 390, 768, 1024 y 1440 px, en ambos temas y con el teclado móvil abierto. La descarga de Chromium falló en el entorno de preparación.
