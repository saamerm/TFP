const DateTime = luxon.DateTime;
let originZone = "UTC";
let destZone = "UTC";
let calculatedPrayers = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Date Pickers
    const now = new Date();
    flatpickr("#depTime", { enableTime: true, dateFormat: "Y-m-d H:i", defaultDate: new Date(now.getTime() + 10*60000), minuteIncrement: 5 });
    flatpickr("#arrTime", { enableTime: true, dateFormat: "Y-m-d H:i", defaultDate: new Date(now.getTime() + 3*60*60000), minuteIncrement: 5 });

    // 2. Toggles & Auto-detect
    document.getElementById('tzToggle').addEventListener('change', (e) => renderResults(e.target.checked ? destZone : originZone));
    detectUserLocation();
});

// --- API: IP LOCATION ---
async function detectUserLocation() {
    try {
        const res = await fetch('https://ipinfo.io/json?token='); 
        const data = await res.json();
        if (data.city && data.country) {
            document.getElementById('origin').value = `${data.city}, ${data.region}, ${data.country}`;
            document.getElementById('loc-detected').classList.remove('hidden');
        }
    } catch(e) { console.log("IP Detect failed"); }
}

// --- MAIN CALCULATION ---
async function calculate() {
    const btn = document.getElementById('calcBtn');
    const statusMsg = document.getElementById('statusMsg');
    const resultsArea = document.getElementById('resultsArea');
    
    // UI Reset
    statusMsg.classList.add('hidden');
    resultsArea.classList.add('hidden');
    statusMsg.className = "mt-4 text-center text-sm p-2 rounded hidden"; 
    btn.disabled = true;
    btn.innerHTML = '<span class="loader mr-2"></span> Calculating...';

    try {
        // 1. Get Inputs (Fresh from DOM)
        const oVal = document.getElementById('origin').value;
        const dVal = document.getElementById('destination').value;
        const dStr = document.getElementById('depTime').value;
        const aStr = document.getElementById('arrTime').value;

        if(!oVal || !dVal || !dStr || !aStr) throw new Error("Please fill in all fields.");

        // 2. Geocode
        updateStatus("Locating cities...", "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300");
        const startLoc = await geocode(oVal);
        const endLoc = await geocode(dVal);
        
        if(!startLoc) throw new Error(`Could not locate "${oVal}".`);
        if(!endLoc) throw new Error(`Could not locate "${dVal}".`);

        // Display found route to user for verification
        document.getElementById('route-info').innerHTML = `Route: <b>${startLoc.name}</b> to <b>${endLoc.name}</b>`;

        // 3. Timezones
        updateStatus("Determining timezones...", "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300");
        originZone = await getTimezone(startLoc.lat, startLoc.lon);
        destZone = await getTimezone(endLoc.lat, endLoc.lon);

        // 4. Time Math
        const depTime = DateTime.fromFormat(dStr, "yyyy-MM-dd HH:mm", { zone: originZone });
        const arrTime = DateTime.fromFormat(aStr, "yyyy-MM-dd HH:mm", { zone: destZone });

        if (!depTime.isValid || !arrTime.isValid) throw new Error("Invalid date format.");
        
        const durationMins = arrTime.diff(depTime, 'minutes').minutes;
        if (durationMins <= 0) throw new Error("Arrival time must be after Departure.");

        // 5. Run Physics
        updateStatus("Simulating flight path...", "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300");
        calculatedPrayers = runSimulation(startLoc, endLoc, depTime, durationMins);

        // 6. Display
        document.getElementById('tzToggle').checked = false; // Reset to Origin
        renderResults(originZone);
        
        resultsArea.classList.remove('hidden');
        resultsArea.scrollIntoView({ behavior: 'smooth' });
        statusMsg.classList.add('hidden'); 

    } catch (err) {
        updateStatus(err.message, "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Calculate Prayers';
    }
}

function updateStatus(msg, classes) {
    const el = document.getElementById('statusMsg');
    el.className = `mt-4 text-center text-sm p-2 rounded ${classes}`;
    el.innerText = msg;
    el.classList.remove('hidden');
}

// --- GEOCODING (Photon -> Open-Meteo -> Nominatim) ---
async function geocode(query) {
    if (!query) return null;
    let name = query;

    // 1. Photon (Best for City, Country)
    try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
            const [lon, lat] = data.features[0].geometry.coordinates;
            // Photon returns detailed props, let's grab name
            const props = data.features[0].properties;
            const dispName = props.name + (props.country ? `, ${props.country}` : '');
            return { lat, lon, name: dispName };
        }
    } catch (e) {}

    // 2. Open-Meteo (Backup)
    try {
        const simpleQuery = query.split(',')[0].trim();
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(simpleQuery)}&count=1&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const r = data.results[0];
            return { lat: r.latitude, lon: r.longitude, name: `${r.name}, ${r.country}` };
        }
    } catch (e) {}

    // 3. Nominatim (Last Resort)
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
        }
    } catch (e) {}

    return null;
}

// --- TIMEZONE (Open-Meteo Primary) ---
async function getTimezone(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.timezone) return data.timezone;
    } catch (e) {}
    
    // Backup
    try {
        const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.timeZone || "UTC";
    } catch (e) { return "UTC"; }
}

// --- FLIGHT SIMULATION ---
function runSimulation(start, end, depTimeObj, duration) {
    const results = [];
    const seen = new Set();
    const step = 5; // Check every 5 minutes
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    for (let t = 0; t <= duration; t += step) {
        // Location Interpolation
        const fraction = t / duration;
        const curLat = start.lat + (end.lat - start.lat) * fraction;
        const curLon = start.lon + (end.lon - start.lon) * fraction;

        // Current Flight Time (Absolute)
        const flightInstant = depTimeObj.plus({ minutes: t }); 

        // Adhan Calculation
        const coords = new adhan.Coordinates(curLat, curLon);
        const date = flightInstant.toJSDate();
        const params = adhan.CalculationMethod.MoonsightingCommittee();
        params.madhab = adhan.Madhab.Hanafi;
        // IMPORTANT: Handle High Latitudes (Arctic Route)
        params.highLatitudeRule = adhan.HighLatitudeRule.SeventhOfTheNight;

        const prayers = new adhan.PrayerTimes(coords, date, params);
        
        prayerNames.forEach(p => {
            if (!prayers[p]) return;

            const pTime = DateTime.fromJSDate(prayers[p]).toUTC();
            const fTime = flightInstant.toUTC();
            const diff = fTime.diff(pTime, 'minutes').minutes;

            // CROSSING LOGIC FIX:
            // "Did the prayer start roughly now?"
            // We widen the window to 0-25 mins to catch "fast forwarding" time zones.
            // (Flying East can compress 1 hour of sun-time into 10 mins of flight-time)
            if (diff >= 0 && diff < 25) {
                const id = `${p}-${fTime.toFormat('dd')}`; // Unique per day
                
                if(!seen.has(id)) {
                    seen.add(id);
                    results.push({
                        name: p.charAt(0).toUpperCase() + p.slice(1),
                        isoTime: fTime.toISO(),
                        lat: curLat,
                        lon: curLon
                    });
                }
            }
        });
    }
    return results.sort((a,b) => DateTime.fromISO(a.isoTime) - DateTime.fromISO(b.isoTime));
}

// --- RENDER ---
function renderResults(displayZone) {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';

    if(calculatedPrayers.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400">No prayer times found during this flight window.</div>';
        return;
    }

    calculatedPrayers.forEach((p, idx) => {
        const timeObj = DateTime.fromISO(p.isoTime).setZone(displayZone);
        const timeStr = timeObj.toFormat("hh:mm a");
        const dateStr = timeObj.toFormat("MMM dd");
        const zoneName = displayZone.split('/')[1]?.replace('_', ' ') || "Local";
        const isLast = idx === calculatedPrayers.length - 1;

        const html = `
        <div class="relative pl-8 pb-8">
            ${!isLast ? '<div class="absolute left-[15px] top-[35px] bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>' : ''}
            <div class="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-darkBorder shadow flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm z-10">
                <i class="fa-solid fa-mosque"></i>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-lg hover:shadow-md transition">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-lg text-blue-900 dark:text-blue-400">${p.name}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <i class="fa-solid fa-location-crosshairs"></i> ${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-xl text-gray-800 dark:text-gray-100">${timeStr}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${dateStr} <span class="uppercase font-bold text-[10px] bg-gray-200 dark:bg-gray-700 px-1 rounded ml-1">${zoneName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}