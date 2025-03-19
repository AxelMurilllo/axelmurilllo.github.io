/**
 * Manages the desktop-like interface functionality including window management,
 * icon dragging, and grid positioning
 */
class DesktopManager {
    /**
     * Constructor
     */
    constructor() {
        this.gridSize = 100;  // Size of each grid cell 
        this.gridGap = 10;    // Gap between grid cells
        this.occupiedCells = new Map();  // Know which grid cells are occupied
        
        // Initialize desktop functionality
        this.initializeIcons();
        this.initializeWindows();
        this.updateOccupiedCells();
    }

    /**
     * Sets up icon functions
     * Drag and drop
     * Double click
     */
    initializeIcons() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            let isDragging = false;
            let startX, startY;
            let originalX, originalY;

            // Left click to drag icons
            icon.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;  
                isDragging = true;
                icon.classList.add('dragging');

                // Initial mouse/icon position
                startX = e.clientX;
                startY = e.clientY;
                const rect = icon.getBoundingClientRect();
                const desktop = document.querySelector('.desktop-grid').getBoundingClientRect();
                
                // If icon has inline styles then keep else calculate relative to desktop
                originalX = parseInt(icon.style.left) || rect.left - desktop.left;
                originalY = parseInt(icon.style.top) || rect.top - desktop.top;

                //DEBUGGING: Show highlighted cells (grid snapping)
                // this.createHighlightCell();
            });

            // Track mouse movement while dragging
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                // Calculate new position based on mouse movement
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                // Calculate new absolute position
                const newX = originalX + deltaX;
                const newY = originalY + deltaY;

                // Get nearest grid position
                const gridPos = this.getGridPosition(newX + this.gridSize/2, newY + this.gridSize/2);
                
                // DEBUGGING: Update cells for user
                // this.updateHighlightCell(gridPos.x, gridPos.y);

                icon.style.left = `${newX}px`;
                icon.style.top = `${newY}px`;
            });

            // Drop the icons
            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                icon.classList.remove('dragging');

                // Get final pos and snap to grid
                const rect = icon.getBoundingClientRect();
                const finalPos = this.getGridPosition(rect.left + this.gridSize/2, rect.top + this.gridSize/2);
                
                // Check if target pos is already occupied
                const newCellKey = `${finalPos.x},${finalPos.y}`;
                const occupyingIcon = this.occupiedCells.get(newCellKey);
                
                if (!occupyingIcon || occupyingIcon === icon) {
                    // Pos is free
                    const x = finalPos.x * (this.gridSize + this.gridGap);
                    const y = finalPos.y * (this.gridSize + this.gridGap);
                    
                    // Transition for smoothing snap
                    icon.style.transition = 'left 0.1s, top 0.1s';
                    icon.style.left = `${x}px`;
                    icon.style.top = `${y}px`;
                    
                    // Removing 'rubberbanding' effect
                    setTimeout(() => {
                        icon.style.transition = '';
                    }, 100);
                    
                    this.updateOccupiedCells();
                } else {
                    // Position is taken
                    // Return to original position
                    icon.style.transition = 'left 0.2s, top 0.2s';
                    icon.style.left = `${originalX}px`;
                    icon.style.top = `${originalY}px`;
                    
                    setTimeout(() => {
                        icon.style.transition = '';
                    }, 200);
                }

                // DEBUGGING: Remove highlight cell
                // this.removeHighlightCell();
            });

            // Double click to open window
            icon.addEventListener('dblclick', () => {
                const id = icon.dataset.id;
                this.openProject(id);
            });
        });
    }

    /**
     * Calculates the nearest grid position for given coordinates.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} Grid position {x, y}
     */
    getGridPosition(x, y) {
        const desktop = document.querySelector('.desktop-grid');
        const rect = desktop.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        // Calculate grid cell position
        const gridX = Math.floor(relativeX / (this.gridSize + this.gridGap));
        const gridY = Math.floor(relativeY / (this.gridSize + this.gridGap));

        // Ensure pos is within bounds
        const maxX = Math.floor(rect.width / (this.gridSize + this.gridGap)) - 1;
        const maxY = Math.floor(rect.height / (this.gridSize + this.gridGap)) - 1;

        return {
            x: Math.max(0, Math.min(gridX, maxX)),
            y: Math.max(0, Math.min(gridY, maxY))
        };
    }

    /**
     * Updates the map of occupied grid cells based on current icon positions
     */
    updateOccupiedCells() {
        this.occupiedCells.clear();
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const pos = this.getGridPosition(rect.left + this.gridSize/2, rect.top + this.gridSize/2);
            this.occupiedCells.set(`${pos.x},${pos.y}`, icon);
        });
    }

    // DEBUGGING METHODS: Show cells, create cells, remove cells
    // createHighlightCell() {
    //     const highlight = document.createElement('div');
    //     highlight.className = 'grid-cell highlight';
    //     document.querySelector('.desktop-grid').appendChild(highlight);
    // }

    // updateHighlightCell(gridX, gridY) {
    //     const highlight = document.querySelector('.grid-cell.highlight');
    //     if (highlight) {
    //         highlight.style.left = `${gridX * (this.gridSize + this.gridGap)}px`;
    //         highlight.style.top = `${gridY * (this.gridSize + this.gridGap)}px`;
    //     }
    // }

    // removeHighlightCell() {
    //     const highlight = document.querySelector('.grid-cell.highlight');
    //     if (highlight) {
    //         highlight.remove();
    //     }
    // }

    initializeWindows() {
        document.querySelectorAll('.project-window').forEach(window => {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            // Set up window titlebar drag
            window.querySelector('.window-titlebar').onmousedown = (e) => 
                this.dragWindowMouseDown(e, window, { pos1, pos2, pos3, pos4 });

            // Bring window to front when clicked (cannot get stuck 'behind' other windows/elements)
            window.addEventListener('mousedown', () => this.bringToFront(window));

            // Set up window control buttons (minimize, maximize, close)
            const buttons = window.querySelectorAll('.window-button');
            buttons[0].onclick = () => this.minimizeWindow(window);
            buttons[1].onclick = () => this.maximizeWindow(window);
            buttons[2].onclick = () => this.closeProject(window.id.replace('-window', ''));

            // Set up resize handle (bottom right corner)
            const resizeHandle = window.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, window));
            }
        });
    }

    /**
     * Opens a project window and brings it to the front.
     * @param {string} id - Project id
     */
    openProject(id) {
        const window = document.getElementById(`${id}-window`);
        window.style.display = 'block';
        this.bringToFront(window);
    }

    /**
     * Closes a project window.
     * @param {string} id - Project id
     */
    closeProject(id) {
        document.getElementById(`${id}-window`).style.display = 'none';
    }

    /**
     * Brings a window to the front by updating its z-index.
     * @param {HTMLElement} window - Window element to bring to front
     */
    bringToFront(window) {
        const windows = document.querySelectorAll('.project-window');
        let maxZ = 0;
        windows.forEach(w => {
            const z = parseInt(getComputedStyle(w).zIndex) || 0;
            maxZ = Math.max(maxZ, z);
        });
        window.style.zIndex = maxZ + 1;
    }

    /**
     * Initializes window dragging functionality.
     * @param {Event} e - Mouse event
     * @param {HTMLElement} window - Window element
     * @param {Object} state - Drag state object
     */
    dragWindowMouseDown(e, window, state) {
        e.preventDefault();
        this.bringToFront(window);
        
        window.classList.add('dragging');
        
        // Store initial positions
        state.pos3 = e.clientX;
        state.pos4 = e.clientY;
        state.initialTop = window.offsetTop;
        state.initialLeft = window.offsetLeft;
        
        document.onmouseup = () => {
            window.classList.remove('dragging');
            this.closeWindowDragElement(window);
        };
        
        document.onmousemove = (e) => this.elementWindowDrag(e, window, state);
    }

    /**
     * Handles window minimization.
     * @param {HTMLElement} window - Window to minimize
     */
    minimizeWindow(window) {
        window.style.display = 'none';
    }

    /**
     * Toggles window maximization state.
     * @param {HTMLElement} window - Window to maximize/restore
     */
    maximizeWindow(window) {
        const desktop = document.querySelector('.desktop-grid');
        const desktopRect = desktop.getBoundingClientRect();
        
        // Store original size if not already stored
        if (!window.dataset.originalTop) {
            window.dataset.originalTop = window.style.top;
            window.dataset.originalLeft = window.style.left;
            window.dataset.originalWidth = window.style.width;
            window.dataset.originalHeight = window.style.height;
        }

        // Toggle maximized state
        if (window.classList.contains('maximized')) {
            window.classList.remove('maximized');
            window.style.top = window.dataset.originalTop;
            window.style.left = window.dataset.originalLeft;
            window.style.width = window.dataset.originalWidth;
            window.style.height = window.dataset.originalHeight;
        } else {
            window.classList.add('maximized');
            window.style.top = '0';
            window.style.left = '0';
            window.style.width = `${desktopRect.width}px`;
            window.style.height = `${desktopRect.height}px`;
        }
    }

    /**
     * Initializes window resizing functionality.
     * @param {Event} e - Mouse event
     * @param {HTMLElement} window - Window to resize
     */
    startResize(e, window) {
        e.preventDefault();
        window.classList.add('resizing');
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = window.offsetWidth;
        const startHeight = window.offsetHeight;

        const resize = (e) => {
            e.preventDefault();
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            
            // Apply minimum dimensions
            window.style.width = `${Math.max(400, width)}px`;
            window.style.height = `${Math.max(300, height)}px`;
        };

        const stopResize = () => {
            window.classList.remove('resizing');
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    /**
     * Handles window dragging movement.
     * @param {Event} e - Mouse event
     * @param {HTMLElement} window - Window being dragged
     * @param {Object} state - Drag state object
     */
    elementWindowDrag(e, window, state) {
        e.preventDefault();
        
        // Calculate the distance moved
        const deltaX = e.clientX - state.pos3;
        const deltaY = e.clientY - state.pos4;
        
        const newTop = state.initialTop + deltaY;
        const newLeft = state.initialLeft + deltaX;
        
        window.style.transform = 'none';
        window.style.top = `${newTop}px`;
        window.style.left = `${newLeft}px`;
    }

    /**
     * Cleans up window dragging event listeners.
     * @param {HTMLElement} window - Window element
     */
    closeWindowDragElement(window) {
        document.onmouseup = null;
        document.onmousemove = null;
        window.style.transform = 'none';
    }
}

// Initialize desktop functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DesktopManager();
});

// Screenshot tab functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const screenshots = document.querySelectorAll('.screenshot');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and screenshots
            tabButtons.forEach(btn => btn.classList.remove('active'));
            screenshots.forEach(screenshot => screenshot.classList.remove('active'));

            // Add active class to clicked button and corresponding screenshot
            button.classList.add('active');
            const targetId = button.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });
});

// Lightbox functionality
document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const closeButton = lightbox.querySelector('.lightbox-close');
    const lightboxTitle = lightbox.querySelector('.lightbox-title');
    let currentZoom = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;

    // Open lightbox when clicking on a screenshot
    document.querySelectorAll('.screenshot').forEach(screenshot => {
        screenshot.addEventListener('click', () => {
            lightbox.classList.add('active');
            lightboxImage.src = screenshot.src;
            lightboxImage.alt = screenshot.alt;
            lightboxTitle.textContent = screenshot.alt;
            resetZoom();
        });
    });

    // Close lightbox
    closeButton.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });

    // Zoom controls
    document.querySelectorAll('.zoom-button').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-zoom');
            switch(action) {
                case 'in':
                    currentZoom = Math.min(currentZoom * 1.2, 3);
                    break;
                case 'out':
                    currentZoom = Math.max(currentZoom / 1.2, 0.5);
                    break;
                case 'reset':
                    resetZoom();
                    break;
            }
            updateImageTransform();
        });
    });

    // Image dragging
    lightboxImage.addEventListener('mousedown', (e) => {
        // Ensure image cannot be dragged (default browser thing)
        e.preventDefault(); 
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        lightboxImage.style.cursor = 'grabbing';
    });

    lightboxImage.addEventListener('dragstart', (e) => {
        e.preventDefault(); 
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        // Calculate new position
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        // Apply transform immediately for smooth movement
        requestAnimationFrame(() => {
            updateImageTransform();
        });
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        lightboxImage.style.cursor = 'move';
    });

    // Also stop dragging if mouse leaves the window
    document.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            lightboxImage.style.cursor = 'move';
        }
    });

    // Reset zoom and position
    function resetZoom() {
        currentZoom = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
    }

    // Update image transform with hardware acceleration
    function updateImageTransform() {
        lightboxImage.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${currentZoom})`;
    }

    // Prevent zoom on mouse wheel
    lightbox.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            currentZoom = Math.max(0.5, Math.min(currentZoom * delta, 3));
            updateImageTransform();
        }
    }, { passive: false });
}); 