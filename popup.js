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
var clearBtnElem = document.getElementById("clear"); 
clearBtnElem.addEventListener("click", async (evt) => {
  evt.stopPropagation();
  clearInfo();
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
  chrome.runtime.sendMessage({messageType: 'ClearMessageHistory'});
}

function processMessageRequest(messageRequest) {
  var msgType = messageRequest.messageType;
  if (msgType === "InfoMessage") {
    addInfo(messageRequest.message);
  } else if (msgType === "WarnMessage") {
    addWarning(messageRequest.message);
  }
}

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

    chrome.runtime.sendMessage({messageType: 'GetMessageHistory'}, function(response) {
      if (response) {
        for (var i=0; i<response.length; i++) {
          var message = response[i];
          processMessageRequest(message);
        }
      }
    });
    
  }
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    processMessageRequest(request);
  }
);
