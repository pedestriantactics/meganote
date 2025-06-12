import { useEffect, useRef } from 'react';
import { Frame } from '@/types/signboard';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Pause } from 'lucide-react';

interface MainDisplayProps {
  frame: Frame;
  isEditing: boolean;
  isPlaying: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  onTextChange: (text: string) => void;
  onToggleEdit: () => void;
  onUpdateFrame: (updates: Partial<Frame>) => void;
  onTogglePlayback: () => void;
  onOpenFrames: () => void;
}

export function MainDisplay({
  frame,
  isEditing,
  isPlaying,
  currentFrameIndex,
  totalFrames,
  onTextChange,
  onToggleEdit,
  onUpdateFrame,
  onTogglePlayback,
  onOpenFrames
}: MainDisplayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Main text display area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={frame.text}
            onChange={(e) => onTextChange(e.target.value)}
            className="bg-transparent border-none outline-none resize-none text-center break-words max-w-full w-full h-auto"
            style={{
              fontSize: `${frame.fontSize}px`,
              letterSpacing: `${frame.letterSpacing}px`,
              lineHeight: 1.2,
              color: 'white',
              fontFamily: 'inherit'
            }}
            rows={Math.max(1, Math.ceil(frame.text.length / 20))}
          />
        ) : (
          <div
            className="text-center break-words max-w-full cursor-default"
            style={{
              fontSize: `${frame.fontSize}px`,
              letterSpacing: `${frame.letterSpacing}px`,
              lineHeight: 1.2,
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {frame.text}
          </div>
        )}
      </div>

      {/* Control buttons - top right */}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {/* Edit toggle button */}
        <button
          onClick={onToggleEdit}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          aria-label={isEditing ? "Save changes" : "Toggle edit mode"}
        >
          {isEditing ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
        </button>

        {/* Frame button */}
        <button
          onClick={onOpenFrames}
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-sm font-bold"
          aria-label="Open frames menu"
        >
          {currentFrameIndex + 1}
        </button>

        {/* Play/Pause button (only show if more than 1 frame) */}
        {totalFrames > 1 && (
          <button
            onClick={onTogglePlayback}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Edit controls - bottom of screen when editing */}
      {isEditing && (
        <div className="bg-white text-gray-900 p-4 border-t border-gray-200">
          <div className="max-w-md mx-auto space-y-4">
            {/* Text Size Control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-700">Size</Label>
                <span className="text-sm text-gray-500">{frame.fontSize}px</span>
              </div>
              <Slider
                value={[frame.fontSize]}
                onValueChange={(value) => onUpdateFrame({ fontSize: value[0] })}
                min={16}
                max={120}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Letter Spacing Control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-700">Spacing</Label>
                <span className="text-sm text-gray-500">{frame.letterSpacing}px</span>
              </div>
              <Slider
                value={[frame.letterSpacing]}
                onValueChange={(value) => onUpdateFrame({ letterSpacing: value[0] })}
                min={-5}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
