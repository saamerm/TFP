// Using https://stackoverflow.com/a/1643468/11104068
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const d = new Date();
  // The current month is " + monthNames[d.getMonth()]); The current day is " + d.getDay()); Day of week The current day of month is " + d.getDate());
var year = d.getYear()+1900
var dateExceptTime = d.getDate() + " " + monthNames[d.getMonth()] + " " + year// 20 Aug 2023 23:25
$(document).ready(function() {
  document.getElementById("departureTime").value = dateExceptTime + " 21:25"
  document.getElementById("arrivalTime").value = dateExceptTime + " 23:25"
  document.getElementById("originPrayerTime").value = dateExceptTime + " 22:05"
  document.getElementById("destinationPrayerTime").value = dateExceptTime + " 22:55"
  document.getElementById("currentTime").value = "18 Apr 2023 22:25" // Date format
});

  flatpickr('#departureTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 21:25"
  });
  flatpickr('#arrivalTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 23:25"
  });
  flatpickr('#originPrayerTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 22:05"
  });
  flatpickr('#destinationPrayerTime', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: dateExceptTime + " 22:55"
  });

var Calculate = function(data) {
    var a = new Date(document.getElementById("departureTime").value)
    var b = new Date(document.getElementById("arrivalTime").value)
    var c = new Date(document.getElementById("originPrayerTime").value)
    var d = new Date(document.getElementById("destinationPrayerTime").value)

    prayerTime = 0
  // 240,000 = 1 minute
    for (let i = a.getTime(); i < b.getTime(); i+=120000) { 
      var percent = 100*(i-a.getTime())/(b.getTime()-a.getTime()) //percent of flight completed
      // Eg: if a = 102 and b = 105. At second loop, i = 103 so percent = (103-102)/(105-102)
      var possibleTime = ((d.getTime()-c.getTime())*percent/100)+c.getTime()

      if (i > possibleTime && prayerTime == 0){
        prayerTime = 1
        // console.log("HERE")
        // console.log(i)
        var x = new Date(i)//.toUTCString() + "+0400"
        // console.log(new Date(x))
        // console.log(possibleTime)
        var y = new Date(possibleTime)//.toUTCString() + "+0400"
        // console.log(new Date(y))
        document.getElementById("calculation").innerHTML = x.toLocaleString() + " in the timezone of the origin";       // -> "2/1/2013 7:37:08 AM"
      }
    }
}