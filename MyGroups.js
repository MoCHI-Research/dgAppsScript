/*Go to（push) the card for list of groups that can be edited

  Returns(Action Response): An action response object that pushes the card for list of existing groups
*/
function goToMyGroups() {
  //Gets built card(without navigation) for group list by calling helper function
  var card = goToMyGroupsHelper();

  //Set navigation pushing the card, and return the action response object
  var nav = CardService.newNavigation().popToRoot().pushCard(card);    
  return CardService.newActionResponseBuilder().setNavigation(nav).build();

}

/*Helper function for goToMyGroups; creates and builds the card for navigation push

  Returns(Card): built card(without navigation) page for list of existing groups that
                 can be edited
*/
function goToMyGroupsHelper() {
  //Retrieve all groups from the backend
  conn = Jdbc.getCloudSqlConnection(instanceUrl, user, userPwd)
  var groups = back_retrieve_all_groups(conn);
  //Group list section in "Group list" card
  var group_list_section = CardService.newCardSection();   
  //For each group retrieved from backend
  for (index in groups) {
    //Gets group information from object obtained(name and id)
    let name = groups[index][1]
    let group_id = groups[index][0]
    let parentid = groups[index][2]
    let subgroup_label = "\n"
    if (parentid != 'none'){
      let parentname = back_retrieve_group_name(parentid, conn)
      subgroup_label = "subgroup of " + parentname
    }
    
    //For each group, add a widget to group list section
    //The widget contains a decorated text object that contains an image button following text
    //Click on the decorated text to go to the page editing the specific group
    //Click on the image button to delete the group
    var upper = name.toUpperCase()
    group_list_section.addWidget(
          CardService.newDecoratedText()
            .setText("<b> "+ upper +" </b>")
            //When the text is clicked, calls goToEditAGroup() with argument input group_id
            .setBottomLabel(subgroup_label)
            .setOnClickAction(CardService.newAction()
              .setFunctionName('goToEditAGroup')
              .setParameters({'group_id': group_id})
            )
            .setButton(CardService.newImageButton()
              .setIconUrl("https://i.postimg.cc/pr950Q06/delete-24dp-666666-FILL0-wght400-GRAD0-opsz24.png")
              .setAltText("delete \"" + name + "\"")
              //When the image button is clicked, calls deleteGroup() with argument input group_id
              .setOnClickAction(CardService.newAction()
                .setFunctionName('side_bar')
                .setParameters({'group_id': group_id})
                .setParameters({'group_name': name})
              )
            )
    )
  }
  conn.close()
  //If no group exists in backend, add widgets to group list section
  //indicating no group has been created, and provide a shortcut to 
  //create a group
  if (groups.length == 0) {
    group_list_section.addWidget(
      CardService.newTextParagraph()
        .setText("Currently no group has been created.")
    )
    .addWidget(
      CardService.newTextButton()
        //The font color for shortcut text is set as blue
        .setText("<font color=\'#0000FF\'>Click here to create one </font>")
        .setAltText("Create a new group.")
        //When shortcut is clicked, calls goToCreateAGroup()
        //(Constant goToCreateAGroupAction is declared in homepage.gs)
        .setOnClickAction(goToCreateAGroupAction
                              .setParameters({'copy_from': '2'}) //2 for false bc 0 creates an error as it reads that as null
                              .setParameters({'group_id_from': 'none'}))
    )
  } 

  //Declare and set the card builder for group list card
  let card = CardService.newCardBuilder()
  //Set card name for navigation
  card.setName("Group list")
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  .setHeader(
    CardService.newCardHeader()
      .setTitle('MANAGE GROUPS')
  )

  //Add group list section to the card
  card.addSection(group_list_section)
    
  //Return built card
  return card.build()
}

//pushes card to ask if the user is sure they want to delete the group
function side_bar(e){
  let groupId = e['parameters']['group_id']
  let groupName = e['parameters']['group_name']
  let card = CardService.newCardBuilder()
  .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
  card.setDisplayStyle(CardService.DisplayStyle.PEEK)
  card.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText("Are you sure you want to delete " + groupName + "?"))
        .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton().setText("NO: CANCEL")
        .setBackgroundColor(button_color4)
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOnClickAction(CardService.newAction()
                  .setFunctionName('pop_back')
                  .setParameters({'group_id': groupId})
          )
        )
        .addButton(CardService.newTextButton().setText("YES")
          .setBackgroundColor(button_color3)
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOnClickAction(CardService.newAction()
                  .setFunctionName('deleteGroup')
                  .setParameters({'group_id': groupId})
                  .setParameters({'name': groupName})
          )
        )
      )
  )
  return card.build()
}

//creates the navigation to pop the current card
function pop_back(e){
  var nav = CardService.newNavigation().popCard()
  return CardService.newActionResponseBuilder().setNavigation(nav).build()
}
