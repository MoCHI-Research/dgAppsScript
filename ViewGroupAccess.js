/*Go to（push) the card for list of groups that exist
  click on each group to view and edit the file access of that group

  Returns(Action Response): An action response object that pushes the card for the list of groups
*/
function goToGroupAccess() {
  //Gets built card(without navigation) for group list by calling helper function
  let card = goToGroupAccessHelper();

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card)
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

/*Helper function for goToGroupAccess(); creates and builds the card for navigation push

  Returns(Card): 
    built card(without navigation) page for list of existing groups whose
    file access information can be viewed and edited
*/
function goToGroupAccessHelper(groups) {
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var groups = back_retrieve_all_groups(conn);
  //Group list section of card "Choose a group to view access"
  var group_list_section;
  //If any group exists, set the header as "Choose a group:"
  if (groups.length != 0) {
    group_list_section = CardService.newCardSection().setHeader("Choose a group to view its access:")
  //If no group exists, add widgets to group list section indicating 
  //no group has been created, and provide a shortcut to create a group
  } else {
    group_list_section = CardService.newCardSection()
      .addWidget(
        CardService.newTextParagraph()
          .setText("Currently no group has been created.")
      )
      .addWidget(
        CardService.newTextButton()
          //The font color for shortcut text is set as blue
          .setText("<font color=\'#0000FF\'>Click here to create one</font>")
          .setAltText("Create a new group.")
          //When shortcut is clicked, calls goToCreateAGroup()
        //(Constant goToCreateAGroupAction is declared in homepage.gs)
          .setOnClickAction(goToCreateAGroupAction)
      )
  }

  //For each existing group, add widget to group list section
  for (index in groups) {
    //Gets group information(id and name)
    let group_id = groups[index][0]                 
    let name = groups[index][1]
    let parentid = groups[index][2]
    let subgroup_label = "\n"
    if (parentid != 'none'){
      let parentname = back_retrieve_group_name(parentid, conn)
      subgroup_label = "subgroup of " + parentname
    }
    //For each existing group, add widget to group list section
    //The widget contains a decorated text object. By clicking on
    //the text, the user can view and edit file access of that 
    //specific group
    group_list_section.addWidget(
          CardService.newDecoratedText()
            //Set the text as the name of the group
            .setText("<b>" + name.toUpperCase() + "</b>")
            .setBottomLabel(subgroup_label)
            //When clicked, calls function show_current_group with
            //argument input group_id
            .setOnClickAction(CardService.newAction()
              .setFunctionName("show_current_group")
              .setParameters({'group_id': group_id})
            )
    )
  }
  conn.close()

  ////Declare and set the card builder
  let card = CardService.newCardBuilder()
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    //Set card name for navigation
    .setName("Choose a group to view access")
    .setHeader(
      CardService.newCardHeader()
        .setTitle('MANAGE ACCESS BY GROUP')
    )
    //Add group list section to the card and build it
    .addSection(group_list_section).build()

  //Return built card
  return card
}

/*After user selects a card in "Choose a group to view access", 
  shows the access information of that group

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): An action response object that pushes the card for access information of the group
*/
function show_current_group(e) {
  //Get ID of the group whose access information is shown
  const groupId = e['parameters']['group_id']
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //Gets built card(without navigation) from helper function
  let card = show_group_helper(groupId, conn);

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card);   
  conn.close() 
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}


/*Helper function for show_current_group; creates and builds the card for navigation push

  Parameters: 
    groupId: the ID of the group whose access information is retrieved and presented
  Returns(card): 
    built card(without navigation); page for list of files with access for the specified group
*/
function show_group_helper(groupId, conn) {
  //File list section in card "Choose a file to change access"
  //conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var file_list_section = CardService.newCardSection()

  //Gets the list of the files that the group has access to from backend
  let files_list = back_retrieve_group_access(groupId, conn);

  //Gets the name of the group, for the purpose of presenting information to user
  let groupName = back_retrieve_group_name(groupId, conn)
  //conn.close()
  //Go through the list of files that the group has access to
  for (index in files_list) {
    //Gets file ID and access information
    var fileId = files_list[index][0];
    var fileAccess = files_list[index][1];
    const is_id_edit = (element) => element[0] == fileId && element[1] == "edit" 
    const is_id_comment = (element) => element[0] == fileId && element[1] == "comment" 
    const is_same = (element) => element[0] == fileId && element[1] == fileAccess 
    if (fileAccess == "view" || fileAccess == "comment") {
      if (files_list.some(is_id_edit)){
        continue
      }
      if (fileAccess == "view") {
        if (files_list.some(is_id_comment)) {
          continue
        }
      }
    }
    files_list[index] = "cleared" //clear value so duplicates can be spotted
    if (files_list.some(is_same)){ //if there is a duplicate skip this one but clear its value so the duplicate doesn't stop here
      continue
    }
    files_list[index] = [fileId, fileAccess] //reset value for future access
    //Gets the file and its name from Google Drive
    try{
        var current_file = DriveApp.getFileById(fileId);
        var fileName = current_file.getName();
    
    //For each file, add a widget to file list section
    //The widget has a decorated text object. By clicking on the text,
    //User goes to a new page to change the access level of that specific file
    file_list_section.addWidget(
      CardService.newDecoratedText()
            .setStartIcon(CardService.newIconImage()
              .setAltText("Choose the file " + fileName)
              .setIconUrl(get_type_image(current_file))
            )
            .setWrapText(true)
            //The decorated text of each file has access level below its file name
            .setBottomLabel(fileAccess)
            .setText(fileName)
            //When the text is clicked, calls goToEditAGroup() with arguments groupId, groupName,
            //fileId, and fileName
            .setOnClickAction(CardService.newAction()
                .setFunctionName('change_current_file')
                .setParameters({'group_id': groupId})
                .setParameters({'group_name': groupName})
                .setParameters({'file_id': fileId})
                .setParameters({'file_name': fileName})
              ) 
    )
    } catch (err){
      Logger.log('file does not exist')
    }
  }

  //If the group has no access to any file, add widgets giving user that information,
  //and providing shortcut to share a file with that group
  if (files_list.length == 0) {
    file_list_section.addWidget(
      CardService.newTextParagraph()
        .setText("Currently the group does not have access to any files.")
    )
    .addWidget(
      CardService.newTextButton()
        //The font color of text on the text button is set as blue
        .setText("<font color=\'#0000FF\'>Share a File With the Group</font>")
        .setAltText("Share a File With the Group")
        //The text button, once clicked, calls set_current_group_replace()
        //with argument inputs groupId and groupName
        .setOnClickAction(CardService.newAction()
          .setFunctionName('set_current_group_replace')
          .setParameters({'group_id': groupId})
          .setParameters({'group_name': groupName})
        )
    )
  } else {
    //If the group has access to at least one file, give instruction to let the 
    //user know how to change access level of a file
    file_list_section.setHeader("Click on a file to change its access level:");
  }

  //Create the card builder object 
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setName("Choose a file to change access")
  .setHeader(
    CardService.newCardHeader()
      .setTitle('View File Access of ' + groupName)
  )
  
  //Add file list section to the card
  card.addSection(file_list_section)

  //Return built card (without navigation)
  return card.build()
}

/*After user selects a file to edit in "Choose a group to view access", 
  shows options of access for user, considering the specific group and file

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): An action response object that pushes the card for the list of groups
*/
function change_current_file(e) {
  //Gets the IDs and names of the group and the file from the clicking event
  //The names are for presenting information to user
  const groupId = e['parameters']['group_id']
  const groupName = e['parameters']['group_name']
  const fileId = e['parameters']['file_id']
  const fileName = e['parameters']['file_name']

  //Calls helper function to get the card before navigation
  let card = change_file_helper(groupId, groupName, fileId, fileName);
  
  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*Helper function for change_current_file; creates and builds the card for navigation push

  Parameters: 
    groupId: the ID of the group whose access information is intended by user to change
    groupName(String): the name of the group(for presenting information)
    fileId(String): the ID of the file whose access level is intended by user to change
    fileName(String): the name of the file(for presenting information)
  Returns(card): 
    built card(without navigation); page offering user options of access levels they can 
    set the group
*/
function change_file_helper(groupId, groupName, fileId, fileName) {
  //Information section of the card "Change level of permission"
  var file = DriveApp.getFileById(fileId)
  var information_section = CardService.newCardSection()
    //Add widget to the section.
    //The widget only contains a decorated text object that contains the name of 
    //the file whose access information would be changed.
    //This is for user to be sure that they are changing the right file
    .addWidget(
        CardService.newDecoratedText()
          .setStartIcon(CardService.newIconImage()
            .setAltText("The file chosen is " + fileName)
            .setIconUrl(get_type_image(file))
          )
        .setWrapText(true)
        .setText(fileName)
    )

  //Permission list section of the card "Change level of permission"
  var permission_list_section = CardService.newCardSection()
    .setHeader("Choose a level of permission:")
  
  //Add a widget to the permission list section.
  //The widget contains a selection input field(checkbox_field) that have 
  //four possible options, respectively with values "edit," "comment,"
  //"view," and "none".
  permission_list_section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.RADIO_BUTTON)
      .setTitle("Choose level of permission: ")
      .setFieldName("checkbox_field")
      .addItem("Edit", "edit", false)
      .addItem("Comment", "comment", false)
      .addItem("View", "view", false)
      //"No access" is available so that users can revoke access of the group
      //to the file. It is set as default to avoid accidental access granting
      .addItem("No Access", "none", true)
  )

  //Create the card builder
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set the card name for navigation
  card.setName("Change level of permission")
    .setHeader(
      CardService.newCardHeader()
        //groupName is used as part of the title, for users to know
        //they are operating on the right group
        .setTitle('View File Access of ' + groupName)
    )
    //Add the sections to the card
    .addSection(information_section)
    .addSection(permission_list_section)
    //The button section for user to confirm their choice
    .addSection(
      CardService.newCardSection()
      //The widget has a text button that has text "DONE"
      .addWidget(CardService.newTextButton()
        .setText("DONE")
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(button_color3)
        //Once the button is clicked, it calls goToChangeCompletion
        //with argument inputs groupId and fileId
        .setOnClickAction(CardService.newAction()
          .setFunctionName('goToChangeCompletion')
          .setParameters({'group_id': groupId})
          .setParameters({'file_id': fileId})
        )
      ) 
    )

  //Return built card (without navigation)
  return card.build()
}

/*Goes to the completion page after changing the access level of a group to a file

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): An action response object that updates the card for the list of groups
*/
function goToChangeCompletion(e) {
  //Gets group id and file id from the clicking event
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let groupId = e['parameters']['group_id']
  let fileId = e['parameters']['file_id']

  //Gets the checkbox input form the clicking event
  //The input named 'checkbox_filed' is in the previous card
  //(See change_file_helper() of this file)
  //The inut can be edit," "comment," "view," or "none".
  let checkbox_input = e['formInput']['checkbox_field'];

  //If the input is "none," indicating the group should not
  //have access to the file, revoke its access
  if (checkbox_input == "none") {
    back_revoke_access(groupId, fileId, conn);            
  //Else, updates the access of the group
  } else {
    change_access_changed_file(groupId, fileId, checkbox_input, conn)
    back_update_access(groupId, fileId, checkbox_input, conn);
  }
  //Creates navigation; pop to card "Choose a file to change access"
  //and update by calling show_group_helper();
  //Shows the file access information of the group whose access has
  //just been updated
  var nav = CardService.newNavigation()
    .popToNamedCard("Choose a file to change access")
    .updateCard(show_group_helper(groupId, conn))
  conn.close()
  //Returns built action response
  return CardService.newActionResponseBuilder()
      //Notifying user that file access has been updated
      .setNotification(CardService.newNotification()
          .setText("The access has been updated."))
      .setNavigation(nav)
      //Build the action response object
      .build();
}

