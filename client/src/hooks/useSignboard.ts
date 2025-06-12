import { useState, useEffect, useCallback, useRef } from 'react';
import { Frame, SignboardState, SignboardSettings } from '@/types/signboard';

const STORAGE_KEY = 'signboardState';
const MAX_FRAMES = 5;

export function useSignboard() {
  const [state, setState] = useState<SignboardState>({
    isEditing: false,
    isPlaying: false,
    currentFrameIndex: 0,
    frames: [
      {
        id: 0,
        text: 'edit me',
        fontSize: 48,
        letterSpacing: 0
      }
    ],
    settings: {
      frameDelay: 1
    }
  });

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        setState(prevState => ({
          ...prevState,
          ...parsedState,
          isEditing: false,
          isPlaying: false
        }));
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: SignboardState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, []);

  // Get current frame
  const getCurrentFrame = useCallback((): Frame => {
    return state.frames[state.currentFrameIndex] || state.frames[0];
  }, [state.frames, state.currentFrameIndex]);

  // Update current frame
  const updateCurrentFrame = useCallback((updates: Partial<Frame>) => {
    setState(prevState => {
      const newFrames = [...prevState.frames];
      const currentFrame = newFrames[prevState.currentFrameIndex];
      if (currentFrame) {
        Object.assign(currentFrame, updates);
      }
      const newState = { ...prevState, frames: newFrames };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setState(prevState => {
      const newState = { ...prevState, isEditing: !prevState.isEditing };
      if (newState.isEditing && newState.isPlaying) {
        // Stop playback when entering edit mode
        newState.isPlaying = false;
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      }
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Add new frame
  const addFrame = useCallback(() => {
    if (state.frames.length >= MAX_FRAMES) return;

    setState(prevState => {
      const currentFrame = prevState.frames[prevState.currentFrameIndex];
      const newFrame: Frame = {
        id: Date.now(),
        text: currentFrame.text,
        fontSize: currentFrame.fontSize,
        letterSpacing: currentFrame.letterSpacing
      };

      const newFrames = [...prevState.frames, newFrame];
      const newState = {
        ...prevState,
        frames: newFrames,
        currentFrameIndex: newFrames.length - 1
      };
      saveState(newState);
      return newState;
    });
  }, [state.frames.length, state.currentFrameIndex, saveState]);

  // Delete frame
  const deleteFrame = useCallback((frameId: number) => {
    if (state.frames.length <= 1) return;

    setState(prevState => {
      const frameIndex = prevState.frames.findIndex(f => f.id === frameId);
      if (frameIndex === -1) return prevState;

      const newFrames = prevState.frames.filter(f => f.id !== frameId);
      let newCurrentIndex = prevState.currentFrameIndex;
      
      if (newCurrentIndex >= newFrames.length) {
        newCurrentIndex = newFrames.length - 1;
      }

      const newState = {
        ...prevState,
        frames: newFrames,
        currentFrameIndex: newCurrentIndex
      };
      saveState(newState);
      return newState;
    });
  }, [state.frames.length, saveState]);

  // Select frame
  const selectFrame = useCallback((frameId: number) => {
    setState(prevState => {
      const frameIndex = prevState.frames.findIndex(f => f.id === frameId);
      if (frameIndex === -1) return prevState;

      const newState = { ...prevState, currentFrameIndex: frameIndex };
      return newState;
    });
  }, []);

  // Update frame delay
  const updateFrameDelay = useCallback((delay: number) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        settings: { ...prevState.settings, frameDelay: delay }
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Start playback
  const startPlayback = useCallback(() => {
    if (state.frames.length <= 1) return;

    setState(prevState => ({ ...prevState, isPlaying: true }));

    playbackIntervalRef.current = setInterval(() => {
      setState(prevState => ({
        ...prevState,
        currentFrameIndex: (prevState.currentFrameIndex + 1) % prevState.frames.length
      }));
    }, state.settings.frameDelay * 1000);
  }, [state.frames.length, state.settings.frameDelay]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    setState(prevState => ({ ...prevState, isPlaying: false }));
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (state.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [state.isPlaying, startPlayback, stopPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  return {
    state,
    getCurrentFrame,
    updateCurrentFrame,
    toggleEditMode,
    addFrame,
    deleteFrame,
    selectFrame,
    updateFrameDelay,
    togglePlayback,
    canAddFrame: state.frames.length < MAX_FRAMES,
    canDeleteFrame: state.frames.length > 1
  };
}
