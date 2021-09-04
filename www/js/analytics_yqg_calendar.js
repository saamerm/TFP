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
    var url = "https://script.google.com/macros/s/AKfycbxV6pevPj7Fn8QK1LbwiRi25CCDkp0PETel0N9EAndhVvX3_TDdtAWuBj6qdTi37NM7vA/exec";
    var myJSObject='{"Event": "' + "PageView: YQG_Calendar" + '"}';    
    postCall(url, myJSObject);
  }