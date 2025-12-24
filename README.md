# Guía de Implementación – Requisitos del Sistema

Esta aplicación frontend forma parte del sistema **SIMSADI-UV**, cuyo objetivo es proveer una interfaz web para la interoperabilidad de datos de pacientes entre **HAPI FHIR** y **Bahmni/OpenMRS**, utilizando una API intermedia desarrollada en FastAPI.

Para el correcto funcionamiento del frontend es necesario contar con los siguientes componentes instalados y operativos.

---

1. La API mapeadora se puede encontrar en el sigueinte enlace junto con todo lo necesario para su funcionamiento:
https://github.com/eduardoooooo6/mapeo-fhir-bahmniOpenMRS-API?utm_source=chatgpt.com

2. Gestor de paquetes npm

El proyecto utiliza npm como gestor de dependencias.
Todas las dependencias del frontend están definidas en el archivo package.json.

Dependencias principales instaladas automáticamente:

- Next.js
- React y React DOM
- Material UI (MUI)
- Emotion (motor de estilos de MUI)
- Axios (comunicación con la API)
- Day.js (manejo de fechas)
- Formik y Yup (formularios y validaciones)
- Tailwind CSS
- TypeScript
- ESLint

No es necesario instalar estas librerías manualmente.

3. Instalación de dependencias del proyecto

Una vez clonado el repositorio del frontend, ejecutar en la raíz del proyecto:

npm install


Este comando instalará automáticamente todas las dependencias y dependencias de desarrollo definidas en package.json.

4. Arrancar el front Next.js

El framework Next.js se utiliza para el desarrollo del frontend con renderizado moderno y enrutamiento basado en archivos.

Comando de arranque:

npm run dev

Por defecto, la aplicación se ejecuta en:

http://localhost:3000

5. Material UI (MUI)

La interfaz gráfica está construida utilizando Material UI (MUI) versión 7.

Librerías principales utilizadas:

@mui/material

@mui/icons-material

@mui/x-date-pickers

@emotion/react

@emotion/styled

@fontsource/roboto

MUI utiliza Emotion como motor de estilos, el cual ya se encuentra configurado como dependencia del proyecto.

No se requiere configuración adicional para su uso.

6. Tailwind CSS

El proyecto utiliza Tailwind CSS como complemento para estilos utilitarios.

Tailwind se encuentra configurado como dependencia de desarrollo y se integra con PostCSS.

No es necesario realizar una instalación manual adicional.

7. TypeScript

El frontend está desarrollado en TypeScript, lo que permite tipado estático y mayor robustez del código.

Versiones utilizadas:

TypeScript 5.x

Tipos para Node.js, React y Axios

El soporte TypeScript está completamente integrado en Next.js.

**Consideraciones Importantes**

- El frontend requiere que la API de interoperabilidad (FastAPI) esté en ejecución para funcionar correctamente.

- Las URLs de la API deben coincidir con la configuración utilizada en el código (por ejemplo, http://localhost:5000).

- Se recomienda ejecutar el frontend únicamente una vez que los servicios de backend, HAPI FHIR y Bahmni/OpenMRS estén operativos.