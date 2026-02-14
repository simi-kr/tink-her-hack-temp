
let medicines = JSON.parse(localStorage.getItem("medicines")) || [];
let doctors = [];
let labs = [];
let history = [];

// Alarm and voice note setup
let alarmTimeouts = [];
function scheduleAlarms() {
    // Clear previous alarms
    alarmTimeouts.forEach(timeout => clearTimeout(timeout));
    alarmTimeouts = [];
    const now = new Date();
    medicines.forEach(med => {
        const [hour, minute] = med.time.split(":");
        const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
        let delay = alarmTime - now;
        if (delay < 0) return; // Skip past times
        alarmTimeouts.push(setTimeout(() => {
            ringAlarm(med);
        }, delay));
    });
}

function ringAlarm(med) {
    const soundToggle = document.getElementById("soundToggle").checked;
    const language = document.getElementById("languageSelect").value;
    let message = `Time to take your medicine: ${med.name}`;
    if (language === "malayalam") {
        message = `നിങ്ങളുടെ മരുന്ന് എടുക്കാനുള്ള സമയം: ${med.name}`;
    }
    if (soundToggle) {
        // Play alarm sound
        let audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
        audio.play();
    } else {
        // Speak voice note
        speakVoiceNote(message);
    }
    alert(message);
}

function speakVoiceNote(text) {
    if ('speechSynthesis' in window) {
        let utter = new SpeechSynthesisUtterance(text);
        let voices = window.speechSynthesis.getVoices();
        let selectedVoice = document.getElementById("voiceSelect").value;
        utter.voice = voices.find(v => v.name === selectedVoice) || null;
        window.speechSynthesis.speak(utter);
    }
}

// Populate voice options
window.addEventListener('DOMContentLoaded', () => {
    let voiceSelect = document.getElementById("voiceSelect");
    function loadVoices() {
        let voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = "";
        voices.forEach(voice => {
            let option = document.createElement("option");
            option.value = voice.name;
            option.text = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    scheduleAlarms();
});

function login() {
    let user = document.getElementById("username").value;
    if(user) {
        localStorage.setItem("user", user);
        document.getElementById("landingPage").classList.add("hidden");
        document.getElementById("mainPage").classList.remove("hidden");
        document.getElementById("displayUser").innerText = user;
        document.getElementById("chatToggle").classList.remove("hidden");
        updateDashboard();
    }
}

function logout() {
    location.reload();
}

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
    });
    document.getElementById(id).classList.add("active");
}

function addMedicine() {
    let name = document.getElementById("medName").value;
    let time = document.getElementById("medTime").value;

    if(name && time) {
        medicines.push({name, time});
        localStorage.setItem("medicines", JSON.stringify(medicines));
        displaySchedule();
        updateDashboard();
        scheduleAlarms();
    }
}

function displaySchedule() {
    let list = document.getElementById("scheduleList");
    let noMsg = document.getElementById("noScheduleMsg");
    list.innerHTML = "";
    if (medicines.length === 0) {
        if (noMsg) noMsg.style.display = "block";
        return;
    } else if (noMsg) {
        noMsg.style.display = "none";
    }
    medicines.forEach((med, idx) => {
        let li = document.createElement("li");
        li.innerText = med.name + " at " + med.time + " ";
        let delBtn = document.createElement("button");
        delBtn.innerText = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = function() { deleteMedicine(idx); };
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function deleteMedicine(idx) {
    medicines.splice(idx, 1);
    localStorage.setItem("medicines", JSON.stringify(medicines));
    displaySchedule();
    updateDashboard();
    scheduleAlarms();
}

function updateDashboard() {
    document.getElementById("totalMed").innerText = medicines.length;
    displaySchedule();
    displayHistory();
}

function displayHistory() {
    let list = document.getElementById("historyList");
    let noMsg = document.getElementById("noHistoryMsg");
    let hist = JSON.parse(localStorage.getItem("history")) || [];
    list.innerHTML = "";
    if (hist.length === 0) {
        if (noMsg) noMsg.style.display = "block";
        return;
    } else if (noMsg) {
        noMsg.style.display = "none";
    }
    hist.forEach((item, idx) => {
        let li = document.createElement("li");
        li.innerText = item;
        let delBtn = document.createElement("button");
        delBtn.innerText = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = function() { deleteHistory(idx); };
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function deleteHistory(idx) {
    let hist = JSON.parse(localStorage.getItem("history")) || [];
    hist.splice(idx, 1);
    localStorage.setItem("history", JSON.stringify(hist));
    displayHistory();
}
function generateReport() {
    let reportDiv = document.getElementById("reportContent");
    let medCount = medicines.length;
    let hist = JSON.parse(localStorage.getItem("history")) || [];
    let report = `<h3>Health Summary</h3>`;
    report += `<p>Total Medicines: ${medCount}</p>`;
    report += `<p>History Records: ${hist.length}</p>`;
    if (hist.length > 0) {
        report += `<ul>` + hist.map(h => `<li>${h}</li>`).join('') + `</ul>`;
    }
    reportDiv.innerHTML = report;
}

function addDoctor() {
    let name = document.getElementById("docName").value;
    let phone = document.getElementById("docPhone").value;
    doctors.push({name, phone});
    let li = document.createElement("li");
    li.innerText = name + " - " + phone;
    document.getElementById("doctorList").appendChild(li);
    // Add to history
    let hist = JSON.parse(localStorage.getItem("history")) || [];
    let today = new Date();
    let dateStr = today.toLocaleDateString();
    hist.push(`${dateStr}: Added doctor ${name} (${phone})`);
    localStorage.setItem("history", JSON.stringify(hist));
    displayHistory();
}
window.addEventListener('DOMContentLoaded', () => {
    displayHistory();
    let reportDiv = document.getElementById("reportContent");
    if (reportDiv) reportDiv.innerHTML = '';
});

function addLab() {
    let test = document.getElementById("labTest").value;
    labs.push(test);
    let li = document.createElement("li");
    li.innerText = test;
    document.getElementById("labList").appendChild(li);
}

// Chatbox
function toggleChatbox() {
    let chatbox = document.getElementById("chatbox");
    let toggle = document.getElementById("chatToggle");
    if (chatbox.classList.contains("hidden")) {
        chatbox.classList.remove("hidden");
    } else {
        chatbox.classList.add("hidden");
    }
}

// AI Health Tips
const healthTips = [
    "Stay hydrated by drinking enough water daily.",
    "Take your medicines on time for best results.",
    "Maintain a balanced diet rich in fruits and vegetables.",
    "Engage in light physical activity as recommended by your doctor.",
    "Keep regular contact with your healthcare provider.",
    "Wash your hands frequently to prevent infections.",
    "Monitor your blood pressure and sugar levels regularly if advised.",
    "Get enough sleep to help your body recover.",
    "Avoid skipping meals and eat at regular intervals.",
    "Keep emergency contacts easily accessible."
];

function generateHealthTip() {
    const list = document.getElementById("healthTipsList");
    if (!list) return;
    // Pick a random tip not currently shown
    let currentTips = Array.from(list.children).map(li => li.innerText);
    let available = healthTips.filter(tip => !currentTips.includes(tip));
    let tip;
    if (available.length === 0) {
        tip = healthTips[Math.floor(Math.random() * healthTips.length)];
    } else {
        tip = available[Math.floor(Math.random() * available.length)];
    }
    let li = document.createElement("li");
    li.innerText = tip;
    list.appendChild(li);
    // Optionally, scroll to new tip
    list.scrollTop = list.scrollHeight;
}

function sendChatMessage() {
    let input = document.getElementById("chatInput");
    let text = input.value.trim();
    if (!text) return;
    input.value = "";

    let container = document.getElementById("chatMessages");
    let userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.innerHTML = "<p>" + escapeHtml(text) + "</p>";
    container.appendChild(userMsg);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
        let reply = getChatResponse(text);
        let botMsg = document.createElement("div");
        botMsg.className = "chat-msg bot";
        botMsg.innerHTML = "<p>" + escapeHtml(reply) + "</p>";
        container.appendChild(botMsg);
        container.scrollTop = container.scrollHeight;
    }, 500);
}

function escapeHtml(text) {
    let div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function getChatResponse(text) {
    let t = text.toLowerCase();
    if (t.includes("medicine") && t.includes("add")) return "To add a medicine, go to Add Medicine from the sidebar, enter the name and time, then click Add.";
    if (t.includes("schedule") || t.includes("today")) return "Your today's schedule is in Today's Schedule. You can also check the Dashboard for a quick overview.";
    if (t.includes("alarm") || t.includes("reminder")) return "Alarm and reminder settings are on the Dashboard. You can choose voice or sound, and the language (English or Malayalam).";
    if (t.includes("doctor") || t.includes("contact")) return "You can add and view doctor contacts under Doctor Contact in the sidebar.";
    if (t.includes("help") || t.includes("hi") || t.includes("hello")) return "I can help with medicines, schedule, alarms, and doctor contacts. What would you like to know?";
    return "Thanks for your message! For medicine reminders, schedules, and contacts, use the sidebar menu. Need something specific?";
}