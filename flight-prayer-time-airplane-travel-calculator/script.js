$(document).ready(function(){
  requestReferrerAndLocationCustom();  
});

// Using https://stackoverflow.com/a/1643468/11104068
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const d = new Date();
  // The current month is " + monthNames[d.getMonth()]); The current day is " + d.getDay()); Day of week The current day of month is " + d.getDate());
var year = d.getYear()+1900
var dateExceptTime = d.getDate() + " " + monthNames[d.getMonth()] + " " + year// 20 Aug 2023 23:25
$(document).ready(function() {
  
  document.getElementById("departureTime").value = dateExceptTime + " 11:25"
  document.getElementById("arrivalTime").value = dateExceptTime + " 23:25"
  document.getElementById("originPrayerTime").value = dateExceptTime + " 12:35"
  document.getElementById("destinationPrayerTime").value = dateExceptTime + " 13:55"

  document.getElementById("departureTime2").value = dateExceptTime + " 11:25"
  document.getElementById("arrivalTime2").value = dateExceptTime + " 23:25"
});

  flatpickr('#departureTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 11:25"
  });
  flatpickr('#arrivalTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 23:25"
  });
  flatpickr('#departureTime2', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 11:25"
  });
  flatpickr('#arrivalTime2', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 23:25"
  });
  flatpickr('#originPrayerTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 12:35"
  });
  flatpickr('#destinationPrayerTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 13:55"
  });

var Calculate = function(data) {
    var a = new Date(document.getElementById("departureTime").value)
    var b = new Date(document.getElementById("arrivalTime").value)
    var c = new Date(document.getElementById("originPrayerTime").value)
    var d = new Date(document.getElementById("destinationPrayerTime").value)

  document.getElementById("calculation").innerHTML = SecretSauce(a,b,c,d).toLocaleString() + " in the timezone of the origin";       // -> "2/1/2013 7:37:08 AM"  
}

// a = departureTime, b = arrivalTime, c = originPrayerTime, d = destinationPrayerTime
function SecretSauce(a, b, c, d){
  var prayerTime = 0
  var result = currentTime
  // 240,000 = 1 minute
  for (let i = a.getTime(); i < b.getTime(); i+=60000) { 
    var percent = 100*(i-a.getTime())/(b.getTime()-a.getTime()) //percent of flight completed
    // Eg: if a = 102 and b = 105. At second loop, i = 103 so percent = (103-102)/(105-102)
    var possibleTime = ((d.getTime()-c.getTime())*percent/100)+c.getTime()

    if (i > possibleTime && prayerTime == 0){
      prayerTime = 1
      var x = new Date(i)//.toUTCString() + "+0400"
      var y = new Date(possibleTime)//.toUTCString() + "+0400"
      result = x
    }
  }
  return result
}

var currentTime = new Date()
var CalculateList = function(data) {
  var a = new Date(document.getElementById("departureTime2").value)
  var b = new Date(document.getElementById("arrivalTime2").value)
  var c = document.getElementById("originCity").value
  var d = document.getElementById("destinationCity").value
  var originCity = c.split(" ,")[0];
  var originCountry = c.split(" ,")[1];
  var destinationCity = d.split(" ,")[0];
  var destinationCountry = d.split(" ,")[1];
  var originFajr = new Date()
  var originDhuhr = new Date()
  var originAsr = new Date()
  var originMaghreb = new Date()
  var originIsha = new Date()
  var destinationFajr = new Date()
  var destinationDhuhr = new Date()
  var destinationAsr = new Date()
  var destinationMaghreb = new Date()
  var destinationIsha = new Date()
  var resultList = ""

  var originTimeZone = ""
  var destinationTimeZone = ""

  $.getJSON('https://api.aladhan.com/v1/timingsByCity/' + a + '?city='+ originCity + '&country=' + originCountry + '&method=2', function(response1){
    originFajr.setHours(response1.data.timings.Fajr.split(":")[0]);
    originFajr.setMinutes(response1.data.timings.Fajr.split(":")[1]);
    originDhuhr.setHours(response1.data.timings.Dhuhr.split(":")[0]);
    originDhuhr.setMinutes(response1.data.timings.Dhuhr.split(":")[1]);
    originAsr.setHours(response1.data.timings.Asr.split(":")[0]);
    originAsr.setMinutes(response1.data.timings.Asr.split(":")[1]);
    originMaghreb.setHours(response1.data.timings.Maghrib.split(":")[0]);
    originMaghreb.setMinutes(response1.data.timings.Maghrib.split(":")[1]);
    originIsha.setHours(response1.data.timings.Isha.split(":")[0]);
    originIsha.setMinutes(response1.data.timings.Isha.split(":")[1]);
    originTimeZone = response1.data.meta.timezone;

    $.getJSON('https://api.aladhan.com/v1/timingsByCity/' + a + '?city='+ destinationCity + '&country=' + destinationCountry + '&method=2', function(response2){
        destinationTimeZone = response2.data.meta.timezone;             
        var now = moment.utc();
        // get the zone offsets for this time, in minutes
        var originOffset = moment.tz.zone(originTimeZone).utcOffset(now); 
        var destinationOffset = moment.tz.zone(destinationTimeZone).utcOffset(now);
        // calculate the difference in hours
        var hoursDifference = -(originOffset - destinationOffset) / 60; //Eg: NYC (-5) - LAX (-8) = -3
        destinationFajr.setHours(Number(response2.data.timings.Fajr.split(":")[0])+hoursDifference);
        destinationFajr.setMinutes(response2.data.timings.Fajr.split(":")[1]);
        destinationDhuhr.setHours(Number(response2.data.timings.Dhuhr.split(":")[0])+hoursDifference);
        destinationDhuhr.setMinutes(response2.data.timings.Dhuhr.split(":")[1]);
        destinationAsr.setHours(Number(response2.data.timings.Asr.split(":")[0])+hoursDifference);
        destinationAsr.setMinutes(response2.data.timings.Asr.split(":")[1]);
        destinationMaghreb.setHours(Number(response2.data.timings.Maghrib.split(":")[0])+hoursDifference);
        destinationMaghreb.setMinutes(response2.data.timings.Maghrib.split(":")[1]);
        destinationIsha.setHours(Number(response2.data.timings.Isha.split(":")[0])+hoursDifference);
        destinationIsha.setMinutes(response2.data.timings.Isha.split(":")[1]); 
    
        if (originFajr > a && originFajr < b){
          resultList = "Fajr must be prayed at " + SecretSauce(a,b,originFajr,destinationFajr).toLocaleString() + ". "
        }
        if (originDhuhr > a && originDhuhr < b){
          resultList += "Dhuhr must be prayed at " + SecretSauce(a,b,originDhuhr,destinationDhuhr).toLocaleString() + ". "
        }
        if (originAsr > a && originAsr < b){
          resultList += "Asr must be prayed at " + SecretSauce(a,b,originAsr,destinationAsr).toLocaleString() + ". "
        }
        if (originMaghreb > a && originMaghreb < b){
          resultList += "Maghreb must be prayed at " + SecretSauce(a,b,originMaghreb,destinationMaghreb).toLocaleString() + ". "
        }
        if (originIsha > a && originIsha < b){
          var timeOfIshaPrayer = SecretSauce(a,b,originIsha,destinationIsha).toLocaleString()
          if (Date(timeOfIshaPrayer) == Date(currentTime)){
            resultList += "Since you are traveling, combine Isha with Maghreb, by praying one after the other. "
          } else{
            resultList += "Isha must be prayed at " + timeOfIshaPrayer + ". "
          }
        }  
        $(calculationList).text(resultList + "Times are in the timezone of the origin. These values may be incorrect as this feature is in beta")      
    
    })
    // .done(function(response) { alert(response + "second success"); })
    .fail(function(response2) { 
    alert(response2.responseJSON.data + " Your city " + destinationCity + " may not be supported yet. Additionally, please check the format: 'City, Country'"); 
    });

  })
  // .done(function(response) { alert(response + "second success"); })
  .fail(function(response1) { 
    alert(response1.responseJSON.data + " Your city " + originCity + " may not be supported yet. Additionally, please check the format: 'City, Country'"); 
  });

  // Test cases
  // Eg: NYC to LAX. NYC: "Isha": "21:59", LAX: "Isha": "21:23",
  // Dhuhr must be prayed at 6/2/2024, 12:54:00 PM. Asr must be prayed at 6/2/2024, 4:46:00 PM. Maghreb must be prayed at 6/2/2024, 8:07:00 PM. Isha must be prayed at 6/2/2024, 9:30:00 PM. Times are in the timezone of the origin. These values may be incorrect as this feature is in beta

}

function requestReferrerAndLocationCustom()
{
  $.getJSON("https://ipinfo.io/json", function (data) {
    console.log("data: " + data);
    var str = data.city + ", " + data.region + ", " + data.country;
    console.log("IP: " + str);
    sendLocationRequestCustom(str); // TODO: Comment while debugging
    $(originCity).val(data.city + ", " + data.country)
  });
}  

function sendLocationRequestCustom(str)
{
  var Name = str;
  var Email = document.URL;      
  var Message = document.referrer; 
  postFeedbackAPICustom(Name, Email, Message)
}

function postFeedbackAPICustom(Name, Email, Message)
{
  var url = "https://script.google.com/macros/s/AKfycbz42xFl_59V36k5VJgldCLFRBv9Gw1n2Z6XapMt1V9d_G-deUaoaOYbkqHddM3HnzA/exec";
  var myJSObject='{"Name": "' + Name + '", "Email" : "' + Email + '", "Message" : "' + Message + '"}';    
  postCallCustom(url, myJSObject);
}

function postCallCustom(url, myJSObject) {
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