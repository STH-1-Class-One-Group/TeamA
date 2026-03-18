update public.map
set category = case
  when category = 'food' then 'restaurant'
  when category = 'night' then 'attraction'
  when category = 'landmark' and slug in (
    'daejeon-museum-of-art',
    'expo-science-park',
    'national-science-museum',
    'daejeon-arts-center',
    'lee-ungno-museum',
    'shinsegye-art-science',
    'currency-museum'
  ) then 'culture'
  when category = 'landmark' then 'attraction'
  else category
end
where category in ('food', 'night', 'landmark');
