browser.contextMenus.create(
  {
    id: "america-versed-menu1",
    title: "America Versed",
    contexts: ["page"],
  }
);

browser.contextMenus.create(
    {
    id: "america-versed-tempreveal",
    parentId: "america-versed-menu1",
    title: "Turn off verse for 10 seconds",
    contexts: ["page"]
    }
);

browser.contextMenus.create(
    {
    id: "america-versed-showpoem",
    parentId: "america-versed-menu1",
    title: "Show page poem",
    contexts: ["page"]
    }
);

browser.contextMenus.create(
  {
    id: "america-versed-pageenable",
    parentId: "america-versed-menu1",
    type: "checkbox",
    title: "Active for page",
    contexts: ["all"],
    checked: true,
  }
);

browser.tabs.onActivated.addListener(
    (info) => {
        browser.tabs.sendMessage(info.tabId, { trigger: 'tabactivated' });
    }
)

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId == "america-versed-tempreveal") {
    browser.tabs.sendMessage(tab.id, { trigger: 'tempreveal' });
  }
  if (info.menuItemId == "america-versed-showpoem") {
    browser.tabs.sendMessage(tab.id, { trigger: 'showpoem' });
  }
  if (info.menuItemId == "america-versed-pageenable") {
    console.log("checked: " + info.checked);
    browser.tabs.sendMessage(tab.id, { trigger: 'menuchangestatusstate', status: info.checked});
  }
});

function handleMessage(request, sender, sendResponse) {
  if (request.trigger == "setEnabledState") {
      let updating = browser.contextMenus.update("america-versed-pageenable", {
          checked: request.setting
        });
        const callback = function() {}
        updating.then(callback, callback);
  }
}
browser.runtime.onMessage.addListener(handleMessage);



/*
browser.runtime.onMessage.addListener(data => {
  const { trigger } = data;
  alert(trigger);
});
*/


function getCurrentTab() {
  return browser.tabs.query({ currentWindow: true, active: true });
}


