import { categoryInfo } from '../../lib/categories';
import type { FestivalItem, Place } from '../../types';

export function placeMarkerContent(place: Place, isActive: boolean) {
  const info = categoryInfo[place.category];
  const ring = isActive ? '#5f4660' : 'rgba(95, 70, 96, 0.18)';
  const scale = isActive ? 'scale(1.08)' : 'scale(1)';
  const shadow = isActive ? '0 14px 28px rgba(255,127,168,0.28)' : '0 10px 22px rgba(255,156,96,0.18)';
  const label = '';

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="position:relative;width:30px;height:30px;">
        <div style="position:absolute;left:50%;top:1px;width:10px;height:10px;border-radius:999px;background:${info.jamColor};transform:translateX(-50%);"></div>
        <div style="position:absolute;left:50%;bottom:1px;width:10px;height:10px;border-radius:999px;background:${info.jamColor};transform:translateX(-50%);"></div>
        <div style="position:absolute;left:1px;top:50%;width:10px;height:10px;border-radius:999px;background:${info.jamColor};transform:translateY(-50%);"></div>
        <div style="position:absolute;right:1px;top:50%;width:10px;height:10px;border-radius:999px;background:${info.jamColor};transform:translateY(-50%);"></div>
        <div style="position:absolute;inset:7px;border-radius:999px;background:${info.color};border:2px solid ${ring};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;color:#5f4660;font-size:10px;font-weight:900;">${info.icon}</div>
      </div>
      ${label}
    </div>
  `;
}

export function festivalMarkerContent(_festival: FestivalItem, isActive: boolean) {
  const ring = isActive ? '#ff4f93' : 'rgba(255, 79, 147, 0.22)';
  const scale = isActive ? 'scale(1.06)' : 'scale(1)';
  const label = '';

  return `
    <div style="transform:${scale};display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="position:relative;width:30px;height:30px;">
        <div style="position:absolute;left:50%;top:1px;width:10px;height:10px;border-radius:999px;background:#ffd4e6;transform:translateX(-50%);"></div>
        <div style="position:absolute;left:50%;bottom:1px;width:10px;height:10px;border-radius:999px;background:#ffd4e6;transform:translateX(-50%);"></div>
        <div style="position:absolute;left:1px;top:50%;width:10px;height:10px;border-radius:999px;background:#ffd4e6;transform:translateY(-50%);"></div>
        <div style="position:absolute;right:1px;top:50%;width:10px;height:10px;border-radius:999px;background:#ffd4e6;transform:translateY(-50%);"></div>
        <div style="position:absolute;inset:8px;border-radius:999px;background:#fff4fa;border:2px solid ${ring};box-shadow:0 10px 24px rgba(255,93,146,0.18);display:flex;align-items:center;justify-content:center;color:#7b1948;font-size:8px;font-weight:900;">축제</div>
      </div>
      ${label}
    </div>
  `;
}

export function hasFestivalCoordinates(festival: FestivalItem) {
  return typeof festival.latitude === 'number'
    && Number.isFinite(festival.latitude)
    && typeof festival.longitude === 'number'
    && Number.isFinite(festival.longitude);
}

export function currentLocationMarkerContent() {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,0.92);box-shadow:0 6px 18px rgba(95,70,96,0.18);border:1px solid rgba(95,70,96,0.12);">
      <div style="width:12px;height:12px;border-radius:999px;background:#4f8cff;box-shadow:0 0 0 6px rgba(79,140,255,0.18);"></div>
    </div>
  `;
}

export function routeStepMarkerContent(step: number) {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:#5f4660;color:#fff;font-size:11px;font-weight:800;box-shadow:0 10px 24px rgba(95,70,96,0.22);border:2px solid rgba(255,255,255,0.9);">${step}</div>
  `;
}
