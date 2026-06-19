# Publicacion de la app

## Antes de publicar

1. En Supabase, ejecutar:

```text
production-reset.sql
```

2. Entrar a la app local como administrador.
3. Configurar partido, fecha, hora de partido, apertura y cierre.
4. Probar dos usuarios en dos navegadores.
5. Confirmar reportes y exportacion CSV.

## Subir a GitHub

Subir estos archivos y carpetas:

```text
src/
scripts/
index.html
package.json
package-lock.json
vercel.json
.nvmrc
.env.example
.gitignore
README.md
SUPABASE_SETUP.md
DEPLOYMENT.md
supabase-schema.sql
production-reset.sql
run-dev.ps1
```

No subir:

```text
.env
node_modules/
dist/
tools/
preview-*.png
*.log
```

## Variables en Vercel

En Vercel, agregar:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Use los mismos valores del archivo `.env`, pero no suba `.env` a GitHub.

## Configuracion Vercel

Vercel debe detectar Vite automaticamente. Si pide configuracion manual:

```text
Framework: Vite
Build command: npm run build
Output directory: dist
Install command: npm install
```

## Prueba despues de publicar

1. Abrir el link final en dos dispositivos.
2. Registrar dos participantes.
3. Hacer una puja.
4. Confirmar que el otro dispositivo ve la puja sin recargar.
5. Entrar como administrador.
6. Revisar Reportes.
7. Exportar CSV.
