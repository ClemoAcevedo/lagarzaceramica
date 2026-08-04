# Supabase

La base remota está vinculada al repositorio mediante Supabase CLI. Su estructura
se conserva como migraciones versionadas en `supabase/migrations/`; no se deben
aplicar futuros cambios de esquema copiando SQL manualmente al Dashboard.

## Estado actual

Las migraciones `202608020001` a `202608040006` están registradas como aplicadas
en el proyecto remoto. Para comprobar que ambos historiales coinciden:

```bash
npm run db:status
```

## Conectar otra instalación local

```bash
npm install
npx supabase login
npx supabase link --project-ref pkzlspzntluxocnubwga
```

El login y los datos temporales de la vinculación se guardan fuera del control
de versiones. Nunca se deben incluir access tokens, contraseñas o claves
`secret`/`service_role` en Git ni en variables `VITE_*`.

## Variables de la aplicación

Copia `.env.example` a `.env.local` y completa:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Las mismas variables deben existir en GitHub Actions para el build público.

## Crear una migración

```bash
npx supabase migration new nombre_del_cambio
```

Edita únicamente el nuevo archivo SQL. Antes de aplicarlo, revisa el estado y
haz una simulación:

```bash
npm run db:status
npm run db:push:dry
```

Si la simulación es correcta:

```bash
npm run db:push
npm run db:status
```

`db push` registra automáticamente la versión en
`supabase_migrations.schema_migrations`. El SQL Editor puede utilizarse para
consultas puntuales, pero no como mecanismo de despliegue del esquema.

## Crear una cuenta administradora

1. En Supabase abre **Authentication → Users → Add user**.
2. Crea la cuenta, confirma el correo y copia su UUID.
3. Ejecuta una vez en SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('UUID-DE-LA-CUENTA');
```

Mantén desactivado el registro público. Esta inserción autoriza una cuenta; no
modifica el esquema y por eso no requiere una migración compartida.

## Importación inicial del catálogo

El importador solo se necesita al preparar una base vacía. Sube las fotografías
WebP y crea las piezas como borradores; se detiene si ya existen productos.

```bash
read -s "SUPABASE_SECRET_KEY?Pega la clave secreta y presiona Enter: "
export SUPABASE_SECRET_KEY
npm run migrate:catalog
unset SUPABASE_SECRET_KEY
```

La clave secreta vive únicamente en esa sesión de terminal.

## Recuperar una desincronización

No ejecutes `migration repair` sin comprobar primero la base. Comienza con:

```bash
npm run db:status
npx supabase db pull
```

`migration repair` modifica solamente el historial, no aplica ni revierte SQL;
debe reservarse para cambios que ya existen realmente en la base remota.
