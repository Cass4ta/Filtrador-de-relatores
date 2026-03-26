# Plataforma de Gestión de Relatores (Versión Demo / Portafolio)

Este proyecto es una plataforma interactiva de gestión diseñada para el control y filtrado de relatores (instructores/capacitadores). Está construida utilizando **Vite, React, Tailwind CSS y Supabase**.

> 💡 **La Visión del Proyecto (Red Social B2B):**
> La idea original y el objetivo principal de este proyecto a largo plazo es crear una especie de **red social o directorio interactivo** enfocado en conectar **Relatores** con **OTECs** (Organismos Técnicos de Capacitación). Busca ser el puente digital que facilite la búsqueda, contratación y gestión del talento en el área de la capacitación.

> ⚠️ **Nota sobre esta Versión Demo:** 
> Esta es una versión de demostración pública adaptada para presentarse como portafolio. Por motivos de seguridad, las modificaciones que realices en el sistema (como agregar, editar o eliminar relatores) se **simulan localmente** en la memoria de tu navegador (`localStorage`). Esto permite ofrecer la experiencia completa e interactiva de uso, sin afectar o alterar los datos persistentes de la base de datos real en la nube.

## Características Principales 🚀
- **CRUD Completo:** Interfaz intuitiva para listar, agregar, eliminar y modificar relatores.
- **Simulación Local Inteligente:** Uso de React State para emular escrituras en la base de datos de manera fluida y protegida.
- **Filtros Avanzados Reactivos:** Búsqueda instantánea por nombre, profesión, ciudad, estatus de aprobación de la OTEC y categorías de conocimiento.
- **Importación masiva (.CSV):** Capacidad de subir archivos de hojas de cálculo para poblar masivamente la base de datos, implementado con parseo avanzado y detección de errores/duplicados.
- **Diseño Glassmorphism y Dark UI:** Creado con Tailwind CSS, garantizando una estética premium y moderna con perfecta legibilidad en cualquier dispositivo.

## Cómo probar esta Demo en local

1. **Clona el repositorio** e instala las dependencias:
   ```bash
   git clone <URL_DE_ESTE_REPOSITORIO>
   cd "Filtrador Relatores demo"
   npm install
   ```

2. **Configura tus variables de entorno:**
   Renombra el archivo `.env.example` a `.env` e inserta la URL y la API Key pública de lectura de tu proyecto de Supabase.

3. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Accede a la aplicación:**
   Abre tu navegador en `http://localhost:5173`. ¡No necesitas iniciar sesión para entrar en esta versión de demostración!

---
*Desarrollado para la industria de la capacitación y como muestra técnica de portafolio.*
