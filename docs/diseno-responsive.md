# Diseño adaptable

La interfaz se adapta automáticamente al ancho disponible; no tiene selector de formato ni marco de teléfono simulado.

- Celular: una columna, navegación inferior y controles táctiles.
- Tablet y ventanas medianas: navegación inferior; biblioteca e historial pueden distribuirse en dos columnas.
- Computadora desde 1100 px: navegación lateral y mayor espacio interior.
- Inicio muestra dos columnas solo cuando su área de contenido alcanza 960 px. El ancho se mide después de descontar la navegación lateral, para evitar tarjetas estrechas. En ventanas menores utiliza una columna.

Las tarjetas conservan su altura natural. Si el contenido supera la altura de la ventana, se desplaza dentro del área central sin comprimirse. Los ejercicios mantienen un ancho limitado para facilitar la lectura de los símbolos.

La altura dinámica `100dvh` y el área segura inferior permiten adaptar la vista al navegador del celular. Los temas claro y oscuro comparten las mismas reglas de distribución.
