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
    var url = "https://script.google.com/macros/s/AKfycbxzEJVBRmE-z7ZY4C6FRzxPn28TKW6mozP73FfPuVgXYgauG3_MnhroSoe5wVyE8eUkMg/exec";
    var myJSObject='{"Event": "' + "SelectAction: " + actionType + '"}';    
    postCall(url, myJSObject);
  }
  
  function pageViewed() {
    var url = "https://script.google.com/macros/s/AKfycbxzEJVBRmE-z7ZY4C6FRzxPn28TKW6mozP73FfPuVgXYgauG3_MnhroSoe5wVyE8eUkMg/exec";
    var myJSObject='{"Event": "' + "PageView: Windsor" + '"}';    
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