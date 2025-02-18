//NOTE: Currently this file is not used
/**************************************************************************************/

// Replace the variables in this block with real values.
// You can find the "Instance connection name" in the Google Cloud
//   Platform Console, on the instance Overview page.

// referenece to execute SQL : https://developers.google.com/apps-script/guides/jdbc

let groupid_iter = 0;
let userid_iter = 0;
/**
 * Initializes the connection and connects to the database
 */

const sql_create_owner = 'CREATE TABLE Owner ( ownerid int, name varchar(40), email varchar(40), PRIMARY KEY(ownerid))'
const sql_create_drive_group = 'CREATE TABLE Drive_Group ( groupid int, name varchar(40),  ownerid int, PRIMARY KEY(ownerid, groupid), FOREIGN KEY(ownerid) REFERENCES Owner(ownerid))'
const sql_create_user = 'CREATE TABLE User (userid int, name varchar(40), email varchar(40), PRIMARY KEY(userid))'
const sql_create_file = 'CREATE TABLE File (fileid int, name varchar(40), link varchar(100),PRIMARY KEY(fileid))'
const sql_create_permission = 'CREATE TABLE Permission (pid int, edit enum(‘True’,’False’), comment: enum(‘True’,’False’), view: enum(‘True’,’False’),PRIMARY KEY(pid))'
const sql_create_filetype = 'CREATE TABLE FileType (ftid int, doc enum(‘True’,’False’), sheet enum(‘True’,’False’), slide enum(‘True’,’False’), folder enum(‘True’,’False’), other enum(‘True’,’False’),PRIMARY KEY(ftid))'
const sql_create_owns = 'CREATE TABLE Owns (groupid int, ownerid int NOT NULL, PRIMARY KEY (groupid), FOREIGN KEY (groupid) REFERENCES Drive_Group(groupid),FOREIGN KEY (ownerid) REFERENCES Owner(ownerid))'
const sql_create_has_user = 'CREATE TABLE Has_User (groupid int, userid int, PRIMARY KEY (groupid, userid), FOREIGN KEY (groupid) REFERENCES Drive_Group(groupid),FOREIGN KEY (userid) REFERENCES User(userid))'
const sql_create_can = 'CREATE TABLE Can (fileid int, pid int NOT NULL,PRIMARY KEY (fileid), FOREIGN KEY (fileid) REFERENCES File(fileid),FOREIGN KEY (pid) REFERENCES Permission(pid))'
const sql_create_filetype_ref = 'CREATE TABLE FileType_Ref (fileid int, ftid int, PRIMARY KEY (fileid), FOREIGN KEY (fileid) REFERENCES File(fileid), FOREIGN KEY (ftid) REFERENCES FileType(ftid))'



/*Note: Below are attempts to initialize or update user information into the backend database;
        might not work with the latest version of DriveGroups. */

function initialize() {
  const conn = Jdbc.getCloudSqlConnection(instanceUrl, root, userPwd);
  Logger.log(conn)
  var group_id1 = 1
  const name1 = "Esme's HCI"
  var owner_id1 = 1
  const sql_insert_new_group = `INSERT INTO DriveGroups.DriveGroup VALUES ( ?, ?, ?)`;
  const stmt = conn.prepareStatement('INSERT INTO DriveGroups.DriveGroup VALUES (?,?,?)');
  stmt.setString(1, group_id1);
  stmt.setString(2, name1);
  stmt.setString(3, owner_id1);
  let result = stmt.execute(sql_insert_new_group)
  Logger.log(result)
//createStatement(); executesql();
}


function sql_template(){
  try {
    const conn = Jdbc.getCloudSqlConnection(instanceUrl, root, userPwd);
    var group_id1 = 1
    const name1 = "Esme's HCI"
    var owner_id1 = "zl2792@barnard.edu"
    const stmt = conn.prepareStatement('INSERT INTO Owner ' +
      'values (?, ?, ?)');
    stmt.setString(1, group_id1);
    stmt.setString(2, name1);
    stmt.setString(3, owner_id1);
    stmt.execute();
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }
}
/**************************************************************************************/
