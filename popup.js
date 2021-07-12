/**
 * Popup script gets executed only once the user click onto the Chrome Extension Icon to activate the popup
 */
var isCopyEnabled = false;
var infoElem = document.getElementById("message-panel");
var btnElem = document.getElementById("execute-copy"); 
btnElem.addEventListener("click", async (evt) => {
  evt.stopPropagation();
  if (isCopyEnabled) {
    chrome.runtime.sendMessage({messageType: 'ExecuteCopy'});
  }
});

function addInfo(message) {
  var divElem = document.createElement("div");
  divElem.classList.add("info");
  divElem.innerText = message;
  infoElem.appendChild(divElem);
} 

function addWarning(message) {
  var divElem = document.createElement("div");
  divElem.classList.add("warning");
  divElem.innerText = message;
  infoElem.appendChild(divElem);
}

function clearInfo() {
  infoElem.innerHTML = '';
}


clearInfo();
addInfo("Extension startup ...");


chrome.runtime.sendMessage({messageType: 'GetTabIds'}, function(response) {
  if (response) {
    if (response.isoTabId != null) {
      addInfo("ISO tab detected");
    } else {
      addWarning("ISO tab not detected. Open a new tab and connect to ISO");
    }
    if (response.eformTabId != null) {
      addInfo("EFORM tab detected");
    } else {
      addWarning("EFORM tab not detected. Open a new tab and connect to EFORM");
    }
  
    
    if ((response.isoTabId != null) && (response.eformTabId != null) ) {
      isCopyEnabled = true;
      btnElem.classList.remove("disable");
      addInfo("Click onto the button to launch the copy execution");
    } else {
      isCopyEnabled = false;
      btnElem.classList.add("disable");
    }  
  }
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msgType = request.messageType;
    if (msgType === "InfoMessage") {
      addInfo(request.message);
    } else if (msgType === "WarnMessage") {
      addWarning(request.message);
    }
  }
);
