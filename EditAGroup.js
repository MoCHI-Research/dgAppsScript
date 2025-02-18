
/*Go to（push) the card for editing a certain group

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): An action response object that pushes the card for editing a group
*/
function goToEditAGroup(e) {
  //Gets the id of the group to edit from clicking event
  const group_id = e['parameters']['group_id']

  //Set the navigation to push the built card, and then return the action response
  var nav = goToEditAGroupHelper(group_id) 
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*Helper function for goToEditAGroup; creates and builds the card for navigation push

  Parameters: group_id: the id of the group to edit
  Returns(Card): built card(without navigation) page for editing a specific group
*/
function goToEditAGroupHelper(group_id) {
  //Get the current Group object to edit
  //Currently the object is solely for obtaining information; all edits happen in backend
  var conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //let group_curr = back_retrieve_group(group_id, conn);

  //Gets the group name and the emails in the group
  let name = back_retrieve_group_name(group_id, conn);
  let user_emails = back_retrieve_group_users(group_id, conn);
  
  //User_list_section in the "Edit a group" card
  let user_list_section = CardService.newCardSection()
    .setHeader("Users in this group:")

  //For each user email in the email list, add the email address and delete button
  //as a widget to user_list_section
  for (const user of user_emails) {
    //Declare and set up deletebutton(the button clicked to delete a group)
    var deleteButton = CardService.newImageButton()
      .setIconUrl("https://i.postimg.cc/pr950Q06/delete-24dp-666666-FILL0-wght400-GRAD0-opsz24.png")
      .setAltText("Remove " + user + " from group")
      //Constant goToDeleteUser defined in homepage.gs
      //When deleteButton is clicked, calls deleteUser with argument inputs group_id and user
      .setOnClickAction(goToDeleteUser
        .setParameters({'group_id': group_id})
        .setParameters({'user_email': user})
      )
    
    //Declare email text; the email address of ecah user in the list
    var email_text = CardService.newDecoratedText()
      .setText(user)
    if (is_owner(user, group_id, conn) == false){
      email_text.setButton(deleteButton)
    }
    //Add the widget to user_list_section
    user_list_section.addWidget(email_text)
  }
  conn.close()
  //Add a dividing line to user_list_section
  user_list_section.addWidget(divider)

  //Add_new_user_section in "Edit a group" card
  //The section contains a widget with an input field for user emails to add
  //and a button for adding to the group
  let add_new_user_section = CardService.newCardSection()
    .setHeader("Add users to group '" + name + "'.")
    //Add the widget
    .addWidget(CardService.newTextInput()
      //Input field for adding new users to the group
      .setFieldName("user_emails")
          .setTitle("Emails - separate with commas")
          .setMultiline(true))
        //The sub-widget only contains a button to click for confirming
        //adding user emails
        .addWidget(CardService.newTextButton()
          //Set text on the button as "Add to Group"
          .setText("Add to Group")
          .setBackgroundColor(button_color3)
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          //When the button is clicked, calls addUserEmails() with argument input group_id
          .setOnClickAction(CardService.newAction()
            .setFunctionName("addUserEmails")
            .setParameters({'group_id': group_id})
          )
        )
  var card = CardService.newCardBuilder()
    //Set card name for navigation
    .setName("Edit a group")
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Edit ' + name)
    )
    //Add user list section and add_new_user_section
    .addSection(user_list_section)
    .addSection(add_new_user_section)
    //Build the card
    .build()
  //Return the built card(without navigation) for editing a group
  var nav = CardService.newNavigation().popToRoot().pushCard(card)
  return nav
}

/*Add users to a group and returns built action response object with navigation

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that updates the card to go to the user list 
    of the edited group as a response to adding new users to the group
*/
function addUserEmails(e) {
  //Gets parameter 'group_id' from clicking event 
  let groupId = e['parameters']['group_id'];
  //Gets input from input field named user_emails
  //(See goToEditAGroupHelper() in this file or requestNewGroupUsers() in CreateAGroup.gs)
  let userEmails = e.formInput.user_emails;
  
  //If no user email was input, directly update to editing the current group card,
  //and set notification to indicate no user was added;
  //Then directly returns; the code after would not execute
  if (!userEmails) {
    var nav = goToEditAGroupHelper(groupId)
    //Return the built action response object
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("No extra user was added to the group."))
      .setNavigation(nav)
      .build();
  }

  //Code after only runs when email addresses are input
  let emailsArray = userEmails.split(",");
  let erroneousEmails = [];
  let goodEmails = [];
  
  //Delete spaces in each email address 
  //Designed for deleting spaces after each comma, but deletes other spaces as well
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  for (index in emailsArray) { 
    email = emailsArray[index].replace(/\s/g, "");
    // We will now validate each email using the validateEmail function
    if (validateEmail(email)) {
      back_add_user(groupId, email, conn);
      //grant_access_new_user(groupId, email, conn);
      goodEmails.push(email)
    } else {
      erroneousEmails.push(email);
      back_add_err_email(email, groupId, conn);
    }
  }
  add_good_emails(groupId, goodEmails, conn, 0)
  recursive_add_users_to_parent_groups(groupId, goodEmails, conn)

  conn.close()
  
  if (erroneousEmails[0] == null){
    var nav = goToEditAGroupHelper(groupId)
    //Returns the built action response object, with notification indicating new users were added,
    //and navigation to edit current group page
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("Members have been added to the group."))
      .setNavigation(nav)
      .build();
  } else {
    var nav = getCorrectEmails(groupId)
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("You have atleast one invalid email"))
      .setNavigation(nav)
      .build();
  }
}

/*
Given an email as a string, will validate if it is a real email by checking the pattern of the string and sending a test email out.
@ARGS:
  email: A string representation of an email
@RETURNS:
  bool: true if it is a valid email; otherwise, false
*/
function validateEmail(email) {
  var emailRegex = /\S+@\S+\.\S+/;
  if (emailRegex.test(email) == false) {
      Logger.log("Error with email syntax (" + email + "). ");
      return false;
  } else {
      //try {
        var subject = "You have been added to a DriveGroup";
        var message = "You have been added you to a group in DriveGroups. If this was in error, please contact the sender of this email as soon as possible.";
        // GmailApp.sendEmail(email, subject, message);
        return true;
      //} catch(e) {
      //  return false;
      //}
  }
}

/*
Given a groupid and list of erroneous emails, will get corrected emails from the user for each
@ARGS:
  groupId: The ID of the group to add the emails to
  emails: A list of strings of invalid emails
@RETURNS:
  VOID
*/
function correctErroneousEmails (groupId, emails, index) {
  if(index < email.length){
    email = emails[index];
    if (validateEmail(email) == false){
      var nav = CardService.newNavigation().popToRoot().pushCard(getCorrectEmail(email, emails, index, groupId))
      return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
    } else {
        correctErroneousEmails(groupId, emails, index + 1)
    }
  }
}

function getCorrectEmails(groupId) {
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  const emails = get_err_emails(groupId, conn)
  const email_card = CardService.newCardBuilder()
  const card_section = CardService.newCardSection()
  card_section.addWidget(CardService.newTextButton()
                            .setText("---------------------CANCEL ALL---------------------")
                            .setOnClickAction(CardService.newAction()
                              .setFunctionName('goToEditAGroupHelperHelper')
                              .setParameters({'groupId':groupId}))
                            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                            .setBackgroundColor(button_color4)
                            )
  conn.close()
  if (emails[0] == null){
    
    return goToEditAGroupHelper(groupId)
  } else {
    for (index in emails){
    const cancel = CardService.newTextButton()
    cancel
      .setText("CANCEL")
      .setBackgroundColor(button_color4)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
                          .setFunctionName("cancel_email")
                          .setParameters({'groupId': groupId})
                          .setParameters({'err_email': emails[index]}))
    const confirm = CardService.newTextButton()
    confirm
      .setText("CONFIRM")
      .setBackgroundColor(button_color3)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction().setFunctionName("confirm_email").setParameters({'groupId': groupId}).setParameters({'err_email': emails[index]}))
    card_section
      .addWidget(CardService.newTextParagraph().setText(emails[index] + "<font color=\"#FF0000\"> is not a valid email. Replace the email below or click cancel to omit this email from your group: </text>"))
      .addWidget(CardService.newTextInput()
            .setFieldName("new_email")
            .setTitle("Enter a valid email"))
      .addWidget(CardService.newButtonSet()
                    .addButton(cancel)
                    .addButton(confirm))
  }
  email_card.setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))
                        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                        ))
  email_card
    .setName("FIX INVALID EMAIL")
    .setHeader(CardService.newCardHeader().setTitle("You have invalid emails. Click CANCEL ALL to ignore these emails."))
    .addSection(card_section)
  return CardService.newNavigation().popToRoot().pushCard(email_card.build())
  }
}

function goToEditAGroupHelperHelper(e){
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  const groupId = e['parameters']['groupId']
  clear_err_emails(groupId, conn)
  conn.close()
  return goToEditAGroupHelper(groupId)
}

function cancel_email(e){
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  const err_email = e['parameters']['err_email']
  const groupId = e['parameters']['groupId']
  delete_err_email(err_email, groupId, conn)
  var nav = getCorrectEmails(groupId)
  conn.close()
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
            .setText(err_email + " will not be added to the group"))
        .setNavigation(nav)
        .build();
}

function confirm_email(e){
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let new_email = e.formInput.new_email;
  const err_email = e['parameters']['err_email']
  const groupId = e['parameters']['groupId']
  if (new_email == undefined){
    return(CardService.newActionResponseBuilder().setNavigation(getCorrectEmails(groupId)).build())
  }
  if (validateEmail(new_email) == false){
    delete_err_email(err_email, groupId, conn)
    back_add_err_email(new_email, groupId, conn)
    var nav = getCorrectEmails(groupId)
    conn.close()
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
            .setText(new_email + " is not a valid email"))
        .setNavigation(nav)
        .build();
    //To do: make this an action response with navigation and notification
  } else {
    delete_err_email(err_email, groupId, conn)
    back_add_user(groupId, new_email, conn)
    grant_access_new_user(groupId, new_email);
    var nav = getCorrectEmails(groupId)
    conn.close()
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
            .setText(new_email + " has been added to the group"))
        .setNavigation(nav)
        .build();
  }
}


/*Deletes a group and returns built action response object with navigation

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that updates the card of group list,
    as a response to removing a group
*/
function deleteGroup(e){
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let groupId = e['parameters']['group_id']
  let name = e['parameters']['name']
  //deleteGroupHelper(groupId, name, conn)
  running = PropertiesService.getScriptProperties().getProperty("trigger_running")
  if (running == "True"){
    notifier_card = CardService.newCardBuilder()
    notifier_card.setFixedFooter(CardService.newFixedFooter()
                  .setPrimaryButton(CardService.newTextButton()
                            .setText("Home")
                            .setBackgroundColor(button_color1)
                            .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))
                            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                            ))
    notifier_card.setHeader(CardService.newCardHeader().setTitle("Deletion Failed"))
    notifier_card.addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText("Cannot delete two groups at once. Please try again later.")))
    var nav = CardService.newNavigation().popToRoot().pushCard(notifier_card.build())
    return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
  } else {
    start_deletion_process(groupId, name)
  }

  // let children = get_child_groups(groupId, conn)
  // for (child_index in children){
  //     let childId = children[child_index][0]
  //     let childName = children[child_index][1]
  //     if(childName != "undefined"){
  //       //deleteGroupHelper(childId, childName, conn)
  //       delayby = (child_index +1) * 1
  //       Logger.log(childName)
  //       start_delayed_deletion_process(childId, childName, delayby)
  //     }    
  // }
  conn.close()
  //Sets the navigation; updates the card to go to group list page
  // var nav = CardService.newNavigation().popToRoot().pushCard(goToMyGroupsHelper())
  // //Returns the built action response object, with notification indicating group was deleted,
  // //and navigation to group list page
  // return CardService.newActionResponseBuilder()
  //     .setNotification(CardService.newNotification()
  //         .setText("The group has been deleted."))
  //     .setNavigation(nav)
  //     .build();
  notifier_card = CardService.newCardBuilder()
  notifier_card.setFixedFooter(CardService.newFixedFooter()
                  .setPrimaryButton(CardService.newTextButton()
                            .setText("Home")
                            .setBackgroundColor(button_color1)
                            .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))
                            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                            ))
  notifier_card.setHeader(CardService.newCardHeader().setTitle("Your Group is Being Deleted"))
  notifier_card.addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText("This may take a few minutes. Once the group is deleted you will be able to see it under \"Archived Groups.\"")))
  var nav = CardService.newNavigation().popToRoot().pushCard(notifier_card.build())
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
}

function testdeletegrouphelper(){
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  deleteGroupHelper("91541038", "Group1", conn)
  conn.close()
}

function start_deletion_process(groupId, name){
    PropertiesService.getScriptProperties().setProperty('groupId', groupId)
    PropertiesService.getScriptProperties().setProperty('name', name)
    PropertiesService.getScriptProperties().setProperty("trigger_running", "True")
    ScriptApp.newTrigger('triggeredDeleteGroupHelper')
      .timeBased()
      .after(1 * 1000) //after 1 second
      .create();
}


function triggeredDeleteGroupHelper(){
  groupId = PropertiesService.getScriptProperties().getProperty("groupId")
  name = PropertiesService.getScriptProperties().getProperty("name")
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  console.time("access")
  remove_access_deleted_group(groupId, conn)
  //possibly_faster_group_remove_access(groupId, conn)
  console.timeEnd("access")
  console.time("back")
  back_delete_group(groupId, name, conn)
  console.timeEnd("back")
  conn.close()
  PropertiesService.getScriptProperties().setProperty("trigger_running", "False")
}

function onlyUnique(value, index, array) {
  return array.indexOf(value) == index;
}

function possibly_faster_group_remove_access(groupId, conn){
  files = back_retrieve_group_files(groupId, conn)
  users = back_retrieve_group_users(groupId, conn)
  batch_remove_access(files, users)
  var all_crossover_groups = []
  let user = ""
  // for (index in users){
  //   user = users[index]
  //   Logger.log(user)
  //   all_crossover_groups.concat(back_retrieve_group_list_by_user_email(user, conn))
  // }
  all_crossover_groups = back_retrieve_all_groups(conn)
  unique = all_crossover_groups.filter(onlyUnique)
  for (index in unique) {
    group_to_restore = unique[index]
    if(group_to_restore != groupId){
      restore_group_user_accesses(group_to_restore, conn)
    }
  }
}

function deleteGroupHelper(groupId, name) { 
  /*******************************************************************/
  // let userEmail = e['parameter']['parameterArray'][0]
  // let groupId = e['parameter']['parameterArray'][1]
  // let groupId = e['parameters']['group_id']
  // back_delete_group(groupId)
  //return null;
  /*******************************************************************/

  //Gets parameter 'group_id' from clicking event, and delete the group
  //with that id from the backend
  // let groupId = e['parameters']['group_id']
  // let name = e['parameters']['name']
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  console.time("access")
  remove_access_deleted_group(groupId, conn)
  console.timeEnd("access")
  console.time("back")
  back_delete_group(groupId, name, conn)
  console.timeEnd("back")
  conn.close()
}

/*Deletes a user from a group and returns built action response object with navigation

  Parameters: e(Event): the clicking event that calls this function
  Returns(Action Response): 
    An action response object that updates the card of current edited group,
    as a response to removing a user
*/
function deleteUser(e) {
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  /*******************************************************************/
  // let userEmail = e['parameter']['parameterArray'][0]
  // let groupId = e['parameter']['parameterArray'][1]
  // let groupId = e['parameters']['group_id']
  // let userEmail = e['parameters']['user_email']
  // removeUser(groupId, userEmail)
  //return null;
  /*******************************************************************/
  //Gets parameters 'group_id' and 'user_email' from clicking event, 
  //and delete the user from the group in the backend
  let groupId = e['parameters']['group_id']
  let userEmail = e['parameters']['user_email']
  //revokePermissions(userEmail)
  back_remove_user(groupId, userEmail, conn)
   var group_access = back_retrieve_group_access(groupId, 
                                               conn,
                                               new_connection = true)
  remove_access_deleted_user(userEmail, groupId, conn, group_access)
  conn.close()

  //Sets the navigation; updates the card to go to editing current group page
  var nav = goToEditAGroupHelper(groupId)
  //Returns the built action response object, with notification indicating user was deleted,
  //and navigation to editing current group page
  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("The user has been removed from the group."))
      .setNavigation(nav)
      .build();
}


