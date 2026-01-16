let enabled = true;

document.addEventListener('DOMContentLoaded', async () => {

  async function detectColorScheme() {
    const config = await window.storageManager.getConfig();
    let uiTheme = "light";
    let storageTheme = config?.uiTheme;

    if(storageTheme){
      uiTheme = storageTheme;
    } else if(!window.matchMedia) {
      uiTheme = "light";
    } else if(window.matchMedia("(prefers-color-scheme: dark)").matches) {
      uiTheme = "dark";
    }

    document.documentElement.setAttribute("data-theme", uiTheme);
  }

  await detectColorScheme();
  

  const checkbox = document.getElementById("toggle-extension");
  const statusText = document.getElementById("status-text");

  chrome.storage.onChanged.addListener((changes) => {
    if (Object.hasOwn(changes, 'enabled')) {
      enabled = !!changes.enabled.newValue;
      checkbox.checked = enabled;
      statusText.textContent = enabled ? "On" : "Off";
    }
  });

  // Restore the switch state from storage
  const config = await window.storageManager.getConfig();

  // If UI password is set, redirect to options page
  if (config && config.uiPass) {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
      window.close();
    }
  }

  // Load enabled state (not part of synced config)
  const enabledData = await chrome.storage.local.get("enabled");
  const enabledValue = enabledData.enabled === undefined ? true : !!enabledData.enabled;
  checkbox.checked = enabledValue;
  statusText.textContent = enabledValue ? "On" : "Off";

  // Listen for changes to the switch
  checkbox.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
      console.log({enabled: !!event.target.checked})
        chrome.storage.local.set({enabled: !!event.target.checked});
        chrome.tabs.reload(); // Reload page to apply the new state
    }
  });

  // Open options page
  document.getElementById("options-button").addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
      window.close();
    }
  });
});