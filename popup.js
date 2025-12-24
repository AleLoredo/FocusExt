document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');

  // Default to true if not set
  chrome.storage.local.get(['optimizationEnabled'], (result) => {
    const isEnabled = result.optimizationEnabled !== false; // Default to true
    console.log('ColabUI Popup: Loaded optimization state:', isEnabled);
    updateButton(isEnabled);
  });

  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['optimizationEnabled'], (result) => {
      const currentState = result.optimizationEnabled !== false;
      const newState = !currentState;

      // Save to storage
      chrome.storage.local.set({ optimizationEnabled: newState }, () => {
        console.log('ColabUI Popup: Saved optimization state:', newState);
        // Update UI
        updateButton(newState);

        // Send message to active tab to apply immediately
        sendMessageToActiveTab({
          action: "set_optimization_state",
          enable: newState
        });
      });
    });
  });

  function updateButton(enabled) {
    if (enabled) {
      toggleBtn.textContent = "Toggle Off"; // It is currently ON, so action is to turn OFF? 
      // Or should it state current status? "Toggle On/Off" usually means "Switch"
      // User said "Button that indicates Toggle on / Toggle off". 
      // Interpreting as: Text showing what it IS or what it WILL DO?
      // Usually "Turn Off" (active) vs "Turn On" (inactive).
      // Let's use "Estado: Activado" or similar if Spanish, or "Disable" / "Enable".
      // User used English "Toggle on / Toggle off" in request, but Spanish context.
      // Let's use "Desactivar" / "Activar" for clarity, or specifically "Toggle Off" / "Toggle On" as requested.
      // Request: "un botton que indique 'Toogle on /Toogle off'".
      // I will literally use "Toggle Off" (when on) and "Toggle On" (when off).
      toggleBtn.textContent = "Toggle Off";
      toggleBtn.classList.add('status-on');
      toggleBtn.classList.remove('status-off');
    } else {
      toggleBtn.textContent = "Toggle On";
      toggleBtn.classList.add('status-off');
      toggleBtn.classList.remove('status-on');
    }
  }

  function sendMessageToActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});
