class SignboardApp {
    constructor() {
        this.state = {
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
            frameDelay: 1
        };
        
        this.maxFrames = 5;
        this.playbackInterval = null;
        this.storageKey = 'signboardState';
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.bindEvents();
        this.updateDisplay();
        this.updateControls();
    }
    
    bindEvents() {
        // Control buttons
        document.getElementById('editBtn').addEventListener('click', () => this.toggleEdit());
        document.getElementById('frameBtn').addEventListener('click', () => this.openFrames());
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback());
        
        // Edit controls
        document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
            this.updateCurrentFrame({ fontSize: parseInt(e.target.value) });
        });
        
        document.getElementById('letterSpacingSlider').addEventListener('input', (e) => {
            this.updateCurrentFrame({ letterSpacing: parseInt(e.target.value) });
        });
        
        document.getElementById('editText').addEventListener('input', (e) => {
            this.updateCurrentFrame({ text: e.target.value });
        });
        
        // Frames overlay
        document.getElementById('closeFramesBtn').addEventListener('click', () => this.closeFrames());
        document.getElementById('addFrameBtn').addEventListener('click', () => this.addFrame());
        document.getElementById('frameDelay').addEventListener('input', (e) => {
            this.updateFrameDelay(parseFloat(e.target.value));
        });
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsedState = JSON.parse(saved);
                this.state = {
                    ...this.state,
                    ...parsedState,
                    isEditing: false,
                    isPlaying: false
                };
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    getCurrentFrame() {
        return this.state.frames[this.state.currentFrameIndex] || this.state.frames[0];
    }
    
    updateCurrentFrame(updates) {
        const frame = this.getCurrentFrame();
        Object.assign(frame, updates);
        this.updateDisplay();
        this.saveState();
    }
    
    updateDisplay() {
        const frame = this.getCurrentFrame();
        const displayText = document.getElementById('displayText');
        const editText = document.getElementById('editText');
        
        // Update text content
        displayText.textContent = frame.text;
        editText.value = frame.text;
        
        // Update styles
        const style = {
            fontSize: `${frame.fontSize}px`,
            letterSpacing: `${frame.letterSpacing}px`
        };
        
        Object.assign(displayText.style, style);
        Object.assign(editText.style, style);
        
        // Update textarea rows based on content
        const lines = Math.max(1, Math.ceil(frame.text.length / 20));
        editText.rows = lines;
        
        // Update sliders
        document.getElementById('fontSizeSlider').value = frame.fontSize;
        document.getElementById('fontSizeValue').textContent = frame.fontSize;
        document.getElementById('letterSpacingSlider').value = frame.letterSpacing;
        document.getElementById('letterSpacingValue').textContent = frame.letterSpacing;
    }
    
    updateControls() {
        // Update frame button
        document.getElementById('frameBtn').textContent = this.state.currentFrameIndex + 1;
        
        // Show/hide play button
        const playBtn = document.getElementById('playBtn');
        if (this.state.frames.length > 1) {
            playBtn.style.display = 'flex';
            playBtn.textContent = this.state.isPlaying ? '⏸️' : '▶️';
        } else {
            playBtn.style.display = 'none';
        }
        
        // Update edit button
        document.getElementById('editBtn').textContent = this.state.isEditing ? '✅' : '✏️';
    }
    
    toggleEdit() {
        this.state.isEditing = !this.state.isEditing;
        
        if (this.state.isEditing && this.state.isPlaying) {
            this.stopPlayback();
        }
        
        // Toggle display/edit elements
        const displayText = document.getElementById('displayText');
        const editText = document.getElementById('editText');
        const editControls = document.getElementById('editControls');
        
        if (this.state.isEditing) {
            displayText.style.display = 'none';
            editText.style.display = 'block';
            editControls.style.display = 'block';
            editText.focus();
            editText.select();
        } else {
            displayText.style.display = 'block';
            editText.style.display = 'none';
            editControls.style.display = 'none';
        }
        
        this.updateControls();
        this.saveState();
    }
    
    openFrames() {
        document.getElementById('framesOverlay').style.display = 'flex';
        this.updateFramesList();
        document.getElementById('frameDelay').value = this.state.frameDelay;
    }
    
    closeFrames() {
        document.getElementById('framesOverlay').style.display = 'none';
    }
    
    updateFramesList() {
        const framesList = document.getElementById('framesList');
        framesList.innerHTML = '';
        
        this.state.frames.forEach((frame, index) => {
            const isSelected = index === this.state.currentFrameIndex;
            const frameItem = document.createElement('div');
            frameItem.className = `frame-item ${isSelected ? 'selected' : ''}`;
            frameItem.addEventListener('click', () => this.selectFrame(frame.id));
            
            frameItem.innerHTML = `
                <div class="frame-item-header">
                    <div class="frame-title">Frame ${index + 1}</div>
                    ${this.state.frames.length > 1 ? `<button class="delete-frame-btn" onclick="event.stopPropagation(); app.deleteFrame(${frame.id})">🗑️</button>` : ''}
                </div>
                <div class="frame-preview">${frame.text || 'Empty frame'}</div>
                <div class="frame-details">Size: ${frame.fontSize}px, Spacing: ${frame.letterSpacing}px</div>
            `;
            
            framesList.appendChild(frameItem);
        });
        
        // Update add frame button
        const addFrameBtn = document.getElementById('addFrameBtn');
        addFrameBtn.disabled = this.state.frames.length >= this.maxFrames;
    }
    
    addFrame() {
        if (this.state.frames.length >= this.maxFrames) return;
        
        const currentFrame = this.getCurrentFrame();
        const newFrame = {
            id: Date.now(),
            text: currentFrame.text,
            fontSize: currentFrame.fontSize,
            letterSpacing: currentFrame.letterSpacing
        };
        
        this.state.frames.push(newFrame);
        this.state.currentFrameIndex = this.state.frames.length - 1;
        
        this.updateDisplay();
        this.updateControls();
        this.updateFramesList();
        this.saveState();
    }
    
    deleteFrame(frameId) {
        if (this.state.frames.length <= 1) return;
        
        const frameIndex = this.state.frames.findIndex(f => f.id === frameId);
        if (frameIndex === -1) return;
        
        this.state.frames.splice(frameIndex, 1);
        
        if (this.state.currentFrameIndex >= this.state.frames.length) {
            this.state.currentFrameIndex = this.state.frames.length - 1;
        }
        
        this.updateDisplay();
        this.updateControls();
        this.updateFramesList();
        this.saveState();
    }
    
    selectFrame(frameId) {
        const frameIndex = this.state.frames.findIndex(f => f.id === frameId);
        if (frameIndex === -1) return;
        
        this.state.currentFrameIndex = frameIndex;
        this.updateDisplay();
        this.updateControls();
        this.updateFramesList();
    }
    
    updateFrameDelay(delay) {
        if (isNaN(delay)) return;
        this.state.frameDelay = delay;
        this.saveState();
    }
    
    togglePlayback() {
        if (this.state.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
        if (this.state.frames.length <= 1) return;
        
        this.state.isPlaying = true;
        this.updateControls();
        
        this.playbackInterval = setInterval(() => {
            this.state.currentFrameIndex = (this.state.currentFrameIndex + 1) % this.state.frames.length;
            this.updateDisplay();
            this.updateControls();
        }, this.state.frameDelay * 1000);
    }
    
    stopPlayback() {
        this.state.isPlaying = false;
        this.updateControls();
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SignboardApp();
});