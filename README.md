# Subasta Mundialista

Aplicacion web para una polla futbolistica tipo subasta, conectada a Supabase y lista para publicar en Vercel.

## Funciones

1. Portada con acceso a Subasta y Configuracion.
2. Matriz de resultados de 0 a 6 goles por equipo.
3. Registro de participantes por nombre y celular.
4. Pujas por casilla desde 1000 pesos.
5. Apertura y cierre por fecha y hora Colombia.
6. Supabase para base de datos y tiempo real.
7. Login real de administrador con Supabase Auth.
8. Reportes administrativos, consulta de ganador y exportacion CSV.

## Ejecutar localmente

```bash
npm install
npm run dev
```

La app queda disponible normalmente en:

```text
http://127.0.0.1:5173/
```

## Variables de entorno

Copie `.env.example` como `.env` y agregue:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No suba `.env` a GitHub. Ya esta protegido por `.gitignore`.

## Base de datos Supabase

En el SQL Editor de Supabase ejecute el archivo:

```text
supabase-schema.sql
```

Ese archivo crea las tablas, politicas RLS, tiempo real y la funcion segura `public.place_bid(...)`.

La base de datos valida:

- Que la subasta ya este abierta.
- Que la subasta no este cerrada.
- Que el participante este inscrito en el partido.
- Que el marcador este entre 0 y 6.
- Que la puja sea minimo de 1000.
- Que una nueva puja supere la anterior por al menos 1000.

## Administrador

Cuando Supabase esta configurado, Configuracion usa Supabase Auth.

1. En Supabase, abra Authentication > Users.
2. Cree el usuario administrador.
3. Copie el `User UID`.
4. Ejecute en SQL Editor:

```sql
insert into public.app_admins (user_id, email)
values ('PEGUE-AQUI-EL-USER-UID', 'admin@empresa.com')
on conflict (user_id) do update set email = excluded.email;
```

En modo local sin `.env`, queda disponible la contrasena de prueba:

```text
admin123
```

## Publicar en Vercel

1. Conecte el repositorio de GitHub.
2. Framework: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Agregue estas variables de entorno en Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

6. Publique.

## Limpieza antes de lanzar

Si se hicieron pruebas en Supabase, ejecute en SQL Editor:

```text
production-reset.sql
```

Esto elimina participantes y pujas de prueba del partido principal, corrige la fecha con horario Colombia y deja el partido listo para configurarlo desde el panel administrador.

## Prueba de produccion

1. Abra el link final en dos navegadores o dos celulares.
2. Inscriba dos participantes diferentes.
3. Haga una puja desde un dispositivo.
4. Verifique que el otro vea la puja sin recargar.
5. Entre como administrador y revise reportes.
6. Consulte el marcador ganador y exporte el CSV.
