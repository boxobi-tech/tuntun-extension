(function () {
  const has = Object.prototype.hasOwnProperty;

  const defaultJSFunction = `(video, objectType) => {
  // Add custom conditions below

  // Custom conditions did not match, do not block
  return false;
}`;

  const jsEditors = {};
  let isLoggedIn = false;
  let storageData = {
    filterData: {
      javascript: defaultJSFunction,
      videoId: ['// Add your video ID filters below', ''],
      channelId: ['// Add your channel ID filters below', ''],
      channelName: ['// Add your channel name filters below', ''],
      comment: ['// Add your comment filters below', ''],
      title: ['// Add your video title filters below', ''],
    },
    options: {},
    uiPass: '',
  };

  const textAreas = ['title', 'channelName', 'channelId', 'videoId', 'comment'];

  // Filter count tracking
  const filterCounts = {
    title: 0,
    channelName: 0,
    channelId: 0,
    videoId: 0,
    comment: 0
  };

  /**
   * Count active filters (non-empty, non-comment lines)
   */
  function countActiveFilters(text) {
    const lines = text.split('\n');
    return lines.filter(line => {
      const trimmed = line.trim();
      return trimmed !== '' && !trimmed.startsWith('//');
    }).length;
  }

  /**
   * Update filter count display for a specific filter type
   */
  function updateFilterCount(filterType) {
    const editor = jsEditors[filterType];
    if (!editor) return;

    const count = countActiveFilters(editor.getValue());
    filterCounts[filterType] = count;

    // Update count text above editor
    const countElement = $(`${filterType}-filter-count`);
    if (countElement) {
      const countText = count === 0 ? 'No active filters' :
                        count === 1 ? '1 active filter' :
                        `${count} active filters`;
      countElement.querySelector('span').textContent = countText;
    }

    // Update tab badge
    updateTabBadge(filterType, count);
  }

  /**
   * Update the badge count in tab label
   */
  function updateTabBadge(filterType, count) {
    const badgeId = `tab-${filterType === 'channelName' ? 'channel-name' :
                          filterType === 'videoId' ? 'video-id' :
                          filterType === 'channelId' ? 'channel-id' : filterType}-badge`;
    const badge = $(badgeId);
    if (badge) {
      badge.textContent = count > 0 ? `(${count})` : '';
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
  }

  /**
   * Update all filter counts
   */
  function updateAllFilterCounts() {
    textAreas.forEach(filterType => {
      updateFilterCount(filterType);
    });
  }

  /**
   * Get placeholder text for each filter type
   */
  function getPlaceholderText(filterType) {
    const placeholders = {
      title: "Example: clickbait video\nExample with regex: /\\[GONE WRONG\\]/i",
      channelName: "Example: spam channel name\nExample: Annoying YouTuber",
      videoId: "Example: dQw4w9WgXcQ\nPaste video IDs from YouTube URLs",
      channelId: "Example: UC_x5XG1OV2P6uZZ5FSM9Ttw\nPaste channel IDs from channel URLs",
      comment: "Example: spam phrase\nExample: buy now"
    };
    return placeholders[filterType] || "";
  }

  function detectColorScheme(){
    let theme="light";

    if(storageData.uiTheme){
      theme = storageData.uiTheme;
    } else if(!window.matchMedia) {
      theme = "light";
    } else if(window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }

    if (!storageData.uiTheme) {
      storageData.uiTheme = theme;
      saveData();
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".CodeMirror").forEach((area) => {
      if (theme === "dark") {
        area.classList.add('cm-darktheme');
      } else {
        area.classList.remove('cm-darktheme');
      }
    });

  }

  async function loadData() {
    storageData = await window.storageManager.getConfig();
    detectColorScheme();
    checkForLogin();

    // Initialize sync status UI
    setTimeout(() => {
      updateSyncStatus();
    }, 100);
  }

  async function saveData(label = undefined) {
    if (!isLoggedIn) return;
    await window.storageManager.setConfig(storageData);
    if (label !== undefined) setLabel(label, 'Options Saved');
  }

  /**
   * Handle sync toggle enable/disable
   */
  async function handleSyncToggle(enabled) {
    if (enabled) {
      const result = await window.storageManager.enableSync();

      if (result.needsResolution) {
        // Show conflict resolution UI
        showConflictDialog(result.localConfig, result.syncConfig);
      } else {
        setLabel('status_save', 'Sync enabled');
        updateSyncStatus();
      }
    } else {
      await window.storageManager.disableSync();
      setLabel('status_save', 'Sync disabled');
      updateSyncStatus();
    }
  }

  /**
   * Update sync status UI elements
   */
  async function updateSyncStatus() {
    const status = await window.storageManager.getSyncStatus();

    // Update UI elements if they exist
    const syncEnabledCheckbox = $('sync-enabled');
    const syncQuota = $('sync-quota');
    const syncLastSync = $('sync-last-sync');
    const syncDetails = $('sync-details');

    if (syncEnabledCheckbox) {
      syncEnabledCheckbox.checked = status.enabled;
    }

    if (syncQuota) {
      syncQuota.textContent = `${status.quotaPercent}%`;
    }

    if (syncLastSync && status.lastSyncAt) {
      const lastSync = new Date(status.lastSyncAt);
      syncLastSync.textContent = lastSync.toLocaleString();
    }

    if (syncDetails) {
      syncDetails.style.display = status.enabled ? 'block' : 'none';
    }
  }

  /**
   * Show conflict resolution dialog
   */
  function showConflictDialog(localConfig, syncConfig) {
    const modal = $('conflict-modal');
    if (!modal) {
      console.error('Conflict modal not found in DOM');
      return;
    }

    modal.style.display = 'block';

    const useLocalBtn = $('use-local-btn');
    const useCloudBtn = $('use-cloud-btn');
    const cancelSyncBtn = $('cancel-sync-btn');

    if (useLocalBtn) {
      useLocalBtn.onclick = async () => {
        await window.storageManager.setConfig(localConfig);
        modal.style.display = 'none';
        setLabel('status_save', 'Local config uploaded');
        updateSyncStatus();
      };
    }

    if (useCloudBtn) {
      useCloudBtn.onclick = async () => {
        storageData = syncConfig;
        populateForms();
        await saveForm();
        modal.style.display = 'none';
        setLabel('status_save', 'Cloud config downloaded');
        updateSyncStatus();
      };
    }

    if (cancelSyncBtn) {
      cancelSyncBtn.onclick = async () => {
        await window.storageManager.disableSync();
        modal.style.display = 'none';
        const syncEnabledCheckbox = $('sync-enabled');
        if (syncEnabledCheckbox) {
          syncEnabledCheckbox.checked = false;
        }
        updateSyncStatus();
      };
    }
  }

  function saveForm() {
    textAreas.forEach((v) => {
      storageData.filterData[v] = multilineToArray(jsEditors[v].getValue());
    });

    const vidLenMin = parseInt($('vidLength_0').value, 10);
    const vidLenMax = parseInt($('vidLength_1').value, 10);

    storageData.filterData.vidLength   = [vidLenMin, vidLenMax];
    storageData.filterData.javascript  = jsEditors['javascript'].getValue();

    storageData.uiTheme = $('ui_theme').value;

    storageData.uiPass = $('pass_save').value;
    storageData.options.trending = $('disable_trending').checked;
    storageData.options.shorts = $('disable_shorts').checked;
    storageData.options.movies = $('disable_movies').checked;
    storageData.options.mixes = $('disable_mixes').checked;
    storageData.options.autoplay = $('autoplay').checked;
    storageData.options.suggestions_only = $('suggestions_only').checked;
    storageData.options.disable_db_normalize = $('disable_db_normalize').checked;
    storageData.options.disable_on_history = $('disable_on_history').checked;
    storageData.options.disable_you_there = $('disable_you_there').checked;
    storageData.options.block_feedback = $('block_feedback').checked;
    storageData.options.enable_javascript = $('enable_javascript').checked;
    storageData.options.block_message = $('block_message').value;
    storageData.options.vidLength_type = $('vidLength_type').value;
    storageData.options.percent_watched_hide = parseInt($('percent_watched_hide').value, 10);

    saveData('status_save');
    detectColorScheme();
    updateAllFilterCounts(); // Update counts after save
    $('save_btn').classList.add('disabled-btn');
  }

  function loginForm() {
    const savedPass = storageData.uiPass;
    if (savedPass && savedPass === $('pass_login').value) {
      unlockPage();
      isLoggedIn = true;
    } else {
      setLabel('status_login', 'Incorrect Password');
    }
  }

  function unlockPage() {
    populateForms();
    $('options').setAttribute('style', '');
    $('login').setAttribute('style', 'display: none');
  }

  function checkForLogin() {
    if (has.call(storageData, 'uiPass') && storageData.uiPass !== '') {
      $('login').setAttribute('style', '');
    } else {
      isLoggedIn = true;
      unlockPage();
    }
  }

  function populateForms(obj = undefined) {
    textAreas.forEach((v) => {
      const content = get(`filterData.${v}`, [], obj);
      jsEditors[v].setValue(content.join('\n'));
    });

    const vidLength = get('filterData.vidLength', [NaN, NaN], obj);
    $('vidLength_0').value         = vidLength[0];
    $('vidLength_1').value         = vidLength[1];
    $('vidLength_type').value      = get('options.vidLength_type', 'allow', obj);

    $('ui_theme').value            = get('uiTheme', 'light', obj);
    $('pass_save').value           = get('uiPass', '', obj);
    $('disable_trending').checked  = get('options.trending', false, obj);
    $('disable_shorts').checked    = get('options.shorts', false, obj);
    $('disable_movies').checked    = get('options.movies', false, obj);
    $('disable_mixes').checked     = get('options.mixes', false, obj);
    $('autoplay').checked          = get('options.autoplay', false, obj);
    $('disable_db_normalize').checked = get('options.disable_db_normalize', false, obj);
    $('disable_on_history').checked = get('options.disable_on_history', false, obj);
    $('disable_you_there').checked   = get('options.disable_you_there', false, obj);
    $('suggestions_only').checked  = get('options.suggestions_only', false, obj);
    $('block_feedback').checked    = get('options.block_feedback', false, obj);
    $('enable_javascript').checked = get('options.enable_javascript', false, obj);
    $('block_message').value       = get('options.block_message', '', obj);
    $('percent_watched_hide').value = get('options.percent_watched_hide', NaN, obj);

    const jsContent = get('filterData.javascript', defaultJSFunction, obj);
    jsEditors['javascript'].setValue(jsContent);

    if ($('enable_javascript').checked) {
      $('advanced_tab').style.removeProperty("display");
    }

    setTimeout(_=>Object.values(jsEditors).forEach((v) => v.refresh()), 1); // https://stackoverflow.com/a/19970695
    updateAllFilterCounts(); // Update counts after data load
    $('save_btn').classList.add('disabled-btn');
  }

  // !! Helpers
  function $(id) {
    return document.getElementById(id);
  }

  function multilineToArray(text) {
    return text.replace(/\r\n/g, '\n').split('\n').map(x => x.trim());
  }

  function get(path, def = undefined, obj = undefined) {
    const paths = (path instanceof Array) ? path : path.split('.');
    let nextObj = obj || storageData;

    const exist = paths.every((v) => {
      if (nextObj instanceof Array) {
        const found = nextObj.find(o => has.call(o, v));
        if (found === undefined) return false;
        nextObj = found[v];
      } else {
        if (!nextObj || !has.call(nextObj, v)) return false;
        nextObj = nextObj[v];
      }
      return true;
    });

    return exist ? nextObj : def;
  }

  function setLabel(label, text) {
    const status = $(label);
    status.textContent = text;
    status.classList.add('alert-animate');
    setTimeout(() => {
      status.textContent = '';
      status.classList.remove('alert-animate');
    }, 1000);
  }

  function saveFile(data, fileName) {
    const a = document.createElement('a');
    const blob = new Blob([JSON.stringify(data)], { type: 'octet/stream' });
    const url = URL.createObjectURL(blob);
    setTimeout(() => {
      a.href = url;
      a.download = fileName;
      const event = new MouseEvent('click');
      a.dispatchEvent(event);
    }, 0);
  }

  function importOptions(evt) {
    const files = evt.target.files;
    const f = files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      let json;
      try {
        json = JSON.parse(e.target.result);
        if (json.filterData && json.options) {
          populateForms(json);
          saveForm();
          updateAllFilterCounts(); // Update counts after import
        }
      } catch (ex) {
        alert('This is not a valid TunTun Extension backup');
      }
    };
    reader.readAsText(f);
  }

  function cmResizer(cm, resizer) {
    const MIN_HEIGHT = 220;

    function heightOf(element) {
      return parseInt(window.getComputedStyle(element).height.replace(/px$/, ""));
    }

    function onDrag(e) {
      cm.display.scroller.style.maxHeight = "100%";
      cm.setSize(null, Math.max(MIN_HEIGHT, (cm.start_h + e.y - cm.start_y)) + "px");
    }

    function onRelease(e) {
      document.body.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", onRelease);
    }

    resizer.addEventListener("mousedown", function (e) {
      cm.start_y = e.y;
      cm.start_h = heightOf(cm.display.wrapper);

      document.body.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onRelease);
    });
  }

  textAreas.concat('javascript').forEach((v) => {
    const editorOptions = {
      mode: v === 'javascript' ? 'javascript' : 'blocktube',
      matchBrackets: true,
      autoCloseBrackets: true,
      lineNumbers: true,
      styleActiveLine: true,
      lineWrapping: true,
      extraKeys: {
        F11: function(cm) {
          if (cm.getOption("fullScreen")) {
            cm.display.scroller.style.maxHeight = cm.start_h || "200px";
          } else {
            cm.display.scroller.style.maxHeight = "100%";
          }
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        Esc: function(cm) {
          if (cm.getOption("fullScreen")) {
            cm.display.scroller.style.maxHeight = cm.start_h || "200px";
            cm.setOption("fullScreen", false);
          }
        }
      }
    };

    // Add placeholder for non-javascript editors
    if (v !== 'javascript') {
      editorOptions.placeholder = getPlaceholderText(v);
    }

    jsEditors[v] = CodeMirror.fromTextArea($(v), editorOptions);
    cmResizer(jsEditors[v], $(v + '_resizer'));
    jsEditors[v].on("change",() => {
      $('options').dispatchEvent(new Event('change', { bubbles: true }));
      // Update filter count on change
      if (v !== 'javascript') {
        updateFilterCount(v);
      }
    });
  });

  // !! Start
  document.addEventListener('DOMContentLoaded', loadData);

  $('options').addEventListener('submit', (evt) => {
    evt.preventDefault();
  });

  $('save_btn').addEventListener('click', (evt) => {
    if(evt.target.classList.contains('disabled-btn')) return;
    saveForm();
  });

  $('login').addEventListener('submit', (evt) => {
    evt.preventDefault();
    loginForm();
  });

  $('export').addEventListener('click', () => {
    if (isLoggedIn) {
      saveForm();
      saveFile(storageData, 'blocktube_backup.json');
    }
  });

  $('import').addEventListener('click', () => {
    if (isLoggedIn) {
      $('myfile').click();
    }
  });

  $('myfile').addEventListener('change', importOptions, false);

  $('enable_javascript').addEventListener('change', (v) => {
    if (v.target.checked) {
      $('advanced_tab').style.removeProperty("display");
      setTimeout(_ => jsEditors['javascript'].refresh(), 1);
    }
    else {
      $('advanced_tab').style.display = "none";
    }
  })

  // Sync toggle event listener
  const syncEnabledCheckbox = $('sync-enabled');
  if (syncEnabledCheckbox) {
    syncEnabledCheckbox.addEventListener('change', (evt) => {
      handleSyncToggle(evt.target.checked);
    });
  }

  $('options').addEventListener('change', (evt) => {
    if (evt.target.tagName === 'INPUT' && evt.target.getAttribute('type') === 'radio') return;
    $('save_btn').classList.remove('disabled-btn');
  });

  function initTabs(name) {
    const element = document.getElementById(name);
    element.querySelectorAll("input[type='radio']").forEach((box) => {
      box.addEventListener('click', (e) => {
        element.querySelectorAll('section').forEach((tab) => {
          tab.style.display = "none";
        });

        const tabName = e.target.getAttribute('aria-controls');
        const tab = document.getElementById(tabName);
        tab.style.display = 'block';

        tab.querySelectorAll('textarea').forEach((txtarea) => {
          const areaName = txtarea.getAttribute('id');
          if (has.call(jsEditors, areaName)) {
            jsEditors[areaName].refresh()
          }
        });

      });

      if (box.checked) {
        box.click();
      }
    });
  }

  initTabs('tabbed-filters-parent');

}());
