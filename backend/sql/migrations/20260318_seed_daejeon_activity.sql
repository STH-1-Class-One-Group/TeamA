-- 2026-03-18: seed demo users, stamp logs, feeds, comments, and user routes
begin;

delete from public."user"
where user_id in ('jam-demo-user', 'user-minji', 'user-jiyoon', 'user-seoa', 'user-yujin');

insert into public."user" (user_id, email, nickname, provider, profile_completed_at)
values
  ('jam-demo-user', 'sohee@example.com', '소희', 'demo', now()),
  ('user-minji', 'minji@example.com', '민지', 'demo', now()),
  ('user-jiyoon', 'jiyoon@example.com', '지윤', 'demo', now()),
  ('user-seoa', 'seoa@example.com', '서아', 'demo', now()),
  ('user-yujin', 'yujin@example.com', '유진', 'demo', now())
on conflict (user_id) do update set
  email = excluded.email,
  nickname = excluded.nickname,
  provider = excluded.provider,
  profile_completed_at = excluded.profile_completed_at,
  updated_at = now();

insert into public.travel_session (user_id, started_at, ended_at, last_stamp_at, stamp_count)
values
  ('jam-demo-user', '2026-03-12T10:20:00+09:00', '2026-03-12T15:40:00+09:00', '2026-03-12T15:40:00+09:00', 3),
  ('jam-demo-user', '2026-03-15T19:10:00+09:00', '2026-03-15T21:30:00+09:00', '2026-03-15T21:30:00+09:00', 2),
  ('user-minji', '2026-03-13T11:00:00+09:00', '2026-03-13T16:20:00+09:00', '2026-03-13T16:20:00+09:00', 3),
  ('user-jiyoon', '2026-03-16T18:00:00+09:00', '2026-03-16T21:10:00+09:00', '2026-03-16T21:10:00+09:00', 2)
on conflict do nothing;

insert into public.user_stamp (user_id, position_id, travel_session_id, stamp_date, visit_ordinal, created_at)
values
  ('jam-demo-user', (select position_id from public.map where slug = 'daejeon-museum-of-art'), (select travel_session_id from public.travel_session where user_id = 'jam-demo-user' and started_at = '2026-03-12T10:20:00+09:00'), '2026-03-12', 1, '2026-03-12T10:20:00+09:00'),
  ('jam-demo-user', (select position_id from public.map where slug = 'harehare'), (select travel_session_id from public.travel_session where user_id = 'jam-demo-user' and started_at = '2026-03-12T10:20:00+09:00'), '2026-03-12', 1, '2026-03-12T13:05:00+09:00'),
  ('jam-demo-user', (select position_id from public.map where slug = 'hanbit-tower'), (select travel_session_id from public.travel_session where user_id = 'jam-demo-user' and started_at = '2026-03-12T10:20:00+09:00'), '2026-03-12', 1, '2026-03-12T15:40:00+09:00'),
  ('jam-demo-user', (select position_id from public.map where slug = 'harehare'), (select travel_session_id from public.travel_session where user_id = 'jam-demo-user' and started_at = '2026-03-15T19:10:00+09:00'), '2026-03-15', 2, '2026-03-15T19:10:00+09:00'),
  ('jam-demo-user', (select position_id from public.map where slug = 'expo-science-park'), (select travel_session_id from public.travel_session where user_id = 'jam-demo-user' and started_at = '2026-03-15T19:10:00+09:00'), '2026-03-15', 1, '2026-03-15T21:30:00+09:00'),
  ('user-minji', (select position_id from public.map where slug = 'hanbat-arboretum'), (select travel_session_id from public.travel_session where user_id = 'user-minji' and started_at = '2026-03-13T11:00:00+09:00'), '2026-03-13', 1, '2026-03-13T11:00:00+09:00'),
  ('user-minji', (select position_id from public.map where slug = 'coffee-interview'), (select travel_session_id from public.travel_session where user_id = 'user-minji' and started_at = '2026-03-13T11:00:00+09:00'), '2026-03-13', 1, '2026-03-13T13:40:00+09:00'),
  ('user-minji', (select position_id from public.map where slug = 'expo-science-park'), (select travel_session_id from public.travel_session where user_id = 'user-minji' and started_at = '2026-03-13T11:00:00+09:00'), '2026-03-13', 1, '2026-03-13T16:20:00+09:00'),
  ('user-jiyoon', (select position_id from public.map where slug = 'ossi-kalguksu'), (select travel_session_id from public.travel_session where user_id = 'user-jiyoon' and started_at = '2026-03-16T18:00:00+09:00'), '2026-03-16', 1, '2026-03-16T18:00:00+09:00'),
  ('user-jiyoon', (select position_id from public.map where slug = 'daedong-sky-park'), (select travel_session_id from public.travel_session where user_id = 'user-jiyoon' and started_at = '2026-03-16T18:00:00+09:00'), '2026-03-16', 1, '2026-03-16T21:10:00+09:00'),
  ('user-seoa', (select position_id from public.map where slug = 'sikjangsan-observatory'), null, '2026-03-17', 1, '2026-03-17T20:40:00+09:00'),
  ('user-yujin', (select position_id from public.map where slug = 'seongsimdang-main'), null, '2026-03-14', 1, '2026-03-14T10:30:00+09:00')
on conflict (user_id, position_id, stamp_date) do update set
  travel_session_id = excluded.travel_session_id,
  visit_ordinal = excluded.visit_ordinal,
  created_at = excluded.created_at;

insert into public.feed (position_id, user_id, stamp_id, body, mood, badge, image_url, created_at, updated_at)
values
  ((select position_id from public.map where slug = 'harehare'), 'jam-demo-user', (select stamp_id from public.user_stamp where user_id = 'jam-demo-user' and stamp_date = '2026-03-15' and position_id = (select position_id from public.map where slug = 'harehare')), '두 번째로 가도 여전히 부드럽고, 전시 보고 들르기 좋아요.', '사진', '하레하레 2번째 방문', null, '2026-03-15T19:40:00+09:00', '2026-03-15T19:40:00+09:00'),
  ((select position_id from public.map where slug = 'daejeon-museum-of-art'), 'jam-demo-user', (select stamp_id from public.user_stamp where user_id = 'jam-demo-user' and stamp_date = '2026-03-12' and position_id = (select position_id from public.map where slug = 'daejeon-museum-of-art')), '전시 보고 바로 이동하기 좋은 시작점이에요. 근처 동선 짜기 편합니다.', '데이트', '대전시립미술관 첫 방문', null, '2026-03-12T11:00:00+09:00', '2026-03-12T11:00:00+09:00'),
  ((select position_id from public.map where slug = 'hanbit-tower'), 'jam-demo-user', (select stamp_id from public.user_stamp where user_id = 'jam-demo-user' and stamp_date = '2026-03-12' and position_id = (select position_id from public.map where slug = 'hanbit-tower')), '야간 조명 들어오면 사진이 더 잘 나옵니다. 마무리 코스로 추천해요.', '야경', '한빛탑 첫 방문', null, '2026-03-12T16:00:00+09:00', '2026-03-12T16:00:00+09:00'),
  ((select position_id from public.map where slug = 'hanbat-arboretum'), 'user-minji', (select stamp_id from public.user_stamp where user_id = 'user-minji' and stamp_date = '2026-03-13' and position_id = (select position_id from public.map where slug = 'hanbat-arboretum')), '산책 동선이 넓어서 사진 찍기 좋았고, 바로 카페로 이어가기 편했어요.', '힐링', '한밭수목원 첫 방문', null, '2026-03-13T11:40:00+09:00', '2026-03-13T11:40:00+09:00'),
  ((select position_id from public.map where slug = 'coffee-interview'), 'user-minji', (select stamp_id from public.user_stamp where user_id = 'user-minji' and stamp_date = '2026-03-13' and position_id = (select position_id from public.map where slug = 'coffee-interview')), '커피인터뷰 궁동점은 창가 자리 분위기가 좋아서 사진 남기기 좋았어요.', '사진', '커피인터뷰 첫 방문', null, '2026-03-13T14:10:00+09:00', '2026-03-13T14:10:00+09:00'),
  ((select position_id from public.map where slug = 'ossi-kalguksu'), 'user-jiyoon', (select stamp_id from public.user_stamp where user_id = 'user-jiyoon' and stamp_date = '2026-03-16' and position_id = (select position_id from public.map where slug = 'ossi-kalguksu')), '국물이 깔끔해서 저녁 시작점으로 좋고, 야경 코스로 이어가기 편했어요.', '데이트', '오씨칼국수 첫 방문', null, '2026-03-16T18:30:00+09:00', '2026-03-16T18:30:00+09:00')
on conflict do nothing;

insert into public.feed_like (feed_id, user_id)
values
  ((select feed_id from public.feed where user_id = 'jam-demo-user' and position_id = (select position_id from public.map where slug = 'harehare')), 'user-minji'),
  ((select feed_id from public.feed where user_id = 'jam-demo-user' and position_id = (select position_id from public.map where slug = 'harehare')), 'user-jiyoon'),
  ((select feed_id from public.feed where user_id = 'jam-demo-user' and position_id = (select position_id from public.map where slug = 'hanbit-tower')), 'user-seoa'),
  ((select feed_id from public.feed where user_id = 'user-minji' and position_id = (select position_id from public.map where slug = 'hanbat-arboretum')), 'jam-demo-user'),
  ((select feed_id from public.feed where user_id = 'user-minji' and position_id = (select position_id from public.map where slug = 'coffee-interview')), 'user-yujin'),
  ((select feed_id from public.feed where user_id = 'user-jiyoon' and position_id = (select position_id from public.map where slug = 'ossi-kalguksu')), 'jam-demo-user')
on conflict (feed_id, user_id) do nothing;

with seeded_comments(feed_slug, user_id, body, created_at) as (
  values
    ('harehare', 'user-seoa', '두 번째 방문 기록까지 보이니까 실제 후기 느낌이 더 좋아요.', '2026-03-15T20:10:00+09:00'::timestamptz),
    ('hanbat-arboretum', 'user-yujin', '수목원 보고 커피인터뷰로 넘어가는 코스가 진짜 괜찮아 보여요.', '2026-03-13T12:10:00+09:00'::timestamptz),
    ('ossi-kalguksu', 'user-minji', '저녁 시작점으로 딱이네요. 다음에 그대로 따라가 볼래요.', '2026-03-16T19:00:00+09:00'::timestamptz)
)
insert into public.user_comment (feed_id, user_id, body, created_at, updated_at)
select f.feed_id, c.user_id, c.body, c.created_at, c.created_at
from seeded_comments c
join public.map m on m.slug = c.feed_slug
join public.feed f on f.position_id = m.position_id
where not exists (
  select 1 from public.user_comment uc where uc.feed_id = f.feed_id and uc.user_id = c.user_id and uc.body = c.body
);

insert into public.user_route (user_id, travel_session_id, title, description, mood, is_public, is_user_generated, like_count, created_at, updated_at)
values
  ('jam-demo-user', (select travel_session_id from public.travel_session where user_id = 'jam-demo-user' and started_at = '2026-03-12T10:20:00+09:00'), '전시 보고 한빛탑까지', '대전시립미술관에서 시작해 하레하레를 거쳐 한빛탑으로 마무리하는 데이트 코스', '데이트', true, true, 2, '2026-03-15T22:00:00+09:00', '2026-03-15T22:00:00+09:00'),
  ('user-minji', (select travel_session_id from public.travel_session where user_id = 'user-minji' and started_at = '2026-03-13T11:00:00+09:00'), '사진 남기기 좋은 궁동-엑스포', '한밭수목원, 커피인터뷰 궁동점, 엑스포과학공원 순으로 이어지는 사진 코스', '사진', true, true, 1, '2026-03-14T09:00:00+09:00', '2026-03-14T09:00:00+09:00')
on conflict do nothing;

delete from public.user_route_place
where route_id in (
  select route_id from public.user_route where title in ('전시 보고 한빛탑까지', '사진 남기기 좋은 궁동-엑스포')
);

insert into public.user_route_place (route_id, position_id, stop_order)
values
  ((select route_id from public.user_route where title = '전시 보고 한빛탑까지'), (select position_id from public.map where slug = 'daejeon-museum-of-art'), 1),
  ((select route_id from public.user_route where title = '전시 보고 한빛탑까지'), (select position_id from public.map where slug = 'harehare'), 2),
  ((select route_id from public.user_route where title = '전시 보고 한빛탑까지'), (select position_id from public.map where slug = 'hanbit-tower'), 3),
  ((select route_id from public.user_route where title = '사진 남기기 좋은 궁동-엑스포'), (select position_id from public.map where slug = 'hanbat-arboretum'), 1),
  ((select route_id from public.user_route where title = '사진 남기기 좋은 궁동-엑스포'), (select position_id from public.map where slug = 'coffee-interview'), 2),
  ((select route_id from public.user_route where title = '사진 남기기 좋은 궁동-엑스포'), (select position_id from public.map where slug = 'expo-science-park'), 3)
on conflict (route_id, position_id) do update set stop_order = excluded.stop_order;

insert into public.user_route_like (route_id, user_id)
values
  ((select route_id from public.user_route where title = '전시 보고 한빛탑까지'), 'user-minji'),
  ((select route_id from public.user_route where title = '전시 보고 한빛탑까지'), 'user-jiyoon'),
  ((select route_id from public.user_route where title = '사진 남기기 좋은 궁동-엑스포'), 'jam-demo-user')
on conflict (route_id, user_id) do nothing;

update public.user_route ur
set like_count = likes.cnt,
    updated_at = now()
from (
  select route_id, count(*)::int as cnt
  from public.user_route_like
  group by route_id
) likes
where ur.route_id = likes.route_id;

commit;
