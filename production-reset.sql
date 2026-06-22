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
  auction_opening_date = (timezone('America/Bogota', now()))::date,
  opening_time = '12:00 AM',
  auction_closing_date = (timezone('America/Bogota', now()))::date,
  closing_time = '11:59 PM',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000001';

select
  'Produccion limpia' as estado,
  opening_date as fecha_partido,
  match_time as hora_partido,
  auction_opening_date as fecha_apertura,
  opening_time as hora_apertura,
  auction_closing_date as fecha_cierre,
  closing_time as hora_cierre
from public.matches
where id = '00000000-0000-4000-8000-000000000001';
