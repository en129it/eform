// Put all the javascript code here, that you want to execute after page load.

function importScript(srca) {
    const src = chrome.runtime.getURL('iso-content-main.js');
    console.log("##### url = " + src);
    const script = document.createElement('script');
    script.setAttribute("type", "module");
    script.setAttribute("src", src);
    const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
    head.insertBefore(script, head.lastChild);
}

function importScript2(data) {
    (async () => {
        const src = chrome.runtime.getURL("iso-content-main.js");
        const contentMain = await import(src);
        contentMain.executeCopy(data);
      })();    
}

function init() {
//    importScript(null);

    const bodyElem = document.getElementsByTagName('body')[0];
    const divElem = document.createElement('div');
    divElem.style.position = 'fixed';
    divElem.style.width = '100%';
    divElem.style.top = '0px';
    const textAreaElem = document.createElement('textarea');
    textAreaElem.id = 'commentId';
    textAreaElem.rows = 2;
    textAreaElem.style.width = '100%';
    textAreaElem.style.borderStyle = 'border-size';
    divElem.prepend(textAreaElem);
    bodyElem.append(divElem);

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            var messageType = request.messageType;
            if (messageType === "ApplyEformDataToIso") {
                importScript2(request.data);
            }
        }
    );

}

init();



//console.log("######### Content script");