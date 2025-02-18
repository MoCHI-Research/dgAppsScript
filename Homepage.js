/**************************************************************************************/
//Homepage.gs
//page 2
//Overview: Sets up home page and names actions
//Functions In Use:
//    homepageTrigger()
//    poptorootaction()   
/**************************************************************************************/

//Set colors for the entire system
const button_color1 = "#99CCFF" //for home button
const button_color2 = "#99CCFF" //for most buttons
const button_color3 = "#1d1dc2" //for completion buttons
const button_color4 = "#626262" //for cancelation buttons


//Actions to switch between screens
const goToCreateAGroupAction = CardService.newAction().setFunctionName('choose_creation_type');
const goToEditAGroupAction = CardService.newAction().setFunctionName('goToEditAGroup');
const goToAddUsers = CardService.newAction().setFunctionName('addUserEmails')
const goToDeleteUser = CardService.newAction().setFunctionName('deleteUser');
const goToDeleteAGroup = CardService.newAction().setFunctionName('deleteGroup');
const goToMyGroupsAction = CardService.newAction().setFunctionName('goToMyGroups');
const goToShareWithAGroupAction = CardService.newAction().setFunctionName('goToShareWithAGroup');
const goToAccessPageAction = CardService.newAction().setFunctionName('goToAccessPage');
const goToGroupAccessAction = CardService.newAction().setFunctionName('goToGroupAccess');
const goToFileAccessAction = CardService.newAction().setFunctionName('goToFileAccess');
const goToCompletionAction = CardService.newAction().setFunctionName('goToCompletion');
const goToRestoreArchivedAction = CardService.newAction().setFunctionName('goToRestoreArchived');
const testAction = CardService.newAction().setFunctionName('test');
const divider = CardService.newDivider();

/*The function that runs when you open the application. 
  (See "homepageTrigger" in appsscript.json)
  Returns: a built Card of the homepage*/
function homepageTrigger() {
  //"Create a Group" Section
  //Contains one widget that has a text button
  //with text "Create a Group"
  //Click on the button to go to(push) "create a group" card
  let createAGroupSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setText("Create a Group")
      .setBackgroundColor(button_color2)
      .setOnClickAction(goToCreateAGroupAction)
    )

  //"Existing Groups" Section
  //Contains one widget that has a text button
  //with text "My Groups"
  //Click on the button to go to(push) "my groups" card
  let myGroupsSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setText("     " + "Manage Groups" + "     ")
      .setBackgroundColor(button_color2)
      .setOnClickAction(goToMyGroupsAction))

  //"Share with a Group" Section
  //Contains one widget that has a text button
  //with text "Share with a Group"
  //Click on the button to go to(push) "share with a group" card
  let shareWithAGroupSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setText("Share with a Group")
      .setBackgroundColor(button_color2)
      .setOnClickAction(goToShareWithAGroupAction))

  //"View Access" Section
  //Contains one widget that has a text button
  //with text "View Access"
  //Click on the button to go to(push) group access card
  let accessSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setText("Manage File Access")
      .setBackgroundColor(button_color2)
      .setOnClickAction(goToAccessPageAction))
 
  let archivedSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setText("Restore Archived Groups")
      .setBackgroundColor(button_color2)
      .setOnClickAction(goToRestoreArchivedAction))
  //Set the card
  var card = CardService.newCardBuilder()
    //Set card name for navigation
    .setName("Homepage")
    //Add all five sections to the card
    .addSection(createAGroupSection)
    .addSection(myGroupsSection)
    .addSection(shareWithAGroupSection)
    .addSection(accessSection)
    .addSection(archivedSection)
    //Build the card
    .build();

  return card
}

//Pops back to the homepage, consistantly used to build the home button footer
function poptorootaction(){
  response = CardService.newActionResponseBuilder()
                        .setNavigation(CardService.newNavigation()
                            .popToRoot())
                        .setStateChanged(true)
                        .build()
  return response
}

