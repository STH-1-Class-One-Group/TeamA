import { create } from 'zustand';
import type { ApiStatus } from '../types';
import { resolveValue, type SetterValue } from './store-utils';

type Position = { latitude: number; longitude: number } | null;

type AppShellRuntimeState = {
  bootstrapStatus: ApiStatus;
  bootstrapError: string | null;
  notice: string | null;
  currentPosition: Position;
  mapLocationStatus: ApiStatus;
  mapLocationMessage: string | null;
  mapLocationFocusKey: number;
  stampActionStatus: ApiStatus;
  stampActionMessage: string;
  setBootstrapStatus: (value: SetterValue<ApiStatus>) => void;
  setBootstrapError: (value: SetterValue<string | null>) => void;
  setNotice: (value: SetterValue<string | null>) => void;
  setCurrentPosition: (value: SetterValue<Position>) => void;
  setMapLocationStatus: (value: SetterValue<ApiStatus>) => void;
  setMapLocationMessage: (value: SetterValue<string | null>) => void;
  setMapLocationFocusKey: (value: SetterValue<number>) => void;
  setStampActionStatus: (value: SetterValue<ApiStatus>) => void;
  setStampActionMessage: (value: SetterValue<string>) => void;
};

export const useAppShellRuntimeStore = create<AppShellRuntimeState>((set) => ({
  bootstrapStatus: 'idle',
  bootstrapError: null,
  notice: null,
  currentPosition: null,
  mapLocationStatus: 'idle',
  mapLocationMessage: null,
  mapLocationFocusKey: 0,
  stampActionStatus: 'idle',
  stampActionMessage: '장소를 선택하면 오늘 스탬프 가능 여부를 바로 확인할 수 있어요.',
  setBootstrapStatus: (value) => set((state) => ({ bootstrapStatus: resolveValue(value, state.bootstrapStatus) })),
  setBootstrapError: (value) => set((state) => ({ bootstrapError: resolveValue(value, state.bootstrapError) })),
  setNotice: (value) => set((state) => ({ notice: resolveValue(value, state.notice) })),
  setCurrentPosition: (value) => set((state) => ({ currentPosition: resolveValue(value, state.currentPosition) })),
  setMapLocationStatus: (value) => set((state) => ({ mapLocationStatus: resolveValue(value, state.mapLocationStatus) })),
  setMapLocationMessage: (value) => set((state) => ({ mapLocationMessage: resolveValue(value, state.mapLocationMessage) })),
  setMapLocationFocusKey: (value) => set((state) => ({ mapLocationFocusKey: resolveValue(value, state.mapLocationFocusKey) })),
  setStampActionStatus: (value) => set((state) => ({ stampActionStatus: resolveValue(value, state.stampActionStatus) })),
  setStampActionMessage: (value) => set((state) => ({ stampActionMessage: resolveValue(value, state.stampActionMessage) })),
}));
