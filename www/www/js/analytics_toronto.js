(function($){
    "use strict"; // Start of use strict    
    $(document).ready(function(){
        pageViewed();  
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
    var url = "https://script.google.com/macros/s/AKfycbzRY7ayjnmXdY1Y37nQB9oBk4LBVDfrc2IhVIRS_iZPR5Kcdf2SF-0yXHhUvYVe2CswfQ/exec";
    var myJSObject='{"Event": "' + "SelectAction: " + actionType + '"}';    
    postCall(url, myJSObject);
  }
  
  function pageViewed() {
    var url = "https://script.google.com/macros/s/AKfycbzRY7ayjnmXdY1Y37nQB9oBk4LBVDfrc2IhVIRS_iZPR5Kcdf2SF-0yXHhUvYVe2CswfQ/exec";
    var myJSObject='{"Event": "' + "PageView: Toronto" + '"}';    
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
  
  function submitMessage()
  {
    var url = "https://script.google.com/macros/s/AKfycbyNis6FoIjQr0VqbgOInwAFBkUq7OAlxLEdd-A26p1JX1GFq7E/exec";
    var Name = document.getElementById('contact_name').value;
    var Email = document.getElementById('contact_email').value;      
    var Message = document.getElementById('contact_message').value;      
    var myJSObject='{"Name": "' + Name + '", "Email" : "' + Email + '", "Message" : "' + Message + '"}';    
    postCall(url, myJSObject);
  }
  function submitSubscription()
  {
    var url = "https://script.google.com/macros/s/AKfycbyNis6FoIjQr0VqbgOInwAFBkUq7OAlxLEdd-A26p1JX1GFq7E/exec";
    var Name = 'Subscription';
    var Email = 'Subscription';      
    var Message = document.getElementById('subscription_message').value;      
    var myJSObject='{"Name": "' + Name + '", "Email" : "' + Email + '", "Message" : "' + Message + '"}';    
    postCall(url, myJSObject);
  }