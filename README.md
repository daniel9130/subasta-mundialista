# Subasta Mundialista

Aplicacion web para una polla futbolistica tipo subasta.

## Estado actual

La app incluye:

1. Portada con acceso a Subasta y Configuracion.
2. Matriz de resultados de 0 a 6 goles por equipo.
3. Registro de participantes por nombre y celular.
4. Pujas por casilla desde 1000 pesos.
5. Apertura/cierre por fecha y hora.
6. Supabase para base de datos y tiempo real.
7. Login real de administrador con Supabase Auth.
8. Reportes administrativos y exportacion CSV.

## Herramientas instaladas

Se instalo Node.js de forma portatil dentro del proyecto:

```text
tools/node-v24.17.0-win-x64
```

No requiere instalacion global de Node.js en Windows.

## Como ejecutar

Desde PowerShell, en esta carpeta:

```powershell
.\run-dev.ps1
```

La app queda disponible en:

```text
http://127.0.0.1:5173/
```

## Verificacion

La app fue compilada correctamente y se genero una captura en:

```text
preview-subasta.png
```

Antes de publicar, valide:

```powershell
.\tools\node-v24.17.0-win-x64\npm.cmd run build
```

## Base de datos y tiempo real Supabase

La app ya esta preparada para guardar datos en Supabase y escuchar cambios en tiempo real.

Guia detallada:

```text
SUPABASE_SETUP.md
```

1. Crear un proyecto en Supabase.
2. Abrir el editor SQL de Supabase.
3. Ejecutar el archivo:

```text
supabase-schema.sql
```

4. Crear un archivo `.env` copiando `.env.example`.
5. Pegar las credenciales del proyecto:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

6. Reiniciar el servidor:

```powershell
.\run-dev.ps1
```

Si no existe `.env`, la app sigue funcionando en modo local de prueba.

Para validar la conexion despues de crear `.env`:

```powershell
.\tools\node-v24.17.0-win-x64\node.exe .\scripts\check-supabase.cjs
```

Cuando Supabase este configurado, la app sincroniza:

- Configuracion del partido.
- Participantes inscritos.
- Pujas por casilla.

Para probar varios usuarios al tiempo, abra la misma URL en dos navegadores o dos dispositivos conectados a la app publicada.

## Seguridad de pujas

El archivo `supabase-schema.sql` incluye la funcion segura:

```text
public.place_bid(...)
```

La app usa esta funcion para guardar pujas en Supabase. La base de datos valida:

- Que la subasta ya este abierta.
- Que la subasta no este cerrada.
- Que el participante este inscrito en el partido.
- Que el marcador este entre 0 y 6.
- Que la puja sea minimo de 1000.
- Que una nueva puja supere la anterior por al menos 1000.

Si ya habia ejecutado el SQL antes, vuelva a ejecutar `supabase-schema.sql` completo en Supabase para aplicar estas reglas.

## Administrador real

Cuando Supabase esta configurado, el boton Configuracion ya no usa la contrasena local. Usa Supabase Auth.

Para crear el administrador:

1. En Supabase, abra Authentication > Users.
2. Cree un usuario con correo y contrasena.
3. Copie el `User UID` del usuario creado.
4. En el SQL editor de Supabase, ejecute:

```sql
insert into public.app_admins (user_id, email)
values ('PEGUE-AQUI-EL-USER-UID', 'admin@empresa.com')
on conflict (user_id) do update set email = excluded.email;
```

5. Entre a la app, pulse Configuracion e inicie sesion con ese correo y contrasena.

En modo local, sin `.env`, la app mantiene la contrasena de prueba:

```text
admin123
```

## Publicacion en GitHub y Vercel

Antes de subir el proyecto, revise que exista `.gitignore`. Este archivo evita subir:

- `.env` y credenciales.
- `node_modules`.
- `dist`.
- `tools`.
- capturas y logs locales.

Archivos importantes para publicar:

```text
package.json
package-lock.json
index.html
src/
supabase-schema.sql
vercel.json
.env.example
```

En Vercel:

1. Conecte el repositorio de GitHub.
2. Framework: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Agregue las variables de entorno:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

6. Publique.

## Prueba de produccion

Despues de publicar:

1. Abra el link final en dos navegadores o dos celulares.
2. Inscriba dos participantes diferentes.
3. Haga una puja desde un dispositivo.
4. Verifique que el otro vea la puja sin recargar.
5. Entre como administrador y revise reportes.
6. Exporte el CSV.

## Limpieza antes de lanzar

Si se hicieron pruebas en Supabase, ejecute este archivo en SQL Editor antes de compartir el link final:

```text
production-reset.sql
```

Esto elimina participantes y pujas de prueba del partido principal, corrige la fecha con horario Colombia y deja el partido listo para configurarlo desde el panel administrador.
