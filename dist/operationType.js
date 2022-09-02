import { FinalExecutionStatus } from "./executor";
export var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus[ExecutionStatus["EXECUTING"] = 0] = "EXECUTING";
    ExecutionStatus[ExecutionStatus["SUCCEEDED"] = 1] = "SUCCEEDED";
    ExecutionStatus[ExecutionStatus["FAILED"] = 2] = "FAILED";
})(ExecutionStatus || (ExecutionStatus = {}));
export class Operation {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return this.name;
    }
}
export class NoTrialOperation extends Operation {
    execute(context) {
        const executionStatus = this.executeOperation(context.getDocuments());
        return (executionStatus) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED;
    }
}
export class TimeoutRetrialOperation extends Operation {
    execute(context) {
        return this.executeOperation(context.getDocuments());
    }
}
export class OperationGroup extends Operation {
    constructor(name, ...operations) {
        super(name);
        this.lastExecOperationsIndex = -1;
        this.operations = operations;
        this.lastExecOperationsIndex = -1;
    }
    execute(context) {
        for (let i = 0; i < this.operations.length; i++) {
            const finalExecutionStatus = context.execute(this.operations[this.lastExecOperationsIndex]);
            if (finalExecutionStatus === FinalExecutionStatus.FAILED) {
                return ExecutionStatus.FAILED;
            }
        }
        return ExecutionStatus.SUCCEEDED;
    }
}
export class Condition extends Operation {
    constructor(name, condition, success, failure) {
        super(name);
        this.condition = condition;
        this.success = success;
        this.failure = failure;
    }
    execute(context) {
        const finalExecutionStatus = context.execute(this.condition);
        let branchExecutionStatus = null;
        if (finalExecutionStatus === FinalExecutionStatus.SUCCEEDED) {
            branchExecutionStatus = context.execute(this.success);
        }
        else if (this.failure) {
            branchExecutionStatus = context.execute(this.failure);
        }
        return branchExecutionStatus === FinalExecutionStatus.SUCCEEDED ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED;
    }
}
//# sourceMappingURL=operationType.js.map