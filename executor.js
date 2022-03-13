import { TimeoutRetrialOperation, ExecutionStatus } from './operationType.js';
const TIMEOUT_IN_MSEC = 10000;
export var FinalExecutionStatus;
(function (FinalExecutionStatus) {
    FinalExecutionStatus[FinalExecutionStatus["SUCCEEDED"] = 0] = "SUCCEEDED";
    FinalExecutionStatus[FinalExecutionStatus["FAILED"] = 1] = "FAILED";
})(FinalExecutionStatus || (FinalExecutionStatus = {}));
export class IFrameLoadEvent {
    constructor(iframeId, eventDate) {
        this.iframeId = iframeId;
        this.eventDate = eventDate;
    }
}
export class ExecutionContext {
    constructor(document, executor) {
        this.document = document;
        this.executor = executor;
        this.operationStack = new Array();
        this.iframeLoadEventListener = (event) => {
            this.lastIFrameLoadEvent = new IFrameLoadEvent(event.target.id, new Date());
        };
        this.lastIFrameLoadEvent = new IFrameLoadEvent("init", new Date());
    }
    execute(operation) {
        return this.executor.execute(operation);
    }
    getLastIFrameLoadEvent() {
        return this.lastIFrameLoadEvent;
    }
    getDocuments() {
        const rslt = new Array();
        rslt.push(this.document);
        this.document.removeEventListener('load', this.iframeLoadEventListener);
        this.document.addEventListener('load', this.iframeLoadEventListener);
        this.getDocumentsHelper(this.document, rslt);
        return rslt;
    }
    getDocumentsHelper(document, documents) {
        const iframeElems = document.getElementsByTagName("iframe");
        document.removeEventListener('load', this.iframeLoadEventListener);
        document.addEventListener('load', this.iframeLoadEventListener);
        for (let i = 0; i < iframeElems.length; i++) {
            const iframeElem = iframeElems.item(i);
            if ("true" != iframeElem.getAttribute("aria-hidden")) {
                const iframeDoc = iframeElem.contentWindow.document;
                iframeElem.removeEventListener('load', this.iframeLoadEventListener);
                iframeElem.addEventListener('load', this.iframeLoadEventListener);
                documents.push(iframeDoc);
                this.getDocumentsHelper(iframeDoc, documents);
            }
        }
    }
    notifyInfoMessage(message) {
        console.log("######## notifyInfoMessage", message);
        chrome.runtime.sendMessage({ messageType: "InfoMessage", message: message });
    }
    notifyWarnMessage(message) {
        console.log("######## notifyWarnMessage", message);
        chrome.runtime.sendMessage({ messageType: "WarnMessage", message: message });
    }
    notifyUserActionMessage(message) {
        console.log("######## notifyUserActionMessage", message);
        chrome.runtime.sendMessage({ messageType: "WarnMessage", message: message });
    }
}
export class OperationExecutor {
    constructor() {
        console.log("# OperationExecutor.create() ");
        this.executionContext = new ExecutionContext(document, this);
    }
    execute(operation) {
        console.log("# OperationExecutor.execute() " + operation.getName());
        if (this.rootOperation == null) {
            this.rootOperation = operation;
        }
        return new Promise((resolve, reject) => {
            const execStartTimestamp = new Date();
            this.executeHelper(operation, execStartTimestamp, resolve, reject);
        }).then(rslt => {
            console.log("# OperationExecutor.execute() rslt ", rslt);
            return rslt;
        }, error => {
            console.log("# OperationExecutor.execute() error " + operation.getName(), error);
            if (error instanceof Error) {
                console.log("======= already error instance", error);
                throw error;
            }
            else {
                console.log("======= NOT already error instance", error);
                throw new Error(error);
            }
            return error;
        });
    }
    executeHelper(operation, execStartTimestamp, resolve, reject) {
        console.log("   # OperationExecutor.executeHelper before operation execution " + operation.getName());
        operation.execute(this.executionContext).then(executionStatus => {
            if (executionStatus === ExecutionStatus.EXECUTING) {
                console.log("   # OperationExecutor.executeHelper operation execution returned EXECUTING");
                if ((new Date() - execStartTimestamp) < TIMEOUT_IN_MSEC) {
                    console.log("   # OperationExecutor.executeHelper retry later " + operation.getName());
                    setTimeout(() => {
                        this.executeHelper(operation, execStartTimestamp, resolve, reject);
                    }, 200);
                }
                else {
                    let errorMsg = null;
                    if (operation instanceof TimeoutRetrialOperation) {
                        errorMsg = operation.timeoutErrorMessage();
                    }
                    if (errorMsg == null) {
                        errorMsg = "Operation '" + operation.getName() + "' does not complete within " + TIMEOUT_IN_MSEC + " seconds";
                    }
                    console.log("   # OperationExecutor.executeHelper retry timeout");
                    this.executionContext.notifyWarnMessage(errorMsg);
                    reject(errorMsg);
                }
            }
            else {
                console.log("   # OperationExecutor.executeHelper operation execution returned SUCCEEDED or FAILED");
                setTimeout(() => {
                    resolve((executionStatus === ExecutionStatus.SUCCEEDED) ? FinalExecutionStatus.SUCCEEDED : FinalExecutionStatus.FAILED);
                }, 1);
            }
        }, error => {
            reject(error);
            //throw new Error(error); 
        });
    }
}
