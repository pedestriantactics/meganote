export interface Frame {
  id: number;
  text: string;
  fontSize: number;
  letterSpacing: number;
}

export interface SignboardSettings {
  frameDelay: number;
}

export interface SignboardState {
  isEditing: boolean;
  isPlaying: boolean;
  currentFrameIndex: number;
  frames: Frame[];
  settings: SignboardSettings;
}
