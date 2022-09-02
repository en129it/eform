import { ExecutionStatus } from './operationType';
const TIMEOUT_IN_MSEC = 5000;
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
}
export class OperationExecutor {
    constructor() {
        this.executionContext = new ExecutionContext(document, this);
    }
    execute(operation) {
        const execStartTimestamp = new Date();
        let excutionStatus = ExecutionStatus.EXECUTING;
        do {
            excutionStatus = operation.execute(this.executionContext);
        } while (excutionStatus === ExecutionStatus.EXECUTING && ((new Date() - execStartTimestamp) < TIMEOUT_IN_MSEC));
        if (excutionStatus === ExecutionStatus.EXECUTING) {
            throw new Error("Operation " + operation.getName() + " does not complete within " + TIMEOUT_IN_MSEC + " seconds");
        }
        return (excutionStatus === ExecutionStatus.SUCCEEDED) ? FinalExecutionStatus.SUCCEEDED : FinalExecutionStatus.FAILED;
    }
}
//# sourceMappingURL=executor.js.map