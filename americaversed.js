//document.body.style.border = "5px solid blue";
//let elements = document.body.innerHTML.search("Trump");
/*
var html = document.body.innerHTML;
regex = /Trump/g;
wrapped = html.replace(regex, function (name) {
	name = name.trim();
	name = ' SOME FUCKING IDIOT ';
	return name;
});
document.body.innerHTML = wrapped;
*/


let registry = {
    poem: ["the boy stood on the burning deck", "hats and hats and hats"],
    _num: 0,
    num: function() {
        this._num++;
        return this._num;
    },
    playruns: 0,
    pageenabled: true,
    reparseswitch: false
}

browser.runtime.onMessage.addListener(data => {
  //const { trigger } = data;
  if (data.trigger === 'tempreveal') {
    tempReveal();
    window.setTimeout(tempRestore, 10000);
  }
  if (data.trigger === 'showpoem') {
    buildPoemModal();
  }
  if (data.trigger === 'menuchangestatusstate') {
    if (data.enabled && ! registry.pageenabled) {
        // findme  
    } else {

    }
  }

});

let tempReveal = function() {
    //const els = document.getElementsByClassName("mapa-managed");
    const els = document.querySelectorAll(".mapa-managed");
    for (let i = 0; i < els.length; i++) {
      let el = els[i];
      el.innerHTML = el.dataset['mapa_orig'];
    }
}

async function buildPoemModal() {
    url = browser.runtime.getURL("modal.html");
    return fetch(chrome.runtime.getURL('modal.html'))
        .then(resp => resp.text())
        .then(html => {
            let modal = document.createElement("div");
            let smodal = modal.attachShadow({mode: "open"});
            smodal.innerHTML = html;
            document.body.appendChild(modal);

            let cssURL = browser.runtime.getURL('modal.css')
            smodal.querySelector(".modal").insertAdjacentHTML(
                "beforebegin",
                "<link rel='stylesheet' href='"+ cssURL +"' />");
            smodal.querySelector(".modal").style.display = "block";
            let poem = registry.poem.lines;
            let spacepoem = [];
            let regex = /  |\t/;
            for (let i=0; i < poem.length; i++) {
                spacepoem.push(poem[i].replace(regex, "&nbsp;&nbsp;"));
            }
            console.log("space poem: ");
            console.log(spacepoem);
            let pagestr = "<h2>"+registry.poem.title+"</h2>\n\n";
            pagestr += "<p>by "+registry.poem.author+"</p>\n\n";
            pagestr += "<div>"+spacepoem.join("<br>")+"</div>\n";
            smodal.querySelector(".modal-body").innerHTML = pagestr;
            smodal.querySelector(".close").onclick = () => modal.remove();
        ;
        });
}

let tempRestore = function() {
    const els = document.querySelectorAll(".mapa-managed");
    for (let i = 0; i < els.length; i++) {
      let el = els[i];
      el.innerHTML = el.dataset['mapa_poem'];
    }
}

let getLinesRandom = function() {
    let len = registry.poem.lines.length;
    let fragment = null;
    if (len <= 2) {
        fragment = registry.poem.lines;
    } else {
        lincount = getRandomInt(len - 2);
        console.log("lincount" + lincount);
        fragment = registry.poem.lines.slice(lincount, lincount+2);
    }

    let str = fragment.join("\n");
    //console.log("str is " + str);
    return str;
}

let getLines = function() {
    let len = registry.poem.lines.length;
    if (len <= 2) {
        return registry.poem.lines.join("\n");
    }

    if (! this.count || this.count >= len) {
        this.count=0;
    }
    let fragment = null;
 
    lincount = this.count;
    this.count += 2;
    fragment = registry.poem.lines.slice(lincount, lincount+2);
    return fragment.join(" / ");
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
    let ret = [];
    for (const line of json[0].lines) {
        if (line) {
            ret.push(line);
        }
    }
    return ret;
  } catch (error) {
    console.error(error.message);
  }
}

let applyOverwrite = function() {
    console.log("applying");
    let keyword = "Trump";
    /*
    var xpath = "//*[contains(text(), \""+keyword+"\")";
    xpath +=       " or ";
    xpath +=       "contains(@aria-label, \""+keyword+"\")]";
    var xpath = "//*[contains(text(), \""+keyword+"\")]";
    var xpath = "//*[contains(normalize-space(text()), \""+keyword+"\")]";
    var xpath = "//*[contains(normalize-space(@text), \""+keyword+"\")]";
    */
    var xpath = "//*[text()[contains(., \""+keyword+"\")]]";
    const nodesSnapshot = document.evaluate(
      xpath,
      document.body,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );

    //console.log(JSON.stringify(iterator));
    let els = [];
    //let msg = "More Tiresome MAGA Nonsense";
    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
      let el = nodesSnapshot.snapshotItem(i)


      // prevent element from being re-mangled on future change
      // if (el.dataset.mapa_managed) {
      if (el.classList.contains("mapa-managed") ) {
        continue;
      }

      el.dataset.mapa_managed = "yes";
      el.classList.add("mapa-managed");
      el.dataset.mapa_orig = el.innerHTML;
      let lines = getLines();
      let msg = lines;
      /*
      let reveal = document.createElement("span");
      reveal.setAttribute("title", el.innerHTML);
      reveal.appendChild(document.createTextNode("[R]"));
      */


      el.innerHTML = '';
      //el.appendChild(reveal);
      el.appendChild(document.createTextNode(msg))
      el.dataset.mapa_poem = el.innerHTML;

      /*
      reveal.addEventListener("click", function(e) {
        alert(el.dataset.mapa_orig);
        console.log("clicked");
        e.preventDefault(); 
      }, true);
      */

      el.addEventListener("click", function() {
        alert(el.dataset.mapa_orig);
        return false; 
      });
      //nodesSnapshot.snapshotItem(i).setAttribute("aria-label", msg);
      //console.log(msg);
    }
    registry.reparseswitch = false;
}

// Select the node that will be observed for mutations
const targetNode = document;

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      console.log("A child node has been added or removed.");
      console.log("setting reparseswitch to true");
      registry.reparseswitch = true;
    }
// else if (mutation.type === "attributes") {
//      console.log(`The ${mutation.attributeName} attribute was modified.`);
//      reparseswitch = true;
//    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
let req = new XMLHttpRequest();
req.onload = function(e) {
    //console.log("here");
    //if (req.readyState === 4) {
        var response = req.responseText;
        //var json = JSON.parse(response);
        //console.log(JSON.stringify(req.responseText));
    //}
};


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let run = function() {
    //console.log("running");
    if (registry.reparseswitch || registry.playruns < 5) {
        console.log("applying");
        applyOverwrite();
        registry.playruns++;

    } else {
        //console.log("no apply");
    }
    window.setTimeout(run, 1000);
}

async function setPoem(msg) {
    registry.poem=msg;
}

// send background script the enabled state (so that it shows the correct menu toggle)
let sending = browser.runtime.sendMessage({
        trigger: "setEnabledState", setting: registry.pageenabled
    });
sending.then(function(msg) {console.log("got monster: " + msg.response);}, function() {});

// get poem, apply it, watch for page changes
const loadAndRun = function() {
    downloadPoem()
        .then(
            async function(msg) {
                await setPoem(msg);
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
if (registry.pageenabled) {
    loadAndRun();
}

// Later, you can stop observing
// observer.disconnect();

//for (let x=2000; x < 10000; x += 1000) {
//    window.setTimeout(go, x);
//}
/*
try {
  let thisNode = iterator.iterateNext();

  while (thisNode) {
    console.log(thisNode.textContent);
    thisNode = iterator.iterateNext();
	els.push(thisNode);
  }
} catch (e) {
  console.error(`Error: Document tree modified during iteration ${e}`);
}

for (el in els) {
	el.innerHTML = "More Tiresome MAGA bollocks";
}
*/
