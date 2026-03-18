-- 2026-03-18: seed 50 Daejeon places and curated courses for UI testing
begin;

with seeded_places (slug, name, district, category, latitude, longitude, summary, description, vibe_tags, visit_time, route_hint, stamp_reward, hero_label, jam_color, accent_color, is_active) as (
  values
  ('seongsimdang-main', '성심당 본점', '중구', 'restaurant', 36.3276, 127.4272, '성심당 본점에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '성심당 본점은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('seongsimdang-dcc', '성심당 DCC점', '유성구', 'restaurant', 36.3749, 127.3878, '성심당 DCC점에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '성심당 DCC점은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('ossi-kalguksu', '오씨칼국수', '동구', 'restaurant', 36.3278181, 127.4336641, '오씨칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '오씨칼국수는 대전역 인근에서 물총조개 칼국수로 자주 언급되는 로컬 맛집으로, 한 끼 코스에 자연스럽게 넣기 좋습니다.', '["로컬맛집","칼국수","대전역"]'::jsonb, '30분 - 1시간', '근처 원도심 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('sindo-kalguksu', '신도칼국수', '동구', 'restaurant', 36.3326422, 127.4309753, '신도칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '신도칼국수는 대전역 인근에서 오래된 전통으로 알려진 로컬 칼국수집으로, 원도심 동선에 잘 어울립니다.', '["로컬맛집","칼국수","원도심"]'::jsonb, '30분 - 1시간', '원도심 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('gongju-kalguksu', '공주칼국수', '중구', 'restaurant', 36.3223275, 127.4092007, '공주칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '공주칼국수는 중구 권역에서 편하게 들르기 좋은 칼국수집으로, 대사동·문창동 동선에 자연스럽게 이어집니다.', '["로컬맛집","칼국수","중구"]'::jsonb, '30분 - 1시간', '근처 문화 스폿이나 카페와 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('oksu-sutbulgui', '옥수숯불구이', '서구', 'restaurant', 36.3288320, 127.3747109, '옥수숯불구이에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '옥수숯불구이는 변동 권역에서 숯불구이와 식사 메뉴를 함께 즐기기 좋은 로컬 식당으로, 서구 동선에 넣기 좋습니다.', '["로컬맛집","숯불구이","서구"]'::jsonb, '40분 - 1시간 20분', '갈마·용문 쪽 카페나 산책 코스와 함께 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Grill', '#ff8d63', '#ffcf69', true),
  ('smile-kalguksu', '스마일칼국수', '중구', 'restaurant', 36.3229, 127.4121, '스마일칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '스마일칼국수은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('daeseon-kalguksu', '대선칼국수', '유성구', 'restaurant', 36.3520, 127.3787, '대선칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '대선칼국수은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('jinrojip', '진로집', '중구', 'restaurant', 36.3262, 127.4279, '진로집에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '진로집은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('gwangcheon-sikdang', '광천식당', '중구', 'restaurant', 36.3288, 127.4235, '광천식당에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '광천식당은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('taepyeong-sogukbap', '태평소국밥', '중구', 'restaurant', 36.3318, 127.4158, '태평소국밥에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '태평소국밥은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('omunchang-sundaegukbap', '오문창순대국밥', '대덕구', 'restaurant', 36.3615, 127.4265, '오문창순대국밥에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '오문창순대국밥은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('barogeujip', '바로그집', '중구', 'restaurant', 36.3267, 127.4258, '바로그집에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '바로그집은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('harehare', '하레하레', '유성구', 'cafe', 36.3501, 127.3785, '하레하레에서 디저트와 커피, 사진 포인트를 함께 즐기기 좋습니다.', '하레하레은 대전 감성 카페 동선에 잘 어울리는 스폿으로, 맛집 방문 뒤 여유 있게 쉬어가기 좋습니다.', '["카페","디저트","감성"]'::jsonb, '40분 - 1시간 30분', '전시나 공원 코스와 연결하면 사진 남기기 좋은 일정이 됩니다.', '감성 카페 스탬프', 'Cafe Mood', '#ff9fd0', '#91a7ff', true),
  ('coffee-interview', '커피인터뷰 궁동점', '유성구', 'cafe', 36.3625, 127.3443, '커피인터뷰 궁동점에서 디저트와 커피, 사진 포인트를 함께 즐기기 좋습니다.', '커피인터뷰 궁동점은 대전 감성 카페 동선에 잘 어울리는 스폿으로, 맛집 방문 뒤 여유 있게 쉬어가기 좋습니다.', '["카페","디저트","감성"]'::jsonb, '40분 - 1시간 30분', '전시나 공원 코스와 연결하면 사진 남기기 좋은 일정이 됩니다.', '감성 카페 스탬프', 'Cafe Mood', '#ff9fd0', '#91a7ff', true),
  ('taehwajang', '태화장', '동구', 'restaurant', 36.3298, 127.4393, '태화장에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '태화장은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('dodudang', '두두당', '대덕구', 'cafe', 36.3645, 127.4318, '두두당에서 디저트와 커피, 사진 포인트를 함께 즐기기 좋습니다.', '두두당은 대전 감성 카페 동선에 잘 어울리는 스폿으로, 맛집 방문 뒤 여유 있게 쉬어가기 좋습니다.', '["카페","디저트","감성"]'::jsonb, '40분 - 1시간 30분', '전시나 공원 코스와 연결하면 사진 남기기 좋은 일정이 됩니다.', '감성 카페 스탬프', 'Cafe Mood', '#ff9fd0', '#91a7ff', true),
  ('wonmi-myeonok', '원미면옥', '동구', 'restaurant', 36.3234, 127.4468, '원미면옥에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '원미면옥은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('boksu-bunsik', '복수분식', '서구', 'restaurant', 36.3073, 127.3730, '복수분식에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '복수분식은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('kalguksu-makers', '칼국수를만드는사람들', '유성구', 'restaurant', 36.3510, 127.3780, '칼국수를만드는사람들에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '칼국수를만드는사람들은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('yuseong-dakbal', '유성닭발', '유성구', 'restaurant', 36.3622, 127.3569, '유성닭발에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '유성닭발은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('akaba-table', '아카바의식탁', '서구', 'restaurant', 36.3068, 127.3404, '아카바의식탁에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '아카바의식탁은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('samchon-jjukkumi', '삼촌쭈꾸미', '서구', 'restaurant', 36.3458, 127.3401, '삼촌쭈꾸미에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '삼촌쭈꾸미은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('maebong-sikdang', '매봉식당', '대덕구', 'restaurant', 36.3908, 127.4081, '매봉식당에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '매봉식당은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('birae-kiki', '비래키키', '대덕구', 'cafe', 36.3548, 127.4594, '비래키키에서 디저트와 커피, 사진 포인트를 함께 즐기기 좋습니다.', '비래키키은 대전 감성 카페 동선에 잘 어울리는 스폿으로, 맛집 방문 뒤 여유 있게 쉬어가기 좋습니다.', '["카페","디저트","감성"]'::jsonb, '40분 - 1시간 30분', '전시나 공원 코스와 연결하면 사진 남기기 좋은 일정이 됩니다.', '감성 카페 스탬프', 'Cafe Mood', '#ff9fd0', '#91a7ff', true),
  ('tongil-myeonok', '통일면옥', '대덕구', 'restaurant', 36.3649, 127.4268, '통일면옥에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '통일면옥은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('buchu-haemul-kalguksu', '부추해물칼국수', '대덕구', 'restaurant', 36.4321, 127.4280, '부추해물칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '부추해물칼국수은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('pungnyeon-samgyetang', '풍년삼계탕', '동구', 'restaurant', 36.3452, 127.4530, '풍년삼계탕에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '풍년삼계탕은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('schnitzel-soje', '슈니첼 소제', '동구', 'restaurant', 36.3328, 127.4428, '슈니첼 소제에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '슈니첼 소제은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('chiangmai-bangkok', '치앙마이방콕', '동구', 'restaurant', 36.3332, 127.4432, '치앙마이방콕에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.', '치앙마이방콕은 대전에서 꾸준히 언급되는 로컬 맛집으로, 여행 동선에 한 끼를 자연스럽게 넣기 좋습니다.', '["로컬맛집","한끼","대전"]'::jsonb, '30분 - 1시간', '근처 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.', '로컬 미식 스탬프', 'Local Bite', '#ff8d63', '#ffcf69', true),
  ('seongsimdang-cake', '성심당 케익부띠끄', '중구', 'cafe', 36.3274, 127.4270, '성심당 케익부띠끄에서 디저트와 커피, 사진 포인트를 함께 즐기기 좋습니다.', '성심당 케익부띠끄은 대전 감성 카페 동선에 잘 어울리는 스폿으로, 맛집 방문 뒤 여유 있게 쉬어가기 좋습니다.', '["카페","디저트","감성"]'::jsonb, '40분 - 1시간 30분', '전시나 공원 코스와 연결하면 사진 남기기 좋은 일정이 됩니다.', '감성 카페 스탬프', 'Cafe Mood', '#ff9fd0', '#91a7ff', true),
  ('hanbat-arboretum', '한밭수목원', '서구', 'attraction', 36.3671, 127.3886, '한밭수목원에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '한밭수목원은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('daejeon-museum-of-art', '대전시립미술관', '서구', 'culture', 36.3669, 127.3872, '대전시립미술관에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '대전시립미술관은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('expo-science-park', '엑스포과학공원', '유성구', 'culture', 36.3765, 127.3868, '엑스포과학공원에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '엑스포과학공원은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('national-science-museum', '국립중앙과학관', '유성구', 'culture', 36.3769, 127.3818, '국립중앙과학관에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '국립중앙과학관은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('daejeon-arts-center', '대전예술의전당', '서구', 'culture', 36.3662, 127.3865, '대전예술의전당에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '대전예술의전당은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('lee-ungno-museum', '이응노미술관', '서구', 'culture', 36.3685, 127.3844, '이응노미술관에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '이응노미술관은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('shinsegye-art-science', '대전신세계 Art & Science', '유성구', 'culture', 36.3750, 127.3813, '대전신세계 Art & Science에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '대전신세계 Art & Science은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('oworld', '오월드', '중구', 'attraction', 36.2885, 127.3965, '오월드에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '오월드은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('bomunsan-observatory', '보문산전망대', '중구', 'attraction', 36.2978, 127.4285, '보문산전망대에서 대전의 야경과 밤 분위기를 가볍게 즐길 수 있습니다.', '보문산전망대은 해 질 무렵부터 분위기가 살아나는 야경 포인트로, 저녁 코스 마무리 장소로 잘 어울립니다.', '["야경","밤산책","뷰포인트"]'::jsonb, '30분 - 1시간', '저녁 식사 후 들르면 대전 야경 코스로 이어가기 좋습니다.', '야경 코스 스탬프', 'Night Glow', '#ff5f8f', '#7e9dff', true),
  ('sikjangsan-observatory', '식장산전망대', '동구', 'attraction', 36.3168, 127.4978, '식장산전망대에서 대전의 야경과 밤 분위기를 가볍게 즐길 수 있습니다.', '식장산전망대은 해 질 무렵부터 분위기가 살아나는 야경 포인트로, 저녁 코스 마무리 장소로 잘 어울립니다.', '["야경","밤산책","뷰포인트"]'::jsonb, '30분 - 1시간', '저녁 식사 후 들르면 대전 야경 코스로 이어가기 좋습니다.', '야경 코스 스탬프', 'Night Glow', '#ff5f8f', '#7e9dff', true),
  ('daedong-sky-park', '대동하늘공원', '동구', 'attraction', 36.3239, 127.4549, '대동하늘공원에서 대전의 야경과 밤 분위기를 가볍게 즐길 수 있습니다.', '대동하늘공원은 해 질 무렵부터 분위기가 살아나는 야경 포인트로, 저녁 코스 마무리 장소로 잘 어울립니다.', '["야경","밤산책","뷰포인트"]'::jsonb, '30분 - 1시간', '저녁 식사 후 들르면 대전 야경 코스로 이어가기 좋습니다.', '야경 코스 스탬프', 'Night Glow', '#ff5f8f', '#7e9dff', true),
  ('yurim-park', '유림공원', '유성구', 'attraction', 36.3628, 127.3565, '유림공원에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '유림공원은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('jangtaesan-forest', '장태산자연휴양림', '서구', 'attraction', 36.2201, 127.3353, '장태산자연휴양림에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '장태산자연휴양림은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('gyejoksan-red-clay', '계족산황톳길', '대덕구', 'attraction', 36.3950, 127.4600, '계족산황톳길에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '계족산황톳길은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('ppuri-park', '뿌리공원', '중구', 'attraction', 36.2860, 127.3738, '뿌리공원에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '뿌리공원은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('uam-historic-park', '우암사적공원', '동구', 'attraction', 36.3485, 127.4570, '우암사적공원에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '우암사적공원은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('currency-museum', '화폐박물관', '유성구', 'culture', 36.3788, 127.3781, '화폐박물관에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '화폐박물관은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true),
  ('citizens-observatory', '대전시민천문대', '유성구', 'attraction', 36.3771, 127.3897, '대전시민천문대에서 대전의 야경과 밤 분위기를 가볍게 즐길 수 있습니다.', '대전시민천문대은 해 질 무렵부터 분위기가 살아나는 야경 포인트로, 저녁 코스 마무리 장소로 잘 어울립니다.', '["야경","밤산책","뷰포인트"]'::jsonb, '30분 - 1시간', '저녁 식사 후 들르면 대전 야경 코스로 이어가기 좋습니다.', '야경 코스 스탬프', 'Night Glow', '#ff5f8f', '#7e9dff', true),
  ('hanbit-tower', '한빛탑', '유성구', 'attraction', 36.3777, 127.3856, '한빛탑에서 대전의 야경과 밤 분위기를 가볍게 즐길 수 있습니다.', '한빛탑은 해 질 무렵부터 분위기가 살아나는 야경 포인트로, 저녁 코스 마무리 장소로 잘 어울립니다.', '["야경","밤산책","뷰포인트"]'::jsonb, '30분 - 1시간', '저녁 식사 후 들르면 대전 야경 코스로 이어가기 좋습니다.', '야경 코스 스탬프', 'Night Glow', '#ff5f8f', '#7e9dff', true),
  ('gapcheon-eco-park', '갑천생태호수공원', '유성구', 'attraction', 36.3506, 127.3403, '갑천생태호수공원에서 대전을 대표하는 문화·여행 포인트를 가볍게 즐길 수 있습니다.', '갑천생태호수공원은 대전 여행 동선에서 자주 언급되는 대표 명소로, 인근 맛집이나 카페와 함께 묶기 좋은 장소입니다.', '["대전명소","산책","전시"]'::jsonb, '40분 - 1시간 30분', '인근 맛집이나 카페와 연결하면 반나절 코스로 이동하기 좋습니다.', '도시 탐험 스탬프', 'City Pick', '#8bc8ff', '#7ce0cf', true)
)
insert into public.map (slug, name, district, category, latitude, longitude, summary, description, vibe_tags, visit_time, route_hint, stamp_reward, hero_label, jam_color, accent_color, is_active)
select slug, name, district, category, latitude, longitude, summary, description, vibe_tags, visit_time, route_hint, stamp_reward, hero_label, jam_color, accent_color, is_active from seeded_places
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

with seeded_courses (slug, title, mood, duration, note, color, display_order) as (
  values
  ('course-date', '기분 좋은 데이트 코스', '데이트', '3시간', '미술관과 디저트, 야경까지 잇는 가벼운 데이트 동선', '#ff8ab1', 1),
  ('course-photo', '사진 남기기 좋은 하루', '사진', '4시간', '수목원과 감성 카페, 엑스포 스폿을 묶은 코스', '#8db8ff', 2),
  ('course-healing', '천천히 쉬어가는 자연 코스', '힐링', '4시간 30분', '숲과 공원 위주로 걷기 좋은 힐링 동선', '#7ddccf', 3),
  ('course-night', '대전 밤공기 코스', '야경', '3시간 30분', '저녁 식사 뒤 전망대와 야경 포인트로 이어지는 코스', '#8f97ff', 4)
)
insert into public.course (slug, title, mood, duration, note, color, display_order)
select slug, title, mood, duration, note, color, display_order from seeded_courses
on conflict (slug) do update set
  title = excluded.title,
  mood = excluded.mood,
  duration = excluded.duration,
  note = excluded.note,
  color = excluded.color,
  display_order = excluded.display_order;

delete from public.course_place where course_id in (select course_id from public.course where slug in ('course-date', 'course-photo', 'course-healing', 'course-night'));
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-date'), (select position_id from public.map where slug = 'daejeon-museum-of-art'), 1) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-date'), (select position_id from public.map where slug = 'harehare'), 2) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-date'), (select position_id from public.map where slug = 'hanbit-tower'), 3) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-photo'), (select position_id from public.map where slug = 'hanbat-arboretum'), 1) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-photo'), (select position_id from public.map where slug = 'coffee-interview'), 2) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-photo'), (select position_id from public.map where slug = 'expo-science-park'), 3) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-healing'), (select position_id from public.map where slug = 'jangtaesan-forest'), 1) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-healing'), (select position_id from public.map where slug = 'gapcheon-eco-park'), 2) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-healing'), (select position_id from public.map where slug = 'yurim-park'), 3) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-night'), (select position_id from public.map where slug = 'ossi-kalguksu'), 1) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-night'), (select position_id from public.map where slug = 'daedong-sky-park'), 2) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;
insert into public.course_place (course_id, position_id, stop_order) values ((select course_id from public.course where slug = 'course-night'), (select position_id from public.map where slug = 'sikjangsan-observatory'), 3) on conflict (course_id, position_id) do update set stop_order = excluded.stop_order;

commit;




