import { Frame } from '@/types/signboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';

interface FramesOverlayProps {
  isOpen: boolean;
  frames: Frame[];
  currentFrameIndex: number;
  frameDelay: number;
  canAddFrame: boolean;
  canDeleteFrame: boolean;
  onClose: () => void;
  onSelectFrame: (frameId: number) => void;
  onAddFrame: () => void;
  onDeleteFrame: (frameId: number) => void;
  onUpdateFrameDelay: (delay: number) => void;
}

export function FramesOverlay({
  isOpen,
  frames,
  currentFrameIndex,
  frameDelay,
  canAddFrame,
  canDeleteFrame,
  onClose,
  onSelectFrame,
  onAddFrame,
  onDeleteFrame,
  onUpdateFrameDelay
}: FramesOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Animation Frames</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Close frames menu"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Frame Delay */}
          <div className="space-y-2">
            <Label htmlFor="frameDelay" className="text-sm font-medium text-gray-700">
              Seconds between frames
            </Label>
            <Input
              id="frameDelay"
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={frameDelay || 1}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onUpdateFrameDelay(val);
              }}
              className="w-full"
            />
          </div>
          
          {/* Frame List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Frames</Label>
              <Button
                onClick={onAddFrame}
                disabled={!canAddFrame}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Frame
              </Button>
            </div>
            
            <div className="space-y-3">
              {frames.map((frame, index) => {
                const isSelected = index === currentFrameIndex;
                return (
                  <div
                    key={frame.id}
                    className={`bg-gray-50 rounded-lg p-4 border-2 cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => onSelectFrame(frame.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          Frame {index + 1}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 truncate">
                          {frame.text || 'Empty frame'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Size: {frame.fontSize}px, Spacing: {frame.letterSpacing}px
                        </div>
                      </div>
                      {canDeleteFrame && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFrame(frame.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tips:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Select a frame to edit its text and settings</li>
              <li>• New frames copy the current frame's settings</li>
              <li>• Use the play button on the main screen to preview</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}