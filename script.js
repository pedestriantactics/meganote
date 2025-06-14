class SignboardApp {
	constructor() {
		this.state = {
			isEditing: false,
			isPlaying: false,
			currentFrameIndex: 0,
			frames: [
				{
					id: 0,
					text: 'Hey',
					fontSize: 120,
					fontWeight: 120,
					letterSpacing: -.07
				}
			],
			frameDelay: 1
		};

		this.maxFrames = 20;
		this.playbackInterval = null;
		this.storageKey = 'signboardState';
		this.editingFrames = new Set(); // Track which frames are currently being edited
		this.wakeLock = null; // Track wake lock

		this.init();
	}

	init() {
		this.loadState();
		this.bindEvents();
		this.updateDisplay();
		this.updateControls();
		this.updateFrameDelayDisplay();
		
		// Request wake lock to prevent sleep
		this.requestWakeLock();
		
		// Clean up wake lock when page unloads
		window.addEventListener('beforeunload', () => {
			this.releaseWakeLock();
			this.stopFallbackPreventSleep();
		});
	}

	bindEvents() {
		// Control buttons
		document.getElementById('editBtn').addEventListener('click', () => this.toggleEdit());
		document.getElementById('settingsBtn').addEventListener('click', () => this.openFrames());
		document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback());

		// Edit controls
		document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
			this.updateCurrentFrame({ fontSize: parseInt(e.target.value) });
		});

		document.getElementById('fontWeightSlider').addEventListener('input', (e) => {
			this.updateCurrentFrame({ fontWeight: parseInt(e.target.value) });
		});

		document.getElementById('letterSpacingSlider').addEventListener('input', (e) => {
			this.updateCurrentFrame({ letterSpacing: parseFloat(e.target.value) });
		});

		// Remove automatic text updates - only save when edit button is pressed
		// document.getElementById('textContent').addEventListener('input', (e) => {
		//     // Text updates now happen only when save button is pressed
		// });

		// Frames overlay
		document.getElementById('closeFramesBtn').addEventListener('click', () => this.closeFrames());
		document.getElementById('addFrameBtn').addEventListener('click', () => this.addFrame());
		document.getElementById('resetCacheBtn').addEventListener('click', () => this.resetCache());
		document.getElementById('decreaseDelayBtn').addEventListener('click', () => this.decreaseFrameDelay());
		document.getElementById('increaseDelayBtn').addEventListener('click', () => this.increaseFrameDelay());
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

				// Migrate existing frames to include fontWeight if missing
				this.state.frames = this.state.frames.map(frame => ({
					...frame,
					fontWeight: frame.fontWeight || 80
				}));
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

	resetCache() {
		console.log('Reset cache button clicked');

		// For debugging, let's also try without confirm dialog
		const skipConfirm = true; // Set to true to skip confirmation
		let userConfirmed = skipConfirm;

		if (!skipConfirm) {
			userConfirmed = confirm('Are you sure you want to reset the app? This will delete all frames and settings.');
		}

		console.log('Confirm dialog result:', userConfirmed);

		if (userConfirmed) {
			console.log('User confirmed reset');
			try {
				localStorage.removeItem(this.storageKey);

				// Reset to initial state
				this.state = {
					isEditing: false,
					isPlaying: false,
					currentFrameIndex: 0,
					frames: [
						{
							id: 0,
							text: 'Hey',
							fontSize: 120,
							fontWeight: 120,
							letterSpacing: -.07
						}
					],
					frameDelay: 1
				};

				// Stop any playback
				if (this.playbackInterval) {
					clearInterval(this.playbackInterval);
					this.playbackInterval = null;
				}

				// Update the display and controls
				this.updateDisplay();
				this.updateControls();
				this.updateFramesList();

				// Close frames overlay if open
				this.closeFrames();

				console.log('Reset cache completed successfully');

			} catch (error) {
				console.error('Failed to reset cache:', error);
			}
		} else {
			console.log('User cancelled reset');
		}
	}

	getCurrentFrame() {
		return this.state.frames[this.state.currentFrameIndex] || this.state.frames[0];
	}

	updateCurrentFrame(updates) {
		const frame = this.getCurrentFrame();
		Object.assign(frame, updates);

		// Only update display if we're not editing text, or if it's a style change
		if (!this.state.isEditing || !updates.hasOwnProperty('text')) {
			this.updateDisplay();
		}

		this.saveState();
	}

	updateDisplay() {
		const frame = this.getCurrentFrame();
		const textContent = document.getElementById('textContent');

		// Only update text content if not currently editing to avoid cursor repositioning
		if (!this.state.isEditing) {
			textContent.innerText = frame.text || 'edit me';
		}

		// Update styles (always safe to update these)
		const style = {
			fontSize: `${frame.fontSize}pt`,
			fontWeight: frame.fontWeight,
			letterSpacing: `${frame.letterSpacing}em`
		};

		Object.assign(textContent.style, style);

		// Update sliders
		document.getElementById('fontSizeSlider').value = frame.fontSize;
		document.getElementById('fontSizeValue').textContent = frame.fontSize;
		document.getElementById('fontWeightSlider').value = frame.fontWeight;
		document.getElementById('fontWeightValue').textContent = frame.fontWeight;
		document.getElementById('letterSpacingSlider').value = frame.letterSpacing;
		document.getElementById('letterSpacingValue').textContent = frame.letterSpacing;
	}

	updateControls() {
		// Update frame counter
		document.getElementById('frameCounter').textContent = `${this.state.currentFrameIndex + 1}`;

		// Show/hide play button (only if multiple frames AND not editing)
		const playBtn = document.getElementById('playBtn');
		if (this.state.frames.length > 1 && !this.state.isEditing) {
			playBtn.style.display = 'block';
			playBtn.textContent = this.state.isPlaying ? '\uE019' : '\uE018';
		} else {
			playBtn.style.display = 'none';
		}

		// Show/hide settings button (hide when editing)
		const settingsBtn = document.getElementById('settingsBtn');
		if (this.state.isEditing) {
			settingsBtn.style.display = 'none';
		} else {
			settingsBtn.style.display = 'block';
		}

		// Update edit button
		document.getElementById('editBtn').textContent = this.state.isEditing ? '\uE001' : '\uE008';
	}

	toggleEdit() {
		this.state.isEditing = !this.state.isEditing;

		if (this.state.isEditing && this.state.isPlaying) {
			this.stopPlayback();
		}

		// Toggle edit controls and contenteditable
		const textContent = document.getElementById('textContent');
		const editControls = document.getElementById('editControls');

		if (this.state.isEditing) {
			textContent.contentEditable = 'true';
			editControls.style.display = 'block';
			textContent.focus();
			// Select all text for easier editing
			const range = document.createRange();
			range.selectNodeContents(textContent);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		} else {
			// Save the text when exiting edit mode
			this.updateCurrentFrame({ text: textContent.innerText });

			textContent.contentEditable = 'false';
			editControls.style.display = 'none';
			textContent.blur();
			// Clear any selection
			window.getSelection().removeAllRanges();
		}

		this.updateControls();
		this.saveState();
	}

	openFrames() {
		document.getElementById('framesOverlay').style.display = 'flex';
		this.updateFramesList();
		this.updateFrameDelayDisplay();
	}

	closeFrames() {
		// Save any frames that are currently being edited
		this.saveAllEditingFrames();
		document.getElementById('framesOverlay').style.display = 'none';
	}

	saveAllEditingFrames() {
		// Save text for all frames currently being edited
		this.editingFrames.forEach(frameId => {
			this.saveFrameText(frameId);
		});

		// Clear the editing frames set
		this.editingFrames.clear();
	}

	saveFrameText(frameId) {
		const frameElement = document.querySelector(`.frame-preview[data-frame-id="${frameId}"]`);
		if (frameElement) {
			const frame = this.state.frames.find(f => f.id === frameId);
			if (frame) {
				const newText = frameElement.textContent.trim();
				// Only save non-placeholder text
				if (newText && newText !== 'Empty frame') {
					frame.text = newText;
				} else {
					frame.text = '';
				}
			}
		}

		// Update display and save state
		this.updateDisplay();
		this.saveState();
	}

	toggleFrameEdit(frameId) {
		const frameElement = document.querySelector(`.frame-preview[data-frame-id="${frameId}"]`);
		const editBtn = document.querySelector(`.edit-frame-btn[data-frame-id="${frameId}"]`);
		
		if (!frameElement || !editBtn) return;

		if (this.editingFrames.has(frameId)) {
			// Save and exit edit mode
			this.saveFrameText(frameId);
			this.editingFrames.delete(frameId);
			
			frameElement.contentEditable = 'false';
			frameElement.classList.remove('editing');
			editBtn.textContent = '\uE008'; // Edit icon
			frameElement.blur();
		} else {
			// Enter edit mode
			this.editingFrames.add(frameId);
			
			frameElement.contentEditable = 'true';
			frameElement.classList.add('editing');
			editBtn.textContent = '\uE001'; // Check icon
			frameElement.focus();
			
			// Select all text for easier editing
			const range = document.createRange();
			range.selectNodeContents(frameElement);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

	updateFramesList() {
		const framesList = document.getElementById('framesList');
		framesList.innerHTML = '';

		this.state.frames.forEach((frame, index) => {
			const isSelected = index === this.state.currentFrameIndex;
			const isEditing = this.editingFrames.has(frame.id);
			const frameItem = document.createElement('div');
			frameItem.className = `frame-item ${isSelected ? 'selected' : ''}`;
			frameItem.addEventListener('click', (e) => {
				// Don't select frame if clicking on the edit button, or if clicking on editable text
				const isEditButton = e.target.classList.contains('edit-frame-btn');
				const isDeleteButton = e.target.classList.contains('delete-frame-btn');
				const isEditableText = e.target.classList.contains('frame-preview') && e.target.contentEditable === 'true';
				
				if (!isEditButton && !isDeleteButton && !isEditableText) {
					this.selectFrame(frame.id);
				}
			});

			frameItem.innerHTML = `
                <div class="frame-item-header">
                    <div class="frame-title">${index + 1}</div>
                    <div class="frame-controls">
                        <button class="icon-btn edit-frame-btn" 
                                data-frame-id="${frame.id}"
                                title="${isEditing ? 'Save' : 'Edit'}">${isEditing ? '\uE001' : '\uE008'}</button>
                        ${this.state.frames.length > 1 ? `<button class="icon-btn delete-frame-btn icon-trashIcon" onclick="event.stopPropagation(); app.deleteFrame(${frame.id})" title="Delete Frame"></button>` : ''}
                    </div>
                </div>
                <div class="frame-preview ${isEditing ? 'editing' : ''}" 
                     contenteditable="${isEditing ? 'true' : 'false'}" 
                     data-frame-id="${frame.id}"
                     data-original-text="${frame.text || ''}">${frame.text || 'Empty frame'}</div>
            `;

			framesList.appendChild(frameItem);

			// Add event listener for the edit button
			const editBtn = frameItem.querySelector('.edit-frame-btn');
			editBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleFrameEdit(frame.id);
			});

			// Add event listeners for the frame preview when editing
			const framePreview = frameItem.querySelector('.frame-preview');
			
			// Handle keyboard shortcuts when editing
			framePreview.addEventListener('keydown', (e) => {
				if (!isEditing) return;
				
				if (e.key === 'Enter') {
					e.preventDefault();
					this.toggleFrameEdit(frame.id); // Save and exit
				} else if (e.key === 'Escape') {
					e.preventDefault();
					// Revert to original text and exit editing mode
					const originalText = framePreview.getAttribute('data-original-text');
					framePreview.textContent = originalText || 'Empty frame';
					this.editingFrames.delete(frame.id);
					framePreview.contentEditable = 'false';
					framePreview.classList.remove('editing');
					editBtn.textContent = '\uE008'; // Edit icon
					framePreview.blur();
				}
			});
		});

		// Update add frame button visibility
		const addFrameBtn = document.getElementById('addFrameBtn');
		if (this.state.frames.length >= this.maxFrames) {
			addFrameBtn.style.display = 'none';
		} else {
			addFrameBtn.style.display = 'block';
		}
	}

	addFrame() {
		if (this.state.frames.length >= this.maxFrames) return;

		const currentFrame = this.getCurrentFrame();
		const newFrame = {
			id: Date.now(),
			text: currentFrame.text,
			fontSize: currentFrame.fontSize,
			fontWeight: currentFrame.fontWeight,
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
		
		// Clamp the delay between 0.5 and 10
		delay = Math.max(0.5, Math.min(10, delay));
		
		this.state.frameDelay = delay;
		this.updateFrameDelayDisplay();
		this.saveState();
	}

	decreaseFrameDelay() {
		const currentDelay = this.state.frameDelay;
		const newDelay = Math.max(0.5, currentDelay - 0.5);
		this.updateFrameDelay(newDelay);
	}

	increaseFrameDelay() {
		const currentDelay = this.state.frameDelay;
		const newDelay = Math.min(10, currentDelay + 0.5);
		this.updateFrameDelay(newDelay);
	}

	updateFrameDelayDisplay() {
		const frameDelayValue = document.getElementById('frameDelayValue');
		if (frameDelayValue) {
			frameDelayValue.textContent = this.state.frameDelay.toString();
		}
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

	async requestWakeLock() {
		try {
			if ('wakeLock' in navigator) {
				this.wakeLock = await navigator.wakeLock.request('screen');
				console.log('Wake lock activated');
				
				// Re-request wake lock when page becomes visible again
				document.addEventListener('visibilitychange', async () => {
					if (this.wakeLock !== null && document.visibilityState === 'visible') {
						this.wakeLock = await navigator.wakeLock.request('screen');
					}
				});
			} else {
				console.log('Wake Lock API not supported');
				this.fallbackPreventSleep();
			}
		} catch (err) {
			console.error('Failed to activate wake lock:', err);
			this.fallbackPreventSleep();
		}
	}

	releaseWakeLock() {
		if (this.wakeLock !== null) {
			this.wakeLock.release();
			this.wakeLock = null;
			console.log('Wake lock released');
		}
	}

	// Fallback method for older browsers
	fallbackPreventSleep() {
		// Create an invisible video element that plays continuously
		if (!this.keepAwakeVideo) {
			this.keepAwakeVideo = document.createElement('video');
			this.keepAwakeVideo.style.position = 'absolute';
			this.keepAwakeVideo.style.left = '-9999px';
			this.keepAwakeVideo.style.width = '1px';
			this.keepAwakeVideo.style.height = '1px';
			this.keepAwakeVideo.muted = true;
			this.keepAwakeVideo.loop = true;
			
			// Create a minimal video data URL (1x1 pixel, 1 second)
			this.keepAwakeVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzEAAAAIZnJlZQAAAGRtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NSByMzEwOWJhIDI1MjBlYWEgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29peWxlZnQgMjAwMy0yMDIxIC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MSByZWY9MSBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgzOjB4MSBtZT1oZXggc3VibWU9MiBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0wIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MCA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0wIHRocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0wIHdlaWdodHA9MCBrZXlpbnQ9MjUwIGtleWludF9taW49MjUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD0xMCByYz1jcmYgbWJ0cmVlPTEgY3JmPTUxLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuMjUgYXE9MToxLjAwAIAAAAFZZYiEACD/2lu4BjDG8BUHFvYYRwGJukkDwgJkE+GvOwLJHRRdPJzOTPpHJMYMSHJKzBVNSFjPSQE+yqONSx0XbLaXIKfIUuFRAIDgAwABAAAJOLYBAIAABhWIhAAg/9pbuAYwxvAVBxb2GEcBibpJA8ICZBPhr';
			
			document.body.appendChild(this.keepAwakeVideo);
		}
		
		this.keepAwakeVideo.play().catch(err => {
			console.log('Fallback video play failed:', err);
		});
	}

	stopFallbackPreventSleep() {
		if (this.keepAwakeVideo) {
			this.keepAwakeVideo.pause();
			this.keepAwakeVideo.remove();
			this.keepAwakeVideo = null;
		}
	}
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
	app = new SignboardApp();
});
