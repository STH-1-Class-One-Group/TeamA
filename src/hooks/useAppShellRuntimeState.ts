import { useAppShellRuntimeStore } from '../store/app-shell-runtime-store';

export function useAppShellRuntimeState() {
  const notice = useAppShellRuntimeStore((state) => state.notice);
  const setNotice = useAppShellRuntimeStore((state) => state.setNotice);
  const currentPosition = useAppShellRuntimeStore((state) => state.currentPosition);
  const setCurrentPosition = useAppShellRuntimeStore((state) => state.setCurrentPosition);
  const mapLocationStatus = useAppShellRuntimeStore((state) => state.mapLocationStatus);
  const setMapLocationStatus = useAppShellRuntimeStore((state) => state.setMapLocationStatus);
  const mapLocationMessage = useAppShellRuntimeStore((state) => state.mapLocationMessage);
  const setMapLocationMessage = useAppShellRuntimeStore((state) => state.setMapLocationMessage);
  const mapLocationFocusKey = useAppShellRuntimeStore((state) => state.mapLocationFocusKey);
  const setMapLocationFocusKey = useAppShellRuntimeStore((state) => state.setMapLocationFocusKey);
  const stampActionStatus = useAppShellRuntimeStore((state) => state.stampActionStatus);
  const setStampActionStatus = useAppShellRuntimeStore((state) => state.setStampActionStatus);
  const stampActionMessage = useAppShellRuntimeStore((state) => state.stampActionMessage);
  const setStampActionMessage = useAppShellRuntimeStore((state) => state.setStampActionMessage);
  const bootstrapStatus = useAppShellRuntimeStore((state) => state.bootstrapStatus);
  const bootstrapError = useAppShellRuntimeStore((state) => state.bootstrapError);

  return {
    notice,
    setNotice,
    currentPosition,
    setCurrentPosition,
    mapLocationStatus,
    setMapLocationStatus,
    mapLocationMessage,
    setMapLocationMessage,
    mapLocationFocusKey,
    setMapLocationFocusKey,
    stampActionStatus,
    setStampActionStatus,
    stampActionMessage,
    setStampActionMessage,
    bootstrapStatus,
    bootstrapError,
  };
}
