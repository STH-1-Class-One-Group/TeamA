# Refactor Regression Checklist

Date baseline: 2026-03-28

## Smoke

- Open map tab and select a place.
- Confirm the place bottom sheet opens, closes, expands, and collapses normally.
- Confirm the bottom sheet still shows header, badges, stamp card, route hint, composer, and preview feed.

## Place Flow

- Logged-out state: `로그인하고 시작` button opens login flow.
- Logged-in state, no stamp yet: `오늘 스탬프 찍기` triggers claim flow.
- Logged-in state, today stamp complete: `오늘 스탬프 완료` is visible and disabled.
- `피드에서 보기` still opens the feed tab view for the selected place.

## Feed Flow

- Public feed: like button, comment button, and `이 장소 보기` still work.
- Public feed: highlighted review still scrolls into view.
- My page feed tab: `수정`, `수정 저장`, `취소`, `삭제`, `내 피드 보기` all still work.
- Image-attached review still renders through the shared image frame component.

## My Page Tabs

- `스탬프` tab shows stamp cards and route-publish prompt when publishable sessions exist.
- `피드` tab renders feed cards and edit flow.
- `댓글` tab renders comment cards and deep-link button.
- `코스` tab renders draft route publish cards and published route cards.

## Regression Focus

- No tab content disappears when switching tabs repeatedly.
- No header, badge, or proof CTA disappears from the place sheet.
- No comment/like/place CTA disappears from the feed card after refactor.
