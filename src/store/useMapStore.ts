import { create } from 'zustand';
import { getFestivals, getMapBootstrap } from '../api/client';
import type { ApiStatus, AuthSessionResponse, FestivalItem, Place, StampState } from '../types';

export interface MapBootstrapResult {
  places: Place[];
  festivals: FestivalItem[];
  stampState: StampState;
  hasRealData: boolean;
  auth: AuthSessionResponse;
}

interface MapState {
  bootstrapStatus: ApiStatus;
  bootstrapError: string | null;
  places: Place[];
  festivals: FestivalItem[];
  stampState: StampState;
  hasRealData: boolean;
}

interface MapActions {
  setPlaces: (places: Place[]) => void;
  setFestivals: (festivals: FestivalItem[]) => void;
  setStampState: (state: StampState) => void;
  setHasRealData: (value: boolean) => void;
  setBootstrapStatus: (status: ApiStatus) => void;
  setBootstrapError: (error: string | null) => void;
  loadBootstrap: () => Promise<MapBootstrapResult>;
}

const emptyStampState: StampState = {
  collectedPlaceIds: [],
  logs: [],
  travelSessions: [],
};

export const useMapStore = create<MapState & MapActions>((set) => ({
  bootstrapStatus: 'idle',
  bootstrapError: null,
  places: [],
  festivals: [],
  stampState: emptyStampState,
  hasRealData: true,

  setPlaces: (places) => set({ places }),
  setFestivals: (festivals) => set({ festivals }),
  setStampState: (stampState) => set({ stampState }),
  setHasRealData: (hasRealData) => set({ hasRealData }),
  setBootstrapStatus: (bootstrapStatus) => set({ bootstrapStatus }),
  setBootstrapError: (bootstrapError) => set({ bootstrapError }),

  loadBootstrap: async () => {
    set({ bootstrapStatus: 'loading', bootstrapError: null });
    try {
      const [bootstrap, festivalResult] = await Promise.all([
        getMapBootstrap(),
        getFestivals().catch(() => [] as FestivalItem[]),
      ]);
      set({
        places: bootstrap.places,
        festivals: festivalResult,
        stampState: bootstrap.stamps,
        hasRealData: bootstrap.hasRealData,
        bootstrapStatus: 'ready',
        bootstrapError: null,
      });
      return {
        places: bootstrap.places,
        festivals: festivalResult,
        stampState: bootstrap.stamps,
        hasRealData: bootstrap.hasRealData,
        auth: bootstrap.auth,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청을 처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
      set({ bootstrapError: message, bootstrapStatus: 'error' });
      throw error;
    }
  },
}));
