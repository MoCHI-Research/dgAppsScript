/*
ABOUT THIS FILE:
This file contains all possibly helpful functions used either in attempts or older versions of DriveGroups. None of them are currently in use. They are organized by which file they originated, and since this is such a large file I strongly recommend using the control f feature to search by original file. Note: not all files have sections here, if a file has no section it means there are no unused files made in that section.
*/

/**************************************************************************************/
//--------------------------CreateAGroup.gs ---------------------------------------
/**************************************************************************************/

//old method for making subgroups that copies files from parent, However I would like to change this system
//so that files are not copied but are instead parent groups are considered when displsying access, and users 
//are added to their parent groups.
function copy_from_group_helper(groupId_from, groupId_to, conn){
  var files_to_copy = back_retrieve_group_access(groupId_from, 
                                   conn,
                                   new_connection = true)
  for(index in files_to_copy){
    var fileId = files_to_copy[index][0];
    Logger.log(fileId)
    var fileAccess = files_to_copy[index][1];
    back_grant_file_access(groupId_to, fileId, fileAccess, conn);
    grant_access_new_file(groupId_to, fileId, fileAccess);
  }
}

//NOT IN USE:
// function safeAddEmails(e) {
//   // emails = e.formInput.user_emails
//   emailsArray = ["jgfrazie@hamilton.edu", "jackryanBioshock.net", "supermario.plumbers.net", "ben10AlienLover.lov", "plasticchairlover.net", "deviltrigger.gop"];
//   let erroneousEmails = [];
  
//   //Delete spaces in each email address 
//   //Designed for deleting spaces after each comma, but deletes other spaces as well
//   for (let index = 0; index < emailsArray.length; index++) { 
//     emailsArray[index] = emailsArray[index].replace(/\s/g, "")
//     var emailRegex = /\S+@\S+\.\S+/;
//     email = emailsArray[index];

//     // We will now validate each email and then add the valid emails to the group; we store the erroneous emails for later use
//     if (!emailRegex.test(email)) {
//       Logger.log("Error with email (" + email + "). ");
//       erroneousEmails.push(email);
//     } else {
//         try {
//           // var subject = "You have been added to the DriveGroup " + e.formInput.group_name
//           // var message = e.formInput.owner + " has added you to the group " + e.formInput.group_name + "."
//           GmailApp.sendEmail(email, 'subject', 'message');
//           // addUser(groupId, email)
//            grant_access_new_user(groupId, email) //gives the new user access to files in the group
//         } catch(e) {
//           Logger.log("Error with email (" + email + "). ");
//           erroneousEmails.push(email);
//         }
//     }
//   }

//   let validEmails = []
//   for (index = 0; index < emailsArray.length; index = index + 1) {
//     if (erroneousEmails.indexOf(emailsArray[index]) == -1) {
//       validEmails.push(emailsArray[index])
//     }
//   }
//   emailsArray = validEmails

//   Logger.log(emailsArray)
//   Logger.log(erroneousEmails)
// }



// PREVIOUS ATTEMPTS

/*function getUserEmailsInput(name, group_id) {
  //const name = e.commonEventObject.parameters.name
  //const group_id = e.commonEventObject.parameters.group_id

  var name = name
  var group_id = group_id

  let card = CardService.newCardBuilder()
  card.setHeader(
      CardService.newCardHeader()
        .setTitle('CREATE A GROUP')
    )
    .addSection(
      CardService.newCardSection()
        .setHeader("Add users to group '" + name + "'.") 
        .addWidget(CardService.newTextInput()
          .setFieldName("user_emails")
          .setTitle("Emails - separate with commas")
          .setMultiline(true))
        .addWidget(CardService.newTextButton()
          .setText("Add to Group")
          .setOnClickAction(gotoAddUsers)
        )
    ).build()
}*/

/**************************************************************************************/
//--------------------------EditAGroup.gs ---------------------------------------
/**************************************************************************************/

// Non-functioning alternative
// function deleteUser(userEmail, groupId) {
//   removeUser(group_Id, userEmail)
//   return null;
// }

// PREVIOUS ATTEMPTS

/*
  current_group = getGroup(name) 
  //Create list of users in the group
  user_list_section = CardService.newCardSection()
    .setHeader("Users in this group:")
  for (user of current_group.users) {
    deleteButton = CardService.newImageButton()
      .setIconUrl("https://icons-for-free.com/iconfiles/png/512/delete+remove+trash+trash+bin+trash+can+icon-1320073117929397588.png")
      .setAltText("Remove " + user + " from group")
      .setOnClickAction(goToCreateAGroupAction) //TODO: Make this delete the current email
    email = CardService.newDecoratedText()
      .setText(user)
      .setButton(deleteButton)
    user_list_section.addWidget(email)
  }
  user_list_section.addWidget(divider)
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Edit ' + name)
    )
    .addSection(user_list_section)
    .addSection(
      CardService.newCardSection()
        .setHeader("Add a user to group") //print groupname here
        .addWidget(CardService.newTextInput()
          .setFieldName("user_email")
          .setTitle("Email"))
        .addWidget(CardService.newTextButton()
          .setText("Add to Group")
          .setOnClickAction(goToEditAGroupAction))
     ).build()
*/

/**************************************************************************************/
//--------------------------AccessControl.gs ---------------------------------------
/**************************************************************************************/

//On opening DriveGroups, save all user files and ids
function save_all_files(user, file) {
  // Log the name of every file in the user's Drive.
  var files = DriveApp.getFiles()
  // Log the file id of every file in the user's Drive.
  let filesId = []

  while (files.hasNext()) {
    var file = files.next()
    //IMPLEMENT BACKEND HERE; prevent duplicate before insert
    const conn = Jdbc.getCloudSqlConnection(dbUrl, user, userPwd);
    const stmt = conn.prepareStatement('INSERT INTO DriveGroups.FileID values (?)');
    stmt.setString(1, file.getId());
    stmt.execute();
    //filesId.push(file.getId())
  }
  return filesId
}

//Gives the given user permission to view a file
//Inputs: user: an instance of the User class or an email address
        //file: an instance of the File class
function grant_viewing_priv(user, file) {
  let currFile = file.addViewer(user)
  return currFile.getViewers()
}

//Gives the given array of users permission to view a file
//Inputs: users: an array of Users or email addresses
        //file: an instance of the File class
function grant_viewing_priv_list(users, file) {
  let currFile = file.addViewers(users)
  return currFile.getViewers() 
}

//Gives the given user permission to edit a file
//Inputs: user: an instance of the User class or an email address
        //file: an instance of the File class
function grant_editing_priv(user, file) {
  let currFile = file.addEditor(user)
  //returns a list of users (Google Class)
  return currFile.getViewer() 
}

//Gives the given list of users permission to edit a file
//Inputs: users: an array of Users or email addresses
        //file: an instance of the File clas
function grant_editing_priv_list(users, file) {
  let currFile = file.addEditors(users)
  return currFile.getViewers() 
}

//Gives the given user permission to comment on a file
//Inputs: user: an instance of the User class or an email address
        //file: an instance of the File class
function grant_commenting_priv(user, file) {
  let currFile = file.addCommenters(user)
  return currFile.getViewers()
}

//Gives the given array of users permission to comment on a file
//Inputs: user: users: an array of Users or email addresses
        //file: an instance of the File class
function grant_commenting_priv_list(users, file) {
  let currFile = file.addCommenters(users)
  return currFile.getViewers() 
}

//Removes from the given user the permission to edit a file
//Inputs: user: an instance of the User class or an email address
        //file: an instance of the File class
function remove_editing_priv(user, file) {
 // let currFile = file.removeEditor(user)
  return file.getViewers() 
}

//Removes from the given user the permission to comment on a file
//Inputs: user: an instance of the User class or an email address
        //file: an instance of the File class
function remove_commenting_priv(user, file) {
  let currFile = file.removeCommenter(user)
  return currFile.getViewers() 
}

//Revokes the given user's permission to view a file
//Inputs: user: an instance of the User class or an email address
        //file: an instance of the File class
function revoke_all_priv(user, file) {
  let currFile = file.revokePermissions(user)
  return currFile.getViewers() 
}

/**************************************************************************************/
//--------------------------BackendFunctions.gs ---------------------------------------
/**************************************************************************************/

//Currently not used also ineffective since it fails to consider access users have from other groups
/*Updates access information of all users in a group. (backend function)
  Parameters: group: an group object, representing the group to update access information on
  Note: a function with the same name can be found in ExistingGroups.gs and some conflict might emerge
*/
function updateUserPermissions(group, conn) {
  //Gets group id from the group object.
  var group_id = group.id;
  //Initializes the email list of users; will update in later part of the function.
  var user_email_list = [];
  //retrieve the list of users;
  try {
    //Retrieve all users that belong to the group with group_id
    query_users = `select user_email from Group_User where groupid = ` + group_id;
    //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
    const sql_retrieve_users = conn.createStatement();
    sql_retrieve_users.setMaxRows(1000);
    //result_users contains all users that belong to the specified group, retrieved from Group_User
    const result_users = sql_retrieve_users.executeQuery(query_users)
    const numCols = result_users.getMetaData().getColumnCount();
    //Iteratively adds the user emails to user_email_list
    while (result_users.next()) {
      let rowString = '';
      for (let col = 0; col < numCols; col++) {
        rowString += result_users.getString(col + 1);
      }
      user_email_list.push(rowString)
    }
    result_users.close();
    sql_retrieve_users.close();
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }

  //retrieve files and access of a group
  try{
    //Retrieve all all access information of the group with group_id
    query_file = `select fileid, access from DriveGroups. Group_File_Access where groupid = ` + group_id + `;`;
    //const conn1 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
    const sql_retrive_files_access = conn.createStatement();
    //result_file_access contains all access information of the specified group
    const result_file_access = sql_retrive_files_access.executeQuery(query_file);
    //Goes through access information of all files related.
    while (result_file_access.next()){
      //Gets access information of the group to a file
      var curr_file_id = result_files_access.getString("fileid");
      var curr_file_access = result_files_access.getString("access")
      var file = DriveApp.getFileById(curr_file_id)
      //For all users in the group, update their access rights based on rights of the group
      if (curr_file_access == "edit"){
        grant_editing_priv(user_email_list,file)
        back_update_access(group_id, curr_file_id, curr_file_access, conn)
      } else if(curr_file_access == "comment") {
        grant_commenting_priv_list(user_email_list, file)
        back_update_access(group_id, curr_file_id, curr_file_access, conn)
      }else if(curr_file_access == "view") {
        grant_viewing_priv_list(user_email_list, file)
        back_update_access(group_id, curr_file_id, curr_file_access, conn)
      }else{
        /* If the group has no access to a file, revokes access from all
        users in the group, and then removes the relationship between the 
        group and the file.*/
        for (user_email in user_email_list){
          revoke_all_priv(user_email, file)
        }
        back_remove_file_from_group(group_id, curr_file_id)
      }
    }
  }catch (err){
    Logger.log('Failed with an error %s', err.message);
  }

  for(fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[1] == "edit") {
      give_edit(group.users, fileAccessTuples[0])
    } else if (fileAccessTuples[1] == "comment") {
      give_comment(group.users, fileAccessTuples[0])
    } else if (fileAccessTuples[1] == "view") {
      give_view(group.users, fileAccessTuples[0])
    } else {
      revoke_view(group.users, fileAccessTuples[0])
    }
  }
  conn.close()
}
// const sql_add_user = `INSERT IGNORE INTO DriveGroups.User VALUES ("`+ email+`")`;
//   const sql_add_user_group_relationship = `INSERT INTO DriveGroups.Group_User VALUES (`+ group_id + `,"` + email + `")`;
//   const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  
//   let statement3 = conn.createStatement()
//   let result3 = statement3.execute(sql_add_user)
//   let result4 = statement3.execute(sql_add_user_group_relationship)
//   Logger.log(result3)
//   Logger.log(result4)
//   conn.close();


/*Updates file access information of all users in a group. (backend function)
  Parameters: groupid: the integer id of the group
              fileid: the id of the file
              access: "none", "view", "comment", or "edit"; the level of the access the group has
                      to the file.
*/
// function back_update_access(groupid, fileid, access){
//   //select fileid where groupid matches; if it is not empty --> update; if it is empty --> insert
//   var file_id_res;
//   try {
//     //Retrieves all files related to a group
//     query =  `select fileid from DriveGroups.Group_File_Access where groupid = "` + groupid +`"`;
//     const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
//     const sql_retrieve_fileid = conn.createStatement();
//     const result_fileid = sql_retrieve_fileid.executeQuery(query);
//     result_fileid.next()
//     file_id_res = result_fileid.getString("fileid");
//     Logger.log(file_id_res)
//     conn.close();
//   } catch (err) {
//     Logger.log('Failed with an error %s', err.message);
//   }

//   if (file_id_res === ""){
//     //If no file is already related to the group, adds the file as the first file
//     try {
//     query_insert = `INSERT INTO DriveGroups.Group_File_Access VALUES` + groupid+ `,"` + fileid + `, "` + access + `";`;
//     const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
//     const sql_update_file_access = conn.createStatement();
//     const result_file_access = sql_update_file_access.executeQuery(query_insert);
//     conn.close();
//     } catch (err){
//       Logger.log('Failed with an error %s', err.message);
//     }
//   }else{
//     ////If there is already file related to the group, update the list to include the file
//     try {
//       const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
//       const stmt = conn.prepareStatement('UPDATE DriveGroups.Group_File_Access SET access = ? WHERE groupid = ? and fileid = ?');
//       stmt.setInt(1, access);
//       stmt.setString(2, groupid);
//       stmt.setString(3, fileid)
//       stmt.execute();
//       conn.close();
//       } catch (err){
//         Logger.log('Failed with an error %s', err.message);
//       }
//   }
// }
/**************************************************************************************/
//--------------------------ShareWithAGroup.gs (deleted file)-------------------------------
/**************************************************************************************/

//Outdated from when there was no multiselect:
//builds a list where each element is a different page of the list of all the files, then sets these pages up with arrows that navigate between them.
function make_sections_search(groupId, groupName, files){
  var pages = [];
  while (files.hasNext()){
    //file list section of the card "Choose a file to share"
    var file_list_section = CardService.newCardSection()
  //      .setHeader("Choose a file to share with " + groupName + ":" )
    //Count how many files have been added.
  //Does so because for some reason now only up to 100 files can be added; if there are
  //more than 100 files the page will not show up
  var file_count = 0;
  
  //Go through every(up to 100th) file
  while (files.hasNext() && file_count < 96) { //96 to save room for search bar and navigation
    file_count += 1
    //For each file, gets the file ID and file name
    var file = files.next()
    var fileId = file.getId()
    var filename = file.getName()
    //For each file, add a widget to file list section
    //The widget contains a decorated text that has a start icon(folder image)
    //Click on a decorated text to select the file
    file_list_section.addWidget(
      CardService.newDecoratedText()
            .setStartIcon(CardService.newIconImage()
              .setAltText("Choose the file " + filename)
              .setIconUrl(get_type_image(file))
            )
            .setWrapText(true)
            //The text of decorated text is the name of the corresponding file
            .setText(filename)
            //The decorated text, once clicked, calls set_current_file()
            //with argument inputs groupId, groupName, fileId, and filename
            .setOnClickAction(CardService.newAction()
                .setFunctionName('set_current_file')
                .setParameters({'group_id': groupId})
                .setParameters({'group_name': groupName})
                .setParameters({'file_id': fileId})
                .setParameters({'file_name': filename})
              ) 
    )
  }
    pages.push(file_list_section)
  }
   //creates the forward backward arrows that allow the user to scroll through files
  for (i = 0; i < pages.length; i++){
    Logger.log("hi")
    Logger.log("index is " + i + " ")
    add_arrows(pages[i], i, pages, groupId, groupName)
  }
  return pages;
}
function make_sections(groupId, groupName){
  var pages = [];
  var files = DriveApp.getFiles();
  while (files.hasNext()){
    // if (continuationToken == null) {
      // firt time execution, get all files from Drive
    //  var files = DriveApp.getFiles();
    // } else {
    //   // not the first time, pick up where we left off
    //   var files = DriveApp.continueFileIterator(continuationToken);
    // }
    
    //file list section of the card "Choose a file to share"
    var file_list_section = CardService.newCardSection()
    //make checkbox selection
    var selectFiles = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.CHECK_BOX)                                    //iris1 bookmark
      .setFieldName("select_files")

  //      .setHeader("Choose a file to share with " + groupName + ":" )
    //Count how many files have been added.
  //Does so because for some reason now only up to 100 files can be added; if there are
  //more than 100 files the page will not show up
  var file_count = 0;
  //Go through every(up to 100th) file
  while (files.hasNext()) { 
    file_count += 1
    //For each file, gets the file ID and file name
    var file = files.next()
    var fileId = file.getId()
    var filename = file.getName()
    //For each file, add a section to file list section
    selectFiles.addItem(filename, fileId, false)

    // old code for when there was no multiselecr
    // //For each file, add a widget to file list section
    // //The widget contains a decorated text that has a start icon(folder image)
    // //Click on a decorated text to select the file
    // file_list_section.addWidget(
    //   CardService.newDecoratedText()
    //         .setStartIcon(CardService.newIconImage()
    //           .setAltText("Choose the file " + filename)
    //           .setIconUrl(get_type_image(file))
    //         )
    //         .setWrapText(true)
    //         //The text of decorated text is the name of the corresponding file
    //         .setText(filename)
    //         //The decorated text, once clicked, calls set_current_file()
    //         //with argument inputs groupId, groupName, fileId, and filename
    //         .setOnClickAction(CardService.newAction()
    //             .setFunctionName('set_current_file')
    //             .setParameters({'group_id': groupId})
    //             .setParameters({'group_name': groupName})
    //             .setParameters({'file_id': fileId})
    //             .setParameters({'file_name': filename})
    //           ) 
    // )
  }
  file_list_section
    .addWidget(CardService.newTextButton()
      .setText("Share selected")
      .setOnClickAction(CardService.newAction()
                          .setFunctionName('completionMultiSelectAction')
                          .setParameters({'groupId': groupId})
                          .setParameters({'groupName': groupName})))
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
       pages.push(file_list_section)
  }
    // if(files.hasNext()){
    //   var continuationToken = files.getContinuationToken();
    //   userProperties.setProperty('CONTINUATION_TOKEN', continuationToken);
    // } else {
    //   // Delete the token
    //   PropertiesService.getUserProperties().deleteProperty('CONTINUATION_TOKEN');
    //   keep_going = false;
    // }
   //creates the forward backward arrows that allow the user to scroll through files
  // for (i = 0; i < pages.length; i++){
  //   Logger.log("hi")
  //   Logger.log("index is " + i + " ")
  //   add_arrows(pages[i], i, pages, groupId, groupName)
  // }
  return pages;
}
//adds the navigation tool to each page in the array of pages
function add_arrows(value, index, array, groupId, groupName){
    //builds forward arrow if not the last page
    if (index != array.length - 1){
        //builds card for next item
        var forwardarrow = CardService.newImageButton()
          .setAltText("An image button with a forward arrow")
          .setIconUrl("https://static.thenounproject.com/attribution/1256497-600.png")
          .setOnClickAction(CardService.newAction()
              .setFunctionName('go_to_page')
              .setParameters({'the_page_num': (index + 1).toString()})
              .setParameters({'groupId': groupId})
              .setParameters({'groupName': groupName}))
    }
    //builds back arrow if not the first page
    if (index != 0){
        //builds card for next item
        var backarrow = CardService.newImageButton()
          .setAltText("An image button with a forward arrow")
          .setIconUrl("https://static.thenounproject.com/attribution/1256499-600.png")
          .setOnClickAction(CardService.newAction()
              .setFunctionName('go_to_page')
              .setParameters({'the_page_num': (index - 1).toString()})
              .setParameters({'groupId': groupId})
              .setParameters({'groupName': groupName}))
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
function go_to_page(e){
  const the_page_num = e['parameters']['the_page_num']
  const groupId = e['parameters']['groupId']
  const groupName = e['parameters']['groupName']
  //let files = DriveApp.getFiles()
  PAGES = make_sections(groupId, groupName)
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  //Set card name for navigation
  card.setName("Choose a file to share")
    //The card header is set to contain the name of the group, in order
    //for user to confirm that they selected the right group
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Share with ' + groupName)
    )
 // add the search bar:
  card.addSection(
      CardService.newCardSection() //adds the search bar
      .addWidget(CardService.newTextInput() 
          .setFieldName('file_query')
          .setTitle("Find file by name")
        )
        .addWidget(CardService.newImageButton()
          .setIconUrl("https://static.thenounproject.com/png/4009566-200.png")
          //The button, once clicked, calls search_for_file()
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('search_for_file')
              .setParameters({'groupId': groupId})
              .setParameters({'groupName': groupName})
          )
        )
     )
 // Add file list section to the card
    card.addSection(PAGES[the_page_num])
  // var nav = CardService.newNavigation().pushCard(card);    
  // return CardService.newActionResponseBuilder().setNavigation(nav).build()
  return card.build()
}
//possibly still useful attempt at using continuation tokens for file retrieval. Generally it seems file retrieval happens fast enough now for this not to be necessary
function list_files(files){
  var userProperties = PropertiesService.getUserProperties();
  var continuationToken = userProperties.getProperty('CONTINUATION_TOKEN');
  var start = new Date();
  var end = new Date();
  var maxTime = 1000*60*4.5; // Max safe time, 4.5 mins

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

  // Save your place by setting the token in your user properties
  if(files.hasNext()){
    Logger.log("start new iteration \n")
    var continuationToken = files.getContinuationToken();
    userProperties.setProperty('CONTINUATION_TOKEN', continuationToken);
    return (list_files(files))
  } else {
    // Delete the token
    PropertiesService.getUserProperties().deleteProperty('CONTINUATION_TOKEN');
    return files
  }
}
function test_get_files(){
  var files = []
  files = list_files(files)
}
// PREVIOUS ATTEMPT
/*function goToShareWithAGroup() {
  //Retrieve a Card object with available files and a Share button, return both
  //This function needs to create group list section and a buttonset of a thumbnail and a filename for each file

  //IMPLEMENT BACKEND HERE!done
  let groups = back_retrieve_group_by_user_email(Session.getActiveUser().getEmail())// array of all groups of the current user

  //Create a group list section
  group_list_section = CardService.newCardSection()
    .setHeader("Choose a group:")

  for (group in groups) {
    var textButton = CardService.newTextButton()
      .setText(group)
      .setOnClickAction(CardService.newAction().setFunctionName('set_current_group')) //supposed to call getGroup
  
      // IMPLEMENT BACKEND HERE!
      let group_id = //on select, save group id
      //Make the file image turn a different color on selection?

      // FOR TESTING BELOW
      //console.log("Test requestNewGroupUsers");
      //.setOnClickAction(CardService.newAction().setFunctionName('requestNewGroupUsers')) //adapted from CreateAGroup
      //.setOnClickAction(goToEditAGroupAction)
    group_list_section.addWidget(textButton)
  }

  //Create a buttonset of a thumbnail and a filename for each file
  let fileSection = CardService.newCardSection().setHeader("Choose a file:")
  // IMPLEMENT BACKEND HERE! 
  let files = DriveApp.getFiles() // Check if this line is correct, set files to all files in the backend
  while (files.hasNext()) {
    let buttonSet = CardService.newButtonSet()
    const file = files.next()
    const thumbnail = file.getThumbnail
    const link = file.getUrl() 
    let imageButton = CardService.newImageButton()
      .setAltText("A file icon for the file " + file.getName())
      .setIconUrl("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F5%2F59%2FOneDrive_Folder_Icon.svg%2F1200px-OneDrive_Folder_Icon.svg.png&f=1&nofb=1")
      
      // IMPLEMENT BACKEND HERE!
      //let file_id =  on select/click, save file id
      // Maybe use .setOnClickAction() ?
      //Make the file image turn a different color on selection?

      //.setOnClickAction(goToCompletionAction); //goes to CompletionPage.gs, disregard
    let textButton = CardService.newTextButton()
      .setText(file.getName())
      .setOnClickAction(goToCompletionAction) //goes to CompletionPage.gs
    buttonSet.addButton(imageButton).addButton(textButton)
    fileSection.addWidget(buttonSet)
  }

  let permissionSelect = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle("Choose level of permission: ")
    .setFieldName("checkbox_field")
    .addItem("Edit", "canEdit", true)
    .addItem("Comment", "canComment", false)
    .addItem("View", "canView", false);

  let card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('SHARE WITH A GROUP'))
  card.addSection(group_list_section).addSection(fileSection)
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setText("SHARE")
      //.setTextButtonStyle(TextButtonStyle.FILLED)
      //.setBackgroundColor("#F06543")
      .setOnClickAction(goToCompletionAction  //goes to CompletionPage.gs
        .setParameters({groupId: 'group_id'},
                       {fileId: 'file_id'},
                       {canEdit: 'canEdit'},
                       {canComment: 'canComment'},
                       {canView: 'canView'}))
      ) 
  )
  return card.build()
}*/


/**************************************************************************************/
//--------------------------HelperShare.gs (deleted file)-------------------------------
/**************************************************************************************/

/*
 This file should keep track of which groups have access to which files, 
 as well as which kind of access they have (editing, viewing, commenting)
 - Contains dictionary that will keep track of groups' access: key is group name, values are file IDs
 - Contains helper functions, so when we add/remove users from a group it adds to data structure as 
   well as shares as needed (Called in ExistingGroup) 
*/

let fileAccess = new Object()
 
//Create groupAccess class
class groupAccess {
  //IMPLEMENT BACKEND HERE!
  //Note: how each groupAccess class should look like in the backend
  constructor(name, files = []) {
    this.name = name; //name of group
    this.files = files; //array of fileInfo classes
  }
}

//Create fileInfo class
class fileInfo {
  //IMPLEMENT BACKEND HERE!
  //Note: how each fileInfo class should look like in the backend
  constructor(fileId, accessType) {
    this.id = fileId; //file ID
    //access type: 0 is none, 1 is editing, 2 is commenting, 3 is viewing
    this.accType = accessType; //integer 0-3
  }
}

function back_insert_group_access(name){
  try {
    const conn = Jdbc.getCloudSqlConnection(dbUrl, user, userPwd);
    const stmt = conn.prepareStatement('INSERT INTO DriveGroups.Drive_Group values (?, ?, ?)');
    stmt.setString(1, group_id);
    group_id +=1;
    stmt.setString(2, name);
    stmt.setString(3, owner_id);
    owner_id +=1;
    stmt.execute();
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }

  //create new group - files relationship iteratively

  try {
    const conn1 = Jdbc.getCloudSqlConnection(dbUrl, user, userPwd);
    conn1.setAutoCommit(false);
    const stmt1 = conn1.prepareStatement('INSERT INTO Group_File values (?, ?)');
    for (let i = 0; i < files.length; i++) {
      stmt1.setString(1, group_id);
      stmt1.setString(2, files[i].id);
      stmt1.addBatch();
    }
    const batch = stmt1.executeBatch();
    conn1.commit();
    conn1.close();
  } catch {
    Logger.log('Failed with an error %s', err.message);
  }
}




// NOTE: all code above this point was commented out for some reason? It may be a typo however.




/*Create a new groupAccess class and add it to the fileAccess dict
Parameters: name: the name of the group
            files: array of fileInfo classes
Returns: a new object of groupAccess Group class
*/
function newGroupAccess(name){
  //IMPLEMENT BACKEND HERE!
  //Push a new groupAccess class to fileAccess and return
  //push new group 

  back_insert_group_access(name)

  let userGroupAccess = new groupAccess(name, files);
  fileAccess[name] = userGroupAccess;
  return userGroupAccess;

}

/*Delete groupAccess class
Parameters: name: the name of the group
*/
// function deleteGroup(name){
//   //IMPLEMENT BACKEND HERE!
//   //Retrieve a new groupAccess from fileAccess to delete and update accordingly

//   //set currGroup to given group
//   let currGroup = fileAccess[name];
//   var oldFiles = currGroup.files; //save old file array
//   currGroup.files = []; //set files to empty array
//   //for previous length of group file array
//   for (let i = 0; i < oldFiles.length; i++) {
//     files[i].accType = 0; //set to no access
//   }
// }

/*Add fileInfo to groupAccess class
Parameters: name: the name of the group
            fileID: file ID of given file
            accType: the type of access to give
                     0 is none, 1 is editing, 2 is commenting, 3 is viewing
*/
function addFile(name, fileId, accType){
  //IMPLEMENT BACKEND HERE!
  //Push a new fileInfo to groupAccess class and return

  //set currGroup to given group
  let currGroup = fileAccess[name];
  var oldFiles = currGroup.files; //save old file array
  var files = []; //create file array
  files[0].id = fileID; //add given file
  //for previous length of group file array
  for (let i = 0; i < oldFiles.length; i++) {
    files[i+1] = oldFiles[i]; //update rest of files
  }
  files[0].accType = accType; 
}

/*Remove file ID from groupAccess class
Parameters: name: the name of the group
            fileID: file ID of given file
*/
function removeFile(name, fileId){
  //IMPLEMENT BACKEND HERE!
  //Retrieve a file from fileAccess to delete and update accordingly

  //set currGroup to given group
  let currGroup = fileAccess[name];
  var oldFiles = currGroup.files; //save old file array
  var files = []; //create file array
  var counter = 0; //create counter
  //for previous length of group file array
  for (let i = 0; i < oldFiles.length; i++) {
    //if files is not the removed one
    if((oldFiles[i]).id != fileId) {
      files[counter] = oldFiles[i]; //update files array
      counter++; //iterate counter
    }
  }
}

/*Changes permission of group
Parameters: name: the name of the group
            type: the new type of access
*/
function changePermission(name, type){
  //IMPLEMENT BACKEND HERE!
  //Retrieve a group from fileAccess to change and update accordingly

  //access type: 0 is none, 1 is editing, 2 is commenting, 3 is viewing
  let currGroup = fileAccess[name];
  currGroup.accType = type;
}


/**************************************************************************************/
//------------------- ExistingGroups.gs (deleted file) -----------------------------
/**************************************************************************************/

//Files related to this class are not useful because retrieving the group to retrieve one aspect takes way more time than just retrieving the aspect you want
//Create Group class
class Group {
  //The class that stores 
 constructor(name, id,  users = [], fileAccess = [], parent) {
    this.name = name; //string, name of group
    this.id = id; //string, id of group created 
    this.users = users; //array of strings, emails of users in this group
    this.fileAccess = fileAccess; //array of tuples(arrays)
      //the first element of the tuple represents file ID
      //the second element of the tuple represents the permission level: 
        //"view"
        //"comment"
        //"edit"
        //"none"
    this.parent = parent; //Group object representing parent; NOTE: currently not in use
    this.nestedGroups = []; //array of Group objects; NOTE: currently not in use
    this.defaultToParent = false //Boolean representing whether to default to subgroup or parent permissions;
                                 //NOTE: currently not in use
  }
}

//FUNCTIONS TO MANAGE GROUPS
/*******************************************************/
/*(Ignore for now) Note: when dealing with adding/removing users from parent/nested groups: 
ADDING a user recursively adds it to all parent groups as well
REMOVING a user recursively removes it from all nested groups as well
*/
/*******************************************************/

/*Given the name of a group and emails in it, generate id for the group
  and create the group in the backend

  Parameters: 
    name(string): the name of the group; 
    emails(array of strings): the list of emails of desired users, 
    (currently not applicable) parent: parent group if applicable
  Returns(string): the generated id of the group
*/
// function newGroup(name, emails, owner){
//   //Generate group ID and use it to create a new group in the backend
//   var id_curr = generate_group_id();
//   // Session.getActiveUser().getEmail() should get the owner???
//   back_create_new_group(id_curr, name, emails, owner);
//   return id_curr;

/*******************************************************/
  // Push a new "Group(name, emails, parent)" class to "groups" dictionary, if it does not exist there already
  // groups should be in the backend, rather than locally
  // RETURNS: the group id as string
  //var id_curr = groupid;
  //let userGroup = new Group(name, id_curr, emails);
  //back_create_new_group(id_curr, name, emails);
  //groupid = groupid + 1;
  //Logger.log(groupid);
/*******************************************************/
//}



/*******************************************************/
  //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
  //Retrieve given its name, and then delete the group and remove it from any nested groups, return nothing

  // let group = getGroup(name);
  // if(group) {
  //   for (const nested in group.nestedGroups) {
  //     nested.parent = None;
  //   }
  //   delete group[name];
  // }
/*******************************************************/

/*******************************************************/
  //curr_group = getGroup(group_id)
  //updateUserPermissions(curr_group)
  //return null;

  // user_id +=1
  // let group = getGroup(groupName);
  // if (group) {
  //   if (group.parent) {
  //     addUser(group.parent.group_name, email)
  //   }
  //   group.users.push(email);
  //   return group.users;
  // }
/*******************************************************/

/*******************************************************/
  //Remove file permissions
  // back_revoke_access(group_id, email);
  // //delete user
  // back_remove_user(group_id,email);
  // curr_group = getGroup(group_id);
  // updateUserPermissions(curr_group);
  // return null;

  //IMPLEMENT BACKEND HERE! Yes
  //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
  //Given its name, if email to the group's users array, delete it from users[] and from all nested groups, return Group if successful

  // let toRevoke = [email]
  // for (fileAccessTuples of group_name.fileAccess) {
  //   revoke_view(group, fileAccessTuples[1])
  // }

  // let group = getGroup(group_id);
  // if (group) {
  //   for (const nested in group.nestedGroups) {
  //     nested.parent = None;
  //   }
  //   user_index = group.users.findIndex(email);
  //   if(user_index !== -1) {
  //     group.users.splice(user_index, 1);
  //     group.users = group.users;
  //     return group;
  //   }
  //   throw("No such user " + user + " in group " + group_name + ".")
  // }

/*******************************************************/
 

/*Add a list of users to a group in the backend
  Parameters: 
    group_id: the id of the group in the backend
    emails(array of strings): array of the emails to add to backend
  Returns: null
*/
function addUserList(group_id, emails, conn) {
  for (email in emails){
    back_add_user(group_id,email, conn)
  }
  return null;

  /*******************************************************/
  // for (email in emails){
  //   back_add_user(group_id,email)
  // }
  // curr_group = getGroup(group_id);
  // updateUserPermissions(curr_group);
  // return null;

  //IMPLEMENT BACKEND HERE!
  //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
  //Given its name, add multiple emails to the group's users array and to all parent groups, return users[] if successful
  //essentially addUser function but for users, an array of User objects
  //info on User objects (https://developers.google.com/apps-script/reference/base/user)

  // group = groups[group_name];
  // if (group) {
  //   if (group.parent) {
  //     addUserList(group.parent.group_name, users)
  //   }
  //   group.users.push(users);
  //   return group.users;
  // } //throw an error if it doesn't work
  /*******************************************************/
  
}



/*Remove a list of users from a group

  Parameters: 
    group_id(string): the id of the group in the backend
    emails(array of strings): the list of emails of the users to delete
  Returns: null
*/
function removeUserList(group_id, emails) {
  for (email in emails){
    back_remove_user(group_id,email);
  }
  
  return null;


  /*******************************************************/
  //IMPLEMENT BACKEND HERE!
  //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
  //Given its name, if email to the group's users array, delete it from users[] and from all nested groups, return Group if successful
  //essentially removeUser function but for users, an array of User objects
  //info on User objects (https://developers.google.com/apps-script/reference/base/user)
  
  // for (email in emails){
  //   back_revoke_access(group_id, email);
  //   back_remove_user(group_id,email);
  // }
  
  // curr_group = getGroup(group_id);
  // updateUserPermissions(curr_group);
  // return null;

  // let group = getGroup(group_name)
  // if(group) {
  //   for (const nested in group.nestedGroups) {
  //     removeUserList(nested.group_name, users)
  //   }
  //   for (let i = 0; i < users.length; i++) {
  //     removeUser(group, users[i]);
  //   }
  // }
  // updateUserPermissions(group)
  // return null;
  /*******************************************************/
}



/**************************************************************************************/
//NOTE: Currently the functions below are not used

//FUNCTIONS TO CHANGE FILE PERMISSIONS

/*Updates user permissions based on group file access
Parameters: group: the group object that stores access information
*/
function updateUserPermissions(group) {
  back_update_permission(group)

  for(fileAccessTuples of group.fileAccess) {
    //Gives user different permissions based on group access
    if (fileAccessTuples[1] == "edit") {
      give_edit(group.users, fileAccessTuples[0])
    } else if (fileAccessTuples[1] == "comment") {
      give_comment(group.users, fileAccessTuples[0])
    } else if (fileAccessTuples[1] == "view") {
      give_view(group.users, fileAccessTuples[0])
    } else {
      revoke_view(group.users, fileAccessTuples[0])
    }
  }
  return group
}


/*Give editing permission to all users in a group
Parameters: group: a Group object in the Groups array
            file: a File object
*/
function give_edit(fileId, group) {
  //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
  //uses AccessControl.gs function
  let user_emails = []
  let file = DriveApp.getFileById(fileId)

  //Loops through the list of users in the group, granting edit right to each user
  for (user of group.users) {
    let updatedUser = grant_editing_priv(user, file);
    user_emails.push(updatedUser.getEmail())
  } 
  group.users = user_emails

  //Updates the access status of the file to "edit" in the group object
  let hasTuple = false
  for (fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[0] == fileId) {
      hasTuple = true
      fileAccessTuples[1] = "edit"
    }
  }
  if (!hasTuple) {
    group.fileAccess.push([fileId, "edit"])
  }
}

/*Revoke editing permission to all users in a group
Parameters: group: a Group object in the Groups array
            file: a File object
*/
function revoke_edit(group, fileId) {
  //Retrieve a Group(name, users, parent) and its users array from "groups" dictionary in backend
  //uses AccessControl.gs function

  let file = DriveApp.getFileById(fileId)

  //Loops through the list of users in the group, revoking edit right from each user
  for (user of group.users) {
    let updatedUsers = remove_editing_priv(user, file);
  } 
  group.users = updatedUsers

  //Updates the access status of the file (from "edit") to "comment" in the group object
  let hasTuple = false
  for (fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[0] == fileId) {
      hasTuple = true
      fileAccessTuples[1] = "comment"
    }
  }
  if (!hasTuple) {
    group.fileAccess.push([fileId, "comment"])
  }
}

/*Give commenting permission to all users in a group
Parameters: group: a Group object in the Groups array
            file: a File object
*/
function give_comment(group, fileId) {
  //Retrieve a Group(name, users, parent) and its users array from "groups" dictionary in backend
  //uses AccessControl.gs function

  let file = DriveApp.getFileById(fileId)
  //Loops through the list of users in the group, granting comment right to each user
  for (user of group.users) {
    let updatedUsers = grant_commenting_priv(user, file);
  } 
  group.users = updatedUsers

  //Updates the access status of the file to "comment" in the group object
  let hasTuple = false
  for (fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[0] == fileId) {
      hasTuple = true
      fileAccessTuples[1] = "comment"
    }
  }
  if (!hasTuple) {
    group.fileAccess.push([fileId, "comment"])
  }
}

/*Revoke commenting permission to all users in a group
Parameters: group: a Group object in the Groups array
            file: a File object
*/
function revoke_comment(group, fileId) {
  //Retrieve a Group(name, users, parent) and its users array from "groups" dictionary in backend
  //uses AccessControl.gs function

  let file = DriveApp.getFileById(fileId)

  //Loops through the list of users in the group, revoking comment right from each user
  for (user of group.users) {
    let updatedUsers = remove_commenting_priv(user, file);
  } 
  group.users = updatedUsers

  //Updates the access status of the file (from "comment") to "view" in the group object
  let hasTuple = false
  for (fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[0] == fileId) {
      hasTuple = true
      fileAccessTuples[1] = "view"
    }
  }
  if (!hasTuple) {
    group.fileAccess.push([fileId, "view"])
  }
}

/*Give viewing permission to all users in a group
Parameters: group: a Group object in the Groups array
            file: a File object
*/
function give_view(group, fileId) {
  //Retrieve a Group(name, users, parent) and its users array from "groups" dictionary in backend
  //uses AccessControl.gs function

  let file = DriveApp.getFileById(fileId)
  //Loops through the list of users in the group, granting viewing right to each user
  for (user of group.users) {
    let updatedUsers = grant_viewing_priv(user, file);
  } 
  group.users = updatedUsers

  //Updates the access status of the file to "view" in the group object
  let hasTuple = false
  for (fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[0] == fileId) {
      hasTuple = true
      fileAccessTuples[1] = "view"
    }
  }
  if (!hasTuple) {
    group.fileAccess.push([fileId, "view"])
  }
}

/*Revoke viewing permission to all users in a group
Parameters: group: a Group object in the Groups array
            file: a File object
*/
function revoke_view(group, fileId) {
  //Retrieve a Group(name, users, parent) and its users array from "groups" dictionary in backend
  //uses AccessControl.gs function
  //backend delete fileid

  let file = DriveApp.getFileById(fileId)
  //Loops through the list of users in the group, revoking viewing right(all rights) from each user
  for (user of group.users) {
    let updatedUsers = revoke_all_priv(user, file);
  } 
  group.users = updatedUsers

  //Updates the access status of the file to "none" in the group object
  let hasTuple = false
  for (fileAccessTuples of group.fileAccess) {
    if (fileAccessTuples[0] == fileId) {
      hasTuple = true
      fileAccessTuples[1] = "none"
    }
  }
  if (!hasTuple) {
    group.fileAccess.push([fileId, "none"])
  }
}



//UNIMPLEMENTED FUNCTIONS

/*Create a new group based on file’s existing sharing settings and add to groupDict
Parameters: name: the name of the group; file: the file whose editors will be added to the group, parent: parent group if applicable
Returns: a new object of the Group class
*/
// function newGroupFromFile(name, file, parent) {
//   //IMPLEMENT BACKEND HERE! Yes
//   //Push a new "Group(name, users, parent)" class to "groups" dictionary, if it does not exist there already
//   //groups should be in the backend, rather than locally
//   //same as last newGroup function
//    let emails = File.getViewers(file);
//    let userGroup = new Group(name, groupid, emails, parent);
//    if (groups[name]) {
//     return null
//    }
//    
//    groups.push(userGroup); //add group to groupDict 
//    back_create_new_group(group_id,emails,owner_id)
//    groupid = groupid + 1;

//    return userGroup;
// }



// NESTED GROUP FUNCTIONS
/*Add a nested group
Parameters: parent: the parent Group object; nested: the nested Group object
Returns: the updated parent Group
*/
// function addNestedGroup(parent, nested){
//   //IMPLEMENT BACKEND HERE!
//   //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
//   //Add a nested group given parent group

//   parent.nestedGroups.push(nested)
//   return parent
// }

/*Create nested group. All users in the nested group must also be in the parent group!
Parameters: 
            group_name: the name of the nested group to create
            parent_group_name: the name of the parent group to add the nested group to
            users: the list of users to put in the nested group
Returns: the new nested group
*/
// function createNestedGroup(group_name, parent_group_name, users) {
//   //IMPLEMENT BACKEND HERE!
//   //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
//   //Create a nested group given group name, parent group, and users to check if they exist in parent group
//   //return updated nested group

//   let parent = getGroup(parent_group_name)
//   if (!(users.every(user => parent.users.includes(user)))) {
//     throw("All users in the nested group must exist in the parent group.")
//     return null
//   }
//   let nested = newGroup(group_name, users, parent)
//   addNestedGroup(parent, nested)
//   return nested
// }

/*Delete a nested group. 
Parameters: 
            group_name: the name of the nested group to delete
            parent_group_name: the name of the parent group to delete the nested group from
            users: the list of users to remove from the nested group
Returns: the new nested group
*/
// function createNestedGroup(group_name, parent_group_name, users) {
//   //IMPLEMENT BACKEND HERE!
//   //Retrieve a Group(name, users, parent) from "groups" dictionary in backend
//   //Delete a nested group given group name, parent group, and users to check that they don't exist in any nested groups afterwards
//   //return updated nested group
//   //not sure where everything in this function went?? it was deleted when I got to it

//   let parent = getGroup(parent_group_name)
//   removeUser(parent, group_name)
//   if (!(users.every(user => parent.users.includes(user)))) {
//     throw("Deletion error.")
//     return null
//   }
//   return nested
// }



//TESTING FUNCTIONS

function logGroupNames(){
  //IMPLEMENT BACKEND HERE!
  //Retrieve a Group(name, users, parent) and its names from "groups" dictionary in backend
  //uses AccessControl.gs function
  //for testing purposes

  for (group in groups) {
    console.log(group)
  }
}

// function tester() {
//   console.log("Pre-add:")
//   logGroupNames()
//   newGroup("test1", [])
//   newGroup("test2", [])
//   newGroup("test3", [])
//   console.log("Post-add:")
//   logGroupNames()
// }
/**************************************************************************************/
