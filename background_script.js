// Put all the javascript code here, that you want to execute in background.


let tabIdToTabMap = new Map();
let eformTabId = null;
let isoTabId = null;

chrome.messageHistory = new Array();

function isIsoTab(tab) {
	return (tab.url.indexOf('https://qa-online.sterbc.com') > -1);
}

function isEformTab(tab) {
	return (tab.url.indexOf('file:///C:/Users/ddev/me/eform/test.html') > -1);
}

/**
 * Delete a given tab from the tab cache.
 * @param tabId Non-null tab unique identifier.
 */
function deleteTabListItem(tabId) {
	tabIdToTabMap.delete(tabId);
	console.log("##### delete tab ", tabId);
}

/**
 * Append a given tab to the tab cache.
 * @param tab Non-null added tab.
 */
function addTabListItem(tab) {
	const isExisting = tabIdToTabMap.has(tab.id);
	tabIdToTabMap.set(tab.id, tab);
	console.log("##### add tab (id=" + tab.id + ", is new ? " + (!isExisting) + ")");

	if (isIsoTab(tab)) {
		isoTabId = tab.id;
		console.log("###### iso before execute script");
		if (!isExisting) {
			chrome.scripting.executeScript({
				files: ['iso-content_script.js'],
				target: {tabId: isoTabId }
			});
		}
		sendMessageToIsoTab('Hello welcome to eform copy');
		sendMessageToPopup('Hello welcome to eform copy');
	}

	if (isEformTab(tab)) {
		eformTabId = tab.id;
		console.log("###### eform tab detected " + eformTabId);
		if (!isExisting) {
			console.log("###### eform before execute script");
			chrome.scripting.executeScript({
				files: ['eform-content_script.js'],
				target: {tabId: eformTabId }
			});
			console.log("###### eform adter execute script");
		}
	}

	return isExisting;
}


function sendMessageToIsoTab(obj) {
	if (isoTabId) {
		console.log("##### messasge send by background process to ISO tab " + isoTabId);
		chrome.tabs.sendMessage(isoTabId, {message: obj});
	}
}

function sendMessageToEFormTab(obj) {
	if (eformTabId) {
		console.log("##### message send by bacgrounf process to eform tab " + eformTabId);
		chrome.tabs.sendMessage(eformTabId, obj);
	}
}

function sendMessageToPopup(obj) {
	console.log("##### message send by background process to popup");
	chrome.runtime.sendMessage({message: obj});
}

// https://developpaper.com/chrome-extension-how-to-update-content-scripts-in-real-time/

	chrome.runtime.onConnect.addListener(
		function(port) {
			console.log("#### on connect", port);
		}
	);
	chrome.runtime.onInstalled.addListener(
		function(details) {
			console.log("#### on installed", details);
		}
	);
	chrome.runtime.onStartup.addListener(
		function() {
			console.log("#### on startup");
		}
	);
	chrome.runtime.onSuspend.addListener(
		function() {
			console.log("#### on suspend");
		}
	);

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log("#### on message");
			var msgType = request.messageType;
			if (msgType === "GetTabIds") {
				sendResponse({isoTabId: isoTabId, eformTabId: eformTabId});
			} else if (msgType === "ExecuteCopy") {
				console.log("#### EXECUTE COPY -> contact eformdata to collect data " + eformTabId);
				chrome.tabs.sendMessage(eformTabId, {messageType: "CollectEformData"}, function(eformData) {
					if (eformData) {
						chrome.runtime.sendMessage({messageType: "InfoMessage", message: "EForm data successfully collected"});
						console.log("#### EXECUTE COPY -> inform ISO tab");
						chrome.tabs.sendMessage(isoTabId, {messageType: "ApplyEformDataToIso", data: eformData});
					}
				});
			} else if ((msgType === "InfoMessage") || (msgType === "WarnMessage")) {
				console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% received message " + request);
				chrome.messageHistory.push(request); 
			} else if (msgType === "GetMessageHistory") {
				console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% GetMessageHistory " + chrome.messageHistory.length);
				sendResponse(chrome.messageHistory);
			} else if (msgType === "ClearMessageHistory") {
				chrome.messageHistory.splice(0, chrome.messageHistory.length);
			}
		}
	);
	

	chrome.tabs.onRemoved.addListener( (tabId, removeInfo) => {
		deleteTabListItem(tabId);
		console.log("OnRemoved");
	});

	chrome.tabs.onDetached.addListener( (tabId, detachInfo) => {
		deleteTabListItem(tabId);
		console.log("OnDetached");
	});

	chrome.tabs.onAttached.addListener( (tabId, attachInfo) => {
		chrome.tabs.get(tabId).then( (tab) => {
			addTabListItem(tab);
		});
		console.log("OnAttached");
	});

	chrome.tabs.onCreated.addListener( (tab) => {
		addTabListItem(tab);
		console.log("OnCreated");
	});

	chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
		addTabListItem(tab);
		console.log("OnUpdated " + tabId);
	});


	chrome.tabs.query({ currentWindow: true }).then(
		(currentTabs) => {
			for (let i = 0; i < currentTabs.length; i++) {
				addTabListItem(currentTabs[i]);
			}
		}
	);
	

