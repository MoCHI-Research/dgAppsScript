function createTrigger_(funcName,minutes){
// Delete already created triggers if any.
deleteTriggers_();
  ScriptApp.newTrigger(funcName).timeBased()
    .everyMinutes(minutes).create();
}
/**
 * Create a request body of batch requests and request it.
 * 
 * @param {Object} object Object for creating request body of batch requests.
 * @returns {Object} UrlFetchApp.HTTPResponse
 */
function batchRequests(object) {
  const { batchPath, requests } = object;
  const boundary = "sampleBoundary12345";
  const lb = "\r\n";
  const payload = requests.reduce((r, e, i, a) => {
    r += `Content-Type: application/http${lb}`;
    r += `Content-ID: ${i + 1}${lb}${lb}`;
    r += `${e.method} ${e.endpoint}${lb}`;
    r += e.requestBody ? `Content-Type: application/json; charset=utf-8" ${lb}${lb}` : lb;
    r += e.requestBody ? `${JSON.stringify(e.requestBody)}${lb}` : "";
    r += `--${boundary}${i == a.length - 1 ? "--" : ""}${lb}`;
    return r;
  }, `--${boundary}${lb}`);
  const params = {
    muteHttpExceptions: true,
    method: "post",
    contentType: `multipart/mixed; boundary=${boundary}`,
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload,
  };
  return UrlFetchApp.fetch(`https://www.googleapis.com/${batchPath}`, params);
}

function batch_share_edit(fileIdList, emailList) {
    if(fileIdList.length == 0){
    return
  }
     if(emailList.length == 0){
    return
  }
  const requests = fileIdList.flatMap((id) => 
  emailList.map(emailAddress => ({
      method: "POST",
      endpoint: `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      requestBody: { role: "writer", type: "user", emailAddress }
    }))
  
  );
  
  const object = { batchPath: "batch/drive/v3", requests }; //creates batch
  const res = batchRequests(object);    //requests batch
  if (res.getResponseCode() != 200) {
    throw new Error(res.getContentText());
  }
}

function batch_share_comment(fileIdList, emailList) {
    if(fileIdList.length == 0){
    return
  }
     if(emailList.length == 0){
    return
  }
  const requests = fileIdList.flatMap((id) => 
  emailList.map(emailAddress => ({
      method: "POST",
      endpoint: `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      requestBody: { role: "commenter", type: "user", emailAddress }
    }))
  
  );
  
  const object = { batchPath: "batch/drive/v3", requests }; //creates batch
  const res = batchRequests(object);    //requests batch
  if (res.getResponseCode() != 200) {
    throw new Error(res.getContentText());
  }
}

function batch_share_view(fileIdList, emailList) {
    if(fileIdList.length == 0){
    return
  }
   if(emailList.length == 0){
    return
  }
  const requests = fileIdList.flatMap((id) => 
  emailList.map(emailAddress => ({
      method: "POST",
      endpoint: `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      requestBody: { role: "reader", type: "user", emailAddress }
    }))
  
  );
  
  const object = { batchPath: "batch/drive/v3", requests }; //creates batch
  const res = batchRequests(object);    //requests batch
  if (res.getResponseCode() != 200) {
    throw new Error(res.getContentText());
  }
}

function batch_remove_access(fileIdList, emailList) {
    if(fileIdList.length == 0){
    return
  }
     if(emailList.length == 0){
    return
  }
  const permissionList = emailList.flatMap((email) =>
      Drive.Permissions.getIdForEmail(email)
  );

  const requests = permissionList.flatMap(({id}) => 
  fileIdList.map(fileId => ({
      method: "DELETE",
      endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${id}`,
      requestBody: {}
    }))
  );
   //Logger.log(requests)
  
  const object = { batchPath: "batch/drive/v3", requests }; //creates batch
  const res = batchRequests(object);    //requests batch
  if (res.getResponseCode() != 200) {
    throw new Error(res.getContentText());
  }
}

function batch_share_edit_test() {
  const folderId = "1UFzFVJS30e9eWJMXyRFIO4m5gWOMGBpf";
  const emails = ["iizydorc@hamilton.edu", "irisizydorczak@gmail.com"]; // set sharing users


  const list = Drive.Files.list({ q: `'${folderId}' in parents and trashed = false`, fields: "items(id,title)" }).items;

  const requests = list.map(({id}) => 
  emails.map(emailAddress => ({
      method: "POST",
      endpoint: `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      requestBody: { role: "commenter", type: "user", emailAddress }
    }))
  
  );
  
  const object = { batchPath: "batch/drive/v3", requests }; //creates batch
  const res = batchRequests(object);    //requests batch
  if (res.getResponseCode() != 200) {
    throw new Error(res.getContentText());
  }
}

