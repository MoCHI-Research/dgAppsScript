var PAGES = [];

/*Go to（push) the card for list of files in user's Google Drive
  click on each file to view and edit the access of different groups to that file

  Returns(Action Response): An action response object that pushes the card for the list of files
*/
function goToFileAccess() {
  //Gets built card(without navigation) for file list by calling helper function
  let card = goToFileAccessHelper();

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card)
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

/*Helper function for goToFileAccess(); creates and builds the card for navigation push

  Returns(Card): 
    built card(without navigation) page for list of files in Google Drive; click on each
    file to view and edit different groups' access to it
*/
function goToFileAccessHelper() {
  //File list section of card "Choose a file to view access"

  // const list = Drive.Files.list({ q: `trashed=false`, fields: "items(id,title, mimeType)" }).items;
  // const requests = list.map(({ id, title, mimeType }) => ({
  //   method: "PATCH",
  //   endpoint: `https://www.googleapis.com/drive/v3/files/${id}`,
  // }));
  // const object = { batchPath: "batch/drive/v3", requests };
  // const res = batchRequests(object);
  // if (res.getResponseCode() != 200) {
  //   throw new Error(res.getContentText());
  // }



  //var files = DriveApp.getFiles()
  console.time("get_pages")
  var pages = make_sections_view_files()
  console.timeEnd("get_pages")
  //file_list_section.addWidget(

  //Create the card
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setName("Choose a file to view access")
  .setHeader(
    CardService.newCardHeader()
      .setTitle('MANAGE ACCESS BY FILE')
  )
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
              .setFunctionName('search_for_file2')
          )
        )
    )
  //Add file list section to the card
  card.addSection(pages[0])

  //Return built card(without navigation)
  return card.build()
}

//much like search for file but includes different popping in the navigation (used if the user searches from the search result page)
function search_for_file2_not_first(e){
  var query = e.formInput.file_query
   let card = CardService.newCardBuilder()
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
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
            .setAltText("search")
            //The button, once clicked, calls search_for_file()
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('search_for_file2_not_first')
            )
          )
          .addButton(CardService.newTextButton()
            .setText("Back to Browse")
            .setBackgroundColor(button_color2)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('pop_back')//pop_to_Choose_a_file_to_share, goToFileAccessHelper
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          )
        )
        .addWidget(CardService.newTextParagraph().setText("Showing results for " + query + ":"))
      )
   //If the user didn't enter anything, provide an error message
   if (query == null){
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("Please enter a valid search or return to browse")
    ))
   } else { //if files exist by that name show them, otherwise provide an error message
   var search_results = DriveApp.searchFiles('title contains "'+ query +'"')
   if (search_results.hasNext()){
    PAGES = make_sections_view_files_search(search_results)
    //Add file list section to the card
    card.addSection(PAGES[0])
   } else {
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("<font color=\"#FF0000\"> Oh no! looks like there are no files matching this search :( Did you spell everything right? </text>")
    ))
   }}
   var nav = CardService.newNavigation().updateCard(card.build())
  //Return built card
  return CardService.newActionResponseBuilder().setNavigation(nav).build()
}

//just like share with a group's "search_for_file" but doesn't use groupId or groupName
function search_for_file2(e){
   var query = e.formInput.file_query
   let card = CardService.newCardBuilder()
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
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
            .setAltText("search")
            //The button, once clicked, calls search_for_file()
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('search_for_file2_not_first')
            )
          )
          .addButton(CardService.newTextButton()
            .setText("Back to Browse")
            .setBackgroundColor(button_color2)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('pop_back')//pop_to_Choose_a_file_to_share, goToFileAccessHelper
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          )
        )
        .addWidget(CardService.newTextParagraph().setText("Showing results for " + query + ":"))
      )
   //If the user didn't enter anything, provide an error message
   if (query == null){
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("Please enter a valid search or return to browse")
    ))
   } else { //if files exist by that name show them, otherwise provide an error message
   var search_results = DriveApp.searchFiles('title contains "'+ query +'"')
   if (search_results.hasNext()){
    PAGES = make_sections_view_files_search(search_results)
    //Add file list section to the card
    card.addSection(PAGES[0])
   } else {
    card.addSection(CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText("<font color=\"#FF0000\"> Oh no! looks like there are no files matching this search :( Did you spell everything right? </text>")
    ))
   }}
  //Return built card
  return card.build()
}

function pop_to_Choose_a_file_to_share(e){
  var nav = CardService.newNavigation().popToNamedCard('Choose a file to share')
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build()
}

/*Given a file, shows the access levels (as selected items in input fields) of all groups
  that have access to this file, and allows each group's access to be changed

  Parameters: 
    e(Event): clicking event that calls this function
  Returns(Action Response): 
    An action response object that pushes the card for the access levels of groups that 
    have access to the file
*/
function show_file_access(e) {
  //Gets the ID and name of the given file from clicking event
  const fileId = e['parameters']['file_id'];
  const fileName = e['parameters']['file_name'];

  //Gets built card(without navigation) for access levels by calling helper function
  let card = show_file_access_helper(fileId, fileName);

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().pushCard(card)
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build()
}

/*Helper function for show_file_access; creates and builds the card for navigation push

  Parameters: 
    fileId(String): the ID of the file whose access information is shown
    fileName(String): the name of the file(for presenting information)
  Returns(card): 
    built card(without navigation); a page with access levels of all groups that have 
    access to the given file. The levels are presented as selection input items and 
    are subject to change
*/
function show_file_access_helper(fileId, fileName) {
  //For the given file, retrieves all its access information from backend
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var access_groups = back_retrieve_file_access(fileId, conn);
  var file = DriveApp.getFileById(fileId)
  //file section of the card "Edit access of groups"
  //The section has a widget that shows the access of which file is being viewed and edited
  var file_section = CardService.newCardSection()
    .addWidget(CardService.newDecoratedText()
          .setStartIcon(CardService.newIconImage()
            .setAltText("The file chosen is " + fileName)
            .setIconUrl(get_type_image(file))
          )
        .setWrapText(true)
        .setText(fileName)
    )

  //group list section of the card "Edit access of groups"
  var group_list_section = CardService.newCardSection()
  
  //Loop through every group that has access to the file 
  for (let index = 0; index < access_groups.length; index++) {
    //For each group, first gets its ID and access level to the file
    var current_group_id = access_groups[index][0]
    var current_access_level = access_groups[index][1]
    //then retrieve the group's name from backend
    var current_group_name = back_retrieve_group_name(current_group_id, conn);

    //For each group, add to group_list_section a widget with decorated text
    //in bold showing clearly the group name
    group_list_section
      .addWidget(
        CardService.newDecoratedText()
        .setText("<b>"+current_group_name+"</b>")
      )
      //For each group, add to group_list_section a widget that is a selection input field
      .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        //Set title as instruction
        .setTitle("Choose access level of " + current_group_name)
        //Set field name to include index（in order to later loop through all fields and get all inputs)
        .setFieldName("checkbox_field_" + index)
        //The four options: "Edit," "Comment," "View," and "No Access."
        //The selection input includes group ID, in order to later know the which group each input
        //corresponds to
        //The access level that the group has to the file is initially selected
        .addItem("Edit", "edit_" + current_group_id, current_access_level == "edit")
        .addItem("Comment", "comment_" + current_group_id, current_access_level == "comment")
        .addItem("View", "view_" + current_group_id, current_access_level == "view")
        .addItem("No Access", "none_" + current_group_id, false)
    )
  }
  conn.close()

  //Create card
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setName("Edit access of groups")
    .setHeader(CardService.newCardHeader()
      .setTitle("Edit Groups' Access")
    )
    //Add file section to the card
    .addSection(file_section)

  //If currently no group has access to the file, give instruction and shortcut to
  //share a file with the group
  if (access_groups.length == 0) {
    group_list_section 
      .addWidget(
        CardService.newTextParagraph()
          .setText("Currently no group has access to the file.")
      )
      .addWidget(
        CardService.newTextButton()
          //The font color for shortcut text is set as blue
          .setText("<font color=\'#0000FF\'>Go to Share with a Group</font>")
          .setAltText("Go to Share with a Group.")
          //When shortcut is clicked, calls replaceToCreateAGroup()
          .setOnClickAction(CardService.newAction()
              .setFunctionName("replaceToShareWithAGroup"))
      )

  } else {
    //If there is at least one group with access to the file, add to group list section
    //the confirming button to click once user finishes all access editing
    group_list_section.addWidget(CardService.newTextButton()
      .setText("DONE")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(button_color3)
      //The button, once clicked, calls function editMultipleAccess() with 
      //argument inputs fileId, fileName, and the number of groups with 
      //access to the file(setParameters can only work with strings)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('editMultipleAccess')
        .setParameters({'file_id': fileId})
        .setParameters({'file_name': fileName})
        .setParameters({'group_num': access_groups.length.toString()})
      )
    )
  }

  //Add group list section to the card and return built card
  card.addSection(group_list_section)
  return card.build()
}

/*Updates the card for page of sharing with a group
  Shows the same page as goToShareWithAGroup(), but updates rather than pushes
  the card

  Returns(Action Response): 
    An action response object that updates the card for sharing with a group
*/
function replaceToShareWithAGroup() {
  //Gets built card(without navigation) by calling helper function
  let card = goToShareWithAGroupHelper();

  //Sets navigation updating the card, and returns action response object
  var nav = CardService.newNavigation().updateCard(card)
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
}

/*After user completes editing access of multiple groups to a file in card 
  "Edit access of groups," updates the settings in backend and shows notification
  to let user know access has been updated

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that gives notification about access updated and updates
    the current card
*/
function editMultipleAccess(e) {
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //Gets file ID, file name, and number of groups with access to the file from clicking event
  let fileId = e['parameters']['file_id']
  let fileName = e['parameters']['file_name']
  //groupNum needs to be parsed to int, since values(and keys as well) of setParameters have
  //to be strings
  let groupNum = parseInt(e['parameters']['group_num'])

  //Loop through every index corresponding to a group
  for (let index = 0; index < groupNum; index++) {
    //For every group, gets the selection input from its corresponding input field
    //See show_file_access_helper() of this file to see names of input fields
    let input_field_name = "checkbox_field_" + index

    //From input, gets the group ID and the group's access to the file
    let current_input = e['formInput'][input_field_name].split('_');
    let current_access = current_input[0];
    let groupId = current_input[1];

    //Revokes or updates access based on user's choice
    if (current_access == "none") {
      back_revoke_access(groupId, fileId, conn); //actual revoking also done here
    } else {
      back_update_access(groupId, fileId, current_access, conn);
      change_access_changed_file(groupId, fileId, current_access, conn)
    }
  }
  conn.close()
  //Navigate by updating the current card that shows groups' access to a given file
  var nav = CardService.newNavigation().updateCard(show_file_access_helper(fileId, fileName))
  //Return action response notifying users access has been updated before navigating
  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("Access levels have been updated"))
      .setNavigation(nav)
      .build();
  
}
//takes a list of files and does not use a continuation token because the list is assumed to be short enough that run time will not be a problem:
function make_sections_view_files_search(files){
  var pages = []
  while (files.hasNext()){
    //file list section of the card "Choose a file to share"
    var file_list_section = CardService.newCardSection()
      .setHeader("Choose a file:")
  //Does so because for some reason now only up to 100 files can be added; if there are
  //more than 100 files the page will not show up
  var file_count = 0;
  //Go through every(up to 100th) file
  while (files.hasNext() && file_count < 96) { //96 to save room for more widgets (the navigation and search bar)
    file_count += 1
    //For each file, gets the file ID and file name
    var file = files.next()
    var fileId = file.getId()
    var fileName = file.getName()
    var image_url = ""

    image_url = get_type_image(file)

    var image = CardService.newIconImage()
              .setAltText("Choose the file " + fileName)
              .setIconUrl(image_url) 

    //For each file, add a widget to file list section
    //The widget contains a decorated text that has a start icon(folder image)
    //Click on a decorated text to select the file
    file_list_section.addWidget(
      CardService.newDecoratedText()
            .setStartIcon(image)
            .setWrapText(true)
            //The text of decorated text is the name of the corresponding file
            .setText(fileName)
            //The decorated text, once clicked, calls show_file_access()
            //with argument inputs fileId and fileName
            .setOnClickAction(CardService.newAction()
                .setFunctionName('show_file_access')
                .setParameters({'file_id': fileId})
                .setParameters({'file_name': fileName})
              ) 
    )
  }
    pages.push(file_list_section)
  }

   //creates the forward backward arrows that allow the user to scroll through files
  for (i = 0; i < pages.length; i++){
    add_arrows_view_access(pages[i], i, pages)
  }
  return pages;
}

function get_file_buttons(){
    // Logs the name of every file in the User's Drive
  // this is useful as the script may take more that 5 minutes (max execution time)
  var userProperties = PropertiesService.getUserProperties();
  var continuationToken = userProperties.getProperty('CONTINUATION_TOKEN');
  var start = new Date();
  var end = new Date();
  var maxTime = 1000*60*4.5; // Max safe time, 4.5 mins
  var card_section = CardService.newCardSection()
  while(files.hasNext){
    if (continuationToken == null) {
      // firt time execution, get all files from Drive
      var files = DriveApp.getFiles();
    } else {
      // not the first time, pick up where we left off
      var files = DriveApp.continueFileIterator(continuationToken);
    }
    while (files.hasNext() && end.getTime() - start.getTime() <= maxTime) {
      var file = files.next();
      Logger.log(file.getName());
      end = new Date();
    }

    // Save place by setting the token in your user properties
    if(files.hasNext()){
      var continuationToken = files.getContinuationToken();
      userProperties.setProperty('CONTINUATION_TOKEN', continuationToken);
    } else {
      // Delete the token
      PropertiesService.getUserProperties().deleteProperty('CONTINUATION_TOKEN');
    }
  }
  return card_section;
}

//Just like go_to_page from share with a group except it doesn't take group name or ID as parameters
function go_to_page2(e){
    const the_page_num = e['parameters']['the_page_num']
    //files = DriveApp.getFiles()
    PAGES = make_sections_view_files()
    let card = CardService.newCardBuilder()
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    card.setName("Choose a file to share")
    //The card header is set to contain the name of the group, in order
 // add the search bar:
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
              .setFunctionName('search_for_file2')
          )
        )
     )
      .addSection(PAGES[the_page_num])   
    return card.build()
}

//Just like add_arrows from share with a group except it doesn't take group name or ID as parameters
function add_arrows_view_access(value, index, array){
    //builds forward arrow if not the last page
    if (index != array.length - 1){
        //builds card for next item
        var forwardarrow = CardService.newImageButton()
          .setAltText("An image button with a forward arrow")
          .setIconUrl("https://static.thenounproject.com/attribution/1256497-600.png")
          .setOnClickAction(CardService.newAction()
              .setFunctionName('go_to_page2')
              .setParameters({'the_page_num': (index + 1).toString()}))
    }
    //builds back arrow if not the first page
    if (index != 0){
        //builds card for next item
        var backarrow = CardService.newImageButton()
          .setAltText("An image button with a forward arrow")
          .setIconUrl("https://static.thenounproject.com/attribution/1256499-600.png")
          .setOnClickAction(CardService.newAction()
              .setFunctionName('go_to_page2')
              .setParameters({'the_page_num': (index - 1).toString()}))
    }
    //builds the navigator and adds it to the card section, the form of this navigator will be two arrows for those in the middle and just one arrow for the first and last page.
    if (index != 0 && index != array.length - 1){
      var navigator = CardService.newButtonSet()
        .addButton(backarrow)
        .addButton(forwardarrow)
      value.addWidget(navigator)
    }
    if (index == 0 && array.length != 1){
      var navigator = CardService.newButtonSet()
        .addButton(forwardarrow)
      value.addWidget(navigator)
    }
    if (index == array.length - 1 && index != 0){
       var navigator = CardService.newButtonSet()
         .addButton(backarrow)
      value.addWidget(navigator)
    }
}

function make_sections_view_files(){
  var pages = []
  // continuation tokens are useful as the script may take more that 6 minutes (max execution time)
  var userProperties = PropertiesService.getUserProperties();
  var continuationToken = userProperties.getProperty('CONTINUATION_TOKEN');
  var keep_going = true; //note may cause problem if user has no files
  while (keep_going){
    //file list section of the card "Choose a file to share"
    var file_list_section = CardService.newCardSection()
      .setHeader("Choose a file:")
    
    if (continuationToken == null) {
      // firt time execution, get all files from Drive
      var files = DriveApp.getFiles();
    } else {
      // not the first time, pick up where we left off
      var files = DriveApp.continueFileIterator(continuationToken);
    }


  //Does so because for some reason now only up to 100 files can be added; if there are
  //more than 100 files the page will not show up
  var file_count = 0;
  //Go through every(up to 100th) file
  while (files.hasNext() && file_count < 96) { //96 to save room for more widgets (the navigation and search bar)
    file_count += 1
    //For each file, gets the file ID and file name
    var file = files.next()
    var fileId = file.getId()
    var fileName = file.getName()
    var image_url = ""

    image_url = get_type_image(file)

    var image = CardService.newIconImage()
              .setAltText("Choose the file " + fileName)
              .setIconUrl(image_url) 

    //For each file, add a widget to file list section
    //The widget contains a decorated text that has a start icon(folder image)
    //Click on a decorated text to select the file
    file_list_section.addWidget(
      CardService.newDecoratedText()
            .setStartIcon(image)
            .setWrapText(true)
            //The text of decorated text is the name of the corresponding file
            .setText(fileName)
            //The decorated text, once clicked, calls show_file_access()
            //with argument inputs fileId and fileName
            .setOnClickAction(CardService.newAction()
                .setFunctionName('show_file_access')
                .setParameters({'file_id': fileId})
                .setParameters({'file_name': fileName})
              ) 
    )
  }
    pages.push(file_list_section)

    if(files.hasNext()){
      var continuationToken = files.getContinuationToken();
      userProperties.setProperty('CONTINUATION_TOKEN', continuationToken);
    } else {
      // Delete the token
      PropertiesService.getUserProperties().deleteProperty('CONTINUATION_TOKEN');
      keep_going = false;
    }

  }

   //creates the forward backward arrows that allow the user to scroll through files
  for (i = 0; i < pages.length; i++){
    add_arrows_view_access(pages[i], i, pages)
  }
  return pages;
}



