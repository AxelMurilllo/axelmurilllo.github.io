// Desktop functionality for projects page
class DesktopManager {
    constructor() {
        this.gridSize = 100;
        this.gridGap = 10;   
        this.occupiedCells = new Map();
        this.initializeIcons();
        this.initializeWindows();
        this.updateOccupiedCells(); 
    }

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

                // Get initial positions
                startX = e.clientX;
                startY = e.clientY;

                // Get icons current position relative to desktop grid
                const rect = icon.getBoundingClientRect();
                const desktop = document.querySelector('.desktop-grid').getBoundingClientRect();
                
                // If icon has inline styles then keep else calculate relative to desktop
                originalX = parseInt(icon.style.left) || rect.left - desktop.left;
                originalY = parseInt(icon.style.top) || rect.top - desktop.top;

                //DEBUGGING: Show highlighted cells (grid snapping)
                // this.createHighlightCell();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                // Calculate new absolute position
                const newX = originalX + deltaX;
                const newY = originalY + deltaY;

                // Get grid position
                const gridPos = this.getGridPosition(newX + this.gridSize/2, newY + this.gridSize/2);
                
                // DEBUGGING: Update cells for user
                // this.updateHighlightCell(gridPos.x, gridPos.y);

                icon.style.left = `${newX}px`;
                icon.style.top = `${newY}px`;
            });

            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                icon.classList.remove('dragging');

                // Get current position
                const rect = icon.getBoundingClientRect();
                const finalPos = this.getGridPosition(rect.left + this.gridSize/2, rect.top + this.gridSize/2);
                
                // Check if new position is occupied
                const newCellKey = `${finalPos.x},${finalPos.y}`;
                const occupyingIcon = this.occupiedCells.get(newCellKey);
                
                if (!occupyingIcon || occupyingIcon === icon) {
                    // Position is free
                    const x = finalPos.x * (this.gridSize + this.gridGap);
                    const y = finalPos.y * (this.gridSize + this.gridGap);
                    
                    // Transitions for snapping into position
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
                    
                    // Removing 'rubberbanding' effect
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

    getGridPosition(x, y) {
        const desktop = document.querySelector('.desktop-grid');
        const rect = desktop.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        // Calculate grid position
        const gridX = Math.floor(relativeX / (this.gridSize + this.gridGap));
        const gridY = Math.floor(relativeY / (this.gridSize + this.gridGap));

        // Ensure within bounds
        const maxX = Math.floor(rect.width / (this.gridSize + this.gridGap)) - 1;
        const maxY = Math.floor(rect.height / (this.gridSize + this.gridGap)) - 1;

        return {
            x: Math.max(0, Math.min(gridX, maxX)),
            y: Math.max(0, Math.min(gridY, maxY))
        };
    }

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
            window.querySelector('.window-titlebar').onmousedown = (e) => this.dragWindowMouseDown(e, window, { pos1, pos2, pos3, pos4 });

            window.addEventListener('mousedown', () => this.bringToFront(window));

            // Window control buttons
            const buttons = window.querySelectorAll('.window-button');
            buttons[0].onclick = () => this.minimizeWindow(window); // Minimize
            buttons[1].onclick = () => this.maximizeWindow(window); // Maximize
            buttons[2].onclick = () => this.closeProject(window.id.replace('-window', '')); // Close

            // Window resizing
            const resizeHandle = window.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, window));
            }
        });
    }

    openProject(id) {
        const window = document.getElementById(`${id}-window`);
        window.style.display = 'block';
        this.bringToFront(window);
    }

    closeProject(id) {
        document.getElementById(`${id}-window`).style.display = 'none';
    }

    bringToFront(window) {
        const windows = document.querySelectorAll('.project-window');
        let maxZ = 0;
        windows.forEach(w => {
            const z = parseInt(getComputedStyle(w).zIndex) || 0;
            maxZ = Math.max(maxZ, z);
        });
        window.style.zIndex = maxZ + 1;
    }

    dragWindowMouseDown(e, window, state) {
        e.preventDefault();
        this.bringToFront(window);
        
        // Add dragging class to disable transitions
        window.classList.add('dragging');
        
        // Get initial positions
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

    minimizeWindow(window) {
        window.style.display = 'none';
    }

    maximizeWindow(window) {
        const desktop = document.querySelector('.desktop-grid');
        const desktopRect = desktop.getBoundingClientRect();
        
        // Store original position and size if not already stored
        if (!window.dataset.originalTop) {
            window.dataset.originalTop = window.style.top;
            window.dataset.originalLeft = window.style.left;
            window.dataset.originalWidth = window.style.width;
            window.dataset.originalHeight = window.style.height;
        }

        // Toggle between maximized and original state
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

    startResize(e, window) {
        e.preventDefault();
        
        // Add resizing class to disable transitions
        window.classList.add('resizing');
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = window.offsetWidth;
        const startHeight = window.offsetHeight;
        const startLeft = window.offsetLeft;
        const startTop = window.offsetTop;

        const resize = (e) => {
            e.preventDefault();
            
            // Calculate new dimensions
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

    elementWindowDrag(e, window, state) {
        e.preventDefault();
        
        // Calculate the distance moved
        const deltaX = e.clientX - state.pos3;
        const deltaY = e.clientY - state.pos4;
        
        // Update the window position directly
        window.style.top = `${state.initialTop + deltaY}px`;
        window.style.left = `${state.initialLeft + deltaX}px`;
    }

    closeWindowDragElement(window) {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Initialize desktop functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DesktopManager();
}); 