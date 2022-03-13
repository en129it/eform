
console.log("##### eform start");
if (window.extensionContent) {
    console.log("##### eform before destroy");
    window.extensionContent.destroy();
}

var EformElement = function() {
    this.label;
    this.id;
    this.idValue;
    this.value;
    this.isMultivalue;
};


window.extensionContent = {
    eformElements: new Array(),
    lastSelectEFormElement: null,

    extractSpan: function(label) {
        var spanElems = document.getElementsByTagName("span");
        for (var i = 0; i < spanElems.length; i++) {
            if (spanElems[i].innerText === label) {
                var spanElem = spanElems[i].nextElementSibling;
                return spanElem.innerText;
            }
        }
        return null;
    },

    extractElementId: function(fullId) {
        var regExp = new RegExp("[^_]+_([0-9]+)(_(.+))?", "g");
        var matchParts = regExp.exec(fullId);
        if (matchParts.length > 1) {
            if (matchParts.length === 4) {
                return [matchParts[1], matchParts[3]];
            } else {
                return [matchParts[1]];
            }
        }
        return null;
    },

    findEformElement: function(id) {
        var candidates = this.eformElements.filter( elem => { return elem.id === id});
        return (candidates.length > 0) ? candidates[0] : null;
    },

    findEformElementByLabel: function(label) {
        var candidates = this.eformElements.filter( elem => { return elem.label === label});
        return (candidates.length > 0) ? candidates[0] : null;
    },

    extractFormElements: function(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            switch(node.tagName) {
                case "LABEL":
                    var eformElement = new EformElement();
                    console.log('>>> '  + node.htmlFor);
                    eformElement.id = this.extractElementId(node.htmlFor)[0];
                    eformElement.label = node.innerText;
                    this.eformElements.push(eformElement);
                    break;
                case "INPUT":
                    var inputId = this.extractElementId(node.id)[0];
                    var eformElement = this.findEformElement(inputId);
                    if (eformElement != null) {
                        switch(node.type) {
                            case "text":
                                eformElement.value = node.value;
                                break;
                            case "radio":
                                if (node.checked) {
                                    eformElement.idValue = this.extractElementId(node.id)[1];
                                    eformElement.value = node.value;
                                }
                                break;
                        }
                    }
                    break;
                case "SELECT":
                    var selectId = this.extractElementId(node.id)[0];
                    lastSelectEFormElement = this.findEformElement(selectId);
                    if (lastSelectEFormElement != null) {
                        lastSelectEFormElement.isMultivalue = (node.multiple === "multiple");
                        if (lastSelectEFormElement.isMultivalue) {
                            lastSelectEFormElement.value = new Array();
                        }
                    }
                    break;
                case "OPTION":
                    if (lastSelectEFormElement != null) {
                        if (node.selected) {
                            if (lastSelectEFormElement.isMultivalue) {
                                lastSelectEFormElement.value.push(node.value);
                            } else {
                                lastSelectEFormElement.value = node.value;
                            }
                        }
                    }
                    break;
                case "TEXTAREA":
                    var textAreaId = this.extractElementId(node.id)[0];
                    var eformElement = this.findEformElement(textAreaId);
                    if (eformElement != null) {
                        eformElement.value = node.innerText;
                    }
                    break;
            }
        }

        var children = node.childNodes;
        if (children != null) {
            for (var i = 0; i < children.length; i++) {
                this.extractFormElements(children[i]);
            }
        }
    },

    extractNonFormElements: function(node, startLabelsToSearch) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            if ("B" === node.tagName) {
                for (var i=0; i<startLabelsToSearch.length; i++) {
                    if (node.innerText.startsWith(startLabelsToSearch[i])) {
                        startLabelsToSearch[i] = node.innerText;
                    }
                }
            }
        }

        var children = node.childNodes;
        if (children != null) {
            for (var i = 0; i < children.length; i++) {
                this.extractNonFormElements(children[i], startLabelsToSearch);
            }
        }
    },

    findEformByLabel: function(label, extractedFullLabels) {
        var items = extractedFullLabels.filter( i => i.startsWith(label) );
        if (items.length === 1) {
            items = items.pop().split(':');
            if (items.length > 1) {
                return items.pop().trim();
            }
        }
        return null;
    },

    mapBusinessSegment: function(eformElement) {
        if (eformElement != null) {
            switch(eformElement.value) {
                case 'Funds':
                    eformElement.value = 'Funds';
                    break;
                case 'Insurance':
                    eformElement.value = 'Insurance';
                    break;
                case 'Pension':
                    eformElement.value = 'Pensions';
                    break;
                case 'Real Estate Fund':
                    eformElement.value = 'Other (Non-Custody Client)';
                    break;
                case 'Third Party Investment Manager':
                    eformElement.value = 'Third Party Investment Manager';
                    break;
                case 'Other':
                    eformElement.value = 'Other (Non-Custody Client)';
                    break;
            }
        }
        return eformElement;
    },

    mapClientTier: function(eformElement) {
        if (eformElement != null) {
            switch(eformElement.value) {
                case 'Strategic':
                    eformElement.value = '1-Strategic';
                    break;
                case 'Value to Grow':
                    eformElement.value = '2-Value to Grow';
                    break;
                case 'Core':
                    eformElement.value = '3-Core';
                    break;
                case 'N/A':
                    eformElement.value = 'N/A';
                    break;
            }
        }
        return eformElement;
    },

    extractPasswordDurationInDays : function(rawValue) {
        var valueAndUnit = rawValue.split(' ');
        var value = valueAndUnit[0];

        if (valueAndUnit.length > 1) {
            switch (valueAndUnit[1].toUpperCase()) {
                case "DAYS" : 
                    return value * 1;
                case "WEEKS" :
                    return value * 7;
                case "MONTHS" :
                    return value * 30;
            }
        }
    },

    extractSizeInMb : function(rawValue) {
        var valueAndUnit = rawValue.split(' ');
        var value = valueAndUnit[0];

        if (valueAndUnit.length > 1) {
            switch (valueAndUnit[1].toUpperCase()) {
                case "MB" : 
                    return value * 1;
                case "GB" :
                    return value * 1024;
                case "KB" :
                    return Math.ceil(value / 1014);
            }
        }
    },

    mapDateFormat : function(eformElement) {
        if (eformElement != null && eformElement.value != null) {
            eformElement.value = eformElement.value.replace("Year", "2007");
            eformElement.value = eformElement.value.replace("jan", "Jan");
        }
        return eformElement;
    },

    collectEformData : function() {
        var passwordDurationLabel = 'Password Duration:';
        var reportFormatLabel = 'Report format:';
        var tableNbRowsLabel = 'Rows per Pageable Table:';
        var maxBundleSizeLabel = 'Maximum Bundle Size:';
        var nonFormElementLabels = [passwordDurationLabel, reportFormatLabel, tableNbRowsLabel, maxBundleSizeLabel];

        var documentRootNode = document.getRootNode();
        this.extractFormElements(documentRootNode);
        this.extractNonFormElements(documentRootNode, nonFormElementLabels);

        var data = {   
            companyName: this.findEformElementByLabel('Name of the Company:'),
            companyAddress: this.findEformElementByLabel('Address :'),
            companyCity: this.findEformElementByLabel('City:'),
            companyCountry: this.findEformElementByLabel('Country:'),
            companyProvince: this.findEformElementByLabel('Province/State:'),
            companyZip: this.findEformElementByLabel('Postal/Zip:'),
            serviceCompany: this.findEformElementByLabel('Service Company:'),
            clientAgreementReceived: this.findEformElementByLabel('Client Access Agreement received?:'), // not used
            documentBrowse: this.findEformElementByLabel('Browse the Document please:'), // ? ########
            targetDateNeeded: this.findEformElementByLabel('Target date needed:'), // not used
            targetDate: this.findEformElementByLabel('Date:'), // not used
            targetDateInterpretation: this.findEformElementByLabel('Select if it has to be set up before or on the date:'), // not used
            region: this.findEformElementByLabel('Geographic Location:'),
            businessSegment1: this.mapBusinessSegment(this.findEformElementByLabel('Business Segment:')),
            businessSegment2: this.mapBusinessSegment(this.findEformElementByLabel('Business Segment :')),
            companyType: this.findEformElementByLabel('Type of Company :'), // ? ########
            existingDfsPromoter: this.findEformElementByLabel('Existing DFS Online Promoter ID:'), // ? ########
            clientTier: this.mapClientTier(this.findEformElementByLabel('Promoter Tier:')),
            passwordDuration: this.extractPasswordDurationInDays(this.findEformByLabel(passwordDurationLabel, nonFormElementLabels)),
            reportFormat: this.findEformByLabel(reportFormatLabel, nonFormElementLabels),
            tableNbRows: this.findEformByLabel(tableNbRowsLabel, nonFormElementLabels),
            maxBundleSize: this.extractSizeInMb(this.findEformByLabel(maxBundleSizeLabel, nonFormElementLabels)),
            timeZone: this.findEformElementByLabel('Time Zone:'),
            dateFormat: this.mapDateFormat(this.findEformElementByLabel('Date Format:')),
            timeFormat: this.findEformElementByLabel('Time Format:'),
            preferredLanguage: this.findEformElementByLabel('Preferred Communication Language:'), // ########
            fundCodes: this.findEformElementByLabel('FUND CODE(S) ALREADY KNOWN FOR THIS COMPANY:'), //
            custodyFundCodes: this.findEformElementByLabel('Custody Fund Code(s):'), //
            custodyReports: this.findEformElementByLabel('Custody Reports:'), //
            custodyReportsAttach: this.findEformElementByLabel('Attachment with the List of Custody Reports:'), //
            accountingFundCodes: this.findEformElementByLabel('Accounting Fund Code(s):'), //
            accountingReports: this.findEformElementByLabel('Accounting Reports:'), //
            accountReportsAttach: this.findEformElementByLabel('Attachment with the List of Accounting Reports:'), //
            milvusPgr: this.findEformElementByLabel('Add Pre-generated Milvus report (CIRSCHDL):'), //
            interactiveReportsSet: this.findEformElementByLabel('Standard set of Interactive Reports,...:'), //
            defaultAdmin: this.findEformElementByLabel('Default Administration:'), //
            manageCompanySettings: this.findEformElementByLabel('Manage Company Settings:'), //
            viewUsers: this.findEformElementByLabel('View Users:'), //
            manageCompanyUsers: this.findEformElementByLabel('Manage Company Users:'), //
            mangeRolesAndPerms: this.findEformElementByLabel('Manage Roles and Permissions:'), //
            manageAccounts: this.findEformElementByLabel('Manage Accounts:'), //
            manageCompanyWorkf: this.findEformElementByLabel('Manage Company Workflow:'), //
            manualPasswChange: this.findEformElementByLabel('Manual Password Change:'), //
            onlineInquiry: this.findEformElementByLabel('Online Inquiry:'), //
            manageTxn: this.findEformElementByLabel('Manage Transactions:'), //
            fileTransfer: this.findEformElementByLabel('File Transfer:'), //
            custodyInteractive: this.findEformElementByLabel('Custody Interactive:'), //
            corpAct: this.findEformElementByLabel('Corporate Action Interactive:'), //
            franceSetup: this.findEformElementByLabel('Specific Set Up for France:'), //
            epr: this.findEformElementByLabel('EPR Activity:'), //
            fai: this.findEformElementByLabel('Fund Accounting Interactive (FAI):'), //
            twofa: this.findEformElementByLabel('Soft Token authentication (2FA settings):'),
            sli: this.findEformElementByLabel('SL Interactive (SLI):'), //
            autocon: this.findEformElementByLabel('Autoconnect:'), //
            emailAlerts: this.findEformElementByLabel('Receive Email Alerts:'), //
            broadcast: this.findEformElementByLabel('Send Company Broadcast:'), //
            secureMessageReceiveOnly: this.findEformElementByLabel('Secure Messages - receive Only:'), //
            secureMessageSendOnly: this.findEformElementByLabel('Secure Messages - send Only:'), //
            globalCustody: this.findEformElementByLabel('Global Custody:'), //
            fundAdmin: this.findEformElementByLabel('Fund Administration:'), //
            alternInvestm: this.findEformElementByLabel('Alternative Investments:'), //
            shareholderSrvs: this.findEformElementByLabel('Shareholder Services:'), //
            ria: this.findEformElementByLabel('Risk & Investment Analytics:'), //
            nbAdmin: this.findEformElementByLabel('Select the Number of Administrator:'), //
            nbUsers: this.findEformElementByLabel('Select the Numer of User:'), //
            attachment: this.findEformElementByLabel('Attachment:') //
        };

        var administrators = new Array();
        for (var i=1; i<=Number(data.nbAdmin.value); i++) {
            administrators.push({
                firstName: this.findEformElementByLabel('First Name (' + i + '):'), 
                lastName: this.findEformElementByLabel('Last Name (' + i + '):'),
                email: this.findEformElementByLabel('Email Address (' + i + '):')
            });
        }
        data.administrators = administrators;

        return data;
    },
    
    listener: function(request, sender, sendResponse) {
        var messageType = request.messageType;
        if (messageType === "CollectEformData") {
            console.log("##### eform received message CollectEformData");
            var eformData = window.extensionContent.collectEformData();
            sendResponse(eformData);
            console.log("##### eform received message CollectEformData END");
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
