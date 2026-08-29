async function loadCurrentWeather() {
    try {
        const response = await fetch("data.json");

        if (!response.ok) {
            throw new Error("تعذر قراءة ملف البيانات");
        }

        const data = await response.json();

        document.getElementById("station-status").textContent =
            data["station-status"];

        document.getElementById("day").textContent =
            data.day;

        document.getElementById("date").textContent =
            data.date;

        const items = [
            ["🌡️", "الحرارة", `${data.temperature}°`],
            ["💧", "الرطوبة", `${data.humidity}%`],
            ["🌬️", "سرعة الرياح", `${data.windSpeed} كم/س`]
        ];

        document.getElementById("current-data").innerHTML =
            items.map(item => `
                <div class="data-item">
                    <div class="label">${item[0]} ${item[1]}</div>
                    <div class="value">${item[2]}</div>
                </div>
            `).join("");

    } catch (error) {
        console.error(error);

        document.getElementById("station-status").textContent =
            "● غير متصلة";

        document.getElementById("current-data").textContent =
            "تعذر قراءة البيانات";
    }
}


function getWeatherIcon(code) {
    const icons = {
        29: "🌤️",
        30: "⛅",
        31: "🌙",
        32: "☀️",
        33: "🌙",
        34: "🌤️"
    };

    return icons[code] || "🌤️";
}


async function loadForecast() {
    try {
        const response = await fetch("forecast.json");

        if (!response.ok) {
            throw new Error("تعذر قراءة ملف التوقعات");
        }

        const data = await response.json();

        const days = data.dayOfWeek;
        const max = data.calendarDayTemperatureMax;
        const min = data.calendarDayTemperatureMin;
        const icons = data.iconCode;
        const chance = data.precipChance;

        document.getElementById("forecast").innerHTML =
            days.map((day, index) => {
                return `
                    <div class="forecast-row">
                        <div>${day}</div>

                        <div class="icon">
                            ${getWeatherIcon(icons[index])}
                        </div>

                        <div>
                            <strong>${max[index]}°</strong>
                        </div>

                        <div>
                            ${min[index]}°
                        </div>

                        <div>
                            ${chance[index] !== null &&
                              chance[index] !== undefined
                                ? `🌧️ ${chance[index]}%`
                                : ""}
                        </div>
                    </div>
                `;
            }).join("");

    } catch (error) {
        console.error(error);

        document.getElementById("forecast").textContent =
            "تعذر قراءة التوقعات";
    }
}


loadCurrentWeather();
loadForecast();


// تحديث البيانات تلقائياً كل دقيقة
setInterval(() => {
    loadCurrentWeather();
    loadForecast();
}, 60000);