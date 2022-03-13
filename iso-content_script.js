// Put all the javascript code here, that you want to execute after page load.

if (window.extensionContent) {
    console.log("########## window destroy");
    window.extensionContent.destroy();
}

window.extensionContent = {
    importScrit:function(srca) {
        const src = chrome.runtime.getURL('iso-content-main.js');
        console.log("##### url = " + src);
        const script = document.createElement('script');
        script.setAttribute("type", "module");
        script.setAttribute("src", src);
        const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
        head.insertBefore(script, head.lastChild);
    },
    
    importScript2: function(data) {
        (async () => {
            console.log("ISO > import script");
            const src = chrome.runtime.getURL("iso-content-main.js");
            const contentMain = await import(src);
            contentMain.executeCopy(data);
          })();    
    },
    
    listener: function(request, sender, sendResponse) {
        var messageType = request.messageType;
        console.log("ISO > onMessage " + messageType);
        if (messageType === "ApplyEformDataToIso") {
            window.extensionContent.importScript2(request.data);
        }
    },

    init: function() {
    //    importScript(null);
        console.log("ISO init() ");
        chrome.runtime.onMessage.addListener(this.listener);
    },

    destroy: function() {
        if (this.listener) {
            chrome.runtime.onMessage.removeListener(this.listener);
        }
    }
}

window.extensionContent.init();



//console.log("######### Content script");