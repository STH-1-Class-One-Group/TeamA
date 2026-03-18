begin;

update public.map
set
  district = '동구',
  latitude = 36.3278181,
  longitude = 127.4336641,
  summary = '오씨칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  description = '오씨칼국수는 대전역 인근에서 물총조개 칼국수로 자주 언급되는 로컬 맛집으로, 한 끼 코스에 자연스럽게 넣기 좋습니다.',
  vibe_tags = '["로컬맛집","칼국수","대전역"]'::jsonb,
  route_hint = '근처 원도심 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.',
  updated_at = now()
where slug = 'ossi-kalguksu';

update public.map
set
  district = '동구',
  latitude = 36.3326422,
  longitude = 127.4309753,
  summary = '신도칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  description = '신도칼국수는 대전역 인근에서 오래된 전통으로 알려진 로컬 칼국수집으로, 원도심 동선에 잘 어울립니다.',
  vibe_tags = '["로컬맛집","칼국수","원도심"]'::jsonb,
  route_hint = '원도심 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.',
  updated_at = now()
where slug = 'sindo-kalguksu';

update public.map
set
  district = '중구',
  latitude = 36.3223275,
  longitude = 127.4092007,
  summary = '공주칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  description = '공주칼국수는 중구 권역에서 편하게 들르기 좋은 칼국수집으로, 대사동·문창동 동선에 자연스럽게 이어집니다.',
  vibe_tags = '["로컬맛집","칼국수","중구"]'::jsonb,
  route_hint = '근처 문화 스폿이나 카페와 함께 반나절 코스로 묶기 좋습니다.',
  updated_at = now()
where slug = 'gongju-kalguksu';

insert into public.map (
  slug,
  name,
  district,
  category,
  latitude,
  longitude,
  summary,
  description,
  vibe_tags,
  visit_time,
  route_hint,
  stamp_reward,
  hero_label,
  jam_color,
  accent_color,
  is_active
) values (
  'oksu-sutbulgui',
  '옥수숯불구이',
  '서구',
  'restaurant',
  36.3288320,
  127.3747109,
  '옥수숯불구이에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  '옥수숯불구이는 변동 권역에서 숯불구이와 식사 메뉴를 함께 즐기기 좋은 로컬 식당으로, 서구 동선에 넣기 좋습니다.',
  '["로컬맛집","숯불구이","서구"]'::jsonb,
  '40분 - 1시간 20분',
  '갈마·용문 쪽 카페나 산책 코스와 함께 묶기 좋습니다.',
  '로컬 미식 스탬프',
  'Local Grill',
  '#ff8d63',
  '#ffcf69',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  district = excluded.district,
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary = excluded.summary,
  description = excluded.description,
  vibe_tags = excluded.vibe_tags,
  visit_time = excluded.visit_time,
  route_hint = excluded.route_hint,
  stamp_reward = excluded.stamp_reward,
  hero_label = excluded.hero_label,
  jam_color = excluded.jam_color,
  accent_color = excluded.accent_color,
  is_active = excluded.is_active,
  updated_at = now();

commit;
