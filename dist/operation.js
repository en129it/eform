import { NoTrialOperation, TimeoutRetrialOperation, OperationGroup, ExecutionStatus } from './operationType';
//#############################################################################
//#############################################################################
// CHECK
//#############################################################################
//#############################################################################
function findTextInDocuments(text, containerElemClassName, containerElemId, documents) {
    const textContentArr = new Array();
    documents.forEach(document => {
        if (this.containerElemId) {
            const elem = document.getElementById(this.containerElemId);
            if (elem != null) {
                textContentArr.push(elem.outerHTML);
            }
        }
        else if (this.containerElemClassName) {
            const candidateElems = document.getElementsByClassName(this.containerElemClassName);
            for (let i = 0; i < candidateElems.length; i++) {
                textContentArr.push(candidateElems[i].outerHTML);
            }
        }
        else {
            const elem = document.getElementsByTagName('body')[0];
            if (elem != null) {
                textContentArr.push(elem.outerHTML);
            }
        }
    });
    return (textContentArr.find(textContent => textContent.indexOf(this.text) > -1) != null);
}
export class CheckTextImmediate extends NoTrialOperation {
    constructor(text, containerElemClassName, containerElemId, name) {
        super("Check text '" + text + "' immediately");
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
        super("Check text '" + text + "'");
        this.text = text;
        this.containerElemClassName = containerElemClassName;
        this.containerElemId = containerElemId;
    }
    executeOperation(documents) {
        return findTextInDocuments(this.text, this.containerElemClassName, this.containerElemId, documents) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.EXECUTING;
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
//#############################################################################
//#############################################################################
// ACTION
//#############################################################################
//#############################################################################
export class ClickAnchorImmediate extends NoTrialOperation {
    constructor(label) {
        super("Click anchor '" + label + "'");
        this.label = label;
    }
    executeOperation(documents) {
        let rslt = false;
        documents.forEach(document => {
            if (!rslt) {
                const anchorElems = document.getElementsByTagName("a");
                console.log("      Found " + anchorElems.length + " candiate anchors");
                for (let i = 0; i < anchorElems.length; i++) {
                    const anchorElem = anchorElems.item(i);
                    if (anchorElem.outerHTML.indexOf(this.label) > -1) {
                        console.log("      Anchor elem found and text is " + this.label);
                        anchorElem.click();
                        console.log("      Anchor elem clicked");
                        rslt = true;
                        break;
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
                if (elem && elem) {
                    elem.value = this.value;
                    rslt = true;
                }
            }
        });
        return rslt;
    }
}
export class GotoPageFromMenu extends OperationGroup {
    constructor(name, menuLabel, pageUrlPart) {
        super(name, new CheckText(menuLabel, null, null), new ClickAnchorImmediate(menuLabel), new CheckPageUrl(pageUrlPart));
    }
}
export class GotoCompaniesPage extends GotoPageFromMenu {
    constructor() {
        super("Go to Companies page", 'All companies', 'CompanyAdministration.external');
    }
}
//# sourceMappingURL=operation.js.map