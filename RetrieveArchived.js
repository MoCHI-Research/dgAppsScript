function goToRestoreArchived() {
  let card = CardService.newCardBuilder()
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  card
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    .setName("Restore Archived Groups")
    .setHeader(CardService.newCardHeader().setTitle("Choose a group to restore:"))
  var group_list_section = CardService.newCardSection();  
  try {
    var groups = back_retrieve_archived();
      if (groups[0] != null){
        for (index in groups) {
            let name = groups[index][1]
            let group_id = groups[index][0]
            //For each group, add a widget to group list section
            //The widget contains a decorated text object that contains an image button following text
            //Click on the decorated text to go to the page editing the specific group
            group_list_section.addWidget(
                  CardService.newDecoratedText()
                    .setText("<b> "+ name.toUpperCase() +" </b>")
                    .setBottomLabel("\n")
                    //When the text is clicked, calls goToEditAGroup() with argument input group_id
                    .setOnClickAction(CardService.newAction()
                      .setFunctionName('restore_group')
                      .setParameters({'group_id': group_id})
                    )
            )
        //Gets group information from object obtained(name and id)
        }

      } else {
        group_list_section.addWidget(CardService.newTextParagraph().setText("You have no archived groups"))
      }
  }catch (err) {
    group_list_section.addWidget(CardService.newTextParagraph().setText("A group is in the process of being deleted please wait a minute and try again" + err))
  }
  
  
  card.addSection(group_list_section)
  return card.build()
}

function restore_group(e){
  const groupId = e['parameters']['group_id']
  const update_archived = 'UPDATE DriveGroups.Drive_Group SET archived = false WHERE groupid = "'+ groupId +'";'
  const stop_delete_from_archive = `DROP EVENT IF EXISTS archive_delete` + groupId + ' ;'
  const stop_delete_group = 'DROP EVENT IF EXISTS group_delete' + groupId + ' ;'
  const stop_delete_file_group = 'DROP EVENT IF EXISTS file_group_delete' + groupId + ' ;'
  const stop_delete_user_group = 'DROP EVENT IF EXISTS user_group_delete' + groupId + ' ;'
  const delete_from_archive = 'DELETE FROM DriveGroups.Archive WHERE groupid = "' + groupId + '";'
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  let statement = conn.createStatement()
  let parent_id = back_retrieve_parent_id(groupId, conn)
  if (parent_id != 0){ //if the group has a parent
    if(is_in_archive(parent_id, conn)){ //and the parent is archived
      return CardService.newActionResponseBuilder().setNotification(CardService.newNotification()
          .setText("Cannot restore subgroup with archived parent.")).build() //don't restore the subgroup
    } 
  }

  //Execute the statements
  statement.execute(stop_delete_from_archive);
  statement.execute(stop_delete_group)
  statement.execute(stop_delete_file_group)
  statement.execute(stop_delete_user_group)
  statement.execute(delete_from_archive)
  statement.execute(update_archived)

  //actually restore access in Drive
  restore_group_user_accesses(groupId, conn)

  conn.close()
  var nav = CardService.newNavigation().popToRoot().pushCard(goToRestoreArchived())
  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("Your group has been restored"))
      .setNavigation(nav)
      .build();
}


function restore_group_user_accesses(groupId, conn){
  users = back_retrieve_group_users(groupId,conn)
  file_access = back_retrieve_group_access(groupId,conn)
  viewable = []
  commentable = []
  editable = []
  for (index in file_access) {
    file_id = file_access[index][0]
    access = file_access[index][1]
    if (access == "view"){
      viewable.push(file_id)
    } else if (access == "comment"){
      commentable.push(file_id)
    } else if (access == "edit"){
      editable.push(file_id)
    }
  } 
  batch_share_view(viewable, users)
  batch_share_comment(commentable, users)
  batch_share_edit(editable, users)
}


function back_retrieve_archived(){
    //Initialize the list that saves existing groups
  var group_list = [];
  //var group_dict = {};
  const user_email = Session.getActiveUser().getEmail();
  try {
    //Gets the group IDs and names of all groups
    query =  `select groupid, name, owner from DriveGroups.Archive`;
    const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
    const sql_retrieve_group = conn.createStatement();
    const archived_groups = sql_retrieve_group.executeQuery(query);
    //For each group, first gets its group ID, then use group ID to retrieve information
    //from backend and build Group object
    while (archived_groups.next()) {
      var groupId = archived_groups.getString("groupid");
      var groupName = archived_groups.getString("name");
      var groupOwner = archived_groups.getString("owner")
      if (groupOwner == user_email){
        group_list.push([groupId, groupName, groupOwner]);
      }
      //group_dict[curr_group_id] = back_retrieve_group(curr_group_id);
    }
    sql_retrieve_group.close()
    //Close the database connection
    conn.close()
    //Return list of groups
    return group_list;
    //return group_dict;
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }
  return group_list;
}