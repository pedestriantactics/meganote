import { useState } from 'react';
import { useSignboard } from '@/hooks/useSignboard';
import { MainDisplay } from '@/components/signboard/MainDisplay';
import { FramesOverlay } from '@/components/signboard/FramesOverlay';

export default function Signboard() {
  const {
    state,
    getCurrentFrame,
    updateCurrentFrame,
    toggleEditMode,
    addFrame,
    deleteFrame,
    selectFrame,
    updateFrameDelay,
    togglePlayback,
    canAddFrame,
    canDeleteFrame
  } = useSignboard();

  const [showFramesOverlay, setShowFramesOverlay] = useState(false);
  const currentFrame = getCurrentFrame();

  const handleTextChange = (text: string) => {
    updateCurrentFrame({ text });
  };

  const handleOpenFrames = () => {
    setShowFramesOverlay(true);
  };

  const handleCloseFrames = () => {
    setShowFramesOverlay(false);
  };

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden">
      {/* Main Display */}
      <MainDisplay
        frame={currentFrame}
        isEditing={state.isEditing}
        isPlaying={state.isPlaying}
        currentFrameIndex={state.currentFrameIndex}
        totalFrames={state.frames.length}
        onTextChange={handleTextChange}
        onToggleEdit={toggleEditMode}
        onUpdateFrame={updateCurrentFrame}
        onTogglePlayback={togglePlayback}
        onOpenFrames={handleOpenFrames}
      />

      {/* Frames Overlay */}
      <FramesOverlay
        isOpen={showFramesOverlay}
        frames={state.frames}
        currentFrameIndex={state.currentFrameIndex}
        frameDelay={state.settings.frameDelay}
        canAddFrame={canAddFrame}
        canDeleteFrame={canDeleteFrame}
        onClose={handleCloseFrames}
        onSelectFrame={selectFrame}
        onAddFrame={addFrame}
        onDeleteFrame={deleteFrame}
        onUpdateFrameDelay={updateFrameDelay}
      />
    </div>
  );
}
