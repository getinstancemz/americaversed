
const americaversed = (function() {
    // private but settable
    let _pageenabled =  true;
    let _poem =  { author: "bob", lines: ["the boy stood on the burning deck", "hats and hats and hats"], title: "the boy" };

    /**
     * accessors
     */

    let pageenabled = function(val) {
        if (typeof val !== 'undefined') {
            _pageenabled = val;
        }
        return _pageenabled;
    };

    let poem = function(newpoem) {
        if (typeof newpoem !== 'undefined') {
            _poem = newpoem;
        }
        return _poem;
    };

    /**
     * poem related
     */
    let downloadPoem = async () => {
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
    };

    let tearDown = function() {
        const els = document.querySelectorAll(".mapa-managed");
        for (let i = 0; i < els.length; i++) {
            let el = els[i];
            el.innerHTML = el.dataset['mapa_orig'];
            el.classList.remove("mapa-managed");
        }
    }

    let tempReveal = function() {
        //const els = document.getElementsByClassName("mapa-managed");
        const els = document.querySelectorAll(".mapa-managed");
        for (let i = 0; i < els.length; i++) {
            let el = els[i];
            el.innerHTML = el.dataset['mapa_orig'];
        }
    }

    let tempRestore = function() {
        const els = document.querySelectorAll(".mapa-managed");
        for (let i = 0; i < els.length; i++) {
            let el = els[i];
            el.innerHTML = el.dataset['mapa_poem'];
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
    let reparseWaiting = false;
    let queueReparse = function() {
        if (! reparseWaiting) {
            reparseWaiting = setTimeout(() => { applyQueuedReparse(); }, 3000)
        }
    }
    let applyQueuedReparse = function() {
        console.log("SUCCESSFULLY APPLIED REPARSEWAITING")
        applyOverwrite();
        reparseWaiting = false;
    }

    /**
     * operations
     */


    return {
        pageenabled: pageenabled,
        applyOverwrite: applyOverwrite,
        tempReveal: tempReveal,
        tempRestore: tempRestore,
        disable: disable,
        buildPoemModal: buildPoemModal,
        downloadPoem: downloadPoem,
        queueReparse: queueReparse,
        tearDown: tearDown,

        // getsetters
        poem: poem,
    };
}());

// findme

/**
 * events and messaging
 */
browser.runtime.onMessage.addListener(data => {
  if (data.trigger === 'tempreveal') {
    americaversed.tempReveal();
    window.setTimeout(americaversed.tempRestore, 10000);
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
        mutationobserver.unwatch();
    }
  }

  if (data.trigger === 'poweroff') {
    // run() checks whether to proceed
    americaversed.tearDown();
    mutationobserver.unwatch();
  }

  if (data.trigger === 'poweron') {
    // run() checks whether to proceed
    run();
  }
});


const mutationobserver = (function() {
    // Select the node that will be observed for mutations
    let targetNode = document;

    // Options for the observer (which mutations to observe)
    let config = {attributes: true, childList: true, subtree: true};

    // Callback function to execute when mutations are observed
    let mutation_callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                console.log("A child node has been added or removed.");
                americaversed.queueReparse(true);
            }
    // else if (mutation.type === "attributes") {
    //      console.log(`The ${mutation.attributeName} attribute was modified.`);
    //      reparseswitch = true;
    //    }
        }
    };
    // Create an observer instance linked to the callback function
    let observer = new MutationObserver(mutation_callback);
    let req = new XMLHttpRequest();
    req.onload = function(e) {
        //if (req.readyState === 4) {
        var response = req.responseText;
        //}
    };
    let watch = function() {
        observer.observe(targetNode, config);
    };
    let unwatch = function() {
        observer.disconnect();
    };
    return {
        watch: watch,
        unwatch: unwatch
    }
})();

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
        americaversed.applyOverwrite();
        /*
            console.log("applying");
            americaversed.applyOverwrite();

        }
        */
        //window.setTimeout(run, 1000);
    }
}
// send background script the enabled state (so that it shows the correct menu toggle)
browser.runtime.sendMessage({
    trigger: "setEnabledState", setting: americaversed.pageenabled()
});

async function setPoem2(msg) {
    americaversed.poem(msg);
}

// get poem, apply it, watch for page changes
const loadAndRun = function() {
    console.log("starting");
    if (! americaversed.pageenabled()) {
        return;
    }
    americaversed.downloadPoem()
        .then(
            msg => americaversed.poem(msg),
        ).then(
            () => run()
        ).then(
            () => mutationobserver.watch()
        );
}

loadAndRun();
