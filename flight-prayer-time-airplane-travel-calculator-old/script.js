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

/*
[Log] originIshaTime: Tue May 20 2025 22:31:00 GMT-0400 (Eastern Daylight Time) (script.js, line 381)
[Log] destinationIshaTime: Wed May 21 2025 00:12:00 GMT-0400 (Eastern Daylight Time) (script.js, line 382)
[Log] originIshaTime: Tue May 20 2025 22:31:00 GMT-0400 (Eastern Daylight Time) (script.js, line 383)
[Log] destinationIshaTime: Wed May 21 2025 00:12:00 GMT-0400 (Eastern Daylight Time) (script.js, line 384)
// Should return Tue May 20, 2025 11:26:00 PM GMT-04:00 (Eastern Daylight Time) but it returns Tue May 20 2025 13:07:50 GMT-0400 (Eastern Daylight Time)
*/
// a = departureTime, b = arrivalTime, c = originIshaTime, d = destinationIshaTime
// a_date = departureTime, b_date = arrivalTime, c_date = originPrayerTime, d_date = destinationPrayerTime
function SecretSauce(a_date, b_date, c_date, d_date, prayer = "") {
    const a = a_date.getTime(); // departureTime ms
    const b = b_date.getTime(); // arrivalTime ms
    const c = c_date.getTime(); // originPrayerTime ms (absolute moment)
    const d = d_date.getTime(); // destinationPrayerTime ms (absolute moment)

    // If flight duration is zero or negative, or prayer isn't within this,
    // the calling condition (originPrayerTime >= departureTime && originPrayerTime <= arrivalTime)
    // should ideally prevent this. But as a safeguard:
    if (a >= b) { 
        // If no flight duration, prayer is at origin time if it's at or after departure.
        // Since c is already confirmed to be >= a and <=b (which means a=b=c here)
        return new Date(c); 
    }

    const flightDuration = b - a;
    // prayerShift can be negative if prayer is "earlier" at destination in absolute terms (e.g. flying east over IDL)
    const prayerShift = d - c;

    let result_ms = b; // Default to arrival time.
    let prayerTimeFound = false;

    // Iterate from departure time up to and including arrival time
    for (let i_ms = a; i_ms <= b; i_ms += 60000) { // 60000 ms = 1 minute
        let percentComplete;
        // flightDuration should not be 0 here due to a >= b check, but for safety:
        if (flightDuration === 0) { 
            percentComplete = (i_ms === a) ? 0 : 1; // Should only be 0 if i_ms = a = b
        } else {
            percentComplete = (i_ms - a) / flightDuration;
        }
        
        percentComplete = Math.max(0, Math.min(1, percentComplete)); // Clamp to [0, 1]

        const interpolatedPrayerTime_ms = c + (percentComplete * prayerShift);

        if (i_ms >= interpolatedPrayerTime_ms) {
            result_ms = i_ms; 
            prayerTimeFound = true;
            break; 
        }
    }
    // If not found, result_ms is 'b' (arrival), meaning prayer is effectively at/after arrival.
    return new Date(result_ms);
}

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


// Calculates the list of prayer times during the flight using 4 values-the city names and flight times
const CalculateList = async () => {
    // Get raw input strings
    const departureDateTimeString = $("#departureTime2").val(); // e.g., "28 May 2025 23:25"
    const arrivalDateTimeString = $("#arrivalTime2").val();     // e.g., "29 May 2025 23:25"
    const originCityCountry = $("#originCity").val();
    const destinationCityCountry = $("#destinationCity").val();

    const [originCity, originCountry] = originCityCountry.split(",").map(s => s.trim());
    const [destinationCity, destinationCountry] = destinationCityCountry.split(",").map(s => s.trim());

    if (!originCity || !originCountry || !destinationCity || !destinationCountry) {
        alert("Please provide the origin and destination cities in the format 'City, Country'.");
        return;
    }

    try {
        // --- 1. Determine Timezones and Parse Departure/Arrival Times ---
        let originTimeZone, destinationTimeZone;

        // Fetch prayer times for a sample date just to get timezone identifiers
        // Use departure string as a base for the sample date, parsed leniently by new Date() for this temporary purpose
        const sampleDateForTZ = new Date(departureDateTimeString.replace(/(\d+)\s(\w+)\s(\d+)/, '$2 $1, $3')); // "May 28, 2025" for new Date()
        
        try {
            const tempOriginData = await getPrayerTimings(originCity, originCountry, sampleDateForTZ);
            originTimeZone = tempOriginData.data.meta.timezone; // e.g., "America/Toronto"

            const tempDestData = await getPrayerTimings(destinationCity, destinationCountry, sampleDateForTZ);
            destinationTimeZone = tempDestData.data.meta.timezone; // e.g., "America/Los_Angeles"
        } catch (apiError) {
            console.error("API Error during timezone fetch:", apiError);
            alert("Error fetching timezone information from API: " + apiError.message);
            return;
        }

        if (!originTimeZone || !destinationTimeZone) {
            alert("Could not determine timezones for origin or destination.");
            return;
        }

        // Define the format flatpickr outputs and moment.js needs to parse
        // Flatpickr: "d M Y H:i" (e.g., "28 May 2025 23:25")
        // Moment.js: "D MMM YYYY HH:mm"
        const flatpickrMomentFormat = "D MMM YYYY HH:mm";

        const departureTime = moment.tz(departureDateTimeString, flatpickrMomentFormat, originTimeZone).toDate();
        const arrivalTime = moment.tz(arrivalDateTimeString, flatpickrMomentFormat, destinationTimeZone).toDate();

        if (isNaN(departureTime.getTime()) || isNaN(arrivalTime.getTime())) {
            alert("Invalid departure or arrival date/time format. Please check your inputs.");
            return;
        }

        if (arrivalTime.getTime() <= departureTime.getTime()) {
            alert("Arrival time must be after departure time.");
            return;
        }

        // --- 2. Calculate Number of Calendar Days Flight Spans (from origin's perspective) ---
        const departureMomentAtOrigin = moment(departureTime).tz(originTimeZone);
        const arrivalMomentAtOrigin = moment(arrivalTime).tz(originTimeZone); // Arrival time converted to origin's TZ

        // Get the start of the day for both in origin's timezone
        const startOfDepartureDayOriginTZ = departureMomentAtOrigin.clone().startOf('day');
        const startOfArrivalDayOriginTZ = arrivalMomentAtOrigin.clone().startOf('day');

        let flightCalendarDays = startOfArrivalDayOriginTZ.diff(startOfDepartureDayOriginTZ, 'days') + 1;
        if (flightCalendarDays <= 0) flightCalendarDays = 1; // Should always be at least 1

        // --- 3. Fetch Prayer Timings for Each Calendar Day ---
        let allOriginTimingsData = [];
        let allDestinationTimingsData = [];

        for (let i = 0; i < flightCalendarDays; i++) {
            const currentDateForAPI = departureMomentAtOrigin.clone().add(i, 'days').toDate();

            try {
                const originTimings = await getPrayerTimings(originCity, originCountry, currentDateForAPI);
                allOriginTimingsData.push(originTimings);

                const destinationTimings = await getPrayerTimings(destinationCity, destinationCountry, currentDateForAPI);
                allDestinationTimingsData.push(destinationTimings);
            } catch (apiError) {
                console.error(`API Error fetching prayer times for day ${i + 1}:`, apiError);
                alert(`Error fetching prayer times for ${currentDateForAPI.toLocaleDateString()}: ${apiError.message}`);
                // Optionally decide if you want to stop or continue with partial data
                return; 
            }
        }

        // --- 4. Process Prayer Timings and Calculate In-Flight Times ---
        let resultList = "";
        const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

        for (let dayIndex = 0; dayIndex < allOriginTimingsData.length; dayIndex++) {
            const originDayData = allOriginTimingsData[dayIndex].data;
            const destinationDayData = allDestinationTimingsData[dayIndex].data;

            // The date for these prayers (YYYY-MM-DD from API)
            const prayerDateStr = originDayData.date.gregorian.date; // e.g., "2025-05-28"
            const [pYear, pMonth, pDay] = prayerDateStr.split("-").map(Number);

            prayerNames.forEach(prayer => {
                const originPrayerHM = originDayData.timings[prayer].split(":"); // ["HH", "MM"]
                
                // Construct origin prayer time as a local moment, then convert to absolute Date object
                const localOriginPrayerMoment = moment.tz({
                    year: pYear, month: pMonth - 1, day: pDay, // moment month is 0-indexed
                    hour: parseInt(originPrayerHM[0]), minute: parseInt(originPrayerHM[1])
                }, originTimeZone);
                const absoluteOriginPrayerTime = localOriginPrayerMoment.toDate();

                // Check if this prayer's time AT ORIGIN is within the flight window
                if (absoluteOriginPrayerTime.getTime() >= departureTime.getTime() && 
                    absoluteOriginPrayerTime.getTime() <= arrivalTime.getTime()) {

                    const destPrayerHM = destinationDayData.timings[prayer].split(":");
                    
                    // Construct destination prayer time as a local moment, then convert to absolute Date object
                    // This is d_date for SecretSauce: the actual moment this prayer occurs at the destination.
                    const localDestPrayerMoment = moment.tz({
                        year: pYear, month: pMonth - 1, day: pDay, // Use same date context initially
                        hour: parseInt(destPrayerHM[0]), minute: parseInt(destPrayerHM[1])
                    }, destinationTimeZone);
                    const d_date_for_secretsauce = localDestPrayerMoment.toDate();
                    
                    const prayerTimeDuringFlight = SecretSauce(
                        departureTime, 
                        arrivalTime, 
                        absoluteOriginPrayerTime, 
                        d_date_for_secretsauce, 
                        prayer
                    );

                    // Display the date of the prayer as per origin's timezone perspective for clarity
                    const displayDate = localOriginPrayerMoment.format("ddd MMM D, YYYY");
                    resultList += `${prayer} on ${displayDate} must be prayed at ${prayerTimeDuringFlight.toLocaleString()}. \n`;
                }
            });
        }

        if (resultList === "") {
            resultList = "No prayer times fall within the specified flight duration.";
        }

        $("#calculationList").text("Prayer times: \n" + resultList + "\nTimes are displayed in your browser's local timezone. Refer to the date next to the prayer for the day of observance. Scroll down for notes.");
        $("#calculationList").html($("#calculationList").html().replace(/\n/g, '<br/>'));

    } catch (error) {
        console.error("Error in CalculateList:", error);
        // Display a user-friendly message for unexpected errors
        alert("An unexpected error occurred: " + error.message);
    }
};