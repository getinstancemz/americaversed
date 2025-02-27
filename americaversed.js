
const americaversed = (function() {
    // private but settable
    let _pageenabled =  true;
    let _poem =  { author: "bob", lines: ["the boy stood on the burning deck", "hats and hats and hats"], title: "the boy" };
    let _reparseswitch = false;
    let _playruns = 0;

    /**
     * accessors
     */

    let pageenabled = function(val) {
        if (typeof val !== 'undefined') {
            _pageenabled = val;
        }
        return _pageenabled;
    };

    let reparseswitch = function(val) {
        if (typeof val !== 'undefined') {
            _reparseswitch = val;
        }
        return _reparseswitch;
    };

    let poem = function(newpoem) {
        if (typeof newpoem !== 'undefined') {
            _poem = newpoem;
        }
        return _poem;
    };

    let playruns = function(val) {
        if (typeof val !== 'undefined') {
            _playruns = val;
        }
        return _playruns;
    };


    let buildPoemModal = async () => {
        return fetch(chrome.runtime.getURL('americaversed-poem.html'))
            .then(resp => resp.text())
            .then(html => {
                let modal = document.createElement("div");
                let smodal = modal.attachShadow({mode: "open"});
                smodal.innerHTML = html;
                document.body.appendChild(modal);

                let cssURL = browser.runtime.getURL('americaversed.css')
                smodal.querySelector(".mapa-modal").insertAdjacentHTML(
                    "beforebegin",
                    "<link rel='stylesheet' href='"+ cssURL +"' />");
                smodal.querySelector(".mapa-modal").style.display = "block";
                console.log(_poem);
                let spacepoem = [];
                let regex = /  |\t/;
                for (let i=0; i < _poem.lines.length; i++) {
                    spacepoem.push(_poem.lines[i].replace(regex, "&nbsp;&nbsp;"));
                }
                console.log("space poem: ");
                console.log(spacepoem);
                let pagestr = "<h2>"+americaversed.poem().title+"</h2>\n\n";
                pagestr += "<p><em>by "+americaversed.poem().author+"</em></p>\n\n";
                pagestr += "<div class='mapa-poem'>"+spacepoem.join("<br>")+"</div>\n";
                smodal.querySelector(".mapa-modal-body").innerHTML = pagestr;
                smodal.querySelector(".mapa-close").onclick = () => modal.remove();
            });
    }

    /**
     * manipulate page
     */
    let applyOverwrite = function() {
        console.log("applying");
        let keyword = "Trump";
        var xpath = "//*[text()[contains(., \""+keyword+"\")]]";
        const nodesSnapshot = document.evaluate(
            xpath,
            document.body,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );

        for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
            let el = nodesSnapshot.snapshotItem(i)


            // prevent element from being re-mangled on future change
            if (el.classList.contains("mapa-managed") ) {
                continue;
            }

            el.dataset.mapa_managed = "yes";
            el.classList.add("mapa-managed");
            el.dataset.mapa_orig = el.innerHTML;
            let msg = getLines();

            el.innerHTML = '';
            el.appendChild(document.createTextNode(msg))
            el.dataset.mapa_poem = el.innerHTML;

            // TODO remove this
            el.addEventListener("click", function() {
                return false;
            });
        }
        _reparseswitch = false;
    };

    let tempReveal = function() {
        //const els = document.getElementsByClassName("mapa-managed");
        const els = document.querySelectorAll(".mapa-managed");
        for (let i = 0; i < els.length; i++) {
            let el = els[i];
            el.innerHTML = el.dataset['mapa_orig'];
        }
    }

    let disable = function() {
        tearDown();
        _pageenabled = false;
    }

    // private
    let getLines = function() {
        let len = _poem.lines.length;
        if (len <= 2) {
            return _poem.lines.join("\n");
        }

        if (! this.count || this.count >= len) {
            this.count=0;
        }
        let fragment;

        lincount = this.count;
        this.count += 2;
        fragment = _poem.lines.slice(lincount, lincount+2);
        return fragment.join(" / ");
    }

    return {
        pageenabled: pageenabled,
        applyOverwrite: applyOverwrite,
        tempReveal: tempReveal,
        disable: disable,
        buildPoemModal: buildPoemModal,

        // getsetters
        reparseswitch: reparseswitch,
        playruns: playruns,
        poem: poem,
    };
}());

// findme

// events
browser.runtime.onMessage.addListener(data => {
  if (data.trigger === 'tempreveal') {
    americaversed.tempReveal();
    window.setTimeout(tempRestore, 10000);
  }

  if (data.trigger === 'showpoem') {
    americaversed.buildPoemModal();
  }

  if (data.trigger === 'menuchangestatusstate') {

    console.log("data:");
    console.log(data);

    if (data.status && ! americaversed.pageenabled()) {
        americaversed.pageenabled(true);
        run();
    } else {
        americaversed.disable();
    }
  }

  if (data.trigger === 'poweroff') {
    // run() checks whether to proceed
    tearDown();
  }

  if (data.trigger === 'poweron') {
    // run() checks whether to proceed
    run();
  }
});




let tearDown = function() {
    const els = document.querySelectorAll(".mapa-managed");
    for (let i = 0; i < els.length; i++) {
      let el = els[i];
      el.innerHTML = el.dataset['mapa_orig'];
      el.classList.remove("mapa-managed");
    }
}


let tempRestore = function() {
    const els = document.querySelectorAll(".mapa-managed");
    for (let i = 0; i < els.length; i++) {
      let el = els[i];
      el.innerHTML = el.dataset['mapa_poem'];
    }
}

async function downloadPoem() {
  let url = "https://poetrydb.org/random";
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    console.log("LINES:"+JSON.stringify(json));
    return json[0];
  } catch (error) {
    console.error(error.message);
  }
}


// Select the node that will be observed for mutations
const targetNode = document;

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const mutation_callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      console.log("A child node has been added or removed.");
      console.log("setting reparseswitch to true");
      americaversed.reparseswitch(true);
    }
// else if (mutation.type === "attributes") {
//      console.log(`The ${mutation.attributeName} attribute was modified.`);
//      reparseswitch = true;
//    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(mutation_callback);
let req = new XMLHttpRequest();
req.onload = function(e) {
    //if (req.readyState === 4) {
    var response = req.responseText;
    //}
};



let run = function() {
    browser.storage.sync.get("enabled").then(
        function(val) {
            let mainswitch = true;
            if (! val.hasOwnProperty("enabled")) {
                mainswitch = true;
            } else {
                mainswitch = val.enabled; 
            }
            //console.log(val);
            //console.log("running with mainswitch: "+ mainswitch);
            dorun(mainswitch);            
        }
    );

    function dorun(mainswitch) {
        if (! americaversed.pageenabled() || ! mainswitch) {
            console.log("will not run - disabled");
            console.log("local switch: "+americaversed.pageenabled());
            console.log("main  switch: "+mainswitch);
            return;
        }
        let myplayruns = americaversed.playruns();
        if (americaversed.reparseswitch() || myplayruns < 5) {
            console.log("applying");
            americaversed.applyOverwrite();
            americaversed.playruns(myplayruns+1);

        }
        window.setTimeout(run, 1000);
    }
}

// send background script the enabled state (so that it shows the correct menu toggle)
let sending = browser.runtime.sendMessage({
        trigger: "setEnabledState", setting: americaversed.pageenabled()
    });
sending.then(function() {}, function() {});

async function setPoem2(msg) {
    americaversed.poem(msg);
}

// get poem, apply it, watch for page changes
const loadAndRun = function() {
    downloadPoem()
        .then(
            async function(msg) {
                await setPoem2(msg);
            }
        ).then(
            function() {
                run()
            }
        );

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}

// start if page is enabled state
if (americaversed.pageenabled()) {
    loadAndRun();
}

// Later, you can stop observing
// observer.disconnect();

/*

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let getLinesRandom = function() {
    let len = americaversed.poem.lines.length;
    let fragment;
    if (len <= 2) {
        fragment = americaversed.poem.lines;
    } else {
        lincount = getRandomInt(len - 2);
        console.log("lincount" + lincount);
        fragment = americaversed.poem.lines.slice(lincount, lincount+2);
    }

    let str = fragment.join("\n");
    return str;
}

let applyOverwrite_depr = function() {
    console.log("applying");
    let keyword = "Trump";
    var xpath = "//*[text()[contains(., \""+keyword+"\")]]";
    const nodesSnapshot = document.evaluate(
      xpath,
      document.body,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );

    let els = [];
    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
      let el = nodesSnapshot.snapshotItem(i)


      // prevent element from being re-mangled on future change
      if (el.classList.contains("mapa-managed") ) {
        continue;
      }

      el.dataset.mapa_managed = "yes";
      el.classList.add("mapa-managed");
      el.dataset.mapa_orig = el.innerHTML;
      let lines = getLines();
      let msg = lines;

      el.innerHTML = '';
      el.appendChild(document.createTextNode(msg))
      el.dataset.mapa_poem = el.innerHTML;

      el.addEventListener("click", function() {
        alert(el.dataset.mapa_orig);
        return false;
      });
    }
    americaversed.reparseswitch(false);
}

async function buildPoemModal() {
    url = browser.runtime.getURL("americaversed-poem.html");
    return fetch(chrome.runtime.getURL('americaversed-poem.html'))
        .then(resp => resp.text())
        .then(html => {
            let modal = document.createElement("div");
            let smodal = modal.attachShadow({mode: "open"});
            smodal.innerHTML = html;
            document.body.appendChild(modal);

            let cssURL = browser.runtime.getURL('americaversed.css')
            smodal.querySelector(".mapa-modal").insertAdjacentHTML(
                "beforebegin",
                "<link rel='stylesheet' href='"+ cssURL +"' />");
            smodal.querySelector(".mapa-modal").style.display = "block";
            let mypoem = americaversed.poem();
            console.log(mypoem);
            let spacepoem = [];
            let regex = /  |\t/;
            for (let i=0; i < mypoem.lines.length; i++) {
                spacepoem.push(mypoem.lines[i].replace(regex, "&nbsp;&nbsp;"));
            }
            console.log("space poem: ");
            console.log(spacepoem);
            let pagestr = "<h2>"+americaversed.poem().title+"</h2>\n\n";
            pagestr += "<p><em>by "+americaversed.poem().author+"</em></p>\n\n";
            pagestr += "<div class='mapa-poem'>"+spacepoem.join("<br>")+"</div>\n";
            smodal.querySelector(".mapa-modal-body").innerHTML = pagestr;
            smodal.querySelector(".mapa-close").onclick = () => modal.remove();
        });
}
 */
