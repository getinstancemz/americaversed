
// on/off radio button
const switchon = document.querySelector("#av_popup_prefs_mainswitch_on");
const switchoff = document.querySelector("#av_popup_prefs_mainswitch_off");
let tab = null; 
getCurrentTab().then(
    function(newtab) {
        tab = newtab[0];
    }
);

// set the enable switch
browser.storage.sync.get("enabled").then(
    function(val) {
        let overrideon = false;
        if (! val.hasOwnProperty("enabled")) {
            browser.storage.sync.set({
                enabled: true
              });
            overrideon = true; 
        }
        console.log(val);
        if (val.enabled || overrideon) {
            console.log("entry state: enabled");
            switchon.checked = true; 
            switchoff.checked = false;       
        } else {
            console.log("entry state: disabled");
            switchon.checked = false; 
            switchoff.checked = true;       
        }
    }
);

// tell the main script about an off click
switchon.addEventListener("click", function(e) {
    console.log("setting enabled");
    browser.storage.sync.set({
        enabled: true
      });
      browser.tabs.sendMessage(tab.id, { trigger: 'poweron' });
    });

// tell the main script about an on click
switchoff.addEventListener("click", function(e) {
    console.log("setting disabled");
    browser.storage.sync.set({
        enabled: false 
      });
      browser.tabs.sendMessage(tab.id, { trigger: 'poweroff' });
    });


function getCurrentTab() {
  return browser.tabs.query({ currentWindow: true, active: true });
}

