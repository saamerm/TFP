(function($){
    "use strict"; // Start of use strict    
    $(document).ready(function(){
        pageViewed();
        requestReferrerAndLocation();  
    });
})(jQuery); // End of use strict


/* ---------------------------------------------
 Custom GDPR compliant analytics
 --------------------------------------------- */
   
  function pageViewed() {
    var url = "https://script.google.com/macros/s/AKfycbxzEJVBRmE-z7ZY4C6FRzxPn28TKW6mozP73FfPuVgXYgauG3_MnhroSoe5wVyE8eUkMg/exec";
    var myJSObject='{"Event": "' + "PageView: YQG_Volunteer" + '"}';    
    postCall(url, myJSObject);
  }