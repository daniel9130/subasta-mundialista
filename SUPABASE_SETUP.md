# Configuracion de Supabase

## 1. Crear proyecto

1. Entre a Supabase.
2. Cree un proyecto nuevo.
3. Abra SQL Editor.
4. Ejecute completo:

```text
supabase-schema.sql
```

## 2. Crear credenciales locales

Copie `.env.example` como `.env` y pegue:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Las credenciales estan en Supabase > Project Settings > API.

## 3. Crear administrador

1. En Supabase, vaya a Authentication > Users.
2. Cree el usuario administrador.
3. Copie el User UID.
4. Ejecute en SQL Editor:

```sql
insert into public.app_admins (user_id, email)
values ('PEGUE-AQUI-EL-USER-UID', 'admin@empresa.com')
on conflict (user_id) do update set email = excluded.email;
```

## 4. Verificar desde este proyecto

Desde PowerShell:

```powershell
.\tools\node-v24.17.0-win-x64\node.exe .\scripts\check-supabase.cjs
```

Si todo esta correcto, debe mostrar:

```text
Supabase esta listo para pruebas locales.
```

## 5. Reiniciar app

```powershell
.\run-dev.ps1
```

Luego pruebe:

1. Entrar a Configuracion con el usuario administrador.
2. Abrir la app en dos navegadores.
3. Registrar dos participantes.
4. Pujar desde un navegador.
5. Confirmar que el otro navegador ve la puja.
