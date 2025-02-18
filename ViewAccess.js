/*Go to(push) the card about access information. It asks user to select from viewing
  viewing access by group and viewing access by file

  Returns(Action Response): 
    action response object that navigates by pushing the card for user to select way
    of viewing access information
*/
function goToAccessPage() {
  //Make choice section of the card "Select way of viewing access"
  //Contains two widget, each of which is a text button for user to click and go to
  //view access by group/by file
  let makeChoiceSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      //Text color of text button is set as blue
      .setText("Manage Access by Group")
      .setBackgroundColor(button_color2)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      //The button, once clicked, calls goToGroupAccess() in ViewGroupAccess.gs.
      //The constant goToGroupAccessAction is defined in Homepage.gs
      .setOnClickAction(goToGroupAccessAction)
    )
    .addWidget(CardService.newTextButton()
      .setText("Manage Access by File")
      .setBackgroundColor(button_color2)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      //The button, once clicked, calls goToFileAccess() in ViewFileAccess.gs.
      .setOnClickAction(goToFileAccessAction)
    )
  
  //Sets card
  var card = CardService.newCardBuilder()
    .setFixedFooter(CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
                        .setText("Home")
                        .setBackgroundColor(button_color1)
                        .setOnClickAction(CardService.newAction().setFunctionName("poptorootaction"))))
    //Set card name for navigation
    .setName("Select way of viewing access")
    //Card header gives user instruction to choose a way of viewing access
    .setHeader(
        CardService.newCardHeader()
          .setTitle('Choose a way of viewing access:'))
    .addSection(makeChoiceSection)
    //Build the card
    .build();

  //Sets navigaton pushing the card, and returns action response object
  var nav = CardService.newNavigation().pushCard(card)
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}
