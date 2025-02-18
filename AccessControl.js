//Adjusts Google Drive file settings
//Ref: https://developers.google.com/apps-script/reference/drive/file#removeEditor(String)

//Using the information from the backend this function actually shares a file with users in a group at 
//the access level of the check_box input.
 //Note this works for files only. DriveApp does have functions that add folders but they are not implemented here yet.
function grant_access_new_file(groupId, fileId, checkbox_input){ 
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var users = back_retrieve_group_users(groupId, 
                                      conn,
                                      new_connection = true);
  conn.close()

  //var this_file = DriveApp.getFileById(fileId)
    if ( checkbox_input == "view"){
      batch_share_view([fileId], users)
    }
    if ( checkbox_input == "comment"){
      batch_share_comment([fileId], users)
    }
    if ( checkbox_input == "edit"){
      batch_share_edit([fileId], users)
    } 
}

function grant_access_new_files(groupId, fileIds, checkbox_input, conn){ 
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var users = back_retrieve_group_users(groupId, 
                                      conn,
                                      new_connection = true);
  //conn.close()

  //var this_file = DriveApp.getFileById(fileId)
    if ( checkbox_input == "view"){
      batch_share_view(fileIds, users)
    }
    if ( checkbox_input == "comment"){
      batch_share_comment(fileIds, users)
    }
    if ( checkbox_input == "edit"){
      batch_share_edit(fileIds, users)
    } 
}


function add_good_emails(groupId, emails, conn, blank){
  var group_access = back_retrieve_group_access(groupId, 
                                              conn,
                                              new_connection = true)
  var to_view = []
  var to_comment = []
  var to_edit = []
  for (i = 0; i < group_access.length; i++){
    var fileId = group_access[i][0]
    var checkbox_input = group_access[i][1]
    //var this_file = DriveApp.getFileById(fileId)
    if ( checkbox_input == "view"){
      to_view.push(fileId)
    }
    if ( checkbox_input == "comment"){
      to_comment.push(fileId)
    }
    if ( checkbox_input == "edit"){
      to_edit.push(fileId)
    } 
  }
  batch_share_view(to_view, emails)
  batch_share_comment(to_comment, emails)
  batch_share_edit(to_edit, emails)
}

//grants a new user access to all files in the group
function grant_access_new_user(groupId, user_email, conn){ 
  //conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var group_access = back_retrieve_group_access(groupId, 
                                                conn,
                                                new_connection = true)
  if (group_access == null){
    return
  }
    //conn.close()
  files_to_view = []
  files_to_edit = []
  files_to_comment = []
  for (i = 0; i < group_access.length; i++){
    var fileId = group_access[i][0]
    var checkbox_input = group_access[i][1]
    //var this_file = DriveApp.getFileById(fileId)
      if ( checkbox_input == "view"){
        files_to_view.push(fileId)
      }
      if ( checkbox_input == "comment"){
        files_to_comment.push(fileId)
      }
      if ( checkbox_input == "edit"){
        files_to_edit.push(fileId)
      }  
  }
  batch_share_comment(files_to_comment, [user_email])
  batch_share_edit(files_to_edit, [user_email])
  batch_share_view(files_to_view, [user_email])
}

function help_new_access_none(this_file, user_email){
  try{
  this_file.revokePermissions(user_email)
  } catch (err) {
    Logger.log("error the user probably already lacked access")
  }
}

function help_new_access_view(this_file, old_access, user_email){
  Logger.log(user_email)
  try{
    if (old_access == "edit"){
      this_file.removeEditor(user_email)
    }
  if (old_access == "comment"){
      this_file.removeCommenter(user_email)
    }
  } catch (err){ 
    Logger.log("user does not have previous access")
  }  
  this_file.addViewer(user_email)
}

function help_new_access_comment(this_file, old_access, user_email){
  if (old_access == "edit"){
        this_file.removeEditor(user_email)
      }
  this_file.addCommenter(user_email) 
}

function remove_access_deleted_user(user_email, groupId, conn, group_access){
  remove_access_deleted_user_helper(user_email, groupId, conn, group_access)
  var children = get_child_groups(groupId, conn)
  for (index in children){
    var group_access = back_retrieve_group_access(children[index][0], 
                                               conn,
                                               new_connection = false)
    back_remove_user(children[index][0], user_email, conn)
    remove_access_deleted_user_helper(user_email, children[index][0], conn, group_access)
  }
}
//removes a user's access to files in a group, this should be called when the user is removed from the group but before
//the user is removed from the table in the backend.
function remove_access_deleted_user_helper(user_email, groupId, conn, group_access){
  //conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)

  var i = 0
  var go_to_none = []
  var newly_comment = []
  var newly_view = []
  var newly_edit = []
  while (i < group_access.length){
    Logger.log("first i: ")
    Logger.log(i)
    var fileId = group_access[i][0]
    var this_access = group_access[i][1]
    Logger.log(this_access)
    var new_access = retrieve_highest_other_access(groupId, group_access[i][0], user_email, conn)
    if (new_access != "edit"){
      go_to_none.push(fileId)
      if (new_access == "comment"){ 
        newly_comment.push(fileId)
        // help_new_access_comment(this_file, this_access, user_email)
      }
      else if (new_access == "view"){ 
        newly_view.push(fileId)
        // help_new_access_view(this_file, this_access, user_email)
      } // note if the highest other access is edit we do not need to revoke any access    
    }
    i = i + 1
  }
  batch_remove_access(go_to_none, [user_email])
  batch_share_comment(newly_comment, [user_email])
  // batch_share_edit(newly_edit, [user_email])
  batch_share_view(newly_view, [user_email])
  //conn.close()
}

//finds all groups apart from initial group that contain the user and have access to the file,
// then the function returns the highest level of access this user has apart from its access in the group parameter
function retrieve_highest_other_access(groupId, fileId, user_email, conn){
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var groups_with_access = back_retrieve_file_access_direct_only (fileId, //excludes groups with inherited access
                                   conn,
                                   new_connection = true)
  let highest_access = "none"
  for (i = 0; i < groups_with_access.length; i++){
    var users_in_this_group = back_retrieve_group_users(groups_with_access[i][0], 
                                   conn,
                                   new_connection = true)
    var access = groups_with_access[i][1]
    if (groups_with_access[i][0] != groupId && users_in_this_group.indexOf(user_email) != -1) { //if it is a different group and the  user is in it
       if (access == "edit"){
         return "edit"
         }
        else if (access == "comment"){
          highest_access = "comment"
        } 
        else if (access == "view" && highest_access == "none"){
          Logger.log("hi mom")
          highest_access = "view"
        } else {
          Logger.log("something happened")
          Logger.log(access)
          Logger.log("highest_access: ")
          Logger.log(highest_access)
        }
    }
  }
  Logger.log(highest_access)
  //conn.close()
  return highest_access
}
// function collect_lists_to_share(group_id, file_ids, conn, users_in_group){
//   var newly_viewers = []
//   var newly_commenters = []
//   var newly_editors = []
//   console.time("forloop")
//   for (index in users_in_group){
//     var user_email = users_in_group[index]
//     Logger.log(index + user_email)
//     if (is_owner(user_email, group_id, conn) == false){
//       var new_access = retrieve_highest_other_access(group_id, file_id, user_email, conn)
//       //var this_access = back_retrieve_this_access (file_id, group_id, conn)
//         if (new_access != "none"){
//           if (new_access == "edit"){
//             newly_editors.push(user_email)   
//             Logger.log("new editor")
//           }
//           else if (new_access == "comment"){ 
//             newly_commenters.push(user_email)
//             Logger.log("new commentor")
//           }
//           else if (new_access == "view"){ 
//             newly_viewers.push(user_email)
//             Logger.log("new viewer")
//           } // note if the highest other access is edit we do not need to revoke any access    
//         }
//     }
//   }
//   console.timeEnd("forloop")
//   console.time("sharing")
//  // batch_remove_access([file_id], all_emails)
//   if (newly_viewers.length != 0){
//     batch_share_view([file_id], newly_viewers)
//   } 
//   if (newly_commenters.length != 0){
//     batch_share_comment([file_id], newly_commenters)
//   }
//   if (newly_editors.length != 0){
//     batch_share_edit([file_id], newly_editors)
//   }
//   console.timeEnd("sharing")
// }

function revoke_access_deleted_file(group_id, file_id, conn, users_in_group) {
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //var this_file = DriveApp.getFileById(file_id)
  let file = DriveApp.getFileById(file_id)
  var newly_viewers = []
  var newly_commenters = []
  var newly_editors = []
  var all_emails = []
  console.time("forloop")
  for (index in users_in_group){
    var user_email = users_in_group[index]
    all_emails.push(user_email)
    Logger.log(index + user_email)
    if (is_owner(user_email, group_id, conn) == false){
      file.revokePermissions(user_email)
      var new_access = retrieve_highest_other_access(group_id, file_id, user_email, conn)
      //var this_access = back_retrieve_this_access (file_id, group_id, conn)
        if (new_access != "none"){
          if (new_access == "edit"){
            newly_editors.push(user_email)   
            Logger.log("new editor")
          }
          else if (new_access == "comment"){ 
            newly_commenters.push(user_email)
            Logger.log("new commentor")
          }
          else if (new_access == "view"){ 
            newly_viewers.push(user_email)
            Logger.log("new viewer")
          } // note if the highest other access is edit we do not need to revoke any access    
        }
    }
  }
  console.timeEnd("forloop")
  console.time("sharing")
 // batch_remove_access([file_id], all_emails)
  if (newly_viewers.length != 0){
    batch_share_view([file_id], newly_viewers)
  } 
  if (newly_commenters.length != 0){
    batch_share_comment([file_id], newly_commenters)
  }
  if (newly_editors.length != 0){
    batch_share_edit([file_id], newly_editors)
  }
  console.timeEnd("sharing")
  //conn.close()
}
  
function higher_access_is(this_access, highest_other_access){
  if (highest_other_access == "none" || highest_other_access == this_access){
    return this_access
  }
  if (highest_other_access == "edit"){
    return highest_other_access
  }
  if (highest_other_access == "comment"){
    if (this_access == "edit"){
      return this_access
    } else {
      return highest_other_access
    }
  }
  if (highest_other_access == "view") {
    if (this_access == "none"){
      return highest_other_access
    } else {
      return this_access
    }
  }
}

function change_access_changed_file(group_id, file_id, new_access, conn){ //note to change: Iris
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  users_in_group = back_retrieve_group_users(group_id, 
                                   conn,
                                   new_connection = true)
  let i = 0
  var this_access = back_retrieve_this_access(file_id, group_id, conn)
  Logger.log("this access: " + this_access)
  var go_to_none = []
  var newly_commenters = []
  var newly_viewers = []
  var newly_editors = []
  while (i < users_in_group.length){
    let user_email = users_in_group[i]
    
    if (is_owner(user_email, group_id, conn) == false){
      var highest_other_access = retrieve_highest_other_access(group_id, file_id, user_email, conn)
      var old_access = higher_access_is(this_access, highest_other_access)
      var access_to_be = higher_access_is(new_access, highest_other_access)
      if (access_to_be != old_access) { // if the access we need is a new one
         if (access_to_be != higher_access_is(access_to_be, old_access)) { //if the new_access is lower than the old access
           go_to_none.push(user_email)
         }
          // help_new_access_none(this_file, user_email)
         if (access_to_be == "view") {   
          newly_viewers.push(user_email)     
          // help_new_access_view(this_file, old_access, user_email)       
        } else if (access_to_be == "comment") {  
          newly_commenters.push(user_email)
          // help_new_access_comment (this_file, old_access, user_email)
        } else if (access_to_be == "edit" && old_access != "edit") {
          newly_editors.push(user_email)
          // this_file.addEditor(user_email)
        }
    }
    }
    i++
  }
  batch_remove_access([file_id], go_to_none)
  batch_share_comment([file_id], newly_commenters)
  batch_share_edit([file_id], newly_editors)
  batch_share_view([file_id], newly_viewers)
  //conn.close()
}

//removes access to all files from all users in the group
//!!!!!!NOTE: this may be effected by how we get the owner of the group
function remove_access_deleted_group(groupId, conn){
 // const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  console.time("retrieve info")
  var users_in_this_group = back_retrieve_group_users(groupId,
                                   conn,
                                   new_connection = true)
  var group_access = back_retrieve_group_access(groupId, 
                                              conn,
                                              new_connection = true)
  console.timeEnd("retrieve info")
  console.time("file share loop")
  for (i in group_access){
    Logger.log("i" + i)
    var fileId = group_access[i][0]
    var fileAccess = group_access[i][1]
      try {
        revoke_access_deleted_file(groupId, fileId, conn, users_in_this_group)
      } catch (err){
        Logger.log("error deleting group: \n")
        Logger.log(err)
      }
  }
  console.timeEnd("file share loop")
}

