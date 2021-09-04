(function($){
    "use strict"; // Start of use strict    
    $(document).ready(function(){
        pageViewed(); 
        requestReferrerAndLocation();           
        $("#send_message").click(function()
        {
            document.getElementById('form_response').innerHTML = "Thank you! We will get back to you within 24 hours";
            submitMessage();
            selectAction("SendMessage");
        });
        $("#subscribe_user").click(function()
        {
            document.getElementById('subscription_reponse').innerHTML = "Thank you!";
            submitSubscription();
            selectAction("SendMessage");
        });        
        $("#launch_blog").click(()=>selectAction("Blog"));
        $("#launch_instagram").click(()=>selectAction("Instagram"));
        $("#launch_twitter").click(()=>selectAction("Twitter"));
        $("#launch_linkedin").click(()=>selectAction("LinkedIn"));
        $("#launch_facebook").click(()=>selectAction("Facebook"));
    });
})(jQuery); // End of use strict


/* ---------------------------------------------
 Custom GDPR compliant analytics
 --------------------------------------------- */

  function selectAction(actionType){
    var url = "https://script.google.com/macros/s/AKfycbxV6pevPj7Fn8QK1LbwiRi25CCDkp0PETel0N9EAndhVvX3_TDdtAWuBj6qdTi37NM7vA/exec";
    var myJSObject='{"Event": "' + "SelectAction: " + actionType + '"}';    
    postCall(url, myJSObject);
  }
  
  function pageViewed() {
    var url = "https://script.google.com/macros/s/AKfycbxV6pevPj7Fn8QK1LbwiRi25CCDkp0PETel0N9EAndhVvX3_TDdtAWuBj6qdTi37NM7vA/exec";
    var myJSObject='{"Event": "' + "PageView: Detroit" + '"}';    
    postCall(url, myJSObject);
  }
  
  function postCall(url, myJSObject) {
    $.ajax({
    type: "POST",
    url: url,
    data: myJSObject,
    success: function (response) {
      console.log(response);
    },
    error: function (error) {
      console.log(error.responseText);
    },
  });
  }