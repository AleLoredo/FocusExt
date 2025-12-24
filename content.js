// content.js

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle_optimize_ui") {
        // Legacy or if called without state
        toggleOptimizeUi();
    } else if (request.action === "reset_optimize_ui") {
        resetOptimizeUi();
    } else if (request.action === "set_optimization_state") {
        setOptimizeUi(request.enable);
    }
});

function resetOptimizeUi() {
    const styleId = 'ft-optimize-ui';
    const existingStyle = document.getElementById(styleId);

    if (existingStyle) {
        existingStyle.remove();
        optimizeColabLayout(false);
        showNotification('Colab restablecido a su estado original.');
    } else {
        // Even if style doesn't exist, ensure layout is reset (e.g. if manually removed but JS state lingers)
        optimizeColabLayout(false);
        showNotification('Colab ya está en su estado original.');
    }
}

function setOptimizeUi(enable, isAutoRun = false) {
    const styleId = 'ft-optimize-ui';
    const existingStyle = document.getElementById(styleId);

    if (!enable && existingStyle) {
        existingStyle.remove();
        optimizeColabLayout(false);

        showNotification('Optimización UI desactivada.');
    } else if (enable && !existingStyle) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* nuevas def de limites maximos para UI */

            /* NOTA: usar clamp() para limitar valores de tipografia de barra top */
            /* limita altura max de barra superior */
            #top-toolbar {
                max-height: 4vh;
            }

             /* limita ancho panel lateral cerrado */
            colab-left-pane {
                max-width: 4vw !important;
            }

            /* limita ancho panel lateral abierto */
            .colab-left-pane-open {
                max-width: 50vw !important;
            }
        
            /* limita ancho de la silueta contenedora del menu lateral 
            pero no limita la expansión de los iconos */
            colab-left-pane-nib {
                max-width: 4vw !important;
                overflow: hidden !important; /* FIX: Evita desbordamiento al hacer zoom */
            }

            /* quita padding de la silueta contenedora del menu lateral */
            .colab-left-pane-nib .left-pane-top {
                padding: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                width: 100% !important;
            }
             /* icono de gemini  - revisar */  
            toggle-composer-button {
                left: 80%;
                max-width: 4vw !important;
                max-height: 4vw !important;
                
            }

            /* manejo de espacios de margen grales  
            .notebook-vertical:not(.embedded) .notebook-horizontal {
                margin: 2px;
            } */


            /* limita ancho iconos menu lateral - FIX: Scoped and fluid */
            .colab-left-pane-nib md-icon {
                max-width: 100% !important;
                width: auto !important;
                min-width: 0 !important;
                /* Optional: clamp font size if icons rely on it */
            }

            /* definir limites maximos para UI */
            
            .cell {
                --colab-cell-gutter-width: 25px !important;
            }

            .notebook-vertical:not(.embedded) .notebook-content {
                padding-left: clamp(35px, 1vw, 1vw) !important;
            }
            .line-numbers {
                left: 15px !important;
            }
            .margin-view-overlays {
                font-size: 18px !important;
            }

             /* colab-left-pane-nib md-icon-button rules remain */
            .colab-left-pane-nib md-icon-button {
                max-width: 100% !important; 
                width: auto !important;
                padding: 0 !important; 
                margin: 2px 0 !important;
            }
          
            .view-lines monaco-mouse-cursor-text {
                font-size: 16px !important;
                left:10px;
            }

            .monaco-editor .margin {
                width: 40px;
            }
            .monaco-scrollable-element editor-scrollable {
                left: 46px !important;
            }
            .monaco-scrollable-element editor-scrollable vs-dark mac {
                left: 46px !important;
            } 
            .monaco-editor.no-user-select .lines-content {
                left: 10px !important;
            }

           

            /* esto no colabora
            .body {
                line-height: 1;
            }*/


            .cell-execution-indicator {
                margin-left: 20px;
            }
            .cell-execution-container {
                left: 10px;
            }
            .status {
                left: -45px;
                top: 40px !important;
                width: 35px !important;
            }


            #top-toolbar.collapsed {
                margin-top: 2px;
                margin: 0px 10px;
                padding: 0 8px;

            }

            colab-status-bar.ft-minimized {
                min-height: 1px !important;
                max-height: 1px !important;
            }

            /* Toggle Button */
            .ft-status-toggle {
                position: fixed !important;
                bottom: 35px !important; /* Default expanded height */
                right: 20px !important;
                width: 4vw !important;
                height: 5vh !important;
                background: var(--colab-surface-container-color) !important;
                border-radius: 8px 8px 0 0 !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 10002 !important; /* High z-index to sit on top */
                box-shadow: 0 -2px 5px rgba(0,0,0,0.1) !important;
                border: 1px solid var(--colab-border-color) !important;
                border-bottom: none !important;
                color: var(--colab-primary-text-color) !important;
                transition: bottom 0.3s ease !important;
            }
            .ft-status-toggle:hover {
                background: var(--colab-surface-container-high-color) !important;
            }
            
            /* When minimized, move button down */
            .ft-status-toggle.ft-minimized-state {
                bottom: 0 !important;
            }

        `;
        document.head.appendChild(style);
        optimizeColabLayout(true);

        // Inject and configure script (handles loading check internally)


        if (isAutoRun) {
            showNotification('ColabUI ha optimizado esta UI');
        } else {
            showNotification('Optimización UI activada.');
        }
    }
}



function optimizeColabLayout(enable) {
    const sidebarContainer = document.querySelector('.colab-left-pane-nib .left-pane-top');

    if (!sidebarContainer) return;

    const buttonsToMove = [
        { command: 'show-variables', icon: 'data_object', title: 'Variables' },
        { command: 'show-terminal', icon: 'terminal', title: 'Terminal' }
    ];

    if (enable) {
        const handleButton = (btnInfo) => {
            const selector = `colab-status-bar md-text-button[command="${btnInfo.command}"]`;
            const originalBtn = document.querySelector(selector);

            // If button exists and hasn't been processed yet
            if (originalBtn && originalBtn.style.display !== 'none') {
                // Hide original
                originalBtn.style.display = 'none';
                originalBtn.dataset.ftHidden = 'true';

                // Check if already injected to avoid duplicates
                if (!sidebarContainer.querySelector(`.ft-injected-btn[data-ft-command="${btnInfo.command}"]`)) {
                    // Create new button in sidebar
                    const wrapper = document.createElement('div');
                    wrapper.className = 'left-pane-button ft-injected-btn';
                    wrapper.dataset.ftCommand = btnInfo.command;

                    wrapper.innerHTML = `
                        <md-icon-button toggle="" command="${btnInfo.command}" data-aria-label="${btnInfo.title}" title="${btnInfo.title}" value="">
                            <md-icon aria-hidden="true">${btnInfo.icon}</md-icon>
                        </md-icon-button>
                    `;

                    // Add click listener to trigger original button
                    wrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        originalBtn.click();
                    });

                    sidebarContainer.appendChild(wrapper);
                }
            }
        };

        // 1. Try immediately
        buttonsToMove.forEach(handleButton);

        // 2. Observe status bar for changes (in case buttons load late or are re-rendered)
        const statusBar = document.querySelector('colab-status-bar');
        if (statusBar) {
            // We attach this observer to the window object to be able to disconnect it later
            if (!window.ftStatusBarObserver) {
                window.ftStatusBarObserver = new MutationObserver(() => {
                    buttonsToMove.forEach(handleButton);
                });
                window.ftStatusBarObserver.observe(statusBar, { childList: true, subtree: true });
            }
        }

        // --- Inject Toggle Button into Body (Fixed Position) ---
        const injectToggle = () => {
            // Check if already injected
            if (!document.querySelector('.ft-status-toggle')) {
                console.log('ColabUI: Injecting status toggle into body...');
                const toggleBtn = document.createElement('div');
                toggleBtn.className = 'ft-status-toggle';
                toggleBtn.title = 'Expandir/Contraer Barra de Estado';

                // Initial State: Minimized
                toggleBtn.classList.add('ft-minimized-state');
                toggleBtn.innerHTML = '&#8963;';

                // Apply minimized state to status bar if it exists
                const statusBar = document.querySelector('colab-status-bar');
                if (statusBar) {
                    statusBar.classList.add('ft-minimized');
                }

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const statusBar = document.querySelector('colab-status-bar');
                    if (statusBar) {
                        const isMinimized = statusBar.classList.toggle('ft-minimized');
                        toggleBtn.classList.toggle('ft-minimized-state', isMinimized);
                        toggleBtn.innerHTML = isMinimized ? '&#8963;' : '&#8964;';
                    }
                });

                document.body.appendChild(toggleBtn);
            }
        };

        injectToggle();

        // Observer for dynamic loading (keep ensuring button exists)
        if (!window.ftObserver) {
            window.ftObserver = new MutationObserver(() => {
                injectToggle();
                // Also ensure status bar has class if button says it's minimized
                const toggleBtn = document.querySelector('.ft-status-toggle');
                const statusBar = document.querySelector('colab-status-bar');
                if (toggleBtn && statusBar && toggleBtn.classList.contains('ft-minimized-state') && !statusBar.classList.contains('ft-minimized')) {
                    statusBar.classList.add('ft-minimized');
                }
            });
            window.ftObserver.observe(document.body, { childList: true, subtree: true });
        }

    } else {
        // Disconnect observer if it exists
        if (window.ftObserver) {
            window.ftObserver.disconnect();
            window.ftObserver = null;
        }

        if (window.ftStatusBarObserver) {
            window.ftStatusBarObserver.disconnect();
            window.ftStatusBarObserver = null;
        }

        // Remove injected buttons from sidebar
        const injectedBtns = sidebarContainer.querySelectorAll('.ft-injected-btn');
        injectedBtns.forEach(btn => btn.remove());

        // Remove toggle button from body
        const toggleBtn = document.querySelector('.ft-status-toggle');
        if (toggleBtn) toggleBtn.remove();

        // Reset status bar
        const statusBar = document.querySelector('colab-status-bar');
        if (statusBar) {
            statusBar.classList.remove('ft-minimized');
        }

        // Show original buttons
        buttonsToMove.forEach(btnInfo => {
            const originalBtn = document.querySelector(`colab-status-bar md-text-button[command="${btnInfo.command}"]`);
            if (originalBtn && originalBtn.dataset.ftHidden === 'true') {
                originalBtn.style.display = '';
                delete originalBtn.dataset.ftHidden;
            }
        });
    }
}

// --- Notification System ---
function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.ft-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'ft-notification';
    notification.textContent = message;

    // Inject styles for notification if not already present
    if (!document.getElementById('ft-notification-style')) {
        const style = document.createElement('style');
        style.id = 'ft-notification-style';
        style.textContent = `
            .ft-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #323232;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                font-family: Roboto, sans-serif;
                font-size: 14px;
                z-index: 10003;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                animation: ft-fade-in 0.3s ease-out;
            }
            @keyframes ft-fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes ft-fade-out {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'ft-fade-out 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    }, 3000);
}

// --- Auto-Run on Load ---

function initAutoOptimize() {
    // Check storage first
    chrome.storage.local.get(['optimizationEnabled'], (result) => {
        console.log('ColabUI Content: Storage check result:', result);
        // Default to true if not set, to match previous behavior for installed users
        if (result.optimizationEnabled === false) return;

        // Check if optimization is already applied
        if (document.getElementById('ft-optimize-ui')) return;

        let waitForColab;

        const checkAndRun = () => {
            const sidebar = document.querySelector('.colab-left-pane-nib .left-pane-top');
            const statusBar = document.querySelector('colab-status-bar');

            if (sidebar && statusBar) {
                // Elements found, stop observing and run optimization
                if (waitForColab) waitForColab.disconnect();
                setOptimizeUi(true, true); // Pass true for enable, true for isAutoRun
                return true;
            }
            return false;
        };

        // Check immediately
        if (checkAndRun()) return;

        // If not found, wait for them
        waitForColab = new MutationObserver(() => {
            checkAndRun();
        });

        waitForColab.observe(document.body, { childList: true, subtree: true });

        // Safety timeout: stop looking after 30 seconds to save resources
        setTimeout(() => {
            if (waitForColab) waitForColab.disconnect();
        }, 30000);
    });
}

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoOptimize);
} else {
    initAutoOptimize();
}

function toggleOptimizeUi(isAutoRun = false) {
    const styleId = 'ft-optimize-ui';
    const existingStyle = document.getElementById(styleId);
    setOptimizeUi(!existingStyle, isAutoRun);
}
