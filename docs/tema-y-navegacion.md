# Tema y navegación

Los componentes comparten los tokens `brand`, `brand-ink`, `accent`, `canvas` e `ink`. El celeste principal es #22d3ee en ambos temas. En el modo claro, los textos de acento usan #0e7490 para conservar contraste sobre blanco. Las transparencias se reservan para fondos y estados; los botones principales usan el mismo celeste y texto oscuro.

Inicio y bienvenida usan el fondo y texto del tema; la imagen decorativa y la sesión rápida también tienen variantes claras. En una instalación sin preferencia guardada, MentIA sigue el tema del sistema. Una selección anterior se conserva. El botón de cambio de tema alterna según el tema efectivo, incluso al usar Sistema.

El encabezado común no contiene botón Volver. Cada cambio de pantalla genera una entrada en el historial del navegador, por lo que el botón Atrás o el gesto del celular vuelve entre pantallas. Durante un ejercicio, Atrás solicita la confirmación de salida y detiene el cronómetro. Volver a una entrada de un juego ya cerrado abre la preparación en vez de reiniciar esa partida. El botón de cierre del ejercicio permanece disponible.

Esta navegación corresponde a la app web. Un contenedor nativo futuro deberá delegar su acción Atrás al historial de la WebView.
