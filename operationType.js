import { FinalExecutionStatus } from "./executor.js";
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
        return new Promise((resolve, reject) => {
            resolve((executionStatus) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED);
        });
    }
}
export class TimeoutRetrialOperation extends Operation {
    execute(context) {
        return new Promise((resolve, reject) => {
            resolve(this.executeOperation(context.getDocuments()));
        });
    }
}
export class OperationGroup extends Operation {
    constructor(name, ...operations) {
        super(name);
        this.operations = operations;
    }
    doNextOperation(context, arrayIndex) {
        console.log("      # OperationGroup execute array index " + arrayIndex);
        return context.execute(this.operations[arrayIndex]).then(finalExecutionStatus => {
            if (finalExecutionStatus === FinalExecutionStatus.FAILED) {
                console.log("      # OperationGroup execute array index returned FAILED");
                return FinalExecutionStatus.FAILED;
            }
            else if (arrayIndex === this.operations.length - 1) {
                console.log("      # OperationGroup execute array index all array items executed. Return " + finalExecutionStatus);
                return finalExecutionStatus;
            }
            else {
                return this.doNextOperation(context, arrayIndex + 1);
            }
        }, error => {
            throw new Error(error);
        });
    }
    execute(context) {
        return this.doNextOperation(context, 0).then(finalExecutionStatus => {
            return (finalExecutionStatus === FinalExecutionStatus.SUCCEEDED) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED;
        }, error => {
            throw new Error(error);
        });
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
        return context.execute(this.condition).then(finalExecutionStatus => {
            let branchPromise = null;
            if (finalExecutionStatus === FinalExecutionStatus.SUCCEEDED) {
                branchPromise = context.execute(this.success);
            }
            else if (this.failure) {
                branchPromise = context.execute(this.failure);
            }
            if (branchPromise != null) {
                return branchPromise.then(branchExecutionStatus => (branchExecutionStatus === FinalExecutionStatus.SUCCEEDED) ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED, error => { throw new Error(error); });
            }
            else {
                return ExecutionStatus.SUCCEEDED;
            }
        }, error => {
            throw new Error(error);
        });
    }
}
export class NotifyUserImmediate extends NoTrialOperation {
    constructor(message, isWarn, mustTerminate) {
        super("Notify user");
        this.message = message;
        this.isWarn = isWarn;
        this.mustTerminate = mustTerminate;
    }
    execute(context) {
        if (this.isWarn) {
            context.notifyWarnMessage(this.message);
        }
        else {
            context.notifyInfoMessage(this.message);
        }
        return new Promise((resolve, reject) => {
            if (this.mustTerminate) {
                reject("Interrupted because : " + this.message);
            }
            else {
                resolve(ExecutionStatus.SUCCEEDED);
            }
        });
    }
    executeOperation(documents) {
        return true;
    }
}
