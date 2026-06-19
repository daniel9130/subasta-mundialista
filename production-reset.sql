-- Ejecutar este archivo justo antes de lanzar la app a usuarios reales.
-- Limpia datos de prueba y deja el partido principal listo para configurar.

delete from public.bids
where match_id = '00000000-0000-4000-8000-000000000001';

delete from public.participants
where match_id = '00000000-0000-4000-8000-000000000001';

update public.matches
set
  home_team = 'Colombia',
  home_code = 'COL',
  away_team = 'Corea del Sur',
  away_code = 'KOR',
  opening_date = (timezone('America/Bogota', now()))::date,
  match_time = '4:00 PM',
  opening_time = '12:00 AM',
  closing_time = '11:59 PM',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000001';

select
  'Produccion limpia' as estado,
  opening_date,
  match_time,
  opening_time,
  closing_time
from public.matches
where id = '00000000-0000-4000-8000-000000000001';
