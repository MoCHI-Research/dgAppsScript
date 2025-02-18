/*Go to（push) the card for page of sharing with a group
  first click on a group and then click on a file to share the file with the group

  Returns(Action Response): 
    An action response object that pushes the card for the list of groups (to share files with)
*/
function goToShareWithAGroup() {
  //Gets built card(without navigation) for group list by calling helper function
  let card = goToShareWithAGroupHelper();

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card)
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
}

/* Helper function for goToShareWithAGroup(); creates and builds the card for navigation push

  Returns(Card):
    built card(without navigation); page for list of existing groups to share files with
*/
function goToShareWithAGroupHelper() {
  //Retrieve all groups from the backend; groups is an array of Group objects
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var groups = []
  groups = back_retrieve_all_groups(conn);
  //Group list section of card "Choose a group to share files with"
  var group_list_section;

  if (groups.length != 0) {
    //If there is at least one group, set the header of the section to show
    //users can select a group to share files with
    group_list_section = CardService.newCardSection()//.setHeader("Choose a group to share files with:")
  } else {
    //If no group is in the backend, let users know and offer a link to create a group
    group_list_section = CardService.newCardSection()
      .addWidget(
        CardService.newTextParagraph()
          .setText("Currently no group has been created.")
      )
      //The widget contains a text button with text "Create one using CREATE A GROUP."
      .addWidget(
        CardService.newTextButton()
          //Text color is set as blue
          .setText("<font color=\'#0000FF\'>Go To CREATE A GROUP.</font>")
          .setAltText("Create a new group.")
          //The button, once clicked, calls goToCreateAGroup().
          //(The constant goToCreateAGroupAction is defined in Homepage.gs)
          .setOnClickAction(goToCreateAGroupAction)
      )
  }

  //Go through each existing group
  for (index in groups) {
    //For each group, gets the group ID and group name
    let group_id = groups[index][0]
    let name = groups[index][1]
    let parentid = groups[index][2]
    subgroup_label = "\n"
    if (parentid != 'none'){
      let parentname = back_retrieve_group_name(parentid, conn)
      subgroup_label = "subgroup of " + parentname
    }
    //For each group, add a widget that contains a text button with
    //text as the group's name 
    group_list_section.addWidget(
          CardService.newDecoratedText()
            .setText("<b> "+ name.toUpperCase() +" </b>")
            .setBottomLabel(subgroup_label)
            //Once the button is clicked, it calls the function set_current_group()
            //with argument inputs group_id and name
            .setOnClickAction(CardService.newAction()
              .setFunctionName("set_current_group")
              .setParameters({'group_id': group_id})
              .setParameters({'group_name': name})
            )
    )
  }
  conn.close()

  //Create and build the card object
  let card = CardService.newCardBuilder()
    //Set card name for navigation
    .setName("Choose a group to share files with")
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    //The header of the card will be 'Choose a group to share files with:'
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Choose a group to share files with:')
    )
    //Add group list section to the card and build it
    .addSection(group_list_section).build()
  
  //Return built card(without navigation)
  return card
}

/*After user selects a group in "Choose a group to share files with", 
  push a card that shows the page of all files, for user to select a file
  to share with that group

  Parameters: 
    e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that pushes the card of all files for user
    to select
*/
function set_current_group(e) {
  //Get group ID and group name from clicking event
  const groupId = e['parameters']['group_id']
  const groupName = e['parameters']['group_name']
  
  //Gets built card(without navigation) for file list by calling helper function
  let card = set_group_helper(groupId, groupName);

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*After user selects a group in "Choose a group to share files with", 
  updates a card that shows the page of all files, for user to select a file
  to share with that group
  Shows the same page as set_current_group(), but updates rather than pushes
  the card (The function is now called in show_group_helper() of ViewGroupAccess.gs)

  Parameters: 
    e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that updates the card of all files for user
    to select
*/
function set_current_group_replace(e) {
  //Get group ID and grooup name from clicking event
  const groupId = e['parameters']['group_id']
  const groupName = e['parameters']['group_name']
  
  //Gets built card(without navigation) for file list by calling helper function
  let card = set_group_helper(groupId, groupName);

  //Set navigation updating the card, and return the action response object
  var nav = CardService.newNavigation().updateCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

function share_selected(e){
  var fileId_list = e['formInputs']['select_files']
  var groupId = e['parameters']['groupId']
  var fileId = fileId_list[0]
   //Information section of "Choose a level of permission" card;
  //the section presents information of the file whose access is being granted
  var information_section = CardService.newCardSection()
    //Add a widget to the section. The section contains a decorated text
    //with a start icon; it is used to present information of the given
    //group(the group access to which is being granted)
    .addWidget(
        CardService.newDecoratedText()
          .setStartIcon(CardService.newIconImage()
            .setAltText("Choose the file access")
          )
        .setWrapText(true)
        //The text is the name of the given file
        .setText("sharing a batch of files")
    )

  //permission list section of "Choose a level of permission" card;
  var permission_list_section = CardService.newCardSection()
  
  //Add a widget to permission list section.
  //The widget is a selection input with type RADIO_BUTTON
  permission_list_section
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        .setTitle("Choose level of permission: ")
        .setFieldName("checkbox_field")
        //There are three possible access levels: edit, comment, and view
        //"none" is not supported because the user can simply cancel and go back
        .addItem("Edit", "edit", false)
        .addItem("Comment", "comment", false)
        .addItem("View", "view", false)
    )

  //Declare card builder
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setName("Choose a level of permission")
    //The header of the card shows which group the access is given to,
    //for user to confirm they are working with the right group
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Share with this group')
    )
    //Add sections to the card
    .addSection(information_section)
    .addSection(permission_list_section)
    //Add the final section that is a button to confirm the sharing choice
    .addSection(
        CardService.newCardSection()
        .addWidget(CardService.newTextButton()
          .setText("SHARE")
          .setBackgroundColor(button_color3)
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          //The button, once clicked on, calls function goToCompletion
          //(constant goToCompletionAction defined in Homepage.gs) with
          //argument inputs groupId and fileId
          .setOnClickAction(CardService.newAction()
            .setFunctionName('completionMultiSelectAction')
            .setParameters({'groupId': groupId})
            //.setParameters({'groupName': groupName})
          )
        ) 
    )

  //Return built card
  return card.build()
}

function set_group_helper(groupId, groupName) {
  //let files = DriveApp.getFiles()
  //PAGES = make_sections(groupId, groupName)
  //Set the first card
  let card = CardService.newCardBuilder()
  
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction")))
    .setSecondaryButton(CardService.newTextButton()
      .setText("Share Selected")
      .setBackgroundColor(button_color3)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
                          .setFunctionName('completionMultiSelectAction')
                          .setParameters({'groupId': groupId})
                          .setParameters({'groupName': groupName}))))
  
  card.setDisplayStyle(CardService.DisplayStyle.PEEK)
  //Set card name for navigation
  card.setName("Choose a file to share")
    //The card header is set to contain the name of the group, in order
    //for user to confirm that they selected the right group
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Share with ' + groupName)
    )
  
  //add the search bar:
  card.addSection(
      CardService.newCardSection() //adds the search bar
      .addWidget(CardService.newTextInput() 
          .setFieldName('file_query')
          .setTitle("Find file by name")
        )
        .addWidget(CardService.newImageButton()
          .setIconUrl("https://static.thenounproject.com/png/4009566-200.png")
          .setAltText("search")
          //The button, once clicked, calls search_for_file()
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('search_for_file')
              .setParameters({'groupId': groupId})
              .setParameters({'groupName': groupName})
          )
        )
     )
  //Add file list section to the card
  //card.addSection(PAGES[0])
  var file_list_section = CardService.newCardSection()
    //make checkbox selection
  var selectFiles = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.CHECK_BOX)                                    //iris1 bookmark
    .setFieldName("select_files")

  var files = DriveApp.getFiles();
  while (files.hasNext()) { 
    //For each file, gets the file ID and file name
    var file = files.next()
    var fileId = file.getId()
    var filename = file.getName()
    //For each file, add a section to file list section
    selectFiles.addItem(filename, fileId, false)
  }
    file_list_section
      .setHeader("Select one or more files to share at this level:")
      .addWidget(selectFiles)
  sharing_level = CardService.newCardSection()
  sharing_level
    .setHeader("Choose a level of permission to share files: ")
    .addWidget(
        CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setFieldName("checkbox_field")
          //There are three possible access levels: edit, comment, and view
          //"none" is not supported because the user can simply cancel and go back
          .addItem("Edit", "edit", false)
          .addItem("Comment", "comment", false)
          .addItem("View", "view", false)
      )
  
  card.addSection(sharing_level)
  card.addSection(file_list_section)
  //Return built card
  return card.build()
}

//A duplicate of set_group_helper modified to be called from an action (parameters use e instead of the classic method)
function set_group_helper_event(e) {
  const groupId = e['parameters']['groupId']
  const groupName = e['parameters']['groupName']
  //let files = DriveApp.getFiles()
  //PAGES = make_sections(groupId, groupName)
  //Set the first card
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setDisplayStyle(CardService.DisplayStyle.PEEK)
  card.setName("Choose a file to share")
    //The card header is set to contain the name of the group, in order
    //for user to confirm that they selected the right group
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Share with ' + groupName)
    )
  
  //add the search bar:
  card.addSection(
      CardService.newCardSection() //adds the search bar
      .addWidget(CardService.newTextInput() 
          .setFieldName('file_query')
          .setTitle("Find file by name")
        )
        .addWidget(CardService.newImageButton()
          .setIconUrl("https://static.thenounproject.com/png/4009566-200.png")
          .setAltText("search")
          //The button, once clicked, calls search_for_file()
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('search_for_file')
              .setParameters({'groupId': groupId})
              .setParameters({'groupName': groupName})
          )
        )
     )
  //Add file list section to the card
  //card.addSection(PAGES[0])
  var nav = CardService.newNavigation().popToRoot().pushCard(card.build()); 
  //Return built card
  return nav
}

function search_for_file_not_first(e){
   var query = e.formInput.file_query
   const groupId = e['parameters']['groupId']
   const groupName = e['parameters']['groupName']
   let card = CardService.newCardBuilder()
   .setFixedFooter(CardService.newFixedFooter()
      .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction")))
      .setSecondaryButton(CardService.newTextButton()
        .setText("Share selected")
        .setBackgroundColor(button_color3)
        .setOnClickAction(CardService.newAction()
                          .setFunctionName('completionMultiSelectAction')
                          .setParameters({'groupId': groupId})
                          .setParameters({'groupName': groupName}))))
    .setName('showing results')
       card.addSection(
        CardService.newCardSection() //adds the search bar
        .addWidget(CardService.newTextInput() 
          .setFieldName('file_query')
          .setTitle("Find file by name")
        )
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newImageButton()
            .setIconUrl("https://static.thenounproject.com/png/4009566-200.png")
            //The button, once clicked, calls search_for_file()
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('search_for_file_not_first') //the only difference with the "not_first" function is that it is called on top of a search result page so the amount of pop_back to get to the browse page is different
                .setParameters({'groupId': groupId})
                .setParameters({'groupName': groupName})
            )
            .setAltText("search")
          )
          .addButton(CardService.newTextButton()
            .setText("Back to Browse")
            .setBackgroundColor(button_color2)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('pop_back')
                //.setParameters({'groupId': groupId})
                //.setParameters({'groupName': groupName})
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          )
        )
        .addWidget(CardService.newTextParagraph().setText("Showing results for " + query + ":"))
      )
   if (query == null){
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("Please enter a valid search or return to browse")
    ))
   } else {
   var search_results = DriveApp.searchFiles('title contains "'+ query +'"')
   if (search_results.hasNext()){
      var file_list_section = CardService.newCardSection()
    //make checkbox selection
  var selectFiles = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.CHECK_BOX)                                    //iris1 bookmark
    .setFieldName("select_files")

  while (search_results .hasNext()) { 
    //For each file, gets the file ID and file name
    var file = search_results .next()
    var fileId = file.getId()
    var filename = file.getName()
    //For each file, add a section to file list section
    selectFiles.addItem(filename, fileId, false)
  }
    file_list_section
      .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        .setTitle("Choose level of permission: ")
        .setFieldName("checkbox_field")
        //There are three possible access levels: edit, comment, and view
        //"none" is not supported because the user can simply cancel and go back
        .addItem("Edit", "edit", false)
        .addItem("Comment", "comment", false)
        .addItem("View", "view", false)
    )
      .addWidget(selectFiles)
  
  card.addSection(file_list_section)
   } else {
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("<font color=\"#FF0000\"> Oh no! looks like there are no files matching this search :( Did you spell everything right? </text>")
    ))
   }}
  //Return built card
  var nav = CardService.newNavigation().popCard().pushCard(card.build())
  return CardService.newActionResponseBuilder().setNavigation(nav).build()
}

function search_for_file(e){                                  
   var query = e.formInput.file_query
   const groupId = e['parameters']['groupId']
   const groupName = e['parameters']['groupName']
   let card = CardService.newCardBuilder()
   .setFixedFooter(CardService.newFixedFooter()
      .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction")))
      .setSecondaryButton(CardService.newTextButton()
        .setText("Share selected")
        .setBackgroundColor(button_color3)
        .setOnClickAction(CardService.newAction()
                          .setFunctionName('completionMultiSelectAction')
                          .setParameters({'groupId': groupId})
                          .setParameters({'groupName': groupName}))))
    .setName('showing results')
       card.addSection(
        CardService.newCardSection() //adds the search bar
        .addWidget(CardService.newTextInput() 
          .setFieldName('file_query')
          .setTitle("Find file by name")
        )
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newImageButton()
            .setAltText("search")
            .setIconUrl("https://static.thenounproject.com/png/4009566-200.png")
            //The button, once clicked, calls search_for_file()
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('search_for_file_not_first') //the only difference with the "not_first" function is that it is called on top of a search result page so the amount of pop_back to get to the browse page is different
                .setParameters({'groupId': groupId})
                .setParameters({'groupName': groupName})
            )
          )
          .addButton(CardService.newTextButton()
            .setText("Back to Browse")
            .setBackgroundColor(button_color2)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('pop_back')
                //.setParameters({'groupId': groupId})
                //.setParameters({'groupName': groupName})
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          )
        )
        .addWidget(CardService.newTextParagraph().setText("Showing results for " + query + ":"))
      )
   if (query == null){
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("Please enter a valid search or return to browse")
    ))
   } else {
   var search_results = DriveApp.searchFiles('title contains "'+ query +'"')
   if (search_results.hasNext()){
      var file_list_section = CardService.newCardSection()
    //make checkbox selection
  var selectFiles = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.CHECK_BOX)                                    //iris1 bookmark
    .setFieldName("select_files")

  while (search_results.hasNext()) { 
    //For each file, gets the file ID and file name
    var file = search_results .next()
    var fileId = file.getId()
    var filename = file.getName()
    //For each file, add a section to file list section
    selectFiles.addItem(filename, fileId, false)
  }
    file_list_section
      .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        .setTitle("Choose level of permission: ")
        .setFieldName("checkbox_field")
        //There are three possible access levels: edit, comment, and view
        //"none" is not supported because the user can simply cancel and go back
        .addItem("Edit", "edit", false)
        .addItem("Comment", "comment", false)
        .addItem("View", "view", false)
    )
      .addWidget(selectFiles)
  
  card.addSection(file_list_section)
   } else {
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("<font color=\"#FF0000\"> Oh no! looks like there are no files matching this search :( Did you spell everything right? </text>")
    ))
   }}
  //Return built card
  return card.build()
}

/*After user selects a group and a file in "Choose a file to share", 
  push a card that shows possible access levels to select; the group
  will have the selected access to the file

  Parameters: 
    e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that pushes the card of all files for user
    to select
*/
function set_current_file(e) {
  //Gets group and file information from clicking event
  //groupName and fileName are for information presenting purposes
  const groupId = e['parameters']['group_id']
  const groupName = e['parameters']['group_name']
  const fileId = e['parameters']['file_id']
  const fileName = e['parameters']['file_name']

  //Gets built card(without navigation) for access selection by calling helper function
  let card = set_file_helper(groupId, groupName, fileId, fileName);
  
  //Set navigation pushing the card, and then return action response object
  var nav = CardService.newNavigation().pushCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*Helper function for set_current_file()
  Given a file and a group, builds a card (without navigation) with a input that has options
  "edit," "comment," and "view" for user to select. The level of access to the file of the
  group will be the option chosen, once the user confirms it

  Parameters:
    groupId(String): the ID of the group given
    groupName(String): the name of the group given; used for information presenting
    fileId(String): the ID of the file given
    groupName(String): the name of the group given; used for information presenting

  Returns(Card):
    Built card(without navigation) that shows access levels for user to assign to the given
    group concerning the given file
*/
function set_file_helper(groupId, groupName, fileId, fileName) {
  //Information section of "Choose a level of permission" card;
  //the section presents information of the file whose access is being granted
  var file = DriveApp.getFileById(fileId)
  var information_section = CardService.newCardSection()
    //Add a widget to the section. The section contains a decorated text
    //with a start icon; it is used to present information of the given
    //group(the group access to which is being granted)
    .addWidget(
        CardService.newDecoratedText()
          .setStartIcon(CardService.newIconImage()
            .setAltText("Choose the file " + fileName)
            .setIconUrl(get_type_image(file))
          )
        .setWrapText(true)
        //The text is the name of the given file
        .setText(fileName)
    )

  //permission list section of "Choose a level of permission" card;
  var permission_list_section = CardService.newCardSection()
  
  //Add a widget to permission list section.
  //The widget is a selection input with type RADIO_BUTTON
  permission_list_section
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        .setTitle("Choose level of permission: ")
        .setFieldName("checkbox_field")
        //There are three possible access levels: edit, comment, and view
        //"none" is not supported because the user can simply cancel and go back
        .addItem("Edit", "edit", false)
        .addItem("Comment", "comment", false)
        .addItem("View", "view", false)
    )

  //Declare card builder
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setName("Choose a level of permission")
    //The header of the card shows which group the access is given to,
    //for user to confirm they are working with the right group
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Share with ' + groupName)
    )
    //Add sections to the card
    .addSection(information_section)
    .addSection(permission_list_section)
    //Add the final section that is a button to confirm the sharing choice
    .addSection(
        CardService.newCardSection()
        .addWidget(CardService.newTextButton()
          .setText("SHARE")
          .setBackgroundColor(button_color3)
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          //The button, once clicked on, calls function goToCompletion
          //(constant goToCompletionAction defined in Homepage.gs) with
          //argument inputs groupId and fileId
          .setOnClickAction(goToCompletionAction
            .setParameters({'group_id': groupId})
            .setParameters({'file_id': fileId})
          )
        ) 
    )

  //Return built card
  return card.build()
}

