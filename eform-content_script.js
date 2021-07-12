// Put all the javascript code here, that you want to execute after page load.
/*
function extractInput(label) {
    var labelElems = document.getElementsByTagName("label");
    for (var i = 0; i < labelElems.length; i++) {
        if (labelElems[i].innerText === label) {
            var inputElem = document.getElementById(labelElems[i].htmlFor);
            return inputElem.value;
        }
    }
    return null;
}

function collectEformData() {
    return {   companyName: extractInput('Name of company'),
        companyAddress: extractInput('Address'),
        companyCity: extractInput('City'),
        companyCountry: extractInput('Country'),
        companyProvince: extractInput('Province/State'),
        companyZip: extractInput('Postal/Zip'),
    };
}

console.log("##### EFORM content script start");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var messageType = request.messageType;
        if (messageType === "CollectEformData") {
            sendResponse(collectEformData());
        }
    }
);
*/

console.log("##### eform start");
if (window.extensionContent) {
    console.log("##### eform before destroy");
    window.extensionContent.destroy();
}

window.extensionContent = {
    extractInput: function(label) {
        var labelElems = document.getElementsByTagName("label");
        for (var i = 0; i < labelElems.length; i++) {
            if (labelElems[i].innerText === label) {
                var inputElem = document.getElementById(labelElems[i].htmlFor);
                return inputElem.value;
            }
        }
        return null;
    },
    
    collectEformData : function() {
        return {   
            companyName: this.extractInput('Name of company'),
            companyAddress: this.extractInput('Address'),
            companyCity: this.extractInput('City'),
            companyCountry: this.extractInput('Country'),
            companyProvince: this.extractInput('Province/State'),
            companyZip: this.extractInput('Postal/Zip'),
        };
    },
    
    listener: function(request, sender, sendResponse) {
        var messageType = request.messageType;
        if (messageType === "CollectEformData") {
            sendResponse(window.extensionContent.collectEformData());
        }
    },

    create: function() {
        console.log("##### eform content create ");
        chrome.runtime.onMessage.addListener(this.listener);
    },

    destroy: function() {
        console.log("##### eform content destroy");
        if (this.listener) {
            chrome.runtime.onMessage.removeListener(this.listener);
            this.listener = null;
        }
    }
}

window.extensionContent.create();
