import { NoTrialOperation, TimeoutRetrialOperation, OperationGroup, ExecutionStatus, NotifyUserImmediate, Condition, SucceedImmediate, SuccessOnFunctionEvalationImmediate } from './operationType.js';
const COMPANY_ADMIN_ROLE_NAME = "Administrator";
//#############################################################################
//#############################################################################
// CHECK
//#############################################################################
//#############################################################################
function findTextInDocuments(text, containerElemClassName, containerElemId, documents) {
    let found = false;
    documents.forEach(document => {
        if (!found) {
            if (containerElemId) {
                const elem = document.getElementById(containerElemId);
                if (elem != null) {
                    found = elem.outerHTML.indexOf(text) > -1;
                }
            }
            else if (containerElemClassName) {
                const candidateElems = document.getElementsByClassName(containerElemClassName);
                for (let i = 0; i < candidateElems.length && !found; i++) {
                    found = candidateElems[i].outerHTML.indexOf(text) > -1;
                }
            }
            else {
                const elem = document.getElementsByTagName('body')[0];
                if (elem != null) {
                    found = elem.outerHTML.indexOf(text) > -1;
                }
            }
        }
    });
    console.log("######### Find text in document " + containerElemClassName + " : " + found);
    return found;
}
function findElementById(id, documents) {
    let rslt;
    documents.forEach(document => {
        if (!rslt) {
            rslt = document.getElementById(id);
        }
    });
    return rslt;
}
function findElementByIdDocument(id, documents) {
    let rslt;
    documents.forEach(document => {
        if (!rslt) {
            if (document.getElementById(id)) {
                rslt = document;
            }
        }
    });
    return rslt;
}
function _findElems(containerElemClassName, containerElemId, documents, fct) {
    let mustContinue = true;
    documents.forEach(document => {
        let candidateElems;
        if (mustContinue) {
            if (containerElemId) {
                candidateElems = document.getElementById(containerElemId);
            }
            else if (containerElemClassName) {
                candidateElems = document.getElementsByClassName(containerElemClassName);
            }
            else {
                candidateElems = document.getElementsByTagName('body')[0];
            }
        }
        if (candidateElems != null) {
            if ('length' in candidateElems) {
                for (let i = 0; i < candidateElems.length && mustContinue; i++) {
                    mustContinue = fct(candidateElems[i]);
                }
            }
            else {
                mustContinue = fct(candidateElems);
            }
        }
    });
}
function findElementWithInnerText(text, containerElemClassName, containerElemId, documents) {
    let rslt;
    _findElems(containerElemClassName, containerElemId, documents, (foundElemNode => {
        rslt = _findElementWithInnerText(text, foundElemNode);
        return (!rslt);
    }));
    return rslt;
}
function _findElementWithInnerText(text, node) {
    switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            let rslt;
            node.childNodes.forEach(child => {
                if (!rslt) {
                    rslt = _findElementWithInnerText(text, child);
                }
            });
            return rslt;
        case Node.TEXT_NODE:
            if (node.textContent === text) {
                return node.parentElement;
            }
            break;
    }
}
function findAnchorElemWithUrlPart(urlPart, containerElemClassName, containerElemId, documents) {
    if (urlPart) {
        let rslt;
        _findElems(containerElemClassName, containerElemId, documents, (foundElemNode => {
            rslt = _findAnchorElemWithUrlPart(urlPart, foundElemNode);
            return (!rslt);
        }));
        return rslt;
    }
}
function _findAnchorElemWithUrlPart(urlPart, node) {
    if (node.nodeType == Node.ELEMENT_NODE) {
        if (node.href && node.href.indexOf(urlPart) > -1) {
            return node;
        }
        let rslt;
        node.childNodes.forEach(child => {
            if (!rslt) {
                rslt = _findAnchorElemWithUrlPart(urlPart, child);
            }
        });
        return rslt;
    }
}
function findImage(fileName, containerElemClassName, containerElemId, documents) {
    let rslt;
    _findElems(containerElemClassName, containerElemId, documents, (foundElemNode => {
        rslt = _findImage(fileName, foundElemNode);
        return (!rslt);
    }));
    return rslt;
}
function _findImage(fileName, node) {
    let rslt;
    if (node.nodeType == Node.ELEMENT_NODE) {
        if ("IMG" == node.nodeName) {
            let src = node.getAttribute("src");
            if (src.indexOf(fileName) > -1) {
                return node;
            }
        }
        node.childNodes.forEach(child => {
            if (!rslt) {
                rslt = _findImage(fileName, child);
            }
        });
    }
    return rslt;
}
function findAllImages(fileNames, containerElemClassName, containerElemId, documents) {
    const rslt = new Array();
    _findElems(containerElemClassName, containerElemId, documents, (foundElemNode => {
        _findImages(fileNames, foundElemNode, rslt);
        return true;
    }));
    return rslt;
}
function _findImages(fileNames, node, rslt) {
    if (node.nodeType == Node.ELEMENT_NODE) {
        if ("IMG" == node.nodeName) {
            let src = node.getAttribute("src");
            fileNames.forEach(fileName => {
                if (src.indexOf(fileName) > -1) {
                    rslt.push(node);
                }
            });
        }
        node.childNodes.forEach(child => {
            _findImages(fileNames, child, rslt);
        });
    }
}
export class CheckTextImmediate extends NoTrialOperation {
    constructor(text, containerElemClassName, containerElemId, name) {
        super((name != null) ? name : ("Check text '" + text + "' immediately"));
        this.text = text;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
    }
    executeOperation(documents) {
        return findTextInDocuments(this.text, this.containerElemClassName, this.containerElemId, documents);
    }
}
export class CheckElementPresenceById extends TimeoutRetrialOperation {
    constructor(elemId, timeoutErrMsg, name) {
        super("Check presence of element by id '" + elemId + "'");
        this.elemId = elemId;
        this.timeoutErrMsg = timeoutErrMsg;
    }
    executeOperation(documents) {
        let found = false;
        documents.forEach(document => {
            if (!found) {
                const elem = document.getElementById(this.elemId);
                found = (elem != null);
            }
        });
        return found ? ExecutionStatus.SUCCEEDED : ExecutionStatus.EXECUTING;
    }
    timeoutErrorMessage() {
        return this.timeoutErrMsg;
    }
}
export class CheckElementPresenceByIdImmediate extends NoTrialOperation {
    constructor(elemId) {
        super("Check immediate presence of element by id '" + elemId + "'");
        this.elemId = elemId;
    }
    executeOperation(documents) {
        let found = false;
        documents.forEach(document => {
            if (!found) {
                const elem = document.getElementById(this.elemId);
                found = (elem != null);
            }
        });
        return found;
    }
}
export class CheckText extends TimeoutRetrialOperation {
    constructor(text, containerElemClassName, containerElemId, timeoutErrMsg, name) {
        super((name != null) ? name : ("Check text '" + text + "'"));
        this.text = text;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
        this.timeoutErrMsg = timeoutErrMsg;
    }
    executeOperation(documents) {
        return findTextInDocuments(this.text, this.containerElemClassName, this.containerElemId, documents) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.EXECUTING;
    }
    timeoutErrorMessage() {
        return this.timeoutErrMsg;
    }
}
export class CheckTextOrAlternateText extends TimeoutRetrialOperation {
    constructor(text, alternateText, containerElemClassName, containerElemId, timeoutErrMsg, name) {
        super("Check text '" + text + "'");
        this.text = text;
        this.alternateText = alternateText;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
        this.timeoutErrMsg = timeoutErrMsg;
    }
    executeOperation(documents) {
        let textFound = findTextInDocuments(this.text, this.containerElemClassName, this.containerElemId, documents);
        if (!textFound) {
            textFound = findTextInDocuments(this.alternateText, this.containerElemClassName, this.containerElemId, documents);
            return textFound ? ExecutionStatus.FAILED : ExecutionStatus.EXECUTING;
        }
        else {
            return ExecutionStatus.SUCCEEDED;
        }
    }
    timeoutErrorMessage() {
        return this.timeoutErrMsg;
    }
}
export class CheckIsLoggedIn extends CheckText {
    constructor() {
        super("Hi, ", "user-nav-menu", null, "Login to ISO with your Enterprise Administrator user", "Check is logged in");
    }
}
export class CheckPageUrl extends TimeoutRetrialOperation {
    constructor(urlPart, timeoutErrMsg) {
        super("Check URL contains part '" + urlPart + "'");
        this.urlPart = urlPart;
        this.timeoutErrMsg = timeoutErrMsg;
    }
    executeOperation(documents) {
        return (documents[0].location.href.indexOf(this.urlPart) > -1) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.EXECUTING;
    }
    timeoutErrorMessage() {
        return this.timeoutErrMsg;
    }
}
export class CheckPageTitle extends CheckText {
    constructor(pageTitle) {
        super(pageTitle, "page_title", null, null, "Check page title is '" + pageTitle + "'");
    }
}
export class ClickElementByInnerText extends TimeoutRetrialOperation {
    constructor(text, containerElemClassName, containerElemId, mustWaitIFrameChange, timeoutErrMsg) {
        super("Click element with inner text '" + text + "'");
        this.text = text;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
        this.mustWaitIFrameChange = mustWaitIFrameChange;
        this.timeoutErrMsg = timeoutErrMsg;
    }
    executeOperation(documents, lastIframeEvent) {
        if (this.lastEvent == null) {
            let rslt = findElementWithInnerText(this.text, this.containerElemClassName, this.containerElemId, documents);
            if (rslt) {
                rslt.click();
                if (this.mustWaitIFrameChange) {
                    this.lastEvent = lastIframeEvent;
                    return ExecutionStatus.EXECUTING;
                }
                return ExecutionStatus.SUCCEEDED;
            }
            return ExecutionStatus.EXECUTING;
        }
        else {
            return (this.lastEvent == lastIframeEvent) ? ExecutionStatus.EXECUTING : ExecutionStatus.SUCCEEDED;
        }
    }
    timeoutErrorMessage() {
        return this.timeoutErrMsg;
    }
}
export class SelectPermissionNode extends TimeoutRetrialOperation {
    constructor(permissionLabel, mustSelect, containerElemClassName, containerElemId) {
        super((mustSelect ? "Select" : "Unselect") + " permission '" + permissionLabel + "'");
        this.permissionLabel = permissionLabel;
        this.mustSelect = mustSelect;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
    }
    executeOperation(documents) {
        let elem = findElementWithInnerText(this.permissionLabel, this.containerElemClassName, this.containerElemId, documents);
        if (elem) {
            while ((elem = elem.previousSibling) != null) {
                if (elem.nodeName === "IMG") {
                    const imgElem = elem;
                    if ((this.mustSelect) && (imgElem.src.indexOf("/unchecked.png") > -1)) {
                        imgElem.click();
                    }
                    else if ((!this.mustSelect) && (imgElem.src.indexOf("/checked.png") > -1)) {
                        imgElem.click();
                    }
                    return ExecutionStatus.SUCCEEDED;
                }
            }
        }
        return ExecutionStatus.EXECUTING;
    }
    timeoutErrorMessage() {
        return "Unable to " + (this.mustSelect ? "select" : "unselect") + " permission '" + this.permissionLabel + "'";
    }
}
export class ExpandPermissionHeader extends TimeoutRetrialOperation {
    constructor() {
        super("Expand permission header");
    }
    executeOperation(documents) {
        let anchorElem = findElementById("permissionTree", documents);
        if (anchorElem) {
            if (anchorElem.className === "collapsed") {
                anchorElem.click();
            }
            return ExecutionStatus.SUCCEEDED;
        }
        return ExecutionStatus.EXECUTING;
    }
    timeoutErrorMessage() {
        return "Unable to expand permission tree header";
    }
}
export class ExpandSelectedPermissionNodes extends NoTrialOperation {
    constructor(containerElemId) {
        super("Expand selected permission nodes");
        this.containerElemId = containerElemId;
    }
    executeOperation(documents) {
        const imgElems = findAllImages(["/partiallyChecked.png", "/checked.png"], null, this.containerElemId, documents);
        imgElems.forEach(imgElem => {
            const liElem = imgElem.parentElement;
            const luNodeList = liElem.querySelectorAll("ul");
            for (var i = 0; i < luNodeList.length; i++) {
                if (luNodeList[i].parentNode == liElem) {
                    luNodeList[i].style.display = 'inline';
                }
            }
        });
        return true;
    }
}
export class ExpandInternalRolePermissionNode extends NoTrialOperation {
    constructor(permissionNodeElemId) {
        super("Expand internal role permission node");
        this.permissionNodeElemId = permissionNodeElemId;
    }
    executeOperation(documents) {
        const nodeElem = findElementById(this.permissionNodeElemId, documents);
        if (nodeElem) {
            nodeElem.style.display = 'block';
        }
        return true;
    }
}
export class SelectInternalRoleInEditUserPage extends NoTrialOperation {
    constructor(internalRoleLabel) {
        super("Select internal role '" + internalRoleLabel + "'");
        this.internalRoleLabel = internalRoleLabel;
    }
    executeOperation(documents) {
        const roleAnchorElem = findElementWithInnerText(this.internalRoleLabel, "tablefullwidth", null, documents);
        if (roleAnchorElem) {
            const rootElem = roleAnchorElem.parentElement.parentElement;
            const elem = rootElem.querySelector("input[type='checkbox']");
            if (elem) {
                if ((!elem.checked)) {
                    elem.click();
                }
            }
        }
        return true;
    }
}
export class CheckPermissionSelectedInViewPermisionPage extends NoTrialOperation {
    constructor() {
        super("Check if at least one permission is selected in view permission page");
    }
    executeOperation(documents) {
        let imgElem = findImage("greenCheckmarkIcon.gif", null, "permissionTreeTable", documents);
        return (imgElem != null);
    }
}
export class CheckTwoFaConfiguredInViewCompanyPage extends NoTrialOperation {
    constructor(eformData) {
        super("Check if 2FA configured in view company page");
        this.eformData = eformData;
    }
    executeOperation(documents) {
        const computerElem = findElementWithInnerText("Computer (Windows PC or MAC)", null, "c_hack", documents);
        const mobileElem = findElementWithInnerText("Mobile Device (Android or Apple IOS)", null, "c_hack", documents);
        if (computerElem && mobileElem) {
            const computerImgElem = computerElem.parentNode.firstElementChild.firstElementChild;
            const mobileImgElem = mobileElem.parentNode.firstElementChild.firstElementChild;
            let mustConfigure = false;
            if (this.eformData.twofa.value === 'Computer' || this.eformData.twofa.value === 'Computer and Mobile device') {
                mustConfigure = mustConfigure || (computerImgElem.src.indexOf("greyCheckmarkIcon") > -1);
            }
            if (this.eformData.twofa.value === 'Mobile device' || this.eformData.twofa.value === 'Computer and Mobile device') {
                mustConfigure = mustConfigure || (mobileImgElem.src.indexOf("greyCheckmarkIcon") > -1);
            }
            return mustConfigure;
        }
        return true;
    }
}
//#############################################################################
//#############################################################################
// ACTION
//#############################################################################
//#############################################################################
export class ClickAnchorImmediate extends TimeoutRetrialOperation {
    constructor(label, mustWaitIFrameChange) {
        super("Click anchor '" + label + "'");
        this.label = label;
        this.mustWaitIFrameChange = mustWaitIFrameChange;
    }
    executeOperation(documents, lastIframeEvent) {
        if (this.lastEvent == null) {
            let rslt = false;
            documents.forEach(document => {
                if (!rslt) {
                    const anchorElems = document.getElementsByTagName("a");
                    console.log("      Found " + anchorElems.length + " candiate anchors");
                    for (let i = 0; i < anchorElems.length; i++) {
                        const anchorElem = anchorElems.item(i);
                        if (_findElementWithInnerText(this.label, anchorElem) != null) {
                            console.log("      Anchor elem found and text is '" + this.label + "'", anchorElem);
                            anchorElem.click();
                            console.log("      Anchor elem clicked");
                            rslt = true;
                            break;
                        }
                    }
                }
            });
            if (rslt && (this.lastEvent == null) && this.mustWaitIFrameChange) {
                this.lastEvent = lastIframeEvent;
                return ExecutionStatus.EXECUTING;
            }
            else {
                return (rslt) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED;
            }
        }
        else {
            return (this.lastEvent == lastIframeEvent) ? ExecutionStatus.EXECUTING : ExecutionStatus.SUCCEEDED;
        }
    }
    timeoutErrorMessage() {
        return "Click anchor " + this.label + " did not completed";
    }
}
export class ClickElementByIdImmediate extends NoTrialOperation {
    constructor(id) {
        super("Click element with id '" + id + "'");
        this.id = id;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            if (!rslt) {
                const elem = document.getElementById(this.id);
                if (elem) {
                    elem.click();
                    rslt = true;
                }
            }
        });
        return rslt;
    }
}
export class CheckRadioOrCheckboxElementByIdImmediate extends NoTrialOperation {
    constructor(id, mustCheck) {
        super((mustCheck ? "Check" : "Uncheck") + " radio element with id '" + id + "'");
        this.id = id;
        this.mustCheck = mustCheck;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            if (!rslt) {
                const elem = document.getElementById(this.id);
                if (elem) {
                    if ((!elem.checked) && this.mustCheck) {
                        elem.click();
                    }
                    else if ((elem.checked) && (!this.mustCheck)) {
                        elem.click();
                    }
                    rslt = true;
                }
            }
        });
        return rslt;
    }
}
export class SetInputValueImmediate extends NoTrialOperation {
    constructor(id, value) {
        super("Fill input id '" + id + "' with value '" + value + "'");
        this.id = id;
        this.value = value;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            console.log('##### SetInputValueImmediate scan document  ');
            if (!rslt) {
                const elem = document.getElementById(this.id);
                console.log('   ##### element', elem);
                if (elem) {
                    elem.value = this.value;
                    rslt = true;
                }
                else {
                }
            }
        });
        console.log('##### SetInputValueImmediate ' + this.id + ' returned ' + rslt);
        return rslt;
    }
}
export class SetSelectValueImmediate extends NoTrialOperation {
    constructor(id, optionValue) {
        super("Set id '" + id + "' with option '" + optionValue + "'");
        this.id = id;
        this.optionValue = optionValue;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            if (!rslt) {
                const elem = document.getElementById(this.id);
                if (elem) {
                    let optionValue = null;
                    for (let i = 0; i < elem.options.length; i++) {
                        if (elem.options[i].label === this.optionValue) {
                            optionValue = elem.options[i].value;
                            break;
                        }
                    }
                    if (optionValue) {
                        elem.value = optionValue;
                        rslt = true;
                    }
                }
            }
        });
        return rslt;
    }
}
export class CheckAnchorPresence extends TimeoutRetrialOperation {
    constructor(urlPart, containerElemClassName) {
        super("Check presence of anchor with href '" + urlPart + "'");
        this.urlPart = urlPart;
        this.containerElemClassName = containerElemClassName;
    }
    executeOperation(documents, lastIframeEvent) {
        if (this.urlPart) {
            const anchorElem = findAnchorElemWithUrlPart(this.urlPart, this.containerElemClassName, null, documents);
            if (anchorElem) {
                return ExecutionStatus.SUCCEEDED;
            }
            return ExecutionStatus.EXECUTING;
        }
        else {
            return ExecutionStatus.SUCCEEDED;
        }
    }
    timeoutErrorMessage() {
        return "Unable to find anchor with href '" + this.urlPart + "'";
    }
}
export class GotoPageFromMenu extends OperationGroup {
    constructor(name, menuLabel, pageTitle, waitForUrl) {
        super(name, new CheckAnchorPresence(waitForUrl ? "InternalRoleAdministration" : null, "user-nav-menu"), new CheckAnchorPresence(waitForUrl ? "UserAdministration" : null, "user-nav-menu"), new CheckText(menuLabel, null, null, "Missing '" + menuLabel + "' menu. Check if you are connecting with a user who has access to that menu"), new ClickAnchorImmediate(menuLabel, null), new CheckPageTitle(pageTitle));
    }
}
export class GotoAdministrationPageFromMenu extends OperationGroup {
    constructor(name, menuLabel, pageTitle) {
        super(name, new CheckText("Administration", null, null, "Missing 'Administration' menu. Check if you are connecting with a user who has access to that menu"), new ClickAnchorImmediate("Administration", true), new CheckText("Administration", "heading", null, null, null), new ClickElementByInnerText(menuLabel, "label", null, true, "Unable to access the '" + menuLabel + "' tile"), new CheckPageTitle(pageTitle));
    }
}
export class GotoPageFromLinkInCurrentPage extends OperationGroup {
    constructor(name, anchorLabel, pageTitle) {
        super(name, new ClickAnchorImmediate(anchorLabel, null), new CheckPageTitle(pageTitle));
    }
}
/*
export class GotoCompaniesPage extends GotoAdministrationPageFromMenu {
    constructor() {
        super("Go to Companies page", 'All Companies', 'All Companies');
    }
}
*/
export class GotoCompaniesPage extends GotoPageFromMenu {
    constructor() {
        super("Go to Companies page", 'All companies', 'All Companies', false);
    }
}
export class CheckCompanyExistanceInCompaniesPage extends OperationGroup {
    constructor(companyName) {
        super("Check company '" + companyName + "' existance in All Companies page", new CheckTextImmediate('searchSubmit', null, null), new SetInputValueImmediate('search', companyName), new ClickElementByIdImmediate('searchSubmit'), new CheckTextOrAlternateText('1 result found', '0 results found', null, null, null));
    }
}
export class GotoCompanyDetailPageFromAllCompaniesPage extends GotoPageFromLinkInCurrentPage {
    constructor(companyName) {
        super("Go to detail page of company '" + companyName + "'", companyName, "Manage Company");
    }
}
export class GotoCompanyAllUsersPage extends OperationGroup {
    constructor(companyName) {
        super("Go to all users page of company '" + companyName + "'", new GotoCompaniesPage(), new CheckTextImmediate('searchSubmit', null, null), new SetInputValueImmediate('search', companyName), new ClickElementByIdImmediate('searchSubmit'), new CheckText('1 result found', null, null, null, null), new GotoPageFromLinkInCurrentPage("Go to all users page of company '" + companyName + "'", "Users", "All Users"));
    }
}
export class GotoCompanyInternalRolesPage extends OperationGroup {
    constructor(companyName) {
        super("Go to internal roles page of company '" + companyName + "'", new GotoCompaniesPage(), new CheckTextImmediate('searchSubmit', null, null), new SetInputValueImmediate('search', companyName), new ClickElementByIdImmediate('searchSubmit'), new CheckText('1 result found', null, null, null, null), new ClickAnchorImmediate(companyName, true), new GotoPageFromMenu("Go to internal roles page of company '" + companyName + "'", "Internal roles", "Internal Role Administration", true));
    }
}
export class CheckUserExistanceInAllUsersPage extends OperationGroup {
    constructor(firstName, lastName, email) {
        super("Check user '" + firstName + ' ' + lastName + "' existance in All Users page", new CheckTextImmediate('searchSubmit', null, null), new SetInputValueImmediate('search', email), new ClickElementByIdImmediate('searchSubmit'), new CheckTextOrAlternateText('1 result found', '0 results found', null, null, null));
    }
}
export class CreateCompanyFromAllCompaniesPage extends OperationGroup {
    constructor(eformData) {
        super("Create new company '" + eformData.companyName.value + "' - part 1", new ClickElementByIdImmediate('create.new.company'), new CheckPageTitle("Create New Company"), new CheckElementPresenceById("editForm", "Page did not load correctly"), new CheckElementPresenceById("columnSecuritiesBalancesPalette-palette-column-available", "Page did not load correctly"), new SetInputValueImmediate("name", eformData.companyName.value), new SetInputValueImmediate("address1", eformData.companyAddress.value), new SetInputValueImmediate("city", eformData.companyCity.value), new SetSelectValueImmediate("country", eformData.companyCountry.value), new SetInputValueImmediate("provState_", eformData.companyProvince.value), new SetInputValueImmediate("postalZipCode", eformData.companyZip.value), new CheckRadioOrCheckboxElementByIdImmediate("bankCheckbox", (eformData.serviceCompany.value === 'Bank' || eformData.serviceCompany.value === 'Bank and Trust')), new CheckRadioOrCheckboxElementByIdImmediate("trustCheckbox", (eformData.serviceCompany.value === 'Trust' || eformData.serviceCompany.value === 'Bank and Trust')), new SetSelectValueImmediate("region", eformData.region.value), new SetSelectValueImmediate("rowsPerTable", eformData.tableNbRows), new CheckRadioOrCheckboxElementByIdImmediate("a4Checkbox", (eformData.reportFormat === 'A4')), new CheckRadioOrCheckboxElementByIdImmediate("letterCheckbox", (eformData.reportFormat !== 'A4')), new SetInputValueImmediate("passwordDurationInDays", eformData.passwordDuration), new SetInputValueImmediate("maxBundleSize", eformData.maxBundleSize), new CheckRadioOrCheckboxElementByIdImmediate("timeFormatRadioGroup0", (eformData.timeFormat.value === '23:59')), new CheckRadioOrCheckboxElementByIdImmediate("timeFormatRadioGroup1", (eformData.timeFormat.value !== '23:59')), new SetSelectValueImmediate("dateFormat", eformData.dateFormat.value), new SetSelectValueImmediate("timeZone", eformData.timeZone.value), new SetSelectValueImmediate("businessSegment1", eformData.businessSegment1.value), new SetSelectValueImmediate("businessSegment2", eformData.businessSegment2.value), new SetSelectValueImmediate("clientSegment", eformData.clientTier.value), new NotifyUserImmediate("Press the 'Save' button to submit new company creation", true, true));
    }
}
export class CreateCompanyFromManageCompanyPage extends OperationGroup {
    constructor(eformData) {
        super("Create new company '" + eformData.companyName.value + "' - part 2", new SetupCompany2FASettings(eformData));
    }
}
export class CreateCompanyPermissions extends OperationGroup {
    constructor(eformData) {
        super("Create permissions of company '" + eformData.companyName.value + "'", new GotoCompaniesPage(), new CheckCompanyExistanceInCompaniesPage(eformData.companyName.value), new GotoPageFromLinkInCurrentPage("Go to permission page of company '" + eformData.companyName.value + "'", "Permissions", "View Company Permissions"), new Condition("Check company permission existance", 
        // Condition
        new CheckPermissionSelectedInViewPermisionPage(), 
        // Then
        new SucceedImmediate(), 
        // Then
        new OperationGroup("Create company permission", new GotoPageFromLinkInCurrentPage("Go to company '" + eformData.companyName.value + "' edit permission page", "Edit Company Permissions", "Edit Company Permissions"), new ExpandPermissionHeader(), new SelectPermissionNode("Manage Company Settings", ("YES" === eformData.manageCompanySettings.value), null, "permissionTreeTable"), new SelectPermissionNode("View Users", ("YES" === eformData.viewUsers.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Company Users", ("YES" === eformData.manageCompanyUsers.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Transactions", ("YES" === eformData.manageTxn.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Roles and Permissions", ("YES" === eformData.mangeRolesAndPerms.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Accounts", ("YES" === eformData.manageAccounts.value), null, "permissionTreeTable"), new SelectPermissionNode("Manual Password Change", ("YES" === eformData.manualPasswChange.value), null, "permissionTreeTable"), new SelectPermissionNode("File Transfer", ("YES" === eformData.fileTransfer.value), null, "permissionTreeTable"), new SelectPermissionNode("Online Inquiry (FOCUS only)", ("YES" === eformData.onlineInquiry.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Company Settings", ("YES" === eformData.manageCompanySettings.value), null, "permissionTreeTable"), new ExpandSelectedPermissionNodes("permissionTreeTable"), new NotifyUserImmediate("Press the 'Save' button to persist company permissions", true, true))));
    }
}
function _getFieldArrayNullable(array, index, field) {
    if (array.length > index) {
        return array[index][field]["value"];
    }
}
function generateCreateCompanyAdministratorUserOperations(eformData, index) {
    return new Condition("Check user definition provided for user at position " + index, 
    // Condition
    new SuccessOnFunctionEvalationImmediate(() => { return (eformData.administrators.length > index); }), 
    // Then
    new Condition("Check user " + _getFieldArrayNullable(eformData.administrators, index, "firstName") + " " + _getFieldArrayNullable(eformData.administrators, index, "lastName") + " existance", 
    // Condition
    new CheckUserExistanceInAllUsersPage(_getFieldArrayNullable(eformData.administrators, index, "firstName"), _getFieldArrayNullable(eformData.administrators, index, "lastName"), _getFieldArrayNullable(eformData.administrators, index, "email")), 
    // Then
    new SucceedImmediate(), 
    // Then
    new OperationGroup("Create company administrator", new GotoPageFromLinkInCurrentPage("Go to create user page of company '" + eformData.companyName.value + "'", "Create New User", "Create New User"), new CheckElementPresenceById("editForm", "Page did not load correctly"), new CheckElementPresenceById("enabled", "Page did not load correctly"), new Condition("Check if user name can be different than email address", 
    // Condition
    new CheckElementPresenceByIdImmediate("username"), 
    // Then
    new SetInputValueImmediate("username", _getFieldArrayNullable(eformData.administrators, index, "email")), 
    // Else
    new SucceedImmediate()), new SetInputValueImmediate("emailAddress", _getFieldArrayNullable(eformData.administrators, index, "email")), new SetInputValueImmediate("firstName", _getFieldArrayNullable(eformData.administrators, index, "firstName")), new SetInputValueImmediate("lastName", _getFieldArrayNullable(eformData.administrators, index, "lastName")), new CheckRadioOrCheckboxElementByIdImmediate("enabled", true), new SelectInternalRoleInEditUserPage(COMPANY_ADMIN_ROLE_NAME), new NotifyUserImmediate("Press the 'Save / Submit For Approval' button to submit new user creation", true, true))));
}
export class CreateCompanyAdministratorUser extends OperationGroup {
    constructor(eformData) {
        super("Create " + eformData.administrators.length + " company administrator for company '" + eformData.companyName.value + "'", new GotoCompaniesPage(), new CheckCompanyExistanceInCompaniesPage(eformData.companyName.value), new ClickAnchorImmediate(eformData.companyName.value, true), new GotoPageFromMenu("Go to users page of company '" + eformData.companyName.value + "'", "Users", "All Users", true), generateCreateCompanyAdministratorUserOperations(eformData, 0), generateCreateCompanyAdministratorUserOperations(eformData, 1), generateCreateCompanyAdministratorUserOperations(eformData, 2), generateCreateCompanyAdministratorUserOperations(eformData, 3), generateCreateCompanyAdministratorUserOperations(eformData, 4));
    }
}
export class SetupCompany2FASettings extends OperationGroup {
    constructor(eformData) {
        super("Create new company '" + eformData.companyName.value + "' - part 2", new Condition("Check 2FA setup in view company page", new CheckTwoFaConfiguredInViewCompanyPage(eformData), 
        // Then
        new OperationGroup("Creation 2FA setup", new ClickElementByIdImmediate('edit.2fa.settings'), new Condition("Must setup 2FA", new CheckPageTitle("Create 2FA Settings"), new OperationGroup("2FA setup", new CheckElementPresenceById("editForm", "Page did not load correctly"), new CheckRadioOrCheckboxElementByIdImmediate("computerTwoFACheckbox", (eformData.twofa.value === 'Computer' || eformData.twofa.value === 'Computer and Mobile device')), new CheckRadioOrCheckboxElementByIdImmediate("mobileTwoFACheckbox", (eformData.twofa.value === 'Mobile device' || eformData.twofa.value === 'Computer and Mobile device')), new NotifyUserImmediate("Press the 'Save' button to submit 2FA configuration", true, true)))), 
        // Else
        new SucceedImmediate()));
    }
}
export class CreateCompanyInternalRole extends OperationGroup {
    constructor(eformData) {
        super("Creation new internal role '" + COMPANY_ADMIN_ROLE_NAME + "' of company '" + eformData.companyName.value + "'", new GotoCompanyInternalRolesPage(eformData.companyName.value), new Condition("Check presence of internal role '" + COMPANY_ADMIN_ROLE_NAME + "'", new CheckTextImmediate(COMPANY_ADMIN_ROLE_NAME, null, "roleListTable"), 
        // Then
        new SucceedImmediate(), 
        // Else create internal role
        new OperationGroup("Creation new internal role '" + COMPANY_ADMIN_ROLE_NAME + "' for company '" + eformData.companyName.value + "'", new GotoPageFromLinkInCurrentPage("Go to create new internal role link", "Create New Internal Role", "Create Internal Role"), new CheckElementPresenceById("editForm", "Page did not load correctly"), new SetInputValueImmediate("name", COMPANY_ADMIN_ROLE_NAME), new ExpandPermissionHeader(), new SelectPermissionNode("Manage Company Settings", ("YES" === eformData.manageCompanySettings.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Company Users", ("YES" === eformData.manageCompanyUsers.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Transactions", ("YES" === eformData.manageTxn.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Roles and Permissions", ("YES" === eformData.mangeRolesAndPerms.value), null, "permissionTreeTable"), new SelectPermissionNode("Manage Accounts", ("YES" === eformData.manageAccounts.value), null, "permissionTreeTable"), new SelectPermissionNode("Manual Password Change", ("YES" === eformData.manualPasswChange.value), null, "permissionTreeTable"), new ExpandInternalRolePermissionNode("permission.0"), new NotifyUserImmediate("Press the 'Save' button to submit internal role creation", true, true))));
    }
}
export class CreateCompanyUsers extends OperationGroup {
    constructor(eformData) {
        super("Create new user" + " for company '" + eformData.companyName.value + "'", new GotoCompanyAllUsersPage(eformData.companyName.value));
    }
}
export class CheckPendingChangesTextImmediate extends CheckTextImmediate {
    constructor() {
        super("View Pending Changes", null, "viewPendingChangesLink", null);
    }
}
