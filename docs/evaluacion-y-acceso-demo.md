# Evaluación inicial y acceso de demostración

Registro nuevo: alias → código de ejemplo → preferencias → evaluación inicial. La evaluación ofrece “Saltear por ahora”, que lleva a Inicio sin registrar intentos, completar la evaluación ni sumar XP. El estado queda como skipped y la dificultad arranca en nivel 1. Puede hacerse después desde Perfil.

Ingreso: se abre Inicio directamente. Se restaura el perfil del alias si existe en este navegador. Los alias que todavía no se probaron localmente también pueden usarse en el acceso simulado, con preferencias predeterminadas; eso no representa una cuenta real ni una autenticación válida. Cambiar preferencias no vuelve a pedir la evaluación.

Al recargar se recuperan la selección activa de la demo, preferencias, resultados y estado de evaluación. Si se cerró sesión, el próximo ingreso con el mismo alias restaura sus datos. Cada alias mantiene su historial separado. Las contraseñas, códigos de recuperación y tokens no se guardan. Si no se puede escribir en localStorage se muestra un aviso y puede continuarse con datos temporales.

La persistencia se limita a este navegador y puede eliminarse borrando sus datos. No reemplaza autenticación, sesión ni persistencia del backend. Cuando exista la API, el servidor debe ser la fuente de verdad del perfil y de la evaluación.

Una evaluación completada no se vuelve a solicitar al entrar. Un registro recién creado que recarga antes de terminar el recorrido lo retoma; puede saltear la evaluación. Los juegos no se reanudan automáticamente al recargar.
