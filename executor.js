import { ExecutionStatus } from './operationType.js';
const TIMEOUT_IN_MSEC = 10000;
export var FinalExecutionStatus;
(function (FinalExecutionStatus) {
    FinalExecutionStatus[FinalExecutionStatus["SUCCEEDED"] = 0] = "SUCCEEDED";
    FinalExecutionStatus[FinalExecutionStatus["FAILED"] = 1] = "FAILED";
})(FinalExecutionStatus || (FinalExecutionStatus = {}));
export class ExecutionContext {
    constructor(document, executor) {
        this.document = document;
        this.executor = executor;
        this.operationStack = new Array();
    }
    execute(operation) {
        return this.executor.execute(operation);
    }
    getDocuments() {
        const rslt = new Array();
        rslt.push(this.document);
        const iframeElems = this.document.getElementsByTagName("iframe");
        for (let i = 0; i < iframeElems.length; i++) {
            const iframeElem = iframeElems.item(i);
            const iframeDoc = iframeElem.contentWindow.document;
            rslt.push(iframeDoc);
        }
        return rslt;
    }
    notifyInfoMessage(message) {
        chrome.runtime.sendMessage({ messageType: "InfoMessage", message: message });
    }
    notifyWarnMessage(message) {
        chrome.runtime.sendMessage({ messageType: "WarnMessage", message: message });
    }
    notifyUserActionMessage(message) {
        chrome.runtime.sendMessage({ messageType: "WarnMessage", message: message });
    }
}
export class OperationExecutor {
    constructor() {
        this.executionContext = new ExecutionContext(document, this);
    }
    execute(operation) {
        console.log("# OperationExecutor.execute() " + operation.getName());
        return new Promise((resolve, reject) => {
            const execStartTimestamp = new Date();
            this.executeHelper(operation, execStartTimestamp, resolve, reject);
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
                    console.log("   # OperationExecutor.executeHelper retry timeout");
                    reject("Operation " + operation.getName() + " does not complete within " + TIMEOUT_IN_MSEC + " seconds");
                }
            }
            else {
                console.log("   # OperationExecutor.executeHelper operation execution returned SUCCEEDED or FAILED");
                setTimeout(() => {
                    resolve((executionStatus === ExecutionStatus.SUCCEEDED) ? FinalExecutionStatus.SUCCEEDED : FinalExecutionStatus.FAILED);
                }, 1000);
            }
        }, error => {
            throw new Error(error);
        });
    }
}
