import { NoTrialOperation, TimeoutRetrialOperation, OperationGroup, ExecutionStatus, NotifyUserImmediate } from './operationType.js';
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
    return found;
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
export class CheckText extends TimeoutRetrialOperation {
    constructor(text, containerElemClassName, containerElemId, name) {
        super((name != null) ? name : ("Check text '" + text + "'"));
        this.text = text;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
    }
    executeOperation(documents) {
        return findTextInDocuments(this.text, this.containerElemClassName, this.containerElemId, documents) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.EXECUTING;
    }
}
export class CheckTextOrAlternateText extends TimeoutRetrialOperation {
    constructor(text, alternateText, containerElemClassName, containerElemId, name) {
        super("Check text '" + text + "'");
        this.text = text;
        this.alternateText = alternateText;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
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
}
export class CheckIsLoggedIn extends CheckText {
    constructor() {
        super("Hi, ", "user-nav-menu", null, "Check is logged in");
    }
}
export class CheckPageUrl extends TimeoutRetrialOperation {
    constructor(urlPart) {
        super("Check URL contains part '" + urlPart + "'");
        this.urlPart = urlPart;
    }
    executeOperation(documents) {
        return (documents[0].location.href.indexOf(this.urlPart) > -1) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.EXECUTING;
    }
}
export class CheckPageTitle extends CheckText {
    constructor(pageTitle) {
        super(pageTitle, "page_title", null, "Check page title is '" + pageTitle + "'");
    }
}
//#############################################################################
//#############################################################################
// ACTION
//#############################################################################
//#############################################################################
export class ClickAnchorImmediate extends NoTrialOperation {
    constructor(label, isCaseInsensitive = false) {
        super("Click anchor '" + label + "'");
        this.label = label;
        this.isCaseInsensitive = isCaseInsensitive;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            if (!rslt) {
                const anchorElems = document.getElementsByTagName("a");
                console.log("      Found " + anchorElems.length + " candiate anchors");
                for (let i = 0; i < anchorElems.length; i++) {
                    const anchorElem = anchorElems.item(i);
                    if (this.isCaseInsensitive) {
                        if (anchorElem.outerHTML.toUpperCase().indexOf(this.label.toUpperCase()) > -1) {
                            console.log("      Anchor elem found and text is " + this.label);
                            anchorElem.click();
                            console.log("      Anchor elem clicked");
                            rslt = true;
                            break;
                        }
                    }
                    else {
                        if (anchorElem.outerHTML.indexOf(this.label) > -1) {
                            console.log("      Anchor elem found and text is " + this.label);
                            anchorElem.click();
                            console.log("      Anchor elem clicked");
                            rslt = true;
                            break;
                        }
                    }
                }
            }
        });
        return rslt;
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
export class SetInputValueImmediate extends NoTrialOperation {
    constructor(id, value) {
        super("Fill input id '" + id + "' with value '" + value + "'");
        this.id = id;
        this.value = value;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            if (!rslt) {
                const elem = document.getElementById(this.id);
                if (elem) {
                    elem.value = this.value;
                    rslt = true;
                }
            }
        });
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
export class GotoPageFromMenu extends OperationGroup {
    constructor(name, menuLabel, pageTitle) {
        super(name, new CheckText(menuLabel, null, null), new ClickAnchorImmediate(menuLabel, false), new CheckPageTitle(pageTitle));
    }
}
export class GotoPageFromLinkInCurrentPage extends OperationGroup {
    constructor(name, anchorLabel, pageTitle, isCaseInsesitive) {
        super(name, new ClickAnchorImmediate(anchorLabel, isCaseInsesitive), new CheckPageTitle(pageTitle));
    }
}
export class GotoCompaniesPage extends GotoPageFromMenu {
    constructor() {
        super("Go to Companies page", 'All companies', 'All Companies');
    }
}
export class CheckCompanyExistanceInCompaniesPage extends OperationGroup {
    constructor(companyName) {
        super("Check company '" + companyName + "' existance in All Companies page", new CheckTextImmediate('searchSubmit', null, null), new SetInputValueImmediate('search', companyName), new ClickElementByIdImmediate('searchSubmit'), new CheckTextOrAlternateText('1 result found', '0 results found', null, null));
    }
}
export class GotoCompanyDetailPageFromAllCompaniesPage extends GotoPageFromLinkInCurrentPage {
    constructor(companyName) {
        super("Go to detail page of company '" + companyName + "'", companyName, "Manage Company", true);
    }
}
export class CreateCompanyFromAllCompaniesPage extends OperationGroup {
    constructor(eformData) {
        super("Create new company '" + eformData.companyName + "'", new ClickElementByIdImmediate('create.new.company'), new CheckPageTitle("Create New Company"), new SetInputValueImmediate("name", eformData.companyName), new SetInputValueImmediate("address1", eformData.companyAddress), new SetInputValueImmediate("city", eformData.companyCity), new SetSelectValueImmediate("country", eformData.companyCountry), new SetInputValueImmediate("provState_", eformData.companyProvince), new SetInputValueImmediate("postalZipCode", eformData.companyZip), new NotifyUserImmediate("Press the 'Save' button to submit new company creation", true, true));
    }
}
export class CheckPendingChangesTextImmediate extends CheckTextImmediate {
    constructor() {
        super("View Pending Changes", null, "viewPendingChangesLink", null);
    }
}
