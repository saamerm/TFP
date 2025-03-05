$(document).ready(function() {
  requestReferrerAndLocationCustom();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const d = new Date();
  const year = d.getFullYear(); // Use getFullYear()
  const dateExceptTime = `${d.getDate()} ${monthNames[d.getMonth()]} ${year}`;

  const defaultDepartureTime = `${dateExceptTime} 11:25`;
  const defaultArrivalTime = `${dateExceptTime} 23:25`;

  $("#departureTime2").val(defaultDepartureTime);
  $("#arrivalTime2").val(defaultArrivalTime);

  flatpickr('#departureTime2', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: defaultDepartureTime
  });
  flatpickr('#arrivalTime2', {
      enableTime: true,
      time_24hr: true,
      dateFormat: "d M Y H:i",
      defaultDate: defaultArrivalTime
  });

});


// a = departureTime, b = arrivalTime, c = originPrayerTime, d = destinationPrayerTime
function SecretSauce(a, b, c, d) {
  var prayerTime = 0
  var result = new Date()
  // 240,000 = 1 minute
  for (let i = a.getTime(); i < b.getTime(); i += 60000) {
      var percent = 100 * (i - a.getTime()) / (b.getTime() - a.getTime()) //percent of flight completed
      // Eg: if a = 102 and b = 105. At second loop, i = 103 so percent = (103-102)/(105-102)
      var possibleTime = ((d.getTime() - c.getTime()) * percent / 100) + c.getTime()

      if (i > possibleTime && prayerTime == 0) {
          prayerTime = 1
          var x = new Date(i) //.toUTCString() + "+0400"
          var y = new Date(possibleTime) //.toUTCString() + "+0400"
          result = x
      }
  }
  return result
}

const CalculateListOld = async () => {
  const departureTime = new Date($("#departureTime2").val());
  const arrivalTime = new Date($("#arrivalTime2").val());
  const originCityCountry = $("#originCity").val();
  const destinationCityCountry = $("#destinationCity").val();

  const [originCity, originCountry] = originCityCountry.split(",").map(s => s.trim());
  const [destinationCity, destinationCountry] = destinationCityCountry.split(",").map(s => s.trim());

  if (!originCity || !originCountry || !destinationCity || !destinationCountry) {
      alert("Please provide the origin and destination cities in the format 'City, Country'.");
      return;
  }
  try {
      const originTimings = await getPrayerTimings(originCity, originCountry, departureTime);
      const destinationTimings = await getPrayerTimings(destinationCity, destinationCountry, departureTime);
      console.log("originTimings")
      console.log(originTimings)
      const originTimeZone = originTimings.data.meta.timezone;
      const destinationTimeZone = destinationTimings.data.meta.timezone;

      const now = moment.utc();
      const originOffset = moment.tz.zone(originTimeZone).utcOffset(now);
      const destinationOffset = moment.tz.zone(destinationTimeZone).utcOffset(now);
      const hoursDifference = -(originOffset - destinationOffset) / 60;
      let resultList = "";

      const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

      prayerNames.forEach(prayer => {
          const originPrayerTime = new Date(departureTime);
          const destinationPrayerTime = new Date(departureTime);
          originPrayerTime.setHours(originTimings.data.timings[prayer].split(":")[0]);
          originPrayerTime.setMinutes(originTimings.data.timings[prayer].split(":")[1]);
          destinationPrayerTime.setHours(Number(destinationTimings.data.timings[prayer].split(":")[0]) + hoursDifference);
          destinationPrayerTime.setMinutes(destinationTimings.data.timings[prayer].split(":")[1]);

          if (originPrayerTime > departureTime && originPrayerTime < arrivalTime) {
              const prayerTimeDuringFlight = SecretSauce(departureTime, arrivalTime, originPrayerTime, destinationPrayerTime).toLocaleString();
              resultList += `${prayer} must be prayed at ${prayerTimeDuringFlight}. `;
          }
      });

      // Isha logic. Still needs improvement.
      const originIshaTime = new Date(departureTime);
      const destinationIshaTime = new Date(departureTime);
      originIshaTime.setHours(originTimings.data.timings["Isha"].split(":")[0]);
      originIshaTime.setMinutes(originTimings.data.timings["Isha"].split(":")[1]);
      destinationIshaTime.setHours(Number(destinationTimings.data.timings["Isha"].split(":")[0]) + hoursDifference);
      destinationIshaTime.setMinutes(destinationTimings.data.timings["Isha"].split(":")[1]);

      if (originIshaTime > departureTime && originIshaTime < arrivalTime) {
          const ishaTimeDuringFlight = SecretSauce(departureTime, arrivalTime, originIshaTime, destinationIshaTime).toLocaleString();
          const originMaghrebTime = new Date(departureTime);
          originMaghrebTime.setHours(originTimings.data.timings["Maghrib"].split(":")[0]);
          originMaghrebTime.setMinutes(originTimings.data.timings["Maghrib"].split(":")[1]);

          const timeDifference = Math.abs(originMaghrebTime.getTime() - originIshaTime.getTime());
          const minutesDifference = Math.ceil(timeDifference / (1000 * 60));
          console.log(minutesDifference)
          if (minutesDifference <= 90) {
              resultList += "Since you are traveling, combine Isha with Maghreb, by praying one after the other.";
          } else {
              resultList += `Isha must be prayed at ${ishaTimeDuringFlight}.`;
          }
      }

      $("#calculationList").text(resultList + " Times are in the timezone of the origin. These values may be incorrect as this feature is in beta");

  } catch (error) {
      console.error("Error:", error);
      alert(error.message); // Display the error message from the catch block
  }
};

async function getPrayerTimings(city, country, date) {
  const formattedDate = moment(date).format("YYYY-MM-DD");
  const apiUrl = `https://api.aladhan.com/v1/timingsByCity/${formattedDate}?city=${city}&country=${country}&method=2`;

  try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.data + ` Your city ${city}, ${country} may not be supported yet. Additionally, please check the format: 'City, Country'`);
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error("API Error:", error);
      throw error; // Re-throw the error to be caught by the calling function
  }
}

function requestReferrerAndLocationCustom() {
  $.getJSON("https://ipinfo.io/json", function(data) {
      console.log("data: " + data);
      var str = data.city + ", " + data.region + ", " + data.country;
      console.log("IP: " + str);
      $("#originCity").val(data.city + ", " + data.country)
  });
}

const CalculateList2 = async () => {
  const departureTime = new Date($("#departureTime2").val());
  const arrivalTime = new Date($("#arrivalTime2").val());
  const originCityCountry = $("#originCity").val();
  const destinationCityCountry = $("#destinationCity").val();

  const [originCity, originCountry] = originCityCountry.split(",").map(s => s.trim());
  const [destinationCity, destinationCountry] = destinationCityCountry.split(",").map(s => s.trim());

  if (!originCity || !originCountry || !destinationCity || !destinationCountry) {
      alert("Please provide the origin and destination cities in the format 'City, Country'.");
      return;
  }
  try {
      // Fetch prayer times for both departure and arrival dates
      const originTimingsDeparture = await getPrayerTimings(originCity, originCountry, departureTime);
      const originTimingsArrival = await getPrayerTimings(originCity, originCountry, arrivalTime);
      const destinationTimingsDeparture = await getPrayerTimings(destinationCity, destinationCountry, departureTime);
      const destinationTimingsArrival = await getPrayerTimings(destinationCity, destinationCountry, arrivalTime);


      const originTimeZone = originTimingsDeparture.data.meta.timezone;
      const destinationTimeZone = destinationTimingsDeparture.data.meta.timezone;

      const now = moment.utc();
      const originOffset = moment.tz.zone(originTimeZone).utcOffset(now);
      const destinationOffset = moment.tz.zone(destinationTimeZone).utcOffset(now);
      const hoursDifference = -(originOffset - destinationOffset) / 60;
      let resultList = "";

      const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

      prayerNames.forEach(prayer => {
          // Determine which origin timings to use based on prayer time.  Use timings from departure date as default.
          let originPrayerTimeDeparture = new Date(departureTime);
          originPrayerTimeDeparture.setHours(originTimingsDeparture.data.timings[prayer].split(":")[0]);
          originPrayerTimeDeparture.setMinutes(originTimingsDeparture.data.timings[prayer].split(":")[1]);

          let originPrayerTimeArrival = new Date(arrivalTime);
          originPrayerTimeArrival.setHours(originTimingsArrival.data.timings[prayer].split(":")[0]);
          originPrayerTimeArrival.setMinutes(originTimingsArrival.data.timings[prayer].split(":")[1]);

          let originPrayerTime = originPrayerTimeDeparture
          if (originPrayerTimeDeparture > arrivalTime){
            originPrayerTime = originPrayerTimeArrival
          }
          let destinationPrayerTimeDeparture = new Date(departureTime);
          destinationPrayerTimeDeparture.setHours(Number(destinationTimingsDeparture.data.timings[prayer].split(":")[0]) + hoursDifference);
          destinationPrayerTimeDeparture.setMinutes(destinationTimingsDeparture.data.timings[prayer].split(":")[1]);

          let destinationPrayerTimeArrival = new Date(arrivalTime);
          destinationPrayerTimeArrival.setHours(Number(destinationTimingsArrival.data.timings[prayer].split(":")[0]) + hoursDifference);
          destinationPrayerTimeArrival.setMinutes(destinationTimingsArrival.data.timings[prayer].split(":")[1]);

          let destinationPrayerTime = destinationPrayerTimeDeparture
          if (originPrayerTimeDeparture > arrivalTime){
            destinationPrayerTime = destinationPrayerTimeArrival
          }
          if (originPrayerTime > departureTime && originPrayerTime < arrivalTime) {
              const prayerTimeDuringFlight = SecretSauce(departureTime, arrivalTime, originPrayerTime, destinationPrayerTime).toLocaleString();
              resultList += `${prayer} must be prayed at ${prayerTimeDuringFlight}. `;
          }
      });

      const originIshaTimeDeparture = new Date(departureTime);
      originIshaTimeDeparture.setHours(originTimingsDeparture.data.timings["Isha"].split(":")[0]);
      originIshaTimeDeparture.setMinutes(originTimingsDeparture.data.timings["Isha"].split(":")[1]);

      const originIshaTimeArrival = new Date(arrivalTime);
      originIshaTimeArrival.setHours(originTimingsArrival.data.timings["Isha"].split(":")[0]);
      originIshaTimeArrival.setMinutes(originTimingsArrival.data.timings["Isha"].split(":")[1]);

      const destinationIshaTimeDeparture = new Date(departureTime);
      destinationIshaTimeDeparture.setHours(Number(destinationTimingsDeparture.data.timings["Isha"].split(":")[0]) + hoursDifference);
      destinationIshaTimeDeparture.setMinutes(destinationTimingsDeparture.data.timings["Isha"].split(":")[1]);

      const destinationIshaTimeArrival = new Date(arrivalTime);
      destinationIshaTimeArrival.setHours(Number(destinationTimingsArrival.data.timings["Isha"].split(":")[0]) + hoursDifference);
      destinationIshaTimeArrival.setMinutes(destinationTimingsArrival.data.timings["Isha"].split(":")[1]);

      let originIshaTime = originIshaTimeDeparture;
      if (originIshaTimeDeparture > arrivalTime) {
        originIshaTime = originIshaTimeArrival;
      }

      let destinationIshaTime = destinationIshaTimeDeparture;
      if (originIshaTimeDeparture > arrivalTime) {
        destinationIshaTime = destinationIshaTimeArrival;
      }
      // originIshaTime = originIshaTimeDeparture > arrivalTime ? originIshaTimeArrival : originIshaTimeDeparture;
      // destinationIshaTime = originIshaTimeDeparture > arrivalTime ? destinationIshaTimeArrival : destinationIshaTimeDeparture;

      if (originIshaTime > departureTime && originIshaTime < arrivalTime) {
          const ishaTimeDuringFlight = SecretSauce(departureTime, arrivalTime, originIshaTime, destinationIshaTime).toLocaleString();

          const originMaghrebTimeDeparture = new Date(departureTime);
          originMaghrebTimeDeparture.setHours(originTimingsDeparture.data.timings["Maghrib"].split(":")[0]);
          originMaghrebTimeDeparture.setMinutes(originTimingsDeparture.data.timings["Maghrib"].split(":")[1]);

          const originMaghrebTimeArrival = new Date(arrivalTime);
          originMaghrebTimeArrival.setHours(originTimingsArrival.data.timings["Maghrib"].split(":")[0]);
          originMaghrebTimeArrival.setMinutes(originTimingsArrival.data.timings["Maghrib"].split(":")[1]);

          let originMaghrebTime = originMaghrebTimeDeparture
          if (originPrayerTimeDeparture > arrivalTime){
            originMaghrebTime = originMaghrebTimeArrival
          }

          const timeDifference = Math.abs(originMaghrebTime.getTime() - originIshaTime.getTime());
          const minutesDifference = Math.ceil(timeDifference / (1000 * 60));
          console.log(minutesDifference)
          if (minutesDifference <= 90) {
              resultList += "Since you are traveling, combine Isha with Maghreb, by praying one after the other.";
          } else {
              resultList += `Isha must be prayed at ${ishaTimeDuringFlight}.`;
          }
      }

      $("#calculationList").text(resultList + "Times are in the timezone of the origin. These values may be incorrect as this feature is in beta");

  } catch (error) {
      console.error("Error:", error);
      alert(error.message); // Display the error message from the catch block
  }
};

const CalculateList = async () => {
  const departureTime = new Date($("#departureTime2").val());
  const arrivalTime = new Date($("#arrivalTime2").val());
  const originCityCountry = $("#originCity").val();
  const destinationCityCountry = $("#destinationCity").val();

  const [originCity, originCountry] = originCityCountry.split(",").map(s => s.trim());
  const [destinationCity, destinationCountry] = destinationCityCountry.split(",").map(s => s.trim());

  if (!originCity || !originCountry || !destinationCity || !destinationCountry) {
      alert("Please provide the origin and destination cities in the format 'City, Country'.");
      return;
  }

  try {
      const flightDurationMillis = arrivalTime.getTime() - departureTime.getTime();
      const flightDurationDays = Math.ceil(flightDurationMillis / (1000 * 60 * 60 * 24)); // Round up to include partial days

      let allOriginTimings = [];
      let allDestinationTimings = [];

      // Fetch prayer timings for each day of the flight
      for (let i = 0; i < flightDurationDays; i++) {
          const currentDate = new Date(departureTime);
          currentDate.setDate(departureTime.getDate() + i); // Increment the date

          const originTimings = await getPrayerTimings(originCity, originCountry, currentDate);
          const destinationTimings = await getPrayerTimings(destinationCity, destinationCountry, currentDate);

          allOriginTimings.push(originTimings);
          allDestinationTimings.push(destinationTimings);
      }

      const originTimeZone = allOriginTimings[0].data.meta.timezone; // Use timezone from the first day
      const destinationTimeZone = allDestinationTimings[0].data.meta.timezone;

      const now = moment.utc();
      const originOffset = moment.tz.zone(originTimeZone).utcOffset(now);
      const destinationOffset = moment.tz.zone(destinationTimeZone).utcOffset(now);
      const hoursDifference = -(originOffset - destinationOffset) / 60;

      let resultList = "";

      // Iterate through the days of the flight and check for prayer times
      for (let dayIndex = 0; dayIndex < flightDurationDays; dayIndex++) {
          const currentDate = new Date(departureTime);
          currentDate.setDate(departureTime.getDate() + dayIndex);

          const originTimings = allOriginTimings[dayIndex];
          const destinationTimings = allDestinationTimings[dayIndex];

          const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

          prayerNames.forEach(prayer => {
              const originPrayerTime = new Date(currentDate);
              originPrayerTime.setHours(originTimings.data.timings[prayer].split(":")[0]);
              originPrayerTime.setMinutes(originTimings.data.timings[prayer].split(":")[1]);

              const destinationPrayerTime = new Date(currentDate);
              destinationPrayerTime.setHours(Number(destinationTimings.data.timings[prayer].split(":")[0]) + hoursDifference);
              destinationPrayerTime.setMinutes(destinationTimings.data.timings[prayer].split(":")[1]);


              // Check if this prayer time falls within the flight window
              if (originPrayerTime >= departureTime && originPrayerTime <= arrivalTime) {
                  const prayerTimeDuringFlight = SecretSauce(departureTime, arrivalTime, originPrayerTime, destinationPrayerTime).toLocaleString();
                  resultList += `${prayer} on ${currentDate.toLocaleDateString()} must be prayed at ${prayerTimeDuringFlight}. `;
              }
          });
      }
      $("#calculationList").text(resultList + "Times are in the timezone of the origin. These values may be incorrect as this feature is in beta");

  } catch (error) {
      console.error("Error:", error);
      alert(error.message); // Display the error message from the catch block
  }
};