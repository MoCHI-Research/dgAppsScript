//Connection information needed to get into the backend database in Apps Script
const connection = getScriptSecret("SQL_CONNECTION_STRING");
const userPwd = getScriptSecret("SQL_PASSWORD");
const db = 'groups';
const user = 'root';
const db_name = Session.getActiveUser().getEmail()

const root = 'root';
const instanceUrl = 'jdbc:google:mysql://' + connection;

/**
 * Used to store secrets + things that might change depending on the environment. 
 * Edit secrets in the online Apps Script project settings
 */
function getScriptSecret(key) {
  let secret = PropertiesService.getScriptProperties().getProperty(key)
  if (!secret) throw Error(`No script property for${key}.`)
  return secret
}

/**
 * Authorizes and makes a request to the Google Drive API.
 */
function run() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://www.googleapis.com/drive/v3/files?pageSize=1';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    Logger.log(service.getLastError());
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  getService_().reset();
}

/**
 * Configures the service.
 */
function getService_() {
  return OAuth2.createService('GoogleDrive:' + USER_EMAIL)
      // Set the endpoint URL.
      .setTokenUrl('https://oauth2.googleapis.com/token')

      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(CLIENT_EMAIL)

      // Set the name of the user to impersonate. This will only work for
      // Google Apps for Work/EDU accounts whose admin has setup domain-wide
      // delegation:
      // https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority
      .setSubject(USER_EMAIL)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())

      // Set the scope. This must match one of the scopes configured during the
      // setup of domain-wide delegation.
      .setScope('https://www.googleapis.com/auth/drive');
}

/**
 * Backend functions
*/

//returns true if the group is archived and false otherwise
function is_in_archive (groupId, conn){
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  const find_owner = 'SELECT * FROM DriveGroups.Archive WHERE groupid = ' + groupId + ';'
  let find_this_owner = conn.createStatement();
 // find_this_user.setMaxRows(1000);
  const found = find_this_owner.executeQuery(find_owner)
  let truth_val = found.next()
  return (truth_val) //boolean result
}

function back_add_err_email(email, groupId, conn){
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  const insert_email = 'INSERT INTO DriveGroups.erroniousEmails (email, groupid) VALUES ( "'+ email 
  +'", "'+ groupId +'" );'
  let adder = conn.createStatement();
  adder.execute(insert_email)
}

function delete_err_email(email, groupId, conn){
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  const delete_email = 'DELETE from DriveGroups.erroniousEmails where email = "'+ email 
  +'" AND groupid = "'+ groupId +'";'
  let deleter = conn.createStatement();
  deleter.execute(delete_email)
  //conn.close()
}

function get_err_emails(groupId, conn){
  //  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  const get_emails = 'SELECT email FROM DriveGroups.erroniousEmails WHERE groupid = "'+ groupId +'";'
  let getter = conn.createStatement();
  var emails = getter.executeQuery(get_emails)
  let user_emails_res = []
  while (emails.next()) {
      //Logger.log(rowString);
      user_emails_res.push(emails.getString("email"))
    }
    emails.close();
    //conn.close();
    return user_emails_res;
}

function clear_err_emails(groupId, conn){
  //  const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  const clear_emails = 'DELETE FROM DriveGroups.erroniousEmails WHERE groupid = "'+ groupId +'";'
  let clearer = conn.createStatement();
  
  clearer.execute(clear_emails)
  clearer.close()
  //conn.close()
}

function is_owner(user_email, groupId, conn){
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  const find_owner = 'SELECT * FROM DriveGroups.Drive_Group WHERE owner = "' + user_email + '" and groupid = ' + groupId + ';'
  let find_this_owner = conn.createStatement();
 // find_this_user.setMaxRows(1000);
  const found = find_this_owner.executeQuery(find_owner)
  truth = found.next()
  //conn.close()
  return (truth) //boolean result
}

function back_create_new_group(group_id, group_name, emails, owner_email, parent_id, conn) {
  Logger.log(owner_email)
  //Establish new database connection, and insert new drive group into SQL database.
  //This is prerequisite for inserting into Group_User
  const stmt = conn.prepareStatement('INSERT INTO DriveGroups.Drive_Group values (?, ?, ?, ?, ?)');
  stmt.setInt(1, group_id);
  stmt.setString(2, group_name);
  stmt.setString(3, owner_email);
  stmt.setBoolean(4, false)
  stmt.setString(5, parent_id)
  stmt.execute();

  //insert users iteratively
  //const conn1 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  conn.setAutoCommit(false);

  /*Statement for inserting users into User iteratively if they are not there; 
  skip the current user if it is already in User.
  This is prerequisite for inserting into Group_User*/
  const stmt1 = conn.prepareStatement('INSERT IGNORE INTO User values (?)'); 
  //Statement for inserting into Group_User
  const stmt2 = conn.prepareStatement('INSERT INTO Group_User values (?,?,?,?)');

  //Add the users into statements
  for (let i = 0; i < emails.length; i++) {
    stmt1.setString(1, emails[i]);
    stmt1.addBatch();

    stmt2.setInt(1, group_id);
    stmt2.setString(2, emails[i]);
    if (emails[i] == owner_email) {
      stmt2.setBoolean(3, true);
    } else {
      stmt2.setBoolean(3, false);
    }
    stmt2.setBoolean(4, false)
    stmt2.addBatch();
  }

  //Execute the statements
  const batch1 = stmt1.executeBatch();
  const batch2 = stmt2.executeBatch();
  conn.commit();
}

/*Retrieves all users in the database that belong to a given group. (backend function)

  Parameters:
    group_id: the id of the group that the users are retrieved from
    conn1(Database Connection): connection to the database
    new_connection（Boolean): true if new connection is needed (when conn1 is set as default);
                              false otherwise, when conn1 is passed as an argument
  Returns(String Array): 
    a list of strings, each of which is an email address in the given group
    (None if error is caught)
*/
function back_retrieve_group_users(group_id, 
                                   conn,
                                   new_connection = true) { 
  var user_emails_res = [];
  try {
    //Get emails that belong to the group in the database based on integer group id
    query1 = "select user_email from Group_User where groupid = '" + group_id + "'";
    const sql_retrieve_users = conn.createStatement();
    sql_retrieve_users.setMaxRows(1000);

    //Retrieve users using the query statement
    const result2 = sql_retrieve_users.executeQuery(query1)
    const numCols = result2.getMetaData().getColumnCount();
    //Iteratively adds all emails to user_emails_res
    while (result2.next()) {
      //Logger.log(rowString);
      user_emails_res.push(result2.getString("user_email"))
    }
    result2.close();
    sql_retrieve_users.close();
    //If new connection was established, close it
    // if (new_connection) 
    //   conn1.close();

    //Return the list of user emails
    return user_emails_res;
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }
}

function back_retrieve_this_access (file_id, group_id, conn){
  const access_query = 'SELECT access FROM DriveGroups.Group_File_Access where groupid = "' + group_id +'" and fileid = "' + file_id +'";'
  //conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  const retrieve_access = conn.createStatement()
  retrieve_access.setMaxRows(1000)
  const the_access = retrieve_access.executeQuery(access_query)
  if (the_access.next()){
    var access_result = the_access.getString(1)
    //conn.close()
    return access_result
  }
  var access_result = "none"
  //conn.close()
  return access_result;
}

function back_retrieve_group_files(group_id, 
                                   conn,
                                   new_connection = true)
 {
      //Initialize result list                     
  var file_id_list = [];
  try {
    //Get file access information of the group in the database based on group id
    query_file = "select fileid from Group_File_Access where groupid = " + group_id;
    const sql_retrieve_files = conn.createStatement();
    sql_retrieve_files.setMaxRows(1000);
    //result3 stores access information of the group concerning all related files
    const result3 = sql_retrieve_files.executeQuery(query_file)
    //Iteratively adds all access information to file_id_list
    while (result3.next()) {
      var curr_file_id = result3.getString("fileid");
      file_id_list.push(curr_file_id)
    }

    result3.close();
    sql_retrieve_files.close();
    //If new connection was established, close it
    // if (new_connection) 
    //   conn.close();
    
    var parent_id = back_retrieve_parent_id(group_id, conn) // base case
    if (parent_id == 0) {
      return file_id_list
    }
    //Return result list
    full_file_access = file_id_list.concat(back_retrieve_group_access(parent_id, conn)) //recursively add parent access
    Logger.log(full_file_access)
    return full_file_access;
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }
 }
/*Retrieves all file access information in the database that belong to a group. (backend function)

  Parameters:
    group_id: the id of the group that the file access infos are retrieved from
    conn2(Database Connection): connection to the database
    new_connection(Boolean): true if new connection is needed (when conn1 is set as default);
                             false otherwise, when conn1 is passed as an argument
  Returns(Array Array): 
    a list of tuples. The first element of the tuple is the ID of a file;
    the second element is the given group's access level to that file
    (None if error is caught)
*/
function back_retrieve_group_access(group_id, 
                                   conn,
                                   new_connection = true) {
  //Initialize result list                     
  var file_access_res = [];
  try {
    //Get file access information of the group in the database based on group id
    query_file = "select fileid, access from Group_File_Access where groupid = " + group_id;
    const sql_retrieve_files = conn.createStatement();
    sql_retrieve_files.setMaxRows(1000);
    //result3 stores access information of the group concerning all related files
    const result3 = sql_retrieve_files.executeQuery(query_file)
    //Iteratively adds all access information to file_access_res
    while (result3.next()) {
      var curr_file_id = result3.getString("fileid");
      var curr_file_access = result3.getString("access")
      file_access_res.push([curr_file_id,curr_file_access])
    }

    result3.close();
    sql_retrieve_files.close();
    //If new connection was established, close it
    // if (new_connection) 
    //   conn.close();
    
    var parent_id = back_retrieve_parent_id(group_id, conn) // base case
    if (parent_id == 0) {
      return file_access_res
    }
    //Return result list
    full_file_access = file_access_res.concat(back_retrieve_group_access(parent_id, conn)) //recursively add parent access
    Logger.log(full_file_access)
    return full_file_access;
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }
}


/*Retrieves all access information about one given file in the database. (backend function)

  Parameters:
    file_id: the id of the file whose access infomation is retrieved
    conn2(Database Connection): connection to the database
    new_connection(Boolean): true if new connection is needed (when conn1 is set as default);
                             false otherwise, when conn1 is passed as an argument
  Returns(Array Array): 
    a list of tuples. The first element of the tuple is the ID of a group;
    the second element is that group's access level to the given file
    (None if error is caught)
*/
function back_retrieve_file_access(file_id, 
                                   conn,
                                   new_connection = true) {
  //Initialize result list    
  var group_access_res = [];

  try {
    //Get access information of the file in the database based on file id
    query_group = "select groupid, access from Group_File_Access where fileid = '" + file_id + "'";
    const sql_retrieve_groups = conn.createStatement();
    sql_retrieve_groups.setMaxRows(1000);
    //result3 stores access information of the file concerning all groups that have access
    const result3 = sql_retrieve_groups.executeQuery(query_group)
    //Iteratively adds all access information to result
    while (result3.next()) {
      var curr_group_id = result3.getString("groupid");
      var curr_group_access = result3.getString("access")
      if (is_in_archive(curr_group_id, conn) == false){
        group_access_res.push([curr_group_id,curr_group_access])
           children = get_child_groups(curr_group_id, conn)
           for (index in children){
              if(back_retrieve_this_access(file_id, children[index][0], conn) == "none"){
                  group_access_res.push([children[index][0], curr_group_access]) //if the child only has access via parents, show that they have parent's access
              }             
           }
      }
    }

    result3.close();
    sql_retrieve_groups.close();
    //If new connection was established, close it
    // if (new_connection) 
    //   conn2.close();
    
    //Return result list
    return group_access_res;
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }
}

//retrieves file access excluding inherited access
function back_retrieve_file_access_direct_only(file_id, 
                                   conn,
                                   new_connection = true) {
  //Initialize result list    
  var group_access_res = [];

  try {
    //Get access information of the file in the database based on file id
    query_group = "select groupid, access from Group_File_Access where fileid = '" + file_id + "'";
    const sql_retrieve_groups = conn.createStatement();
    sql_retrieve_groups.setMaxRows(1000);
    //result3 stores access information of the file concerning all groups that have access
    const result3 = sql_retrieve_groups.executeQuery(query_group)
    //Iteratively adds all access information to result
    while (result3.next()) {
      var curr_group_id = result3.getString("groupid");
      var curr_group_access = result3.getString("access")
      if (is_in_archive(curr_group_id, conn) == false){
        group_access_res.push([curr_group_id,curr_group_access])
      }
    }

    result3.close();
    sql_retrieve_groups.close();
    //If new connection was established, close it
    // if (new_connection) 
    //   conn2.close();
    
    //Return result list
    return group_access_res;
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }
}
/*Retrieves all groups in the database. (backend function)

  Returns(Group Array): a list of tuples containing [groupid, groupname]

*/
function back_retrieve_all_groups(conn) {
  //Initialize the list that saves existing groups
  var group_list = [];
  //var group_dict = {};

  try {
    //Gets the group IDs and names of all groups
    //console.time("retrieve")
    query = `select groupid, name, archived, parent_group_id from DriveGroups.Drive_Group where owner = "` + db_name +`"`;  
    //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
    const sql_retrieve_group = conn.createStatement();
    const result_all_groups = sql_retrieve_group.executeQuery(query);
    //console.timeEnd("retrieve")
    //For each group, first gets its group ID, then use group ID to retrieve information
    //from backend and build Group object
    while (result_all_groups.next()) {
      //console.time("group_list")
      var curr_group_id = result_all_groups.getString("groupid");
      var curr_group_name = result_all_groups.getString("name")
      var archived = result_all_groups.getBoolean("archived")
      var parentid = result_all_groups.getString("parent_group_id")
      if (archived == false){
        //group_list.push(back_retrieve_group(curr_group_id, "place holder"));
        group_list.push([curr_group_id, curr_group_name, parentid])
      } 
      //console.timeEnd("group_list")
      //group_dict[curr_group_id] = back_retrieve_group(curr_group_id);
    }
    sql_retrieve_group.close()
    //Close the database connection
    //conn.close()
    //Return list of groups
    return group_list;
    //return group_dict;
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }
  return group_list;
}

function back_retrieve_group_name(id,conn){
  try {
    //Get the name of the group based on group id from the database
    query =  `select name from DriveGroups.Drive_Group where groupid = "` + id +`"`;  
    const sql_retrieve_group = conn.createStatement();
    const result_groupid = sql_retrieve_group.executeQuery(query);
    result_groupid.next()
    //Save the group name to group_name_res
    group_name_res = result_groupid.getString("name");
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }
  return group_name_res
}

function back_retrieve_group(id, conn) {
  //Initialize things to return; will update in later parts of the function
  var group_name_res;
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  try {
    //Get the name of the group based on group id from the database
    query =  `select name from DriveGroups.Drive_Group where groupid = "` + id +`"`;  
    const sql_retrieve_group = conn.createStatement();
    const result_groupid = sql_retrieve_group.executeQuery(query);
    result_groupid.next()
    //Save the group name to group_name_res
    group_name_res = result_groupid.getString("name");
    //Save the group name to group_name_res 
    //Close database connection
    //conn.close()
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }

  //Getting file access and member emails of the group
  var user_emails_res = back_retrieve_group_users(id, conn);
  var file_access_res = back_retrieve_group_access(id, conn);

  //Get result as a Group object, with information retrieved
  let result_group = new Group(name = group_name_res, id = id, users = user_emails_res, fileAccess =file_access_res)

  //Return the result
  return result_group
}

function get_child_groups(groupId, conn) {
  let statement = conn.createStatement()
  //Logger.log(groupId)
  var get_children = 'SELECT groupid, name FROM DriveGroups.Drive_Group WHERE parent_group_id = "'+ groupId +'";'
  //Logger.log(get_children)
  let direct_children = statement.executeQuery(get_children)
  var children = []
  if (direct_children.next() == false) {
    return children
  }
  let child = direct_children.getString(1)
  let child_name = direct_children.getString(2)
  //Logger.log(child)
  children.push([child, child_name])
  children_of_child = get_child_groups(child, conn)
  if (children_of_child != null){
    var children = children.concat(children_of_child)
  }
  while(direct_children.next() != false){
      let child = direct_children.getString(1)
      let child_name = direct_children.getString(2)
      //Logger.log(child)
      children.push([child, child_name])
      children_of_child = get_child_groups(child, conn)
      if (children_of_child != null){
        var children = children.concat(children_of_child)
      }
  }
  return children
}


/*Adds a user a group in the database. (backend function)

  Parameters: 
    group_id: the id of the group the user is considered in
    email(String): the email of the user
*/
function back_add_user(group_id, email, conn) {
  //Statement to add user email to User; this is prerequisite for adding into Group_User
  const sql_get_name = 'SELECT name FROM DriveGroups.Drive_Group WHERE groupid = "'+ group_id +'";'
  const sql_add_user = `INSERT IGNORE INTO DriveGroups.User VALUES ("`+ email+`")`;
  //Statement to add user email to Group_User
  //Create and execute the statements
  //console.time("start conn")
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  //console.timeEnd("start conn")
  let statement3 = conn.createStatement()
  let name_getter = statement3.executeQuery(sql_get_name)
  var name = name_getter.next()

  const sql_add_user_group_relationship = `INSERT INTO DriveGroups.Group_User VALUES (`+ group_id + `,"` + email + `",  false, "`+ name +`" );`
  
  try {
    statement3.execute(sql_add_user)
    statement3.execute(sql_add_user_group_relationship)
  } catch (err){
    Logger.log("user probably already exists")
  }
  
  //Close the database connection
  //conn.close();
}

function back_set_subgroup(parent_id, child_id, conn ){
  const set_subgroup = 'UPDATE DriveGroups.Drive_Group SET parent_group_id = "'+ parent_id + '" WHERE groupid = "'+ child_id +'";'
  let statement = conn.createStatement()
  statement.execute(set_subgroup)
}

function back_retrieve_parent_id(child_id, conn){
  var get_parent = 'SELECT parent_group_id FROM DriveGroups.Drive_Group WHERE groupid = "'+ child_id +'";'
  let statement = conn.createStatement()
  let parent_id_getter = statement.executeQuery(get_parent)
  
  let parent_id = 0
  parent_id_getter.next()
  if (parent_id_getter.getString("parent_group_id") != "none"){
    parent_id = parent_id_getter.getString("parent_group_id")
  } 
  return parent_id
}

function back_delete_file(file_id, conn){
  const sql_code_to_delete_file = 'DELETE FROM DriveGroups.File WHERE fileid = "' + file_id + '";'
  //conn2 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let query_to_call = conn.createStatement()
  query_to_call.setMaxRows(1000)
  query_to_call.execute(sql_code_to_delete_file)
 // conn2.close()
}
function back_delete_file_if_needed(file_id, conn){
  const find_file = 'SELECT * FROM DriveGroups.Group_File_Access where fileid = "' + file_id + '";'
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let find_this_file = conn.createStatement();
  find_this_file.setMaxRows(1000);
  const found = find_this_file.executeQuery(find_file)
  if (found.next() == false){
    back_delete_file(file_id, conn)
  }
  //conn1.close()
}

/*Revoke the access of a group to a file in the backend.
  The group will no longer have any access to the file (backend function)

  Parameters:
    group_id: the ID of the specified group whose access is revoked
    file_id(String): the ID of the specified file to which the access is revoked
*/
function back_revoke_access(group_id, file_id, conn) {
  users_in_group = back_retrieve_group_users(group_id, 
                                   conn,
                                   new_connection = true)
  revoke_access_deleted_file(group_id, file_id, conn, users_in_group) //actually revoke access
  //Statement to remove the access
  const sql_delete_user_group_relationship = `DELETE FROM DriveGroups.Group_File_Access where groupid = "`+ group_id + `" and fileid = "` + file_id + `";`;
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  let statement = conn.createStatement()
  //Execute the statement
  statement.execute(sql_delete_user_group_relationship)
  //close the database connection
  //back_delete_file_if_needed(file_id, conn)
  //conn.close();
}

function back_delete_user(email, conn){
  const sql_code_to_delete_user = 'DELETE FROM DriveGroups.User WHERE user_email = "' + email + '";'
  //conn2 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let query_to_call = conn.createStatement()
  query_to_call.setMaxRows(1000)
  query_to_call.execute(sql_code_to_delete_user)
  //conn2.close()
}
function back_delete_user_if_needed(email, conn){
  //is the user in another group?
  const find_user = 'SELECT * FROM DriveGroups.Group_User where user_email = "' + email + '";'
  //const conn1 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  let find_this_user = conn.createStatement();
  find_this_user.setMaxRows(1000);
  const found = find_this_user.executeQuery(find_user)
  if (found.next() == false){
    back_delete_user(email, conn)
  }
  //conn1.close()
}

/*Removes a user from a group in the database. (backend function)

  Parameters: group_id: the id of the group to remove the user from
              email(String): the email of the user to remove
*/
function back_remove_user(group_id, email, conn) {
  //The statement to delete user from a group
  const sql_delete_user_group_relationship = `DELETE FROM DriveGroups.Group_User where groupid = "`+ group_id + `" and user_email = "` + email + `";`
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  let statement4 = conn.createStatement()
  //Execute the statement
  let result4 = statement4.execute(sql_delete_user_group_relationship)
  back_delete_user_if_needed(email, conn)
  //Close the databse connection
  //conn.close();
}

/*Removes a group in the database. (backend function)

  Parameters: group_id: the id of the group to remove
*/
function back_delete_group(group_id, name, conn){
  /*First removes all users from the group,
    then removes all access information of the group,
    and finally removes the group from the database.
  */
  //let users_just_deleted_with_group = back_retrieve_group_users(group_id, 
  //                                 conn1 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd),
  //                                 new_connection = true)
  //let files_just_deleted_with_group = back_retrieve_group_access(group_id, 
  //                                 conn2 = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd),
  //                                 new_connection = true)
 // let name = "place holder" 
  //const enable_scheduling = 'SET GLOBAL event_scheduler = ON;'                              
  const add_to_archive = 'INSERT INTO DriveGroups.Archive (groupid, name, owner) VALUES ("'+ group_id + '", "'+ name + '", "'+ db_name + '");'
  const update_to_archived = 'UPDATE DriveGroups.Drive_Group SET archived = true WHERE groupid = "'+ group_id +'";'
  const sql_delete_user_group_relationship = `CREATE EVENT IF NOT EXISTS user_group_delete` + group_id + ` ON 
                                              SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 12 HOUR
                                              DO
                                              DELETE FROM DriveGroups.Group_User where groupid = "`+ group_id + `";`;
  const sql_delete_file_group_relationship = `CREATE EVENT IF NOT EXISTS file_group_delete` + group_id + ` ON 
                                              SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 12 HOUR
                                              DO
                                              DELETE FROM DriveGroups.Group_File_Access where groupid = "` + group_id + `";`;
  const sql_delete_group= `CREATE EVENT IF NOT EXISTS group_delete` + group_id + ` ON 
                           SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 13 HOUR
                           DO
                           DELETE FROM DriveGroups.Drive_Group where groupid = "` + group_id + `";`;
  const sql_delete_from_archive = `CREATE EVENT IF NOT EXISTS archive_delete` + group_id + ` ON 
                                    SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 12 HOUR
                                    DO
                                    DELETE FROM DriveGroups.Archive where groupid = "` + group_id + `";`;
  //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
  let statement = conn.createStatement()
  //Execute the statements
  statement.execute(update_to_archived);
  statement.execute(add_to_archive);
  statement.execute(sql_delete_user_group_relationship);
  statement.execute(sql_delete_file_group_relationship);
  statement.execute(sql_delete_group);
  statement.execute(sql_delete_from_archive);
  // for (i = 0; i < users_just_deleted_with_group.length; i++){
  //   back_delete_user_if_needed(users_just_deleted_with_group[i])
  // }
  // for (k = 0; k < files_just_deleted_with_group.length; k++){
  //   back_delete_file_if_needed(files_just_deleted_with_group[k][0])
  // }
  //Close the database connection
  //conn.close();

}

/*Grants file access to a group. (backend function)

  Parameters: 
    groupid: the integer id of the group
    fileid(String): the id of the file
    access(String): "none", "view", "comment", or "edit"; the level of the access the group has
                    to the file.
*/
function back_grant_file_access(groupid, fileid, access, conn){
  try {
    //First insert file to File if it is not there; this is prerequisite for adding into Group_File_Access
    var update_insert1 = `INSERT IGNORE INTO DriveGroups.File VALUES ("` + fileid + `");`;
    //Statement to insert into Group_File_Access
    var update_insert2 = `INSERT INTO DriveGroups.Group_File_Access VALUES (` + groupid + `,"` + fileid + `", "` + access + `");`;
    //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
    const sql_insert_file_access = conn.createStatement();

    //Execute the statements
    const result_file_access1 = sql_insert_file_access.execute(update_insert1);
    const result_file_access2 = sql_insert_file_access.execute(update_insert2);

    //Close database connection
    //conn.close();
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }
}


function back_update_access(groupid, fileid, access, conn){
 // try {
      //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
      const query1 = 'SELECT access FROM DriveGroups.Group_File_Access WHERE groupid = '+ groupid +' AND fileid = "' + fileid + '";';
      const the_statement = conn.createStatement()
      var res = the_statement.executeQuery(query1)

      if (res.next()){ // if this access is already direct, change it
        const stmt1 = conn.prepareStatement('UPDATE DriveGroups.Group_File_Access SET access = ? WHERE groupid = ? and fileid = ?');
        stmt1.setString(1, access);
        stmt1.setString(2, groupid);
        stmt1.setString(3, fileid)
        stmt1.execute();
      } else { //if this was only inherited add direct access
        const stmt2 = conn.prepareStatement('INSERT INTO DriveGroups.Group_File_Access (access, groupid, fileid) VALUES ( "'+ access +'", "'+ groupid +'", "'+ fileid +'" );')
        stmt2.execute()
      }
      //conn.close();
 // } catch (err){
  //  Logger.log('Failed with an error %s', err.message);

 // }
}

/*Retrieves from the database all groups a user is in. (backend function)
  Parameters: user_email: the email of the user
  Returns: a list of all groups (group objects) that the user with the specified email is in.
*/
function back_retrieve_group_list_by_user_email(user_email, conn){
  var group_id_list = [];
  var group_list = [];
  try {
    //Retrieves all groups that includes the email.
    query_email = `select groupid, name from Group_User where user_email = "` + user_email +`";`;
    //const conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd);
    const sql_retrieve_group_id_list = conn.createStatement();
    sql_retrieve_group_id_list.setMaxRows(1000);
    //Result contains all groups that the user is in.
    const result = sql_retrieve_group_id_list.executeQuery(query_email)
    while (result.next()) {
      console.time("group_list_e")
      var curr_group_id = result.getString("groupid");
      var curr_group_name = result.getString("name")
      if (is_in_archive(curr_group_id, conn) == false){ //we should get rid of this
        //group_list.push(back_retrieve_group(curr_group_id, "place holder"));
        group_list.push([curr_group_id, curr_group_name])
      } 
      console.timeEnd("group_list_e")
      //group_dict[curr_group_id] = back_retrieve_group(curr_group_id);
    }
    result.close();
    sql_retrieve_group_id_list.close();
    //conn.close()
  } catch (err){
    Logger.log('Failed with an error %s', err.message);
  }

  /*For each group id, retrieves its information from database, 
                       constructs new group object based on information,
                       and adds the object to group_list.*/
  // for (id in group_id_list){
  //   let newGroup = back_retrieve_group(id, "place holder");
  //   group_list.push(newGroup)
  // }

  return group_list

}
