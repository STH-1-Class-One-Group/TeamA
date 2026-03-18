function SqlString([string]$value) {
  if ($null -eq $value) { return 'null' }
  return "'" + $value.Replace("'", "''") + "'"
}

function CategoryDefaults([string]$category, [string]$name) {
  switch ($category) {
    'food' {
      return @{
        summary = "${name}에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다."
        description = "${name}은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다."
        tags = '["로컬맛집","한끼","대전"]'
        visit_time = '30분 - 1시간'
        route_hint = '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.'
        stamp_reward = '로컬 미식 스탬프'
        hero_label = 'Local Bite'
        jam_color = '#ff8d63'
        accent_color = '#ffcf69'
      }
    }
    'cafe' {
      return @{
        summary = "${name}에서 디저트와 커피, 사진 포인트를 함께 즐기기 좋습니다."
        description = "${name}은 대전 감성 카페 동선에 잘 어울리는 스폿으로, 맛집 방문 뒤 여유 있게 쉬어가기 좋습니다."
        tags = '["카페","디저트","감성"]'
        visit_time = '40분 - 1시간 30분'
        route_hint = '전시나 공원 코스와 연결하면 사진 남기기 좋은 일정이 됩니다.'
        stamp_reward = '감성 카페 스탬프'
        hero_label = 'Cafe Mood'
        jam_color = '#ff9fd0'
        accent_color = '#91a7ff'
      }
    }
    'night' {
      return @{
        summary = "${name}에서 대전의 야경과 밤 분위기를 가볍게 즐길 수 있습니다."
        description = "${name}은 해 질 무렵부터 분위기가 살아나는 야경 포인트로, 저녁 코스 마무리 장소로 잘 어울립니다."
        tags = '["야경","밤산책","뷰포인트"]'
        visit_time = '30분 - 1시간'
        route_hint = '저녁 식사 후 들르면 대전 야경 코스로 이어가기 좋습니다.'
        stamp_reward = '야경 코스 스탬프'
        hero_label = 'Night Glow'
        jam_color = '#ff5f8f'
        accent_color = '#7e9dff'
      }
    }
    default {
      return @{
        summary = "${name}에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다."
        description = "${name}은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다."
        tags = '["대전명소","산책","전시"]'
        visit_time = '40분 - 1시간 30분'
        route_hint = '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.'
        stamp_reward = '도시 탐험 스탬프'
        hero_label = 'City Pick'
        jam_color = '#8bc8ff'
        accent_color = '#7ce0cf'
      }
    }
  }
}

$places = @(
  @{ slug='seongsimdang-main'; name='성심당 본점'; district='중구'; category='food'; lat='36.3276'; lng='127.4272' },
  @{ slug='seongsimdang-dcc'; name='성심당 DCC점'; district='유성구'; category='food'; lat='36.3749'; lng='127.3878' },
  @{ slug='ossi-kalguksu'; name='오씨칼국수'; district='동구'; category='food'; lat='36.3326'; lng='127.4342' },
  @{ slug='sindo-kalguksu'; name='신도칼국수'; district='동구'; category='food'; lat='36.3320'; lng='127.4348' },
  @{ slug='gongju-kalguksu'; name='공주칼국수'; district='서구'; category='food'; lat='36.3248'; lng='127.3820' },
  @{ slug='smile-kalguksu'; name='스마일칼국수'; district='중구'; category='food'; lat='36.3229'; lng='127.4121' },
  @{ slug='daeseon-kalguksu'; name='대선칼국수'; district='유성구'; category='food'; lat='36.3520'; lng='127.3787' },
  @{ slug='jinrojip'; name='진로집'; district='중구'; category='food'; lat='36.3262'; lng='127.4279' },
  @{ slug='gwangcheon-sikdang'; name='광천식당'; district='중구'; category='food'; lat='36.3288'; lng='127.4235' },
  @{ slug='taepyeong-sogukbap'; name='태평소국밥'; district='중구'; category='food'; lat='36.3318'; lng='127.4158' },
  @{ slug='omunchang-sundaegukbap'; name='오문창순대국밥'; district='대덕구'; category='food'; lat='36.3615'; lng='127.4265' },
  @{ slug='barogeujip'; name='바로그집'; district='중구'; category='food'; lat='36.3267'; lng='127.4258' },
  @{ slug='harehare'; name='하레하레'; district='유성구'; category='cafe'; lat='36.3501'; lng='127.3785' },
  @{ slug='coffee-interview'; name='커피인터뷰 궁동점'; district='유성구'; category='cafe'; lat='36.3625'; lng='127.3443' },
  @{ slug='taehwajang'; name='태화장'; district='동구'; category='food'; lat='36.3298'; lng='127.4393' },
  @{ slug='dodudang'; name='두두당'; district='대덕구'; category='cafe'; lat='36.3645'; lng='127.4318' },
  @{ slug='wonmi-myeonok'; name='원미면옥'; district='동구'; category='food'; lat='36.3234'; lng='127.4468' },
  @{ slug='boksu-bunsik'; name='복수분식'; district='서구'; category='food'; lat='36.3073'; lng='127.3730' },
  @{ slug='kalguksu-makers'; name='칼국수를만드는사람들'; district='유성구'; category='food'; lat='36.3510'; lng='127.3780' },
  @{ slug='yuseong-dakbal'; name='유성닭발'; district='유성구'; category='food'; lat='36.3622'; lng='127.3569' },
  @{ slug='akaba-table'; name='아카바의식탁'; district='서구'; category='food'; lat='36.3068'; lng='127.3404' },
  @{ slug='samchon-jjukkumi'; name='삼촌쭈꾸미'; district='서구'; category='food'; lat='36.3458'; lng='127.3401' },
  @{ slug='maebong-sikdang'; name='매봉식당'; district='대덕구'; category='food'; lat='36.3908'; lng='127.4081' },
  @{ slug='birae-kiki'; name='비래키키'; district='대덕구'; category='cafe'; lat='36.3548'; lng='127.4594' },
  @{ slug='tongil-myeonok'; name='통일면옥'; district='대덕구'; category='food'; lat='36.3649'; lng='127.4268' },
  @{ slug='buchu-haemul-kalguksu'; name='부추해물칼국수'; district='대덕구'; category='food'; lat='36.4321'; lng='127.4280' },
  @{ slug='pungnyeon-samgyetang'; name='풍년삼계탕'; district='동구'; category='food'; lat='36.3452'; lng='127.4530' },
  @{ slug='schnitzel-soje'; name='슈니첼 소제'; district='동구'; category='food'; lat='36.3328'; lng='127.4428' },
  @{ slug='chiangmai-bangkok'; name='치앙마이방콕'; district='동구'; category='food'; lat='36.3332'; lng='127.4432' },
  @{ slug='seongsimdang-cake'; name='성심당 케익부띠끄'; district='중구'; category='cafe'; lat='36.3274'; lng='127.4270' },
  @{ slug='hanbat-arboretum'; name='한밭수목원'; district='서구'; category='landmark'; lat='36.3671'; lng='127.3886' },
  @{ slug='daejeon-museum-of-art'; name='대전시립미술관'; district='서구'; category='landmark'; lat='36.3669'; lng='127.3872' },
  @{ slug='expo-science-park'; name='엑스포과학공원'; district='유성구'; category='landmark'; lat='36.3765'; lng='127.3868' },
  @{ slug='national-science-museum'; name='국립중앙과학관'; district='유성구'; category='landmark'; lat='36.3769'; lng='127.3818' },
  @{ slug='daejeon-arts-center'; name='대전예술의전당'; district='서구'; category='landmark'; lat='36.3662'; lng='127.3865' },
  @{ slug='lee-ungno-museum'; name='이응노미술관'; district='서구'; category='landmark'; lat='36.3685'; lng='127.3844' },
  @{ slug='shinsegye-art-science'; name='대전신세계 Art & Science'; district='유성구'; category='landmark'; lat='36.3750'; lng='127.3813' },
  @{ slug='oworld'; name='오월드'; district='중구'; category='landmark'; lat='36.2885'; lng='127.3965' },
  @{ slug='bomunsan-observatory'; name='보문산전망대'; district='중구'; category='night'; lat='36.2978'; lng='127.4285' },
  @{ slug='sikjangsan-observatory'; name='식장산전망대'; district='동구'; category='night'; lat='36.3168'; lng='127.4978' },
  @{ slug='daedong-sky-park'; name='대동하늘공원'; district='동구'; category='night'; lat='36.3239'; lng='127.4549' },
  @{ slug='yurim-park'; name='유림공원'; district='유성구'; category='landmark'; lat='36.3628'; lng='127.3565' },
  @{ slug='jangtaesan-forest'; name='장태산자연휴양림'; district='서구'; category='landmark'; lat='36.2201'; lng='127.3353' },
  @{ slug='gyejoksan-red-clay'; name='계족산황톳길'; district='대덕구'; category='landmark'; lat='36.3950'; lng='127.4600' },
  @{ slug='ppuri-park'; name='뿌리공원'; district='중구'; category='landmark'; lat='36.2860'; lng='127.3738' },
  @{ slug='uam-historic-park'; name='우암사적공원'; district='동구'; category='landmark'; lat='36.3485'; lng='127.4570' },
  @{ slug='currency-museum'; name='화폐박물관'; district='유성구'; category='landmark'; lat='36.3788'; lng='127.3781' },
  @{ slug='citizens-observatory'; name='대전시민천문대'; district='유성구'; category='night'; lat='36.3771'; lng='127.3897' },
  @{ slug='hanbit-tower'; name='한빛탑'; district='유성구'; category='night'; lat='36.3777'; lng='127.3856' },
  @{ slug='gapcheon-eco-park'; name='갑천생태호수공원'; district='유성구'; category='landmark'; lat='36.3506'; lng='127.3403' }
)

$courses = @(
  @{ slug='course-date'; title='기분 좋은 데이트 코스'; mood='데이트'; duration='3시간'; note='미술관과 디저트, 야경까지 잇는 가벼운 데이트 동선'; color='#ff8ab1'; display_order=1 },
  @{ slug='course-photo'; title='사진 남기기 좋은 하루'; mood='사진'; duration='4시간'; note='수목원과 감성 카페, 엑스포 스폿을 묶은 코스'; color='#8db8ff'; display_order=2 },
  @{ slug='course-healing'; title='천천히 쉬어가는 자연 코스'; mood='힐링'; duration='4시간 30분'; note='숲과 공원 위주로 걷기 좋은 힐링 동선'; color='#7ddccf'; display_order=3 },
  @{ slug='course-night'; title='대전 밤공기 코스'; mood='야경'; duration='3시간 30분'; note='저녁 식사 뒤 전망대와 야경 포인트로 이어지는 코스'; color='#8f97ff'; display_order=4 }
)

$coursePlaces = @(
  @{ course='course-date'; place='daejeon-museum-of-art'; order=1 },
  @{ course='course-date'; place='harehare'; order=2 },
  @{ course='course-date'; place='hanbit-tower'; order=3 },
  @{ course='course-photo'; place='hanbat-arboretum'; order=1 },
  @{ course='course-photo'; place='coffee-interview'; order=2 },
  @{ course='course-photo'; place='expo-science-park'; order=3 },
  @{ course='course-healing'; place='jangtaesan-forest'; order=1 },
  @{ course='course-healing'; place='gapcheon-eco-park'; order=2 },
  @{ course='course-healing'; place='yurim-park'; order=3 },
  @{ course='course-night'; place='ossi-kalguksu'; order=1 },
  @{ course='course-night'; place='daedong-sky-park'; order=2 },
  @{ course='course-night'; place='sikjangsan-observatory'; order=3 }
)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('-- 2026-03-18: seed 50 Daejeon places and curated courses for UI testing')
$lines.Add('begin;')
$lines.Add('')
$lines.Add('with seeded_places (slug, name, district, category, latitude, longitude, summary, description, vibe_tags, visit_time, route_hint, stamp_reward, hero_label, jam_color, accent_color, is_active) as (')
for ($i = 0; $i -lt $places.Count; $i++) {
  $place = $places[$i]
  $defaults = CategoryDefaults $place.category $place.name
  $suffix = if ($i -lt $places.Count - 1) { ',' } else { '' }
  $lines.Add("  (" + (@(
    (SqlString $place.slug),
    (SqlString $place.name),
    (SqlString $place.district),
    (SqlString $place.category),
    $place.lat,
    $place.lng,
    (SqlString $defaults.summary),
    (SqlString $defaults.description),
    ((SqlString $defaults.tags) + '::jsonb'),
    (SqlString $defaults.visit_time),
    (SqlString $defaults.route_hint),
    (SqlString $defaults.stamp_reward),
    (SqlString $defaults.hero_label),
    (SqlString $defaults.jam_color),
    (SqlString $defaults.accent_color),
    'true'
  ) -join ', ') + ")$suffix")
}
$lines.Add(')')
$lines.Add('insert into public.map (slug, name, district, category, latitude, longitude, summary, description, vibe_tags, visit_time, route_hint, stamp_reward, hero_label, jam_color, accent_color, is_active)')
$lines.Add('select slug, name, district, category, latitude, longitude, summary, description, vibe_tags, visit_time, route_hint, stamp_reward, hero_label, jam_color, accent_color, is_active from seeded_places')
$lines.Add('on conflict (slug) do update set')
$lines.Add('  name = excluded.name,')
$lines.Add('  district = excluded.district,')
$lines.Add('  category = excluded.category,')
$lines.Add('  latitude = excluded.latitude,')
$lines.Add('  longitude = excluded.longitude,')
$lines.Add('  summary = excluded.summary,')
$lines.Add('  description = excluded.description,')
$lines.Add('  vibe_tags = excluded.vibe_tags,')
$lines.Add('  visit_time = excluded.visit_time,')
$lines.Add('  route_hint = excluded.route_hint,')
$lines.Add('  stamp_reward = excluded.stamp_reward,')
$lines.Add('  hero_label = excluded.hero_label,')
$lines.Add('  jam_color = excluded.jam_color,')
$lines.Add('  accent_color = excluded.accent_color,')
$lines.Add('  is_active = excluded.is_active,')
$lines.Add('  updated_at = now();')
$lines.Add('')
$lines.Add('with seeded_courses (slug, title, mood, duration, note, color, display_order) as (')
for ($i = 0; $i -lt $courses.Count; $i++) {
  $course = $courses[$i]
  $suffix = if ($i -lt $courses.Count - 1) { ',' } else { '' }
  $lines.Add("  (" + (@(
    (SqlString $course.slug),
    (SqlString $course.title),
    (SqlString $course.mood),
    (SqlString $course.duration),
    (SqlString $course.note),
    (SqlString $course.color),
    $course.display_order
  ) -join ', ') + ")$suffix")
}
$lines.Add(')')
$lines.Add('insert into public.course (slug, title, mood, duration, note, color, display_order)')
$lines.Add('select slug, title, mood, duration, note, color, display_order from seeded_courses')
$lines.Add('on conflict (slug) do update set')
$lines.Add('  title = excluded.title,')
$lines.Add('  mood = excluded.mood,')
$lines.Add('  duration = excluded.duration,')
$lines.Add('  note = excluded.note,')
$lines.Add('  color = excluded.color,')
$lines.Add('  display_order = excluded.display_order;')
$lines.Add('')
$lines.Add("delete from public.course_place where course_id in (select course_id from public.course where slug in ('course-date', 'course-photo', 'course-healing', 'course-night'));")
foreach ($link in $coursePlaces) {
  $lines.Add("insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = '" + $link.course + "'), (select position_id from public.map where slug = '" + $link.place + "'), " + $link.order + ") on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;")
}
$lines.Add('')
$lines.Add('commit;')

Set-Content -Path 'backend/sql/migrations/20260318_seed_daejeon_places_50.sql' -Value $lines -Encoding utf8


