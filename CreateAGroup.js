/**************************************************************************************/
//CreateAGroup.gs
//page 3
//Overview: 
//Functions In Use:
//  choose_creation_type()
//  goToCreateAGroup()
//  requestNewGroupUsers()
//  chooseParentGroup()
//  generate_group_id()
/**************************************************************************************/

const goTorequestNewGroupUsers = CardService.newAction().setFunctionName('requestNewGroupUsers');
//Prompts the user to choose whether to create a subgroup or a regular group
//returns: the built card
function choose_creation_type(){
  let card = CardService.newCardBuilder()
  .setHeader(
        CardService.newCardHeader()
          .setTitle("Choose a method for creating your group: "))
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))
                        .setBackgroundColor(button_color1)))
  card.setDisplayStyle(CardService.DisplayStyle.PEEK)
  card.addSection(CardService.newCardSection()
      // .addWidget(CardService.newTextParagraph().setText("Choose a method for creating your group: "))
        .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton().setText("Create a group from scratch")
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor(button_color2)
          .setOnClickAction(CardService.newAction()
                  .setFunctionName('goToCreateAGroup')
                  .setParameters({'copy_from': '2'}) //2 for false bc 0 creates an error as it reads that as null
                  .setParameters({'group_id_from': 'none'})
                  .setParameters({'from_name': 'none'}))
          )       
        .addButton(CardService.newTextButton()
          .setText("Create a subgroup")
          .setBackgroundColor(button_color2)
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOnClickAction(CardService.newAction()
              .setFunctionName('chooseParentGroup'))
          )
        ))
  return card.build()
}

/*Goes to the page(card) for creating a new group and lets the user name the group
  Returns(Action Response): 
    An action response object that pushes a card for creating the new group
*/
function goToCreateAGroup(e) {
  const copy_from = e['parameters']['copy_from'] //'1' for true and '2' for false (because 0 throws an error)
  const group_id_from = e['parameters']['group_id_from'] //'none' if this is a nonsubgroup or parentid if this is a subgroup
  const from_name = e['parameters']['from_name'] //name of parent group if applicable
  let group_entree_box = CardService.newTextInput() 
        .setFieldName('new_group_name')
  let card = CardService.newCardBuilder()
  card
  //Set card name for navigation and add home button footer
  .setName("Create a group")
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  if(copy_from == '1'){
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('<font color=\'#0000FF\'>CREATE A SUBGROUP OF ' + from_name.toUpperCase() + '</font>')
    )
    group_entree_box.setTitle("SubGroup Name")
  } else {
    card.setHeader(
      CardService.newCardHeader()
      .setTitle('<font color=\'#0000FF\'>CREATE A GROUP FROM SCRATCH</font>')
  )
    group_entree_box.setTitle("Group Name")
  }
  
  //Add section to the card
  //The section contains two widgets:
  //  1. An text input field for entering group name
  //  2. A text button to create the group
  card
  .addSection(
    CardService.newCardSection()
      .addWidget(group_entree_box)
      .addWidget(CardService.newTextButton()
        .setText("Create")
        .setBackgroundColor(button_color3)
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        //The button, once clicked, calls function requestNewGroupUsers()
        //(The global constant goTorequestNewGroupUsers is defined in Homepage.gs)
        .setOnClickAction(goTorequestNewGroupUsers
                            .setParameters({'copy_from': copy_from})
                            .setParameters({'group_id_from': group_id_from})
                            .setParameters({'from_name': from_name}))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      )
  )
    //Set the navigation; push the built card "Create a group"
    var nav = CardService.newNavigation().pushCard(card.build());
    //Return action response object with the navigation
    return CardService.newActionResponseBuilder().setNavigation(nav).build();
}

/*After Group is named, requestNewGroupUsers prompts the addition of users to the group and offers the option to complete 
  group creation. While this page is created is also when the group itself is created
  Returns(Action Response): 
    An action response object that pushes a card for adding users to the
    newly created group
*/
function requestNewGroupUsers(e) {
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  //Gets the group name from input box 
  //(Input box has field name "new_group_name"; see goToCreateAGroup() in this file)
  var name = e.formInput.new_group_name
  const group_id_from = e['parameters']['group_id_from']
  const copy_from = e['parameters']['copy_from']
  const from_name = e['parameters']['from_name']
  //Push the current user(creator) email as the first member of the group
  let user_emails = [] 
  user_emails.push(Session.getActiveUser().getEmail())
  //Add the group to backend and get the group id as string
  var group_id = generate_group_id().toString()
  back_create_new_group(group_id, name, user_emails, user_emails[0], group_id_from, conn)
  //var group_id = newGroup(name, user_emails, Session.getActiveUser().getEmail()).toString()
  //Create CardBuilder object(card will be built later) that will pop up
  //for adding members, once the group is created
  let card = CardService.newCardBuilder()
  card
    //Set card name for navigation
    .setName("Add members to a new group")
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  if(copy_from == '1'){
    //copy_from_group_helper(group_id_from, group_id, conn)
    card
    .setHeader(
      CardService.newCardHeader()
        .setTitle('CREATE A SUBGROUP')
    )
  } else {
    card
    .setHeader(
      CardService.newCardHeader()
        .setTitle('CREATE A GROUP FROM SCRATCH')
    )
  }
  
    //Add a section for adding users to the newly created group.
    //The section has two widgets:
    //  1. An text input field for entering user emails
    //  2. A text button to complete the action
  card
    .addSection(
      CardService.newCardSection()
        .setHeader("Add users to group '" + name + "'.\nClick 'Complete' to continue or skip.") 
        .addWidget(CardService.newTextInput()
          .setFieldName("user_emails")
          .setTitle("Emails - separate with commas")
          .setMultiline(true))
        .addWidget(CardService.newTextButton()
          .setBackgroundColor(button_color3)
          .setText("Complete")
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          //The button, once clicked, calls the function addUserEmails()
            .setOnClickAction(CardService.newAction().setFunctionName('addUserEmails')
            .setParameters({'group_id': group_id})
          ))
    )
    
    //Set the navigation; first go back to the first card (homepage), and then 
    //push the built card "Add members to a new group"
    var nav = CardService.newNavigation().popToRoot().pushCard(card.build());
    //Return action response object that has a notification and a navigation action
    //var notif = CardService.newActionResponseBuilder()
    conn.close()
    if (copy_from == '1'){
      //var from_name = back_retrieve_group(group_id_from, conn).name
      return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("Your group has been created with the files from " + from_name + "."))
      .setNavigation(nav)
      .build();
    } else {
      return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
          .setText("Your group has been created"))
      .setNavigation(nav)
      .build();
    }    
}

//prompts user to select which group to make a subgroup of
function chooseParentGroup(){
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var groups = []
  groups = back_retrieve_all_groups(conn);
  //Group list section of card "Choose a group to share files with"
  var group_list_section;

  if (groups.length != 0) {
    //If there is at least one group, set the header of the section to show
    //users can select a group to share files with
    group_list_section = CardService.newCardSection().setHeader("Note: any users in your subgroup will also be put in this parent group")
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
          .setText("<font color=\'#0000FF\'>Go To CREATE A GROUP</font>")
          .setAltText("Create a new group.")
          //The button, once clicked, calls goToCreateAGroup().
          //(The constant goToCreateAGroupAction is defined in Homepage.gs)
          .setOnClickAction(goToCreateAGroupAction
                            .setParameters({'copy_from': '2'}) //2 for false bc 0 creates an error as it reads that as null
                            .setParameters({'group_id_from': 'none'})
                            .setParameters({'from_name': 'none'}))
      )
  }

  //Go through each existing group
  for (index in groups) {
    //For each group, gets the group ID and group name
    let group_id = groups[index][0]
    let name = groups[index][1]
    let parentid = groups[index][2]
    let subgroup_label = "\n"
    if (parentid != 'none'){
      let parentname = back_retrieve_group_name(parentid, conn)
      subgroup_label = "subgroup of " + parentname
    }
    //For each group, add a widget that contains a text button with
    //text as the group's name 
    group_list_section.addWidget(
          CardService.newDecoratedText()
            .setText("<b> "+ name.toUpperCase() +" </b>")
            //When the text is clicked, calls goToEditAGroup() with argument input group_id
            .setBottomLabel(subgroup_label)
            .setOnClickAction(CardService.newAction()
              .setFunctionName('goToCreateAGroup')
              .setParameters({'copy_from': '1'}) //1 for true
              .setParameters({'group_id_from': group_id})
              .setParameters({'from_name': name})
            )
    )
  }

  conn.close()

  //Create and build the card object
  let card = CardService.newCardBuilder()
    //Set card name for navigation
    .setName("Make from existing")
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    //The header of the card will be 'SHARE WITH A GROUP'
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Choose a group to make a subgroup of:')
    )
    //Add group list section to the card and build it
    .addSection(group_list_section).build()
  
  //Return built card(without navigation)
  return card
}

//new copy from helper to add users to their parent's group called from addUserEmails in edit a group
function recursive_add_users_to_parent_groups(group_id, user_emails, conn){
  parent_id = back_retrieve_parent_id(group_id, conn)
  if (parent_id == 0){
    return
  }
  for (index in user_emails) { 
    email = user_emails[index];
    back_add_user(parent_id, email, conn);
    grant_access_new_user(parent_id, email, conn);
  }
  recursive_add_users_to_parent_groups(parent_id, user_emails, conn)
}

/*Generate group id for a new group
  Returns(integer): 
    the generated id of the new group, as a combination of 
    code generated with time and code generated with the 
    current user's email address
*/
function generate_group_id() {
  //A string that is email of the current user.
  var current_email = Session.getActiveUser().getEmail();
  //The place to store the email address code
  var address_code = 0;
  //Currently, the email code is created by adding 
  //the ascii code of each character before the "@"
  //in the owner's email address
  for (current_char of current_email) {
      if (current_char == '@')
      break;
      address_code += current_char.charCodeAt();
  }

  //Combine time code and email code
  id_curr = new Date().getTime() % (10000) * 10000 + address_code;

  return id_curr;
}
