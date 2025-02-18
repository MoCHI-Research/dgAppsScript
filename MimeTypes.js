//Many of the image links are to a plain folder. This is because I could not find the proper icons. It would be nice if these new images could be added
//This file contains all of the functions required to access and get the correct images for a file's mime type:

// application/vnd.google-apps.audio	
// application/vnd.google-apps.document    	    Google Docs                 *
// application/vnd.google-apps.drive-sdk	      Third-party shortcut
// application/vnd.google-apps.drawing	        Google Drawings
// application/vnd.google-apps.file	            Google Drive file
// application/vnd.google-apps.folder	          Google Drive folder 
// application/vnd.google-apps.form	            Google Forms                *
// application/vnd.google-apps.fusiontable	    Google Fusion Tables
// application/vnd.google-apps.jam	            Google Jamboard
// application/vnd.google-apps.map	            Google My Maps
// application/vnd.google-apps.photo	          Google Photos
// application/vnd.google-apps.presentation	    Google Slides               *
// application/vnd.google-apps.script	          Google Apps Script
// application/vnd.google-apps.shortcut	        Shortcut
// application/vnd.google-apps.site	            Google Sites
// application/vnd.google-apps.spreadsheet	    Google Sheets               *
// application/vnd.google-apps.unknown	
// application/vnd.google-apps.video

//returns an image Url for the mimetype of the file
function get_type_image(file) {
  let image_url = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F5%2F59%2FOneDrive_Folder_Icon.svg%2F1200px-OneDrive_Folder_Icon.svg.png&f=1&nofb=1"
  const mimetype = file.getMimeType()
  if (mimetype == "application/vnd.google-apps.spreadsheet"){
      image_url = "https://e7.pngegg.com/pngimages/660/350/png-clipart-green-and-white-sheet-icon-google-docs-google-sheets-spreadsheet-g-suite-google-angle-rectangle-thumbnail.png"
  }
  else if (mimetype == "application/vnd.google-apps.document"){
    image_url = "https://e7.pngegg.com/pngimages/67/491/png-clipart-google-docs-computer-icons-document-android-google-template-blue-thumbnail.png"
  }
  else if (mimetype == "application/vnd.google-apps.presentation"){
    image_url = "https://e7.pngegg.com/pngimages/301/115/png-clipart-google-docs-google-slides-google-drive-presentation-slide-g-suite-gmail-angle-text-thumbnail.png"
  }
  else if (mimetype == "application/vnd.google-apps.form"){
    image_url = "https://e7.pngegg.com/pngimages/19/353/png-clipart-g-suite-google-surveys-form-logo-google-purple-violet-thumbnail.png"
  }
  else if (mimetype == "application/pdf"){
    image_url = "https://e7.pngegg.com/pngimages/356/493/png-clipart-pdf-android-google-must-have-rectangle-magenta-thumbnail.png"
  }
  else if (mimetype == "application/vnd.google-apps.video"){
    image_url = "file:///Users/irisizydorczak/Desktop/Screenshot%202023-06-02%20at%2010.40.48%20AM.png"
  }
  // else if (mimetype == "application/vnd.google-apps.form"){
  //   image_url = "https://e7.pngegg.com/pngimages/19/353/png-clipart-g-suite-google-surveys-form-logo-google-purple-violet-thumbnail.png"
  // }

  return image_url
}

