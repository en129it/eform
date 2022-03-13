import { OperationExecutor, FinalExecutionStatus } from './executor.js';
import { CheckIsLoggedIn, GotoCompaniesPage, CheckCompanyExistanceInCompaniesPage, GotoCompanyDetailPageFromAllCompaniesPage, CreateCompanyFromAllCompaniesPage, CreateCompanyInternalRole, CreateCompanyAdministratorUser, CheckPendingChangesTextImmediate, CreateCompanyFromManageCompanyPage, CreateCompanyPermissions } from './operation.js';
import { Condition, NotifyUserImmediate, OperationGroup } from './operationType.js';


  
export function executeCopy(eformData) {
  console.log("##### Start processing of operations");

  var companyName = eformData.companyName.value;
    
  var operationGroup = new OperationGroup('Main', 
      new CheckIsLoggedIn(),
      new GotoCompaniesPage(),
      new Condition("Company existance condition",
          // If the company already exists
          new CheckCompanyExistanceInCompaniesPage(companyName), 
          // Then
          new OperationGroup('Company',
            new GotoCompanyDetailPageFromAllCompaniesPage(companyName), 
            new Condition("Company pending changes condition",
                // If pending changes
                new CheckPendingChangesTextImmediate(),
                // Then
                new NotifyUserImmediate("Company has pending changes. Review and approve these changes", true, true),
                // Else
                new OperationGroup('Company', 
                    new CreateCompanyFromManageCompanyPage(eformData),
                    new CreateCompanyPermissions(eformData),
                    new CreateCompanyInternalRole(eformData),
                    new CreateCompanyAdministratorUser(eformData)
                )
            )
          ),
          // Else create the company
          new CreateCompanyFromAllCompaniesPage(eformData)
      )
  );
  
  
  
  var operationExecutor = new OperationExecutor();
  var rslt = operationExecutor.execute(operationGroup);
  rslt.then( data => {
      console.log("######## rslt with data " + data + "  " + FinalExecutionStatus[0] + " - " + FinalExecutionStatus[1] );
  }, error => {
      console.log("######## rslt with error ", error);
  });
  
}

console.log("#### Has executeCopy function ? " + window.executeCopy);

window.executeCopy = executeCopy;
console.log("##### exported function executeCopy() ", window.executeCopy);

