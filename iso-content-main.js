import { OperationExecutor, FinalExecutionStatus } from './executor.js';
import { CheckIsLoggedIn, GotoCompaniesPage, CheckCompanyExistanceInCompaniesPage, GotoCompanyDetailPageFromAllCompaniesPage, CreateCompanyFromAllCompaniesPage, CheckPendingChangesTextImmediate } from './operation.js';
import { Condition, NotifyUserImmediate, OperationGroup } from './operationType.js';


  
export function executeCopy(eformData) {
  console.log("##### Start processing of operations");

  var companyName = eformData.companyName;
    
  var operationGroup = new OperationGroup('Main', 
      new CheckIsLoggedIn(),
      new GotoCompaniesPage(),
      new Condition("Company existance condition",
          // If company exists 
          new CheckCompanyExistanceInCompaniesPage(companyName), 
          // Then
          new OperationGroup('Company',
            new GotoCompanyDetailPageFromAllCompaniesPage(companyName), 
            new Condition("Company pending changes condition",
                // If pending changes
                new CheckPendingChangesTextImmediate(),
                // Then
                new NotifyUserImmediate("Company has pending changes. Review and approve these changes", true, true)
            )
          ),
          // Else
          new CreateCompanyFromAllCompaniesPage(eformData)
      )
  );
  
  
  var exec = new OperationExecutor();
  var rslt = exec.execute(operationGroup);
  rslt.then( data => {
      console.log("######## rslt with data " + data + "  " + FinalExecutionStatus[0] + " - " + FinalExecutionStatus[1] );
  }, error => {
      console.log("######## rslt with error " + error);
  });
  
}

window.executeCopy = executeCopy;
console.log("##### exported function executeCopy() ", window.executeCopy);

