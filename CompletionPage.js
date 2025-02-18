/*Called when user finishes giving access of a group to a file
  Updates the access permissions in the backend, goes to a page with notification that
  action is completed, and offers options for going forward

  Parameters: e(Event): clicking event that calls this function
  Returns(Action Response): an action response object that updates the card to completion page
*/
function goToCompletion(e) {
  //Gets group ID and file ID from clicking event
  let groupId = e['parameters']['group_id']
  let fileId = e['parameters']['file_id']

  //Gets user's choice of access level from selection input
  //The selection input is named 'checkbox_field'; see set_file_helper() of ShareWithAGroup.gs
  //checkbox_input can be "edit," "comment," or "view"
  let checkbox_input = e['formInput']['checkbox_field'];
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //Grant the selected access level of the file to the group in the backend
  back_grant_file_access(groupId, fileId, checkbox_input, conn);
  grant_access_new_file(groupId, fileId, checkbox_input);
  //test(groupId, fileId, checkbox_input);

  //Declare a button set
  let buttonSet = CardService.newButtonSet()
  //"Next File" button of the button set
  nextFileButton = CardService.newTextButton()
    .setText("Next File")
    .setBackgroundColor(button_color2)
    //The button, once clicked, calls function goBackToFileList() with argument input groupId
    .setOnClickAction(CardService.newAction()
      .setFunctionName('pop_back_twice')
      .setParameters({"group_id": groupId})
    )
  //"Next Group" button of the button set
  nextGroupButton = CardService.newTextButton()
    .setText("Next Group")
    .setBackgroundColor(button_color2)
    //The button, once clicked, calls function goBackToGroupList()
    .setOnClickAction(CardService.newAction()
      .setFunctionName('goBackToGroupList')
    )
  //"Done" button of the button set
  doneButton = CardService.newTextButton()
    .setText("Done")  
    .setBackgroundColor(button_color3)  
    //The button, once clicked, calls function goToGroupAccessPage() with argument input groupId
    .setOnClickAction(CardService.newAction()
      .setFunctionName('goToGroupAccessPage')
      .setParameters({"group_id": groupId})
    )
  //Add all three buttons to the button set
  buttonSet.addButton(nextFileButton)
           .addButton(nextGroupButton)
           .addButton(doneButton)

  //Creates and builds card
  let card = CardService
    .newCardBuilder()
      //Set card name for navigation
    .setName("Completion page")
    .setFixedFooter(CardService.newFixedFooter()
                        .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))
                        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                        .setBackgroundColor(button_color1)
                        ))
    //Set header of the card to indicate the file has successfully been shared
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Successfully shared!'))
    //Add a section to the card that contains the button set
    .addSection(
      CardService.newCardSection()
        .addWidget(buttonSet))
    //Build the card
    .build()
  
  //Sets navigaton updating the card, and returns action response object
  var nav = CardService.newNavigation().pushCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

function share_with_subgroups(groupId, fileId_list, access_level, conn){
  let children = get_child_groups(groupId, conn)
  for (i in children){
    child = children[i][0]
    let index = 0
    let fileId = fileId_list[0]
    while(fileId_list[index] != null){
       fileId = fileId_list[index]
        back_grant_file_access(child, fileId, access_level, conn);
        grant_access_new_file(child, fileId, access_level);
        index ++
  }
  }
}

function completionMultiSelectAction(e){
    //Gets group ID and file ID from clicking event
  let groupId = e['parameters']['groupId']
  var fileId_list = e['formInputs']['select_files']

  //Gets user's choice of access level from selection input
  //The selection input is named 'checkbox_field'; see set_file_helper() of ShareWithAGroup.gs
  //checkbox_input can be "edit," "comment," or "view"
  let checkbox_input = e['formInput']['checkbox_field'];
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //Grant the selected access level of the file to the group in the backend
  let index = 0
  let fileId = fileId_list[0]
  while(fileId_list[index] != null){
       fileId = fileId_list[index]
        back_grant_file_access(groupId, fileId, checkbox_input, conn);
        index ++
  }
  grant_access_new_files(groupId, fileId_list, checkbox_input, conn);
  //share_with_subgroups(groupId, fileId_list, checkbox_input, conn)
 
  //Declare a button set
  let buttonSet = CardService.newButtonSet()
  //"Next File" button of the button set
  nextFileButton = CardService.newTextButton()
    .setText("Share more files with this group")
    .setBackgroundColor(button_color2)
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    //The button, once clicked, calls function goBackToFileList() with argument input groupId
    .setOnClickAction(CardService.newAction()
      .setFunctionName('pop_back_twice')
      .setParameters({"groupId": groupId})
    )
  //"Next Group" button of the button set
  nextGroupButton = CardService.newTextButton()
    .setText("Share with another group")
    .setBackgroundColor(button_color2)
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    //The button, once clicked, calls function goBackToGroupList()
    .setOnClickAction(CardService.newAction()
      .setFunctionName('goBackToGroupList')
    )
  //"Done" button of the button set
  doneButton = CardService.newTextButton()
    .setText("Done")
    .setBackgroundColor(button_color3)
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)    
    //The button, once clicked, calls function goToGroupAccessPage() with argument input groupId
    .setOnClickAction(CardService.newAction()
      .setFunctionName('goToGroupAccessPage')
      .setParameters({"group_id": groupId})
    )
  //Add all three buttons to the button set
  buttonSet.addButton(nextFileButton)
           .addButton(nextGroupButton)
           .addButton(doneButton)

  //Creates and builds card
  let card = CardService
    .newCardBuilder()
      //Set card name for navigation
    .setName("Completion page")
    .setFixedFooter(CardService.newFixedFooter()
                        .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))
                        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                        .setBackgroundColor(button_color1)
                        ))
    //Set header of the card to indicate the file has successfully been shared
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Successfully shared!'))
    //Add a section to the card that contains the button set
    .addSection(
      CardService.newCardSection()
        .addWidget(buttonSet))
    //Build the card
    .build()

    conn.close()
  
  //Sets navigaton updating the card, and returns action response object
  var nav = CardService.newNavigation().pushCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

//creates navigation to pop 2 top cards
function pop_back_twice(e){
  var nav = CardService.newNavigation().popCard().popCard()
  return CardService.newActionResponseBuilder().setNavigation(nav).build() 
}

/*Navigate by going all the way back to homepage, and then push the card
  for Share With a Group

  Returns(Action Response): action response object that does the job of navigation
*/
function goBackToGroupList() {
  //Navigate first by popping to the root(homepage), and then by pushing the card
  //calling goToShareWithAGroupHelper()
  var nav = CardService.newNavigation()
    .popToRoot()
    .pushCard(goToShareWithAGroupHelper());
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*Navigate by popping one card(card "Completion page" when this function is called
  in goToCompletion()), and then updating the card for file list to share with a given
  group

  Parameters: e(Event): clicking event that calls this function
  Returns(Action Response): action response object that does the job of navigation
*/
function goBackToFileList(e) {
  //Gets group ID from clicking event
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let groupId = e['parameters']['group_id'];

  //Get group name by retrieving the group with group ID from backend
  let groupName = back_retrieve_group(groupId, conn).name
  conn.close()
  //Navigate first by popping a card, and then by updating the card
  //calling set_group_helper(); this will navigate to the list of files
  //user can share with the group with groupId
  var nav = CardService.newNavigation()
    .popToRoot()
    .pushCard(set_group_helper(groupId, groupName));
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*Navigate by popping to the homepage and then updating the card for file access of 
  a given group

  Parameters: e(Event): clicking event that calls this function
  Returns(Action Response): action response object that does the job of navigation
*/
function goToGroupAccessPage(e) {
  //Gets group ID from clicking event
  var conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let groupId = e['parameters']['group_id'];

  //Navigate first by popping to the root(homepage), and then by pushing the card
  //calling show_group_helper()
  var nav = CardService.newNavigation().popToRoot().pushCard(show_group_helper(groupId, conn));
  conn.close()
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

