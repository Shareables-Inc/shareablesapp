import { create } from "zustand";

interface CameraFocusState {
  cameraFocus: { latitude: number; longitude: number } | null;
  setCameraFocus: (latitude: number, longitude: number) => void;
  clearCameraFocus: () => void;
}

export const useCameraFocusStore = create<CameraFocusState>((set) => ({
  cameraFocus: null,
  setCameraFocus: (latitude, longitude) =>
    set({ cameraFocus: { latitude, longitude } }),
  clearCameraFocus: () => set({ cameraFocus: null }),
}));
