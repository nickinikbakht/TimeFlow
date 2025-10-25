// ========================================
// FIREBASE CONFIGURATION
// ========================================
// REPLACE WITH YOUR FIREBASE CONFIG FROM:
// https://console.firebase.google.com/
// Project Settings > Your apps > Firebase SDK snippet > Config

const firebaseConfig = {
  apiKey: "AIzaSyBHVnwqJODo6VKim84q4lOaVqWan-8gxSg",
  authDomain: "timeflow-7d892.firebaseapp.com",
  databaseURL: "https://timeflow-7d892-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timeflow-7d892",
  storageBucket: "timeflow-7d892.firebasestorage.app",
  messagingSenderId: "146099935683",
  appId: "1:146099935683:web:960190ef61847d6edc4576",
  measurementId: "G-PFY9KR4FTN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ========================================
// GLOBAL STATE
// ========================================
let currentUser = null;
let appData = {
    tasks: [],
    events: [],
    journals: [],
    notes: [],
    currentFilter: 'all'
};

// Productivity tips
const productivityTips = [
    "Break large tasks into smaller, manageable chunks to avoid overwhelm.",
    "Use the Pomodoro Technique: 25 minutes of focused work, then a 5-minute break.",
    "Schedule your most important tasks during your peak energy hours.",
    "Review your day every evening and plan tomorrow before you sleep.",
    "Take regular breaks to maintain focus and prevent burnout.",
    "Eliminate distractions: turn off notifications during deep work sessions.",
    "Track your time to identify where you're spending (or wasting) hours.",
    "Set specific, measurable goals for each day and celebrate small wins.",
    "Learn to say 'no' to tasks that don't align with your priorities.",
    "Start your day with the hardest task (eat the frog!).",
    "Keep a 'done list' to see your accomplishments and boost motivation.",
    "Batch similar tasks together to minimize context switching.",
    "Use the 2-minute rule: if it takes less than 2 minutes, do it now.",
    "Create a distraction-free workspace dedicated to focused work.",
    "Review your progress weekly to adjust strategies and stay on track."
];

// ========================================
// AUTHENTICATION
// ========================================
auth.onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        showMainApp();
        loadUserData();
    } else {
        showLoginScreen();
    }
});

function switchLoginTab(tab) {
    var signinForm = document.getElementById('signinForm');
    var signupForm = document.getElementById('signupForm');
    var tabs = document.querySelectorAll('.login-tab');
    
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    
    if (tab === 'signin') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

function signIn() {
    var email = document.getElementById('signinEmail').value;
    var password = document.getElementById('signinPassword').value;
    var errorEl = document.getElementById('signinError');
    
    errorEl.textContent = '';
    
    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(function(error) {
            errorEl.textContent = error.message;
        });
}

function signUp() {
    var name = document.getElementById('signupName').value;
    var email = document.getElementById('signupEmail').value;
    var password = document.getElementById('signupPassword').value;
    var confirm = document.getElementById('signupConfirm').value;
    var errorEl = document.getElementById('signupError');
    
    errorEl.textContent = '';
    
    if (!name || !email || !password || !confirm) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(function() {
            return db.ref('users/' + auth.currentUser.uid + '/profile').set({
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
        })
        .catch(function(error) {
            errorEl.textContent = error.message;
        });
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    var name = currentUser.displayName || currentUser.email;
    document.getElementById('userName').textContent = 'Welcome, ' + name;
}

// ========================================
// DATA MANAGEMENT
// ========================================
function loadUserData() {
    if (!currentUser) return;
    
    db.ref('users/' + currentUser.uid + '/data')
    .once('value')
    .then(function(snapshot) {
        console.log("Snapshot:", snapshot);        // shows the raw snapshot
        var data = snapshot.val();
        console.log("Data from Firebase:", data);  // shows actual data

        if (data) {
            appData.tasks = data.tasks || [];
            appData.events = data.events || [];
            appData.journals = data.journals || [];
        }

        console.log("appData after loading:", appData);
        renderAll();
    });
}

function saveUserData() {
    if (!currentUser) return;
    
    db.ref('users/' + currentUser.uid + '/data').set({
        tasks: appData.tasks,
        events: appData.events,
        journals: appData.journals,
        lastUpdated: new Date().toISOString()
    });
}

function deleteAllData() {
    var confirmation = prompt('This will DELETE ALL YOUR DATA permanently. Type "DELETE" to confirm:');
    
    if (confirmation === 'DELETE') {
        if (!currentUser) return;
        
        db.ref('users/' + currentUser.uid + '/data').remove()
            .then(function() {
                appData = {
                    tasks: [],
                    events: [],
                    journals: [],
                    currentFilter: 'all'
                };
                renderAll();
                alert('All data has been deleted');
                document.getElementById('dangerZone').style.display = 'none';
            })
            .catch(function(error) {
                alert('Error deleting data: ' + error.message);
            });
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
    setupEventListeners();
    updateTodayDate();
    setDefaultTimes();
    setupDangerZone();
}

function setupDangerZone() {
    var pressCount = 0;
    var lastPress = 0;
    
    document.addEventListener('keydown', function(e) {
        if (e.shiftKey && e.ctrlKey && e.key === 'R') {
            var now = Date.now();
            if (now - lastPress < 1000) {
                pressCount++;
            } else {
                pressCount = 1;
            }
            lastPress = now;
            
            if (pressCount >= 3) {
                var dangerZone = document.getElementById('dangerZone');
                dangerZone.style.display = dangerZone.style.display === 'none' ? 'block' : 'none';
                pressCount = 0;
            }
        }
    });
}

function setupEventListeners() {
    var tabBtns = document.querySelectorAll('.tab');
    for (var i = 0; i < tabBtns.length; i++) {
        tabBtns[i].addEventListener('click', handleTabClick);
    }
    
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('newTaskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    document.getElementById('addEventBtn').addEventListener('click', addEvent);
    document.getElementById('addJournalBtn').addEventListener('click', addJournal);
    
    var filterBtns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < filterBtns.length; i++) {
        filterBtns[i].addEventListener('click', handleFilterClick);
    }
    
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('journalDate').value = today;
    document.getElementById('timelineDate').value = today;
}

function handleTabClick(e) {
    var tabName = e.target.getAttribute('data-tab');
    var tabs = document.querySelectorAll('.tab');
    var contents = document.querySelectorAll('.tab-content');
    
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    for (var i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }
    
    e.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    if (tabName === 'journal') {
        renderActivitySuggestions();
    } else if (tabName === 'timeline') {
        loadTimeline();
    }
}

function handleFilterClick(e) {
    appData.currentFilter = e.target.getAttribute('data-filter');
    var btns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
    }
    e.target.classList.add('active');
    renderTasks();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function setDefaultTimes() {
    var now = new Date();
    var endTime = now.toTimeString().slice(0, 5);
    document.getElementById('journalEndTime').value = endTime;
    
    var startTime = new Date(now.getTime() - 60 * 60 * 1000);
    document.getElementById('journalStartTime').value = startTime.toTimeString().slice(0, 5);
}

function setCurrentTime() {
    var now = new Date();
    var currentTime = now.toTimeString().slice(0, 5);
    document.getElementById('journalEndTime').value = currentTime;
}

function updateTodayDate() {
    var date = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDate').textContent = date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function calculateDuration(startTime, endTime) {
    var start = startTime.split(':');
    var end = endTime.split(':');
    
    var startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    var endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
    
    var diff = endMinutes - startMinutes;
    if (diff < 0) diff += 24 * 60;
    
    var hours = Math.floor(diff / 60);
    var minutes = diff % 60;
    
    if (hours > 0 && minutes > 0) {
        return hours + 'h ' + minutes + 'm';
    } else if (hours > 0) {
        return hours + 'h';
    } else {
        return minutes + 'm';
    }
}

function timeToMinutes(time) {
    var parts = time.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function checkOverlap(activities) {
    var overlaps = [];
    
    for (var i = 0; i < activities.length; i++) {
        for (var j = i + 1; j < activities.length; j++) {
            var a1 = activities[i];
            var a2 = activities[j];
            
            var start1 = timeToMinutes(a1.startTime);
            var end1 = timeToMinutes(a1.endTime);
            var start2 = timeToMinutes(a2.startTime);
            var end2 = timeToMinutes(a2.endTime);
            
            if (end1 < start1) end1 += 24 * 60;
            if (end2 < start2) end2 += 24 * 60;
            
            if (start1 < end2 && start2 < end1) {
                overlaps.push([a1.id, a2.id]);
            }
        }
    }
    
    return overlaps;
}

// ========================================
// TASKS
// ========================================
function addTask() {
    var input = document.getElementById('newTaskInput');
    var priority = document.getElementById('taskPriority').value;
    var category = document.getElementById('taskCategory').value;
    
    if (input.value.trim()) {
        appData.tasks.push({
            id: Date.now(),
            text: input.value.trim(),
            completed: false,
            priority: priority,
            category: category || 'General',
            createdAt: new Date().toISOString()
        });
        input.value = '';
        document.getElementById('taskCategory').value = '';
        saveUserData();
        renderAll();
    }
}

function toggleTask(id) {
    for (var i = 0; i < appData.tasks.length; i++) {
        if (appData.tasks[i].id === id) {
            appData.tasks[i].completed = !appData.tasks[i].completed;
            break;
        }
    }
    saveUserData();
    renderAll();
}

function deleteTask(id) {
    appData.tasks = appData.tasks.filter(function(t) { return t.id !== id; });
    saveUserData();
    renderAll();
}

function renderTasks() {
    var container = document.getElementById('tasksList');
    var filtered = appData.tasks;
    
    if (appData.currentFilter === 'active') {
        filtered = appData.tasks.filter(function(t) { return !t.completed; });
    } else if (appData.currentFilter === 'completed') {
        filtered = appData.tasks.filter(function(t) { return t.completed; });
    } else if (appData.currentFilter === 'high') {
        filtered = appData.tasks.filter(function(t) { return t.priority === 'high'; });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No tasks to show</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var t = filtered[i];
        html += '<div class="task-item">';
        html += '<div class="checkbox ' + (t.completed ? 'checked' : '') + '" onclick="toggleTask(' + t.id + ')"></div>';
        html += '<div class="task-text ' + (t.completed ? 'completed' : '') + '">' + escapeHtml(t.text) + '</div>';
        html += '<span class="priority-badge priority-' + t.priority + '">' + t.priority + '</span>';
        html += '<span class="tag">' + escapeHtml(t.category) + '</span>';
        html += '<button class="btn-delete" onclick="deleteTask(' + t.id + ')">Delete</button>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// ========================================
// EVENTS
// ========================================
function addEvent() {
    var title = document.getElementById('eventTitle').value;
    var date = document.getElementById('eventDate').value;
    var time = document.getElementById('eventTime').value;
    var recurring = document.getElementById('eventRecurring').value;
    var category = document.getElementById('eventCategory').value;
    
    if (title && date && time) {
        appData.events.push({
            id: Date.now(),
            title: title.trim(),
            date: date,
            time: time,
            recurring: recurring,
            category: category || 'General',
            createdAt: new Date().toISOString()
        });
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventCategory').value = '';
        saveUserData();
        renderAll();
    }
}

function deleteEvent(id) {
    appData.events = appData.events.filter(function(e) { return e.id !== id; });
    saveUserData();
    renderAll();
}

function renderEvents() {
    var container = document.getElementById('eventsList');
    var sorted = appData.events.slice().sort(function(a, b) {
        return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
    });
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state">No events scheduled</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < sorted.length; i++) {
        var e = sorted[i];
        html += '<div class="event-item"><div style="flex:1;">';
        html += '<div style="font-weight:600;font-size:16px;margin-bottom:5px;">' + escapeHtml(e.title) + '</div>';
        html += '<div style="color:#6b7280;font-size:14px;">📅 ' + e.date + ' at ' + e.time;
        if (e.recurring !== 'none') html += ' 🔄 ' + e.recurring;
        html += '</div><span class="tag">' + escapeHtml(e.category) + '</span></div>';
        html += '<button class="btn-delete" onclick="deleteEvent(' + e.id + ')">Delete</button></div>';
    }
    container.innerHTML = html;
}

// ========================================
// JOURNAL
// ========================================
function getUniqueActivities() {
    var activities = {};
    for (var i = 0; i < appData.journals.length; i++) {
        var title = appData.journals[i].title;
        if (title) {
            activities[title] = (activities[title] || 0) + 1;
        }
    }
    
    var sorted = Object.keys(activities).sort(function(a, b) {
        return activities[b] - activities[a];
    });
    
    return sorted.slice(0, 10);
}

function renderActivitySuggestions() {
    var container = document.getElementById('activitySuggestions');
    var activities = getUniqueActivities();
    
    if (activities.length === 0) {
        container.innerHTML = '<div style="color: #9ca3af; font-size: 14px;">Start logging activities to see suggestions here</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < activities.length; i++) {
        html += '<div class="activity-chip" onclick="selectActivity(\'' + escapeHtml(activities[i]).replace(/'/g, "\\'") + '\')">' + escapeHtml(activities[i]) + '</div>';
    }
    container.innerHTML = html;
}

function selectActivity(activity) {
    document.getElementById('journalTitle').value = activity;
    document.getElementById('journalTitle').focus();
}

function addJournal() {
    var title = document.getElementById('journalTitle').value;
    var content = document.getElementById('journalContent').value;
    var tags = document.getElementById('journalTags').value;
    var date = document.getElementById('journalDate').value;
    var startTime = document.getElementById('journalStartTime').value;
    var endTime = document.getElementById('journalEndTime').value;
    
    if (title && date && startTime && endTime) {
        var duration = calculateDuration(startTime, endTime);
        
        appData.journals.push({
            id: Date.now(),
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim(),
            date: date,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            createdAt: new Date().toISOString()
        });
        
        document.getElementById('journalTitle').value = '';
        document.getElementById('journalContent').value = '';
        document.getElementById('journalTags').value = '';
        setDefaultTimes();
        
        saveUserData();
        renderAll();
        renderActivitySuggestions();
    } else {
        alert('Please fill in activity name, date, start time, and end time');
    }
}

function deleteJournal(id) {
    appData.journals = appData.journals.filter(function(j) { return j.id !== id; });
    saveUserData();
    renderAll();
}

function renderJournals() {
    var container = document.getElementById('journalList');
    
    if (appData.journals.length === 0) {
        container.innerHTML = '<div class="empty-state">No activities logged yet. Start tracking what you do!</div>';
        return;
    }
    
    var journalsByDay = {};
    for (var i = 0; i < appData.journals.length; i++) {
        var j = appData.journals[i];
        var day = j.date;
        if (!journalsByDay[day]) {
            journalsByDay[day] = [];
        }
        journalsByDay[day].push(j);
    }
    
    var sortedDays = Object.keys(journalsByDay).sort().reverse();
    
    var html = '';
    for (var d = 0; d < sortedDays.length; d++) {
        var day = sortedDays[d];
        var dayJournals = journalsByDay[day];
        
        dayJournals.sort(function(a, b) {
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });
        
        var overlaps = checkOverlap(dayJournals);
        var overlapIds = [];
        for (var o = 0; o < overlaps.length; o++) {
            overlapIds.push(overlaps[o][0], overlaps[o][1]);
        }
        
        var dayDate = new Date(day);
        html += '<div class="day-separator">📅 ' + dayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (overlaps.length > 0) {
            html += ' ⚠️ ' + overlaps.length + ' overlap(s) detected';
        }
        html += '</div>';
        
        for (var i = 0; i < dayJournals.length; i++) {
            var j = dayJournals[i];
            var isOverlap = overlapIds.indexOf(j.id) !== -1;
            
            html += '<div class="journal-item' + (isOverlap ? ' overlap' : '') + '"><div class="journal-entry">';
            html += '<div class="journal-title">' + escapeHtml(j.title) + '</div>';
            html += '<div class="journal-time">⏰ ' + j.startTime + ' - ' + j.endTime + ' <span class="duration">' + j.duration + '</span>';
            if (isOverlap) html += ' <span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">⚠️ Overlap</span>';
            html += '</div>';
            if (j.content) html += '<div class="journal-content">' + escapeHtml(j.content) + '</div>';
            if (j.tags) html += '<div style="margin-top:8px;"><span class="tag">' + escapeHtml(j.tags) + '</span></div>';
            html += '</div><button class="btn-delete" onclick="deleteJournal(' + j.id + ')">Delete</button></div>';
        }
    }
    
    container.innerHTML = html;
}

// ========================================
// TIMELINE VIEW
// ========================================
function loadTimeline() {
    var date = document.getElementById('timelineDate').value;
    renderTimeline(date);
}

function renderTimeline(date) {
    var container = document.getElementById('timelineView');
    
    var dayJournals = appData.journals.filter(function(j) {
        return j.date === date;
    });
    
    if (dayJournals.length === 0) {
        container.innerHTML = '<div class="empty-state">No activities logged for this date</div>';
        return;
    }
    
    dayJournals.sort(function(a, b) {
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
    
    var overlaps = checkOverlap(dayJournals);
    var overlapIds = [];
    for (var o = 0; o < overlaps.length; o++) {
        overlapIds.push(overlaps[o][0], overlaps[o][1]);
    }
    
    var html = '';
    
    if (overlaps.length > 0) {
        html += '<div class="overlap-warning">⚠️ Warning: ' + overlaps.length + ' time overlap(s) detected on this day!</div>';
    }
    
    html += '<div class="timeline-container"><div class="timeline-hours">';
    
    for (var hour = 0; hour < 24; hour++) {
        html += '<div class="timeline-hour">';
        html += '<div class="timeline-hour-label">' + (hour < 10 ? '0' : '') + hour + ':00</div>';
        html += '</div>';
    }
    
    for (var i = 0; i < dayJournals.length; i++) {
        var j = dayJournals[i];
        var startMin = timeToMinutes(j.startTime);
        var endMin = timeToMinutes(j.endTime);
        if (endMin < startMin) endMin += 24 * 60;
        
        var topPos = (startMin / 60) * 60;
        var height = ((endMin - startMin) / 60) * 60;
        var isOverlap = overlapIds.indexOf(j.id) !== -1;
        
        html += '<div class="timeline-activity' + (isOverlap ? ' overlap' : '') + '" style="top:' + topPos + 'px;height:' + height + 'px;width:calc(100% - 20px);" title="' + escapeHtml(j.title) + ' (' + j.startTime + ' - ' + j.endTime + ')">';
        html += escapeHtml(j.title) + ' (' + j.duration + ')';
        html += '</div>';
    }
    
    html += '</div></div>';
    
    container.innerHTML = html;
}

// ========================================
// TODAY VIEW
// ========================================
function renderToday() {
    var today = new Date().toISOString().split('T')[0];
    
    var todayEvents = appData.events.filter(function(e) { return e.date === today; });
    var container = document.getElementById('todayEvents');
    if (todayEvents.length === 0) {
        container.innerHTML = '<div class="empty-state">No events today</div>';
    } else {
        var html = '';
        for (var i = 0; i < todayEvents.length; i++) {
            var e = todayEvents[i];
            html += '<div class="event-item" style="background:linear-gradient(135deg,#dbeafe 0%,#e0e7ff 100%);">';
            html += '<div style="flex:1;"><div style="font-weight:600;">' + escapeHtml(e.title) + '</div>';
            html += '<div style="color:#4338ca;margin-top:5px;">⏰ ' + e.time + '</div></div></div>';
        }
        container.innerHTML = html;
    }
    
    var pending = appData.tasks.filter(function(t) { return !t.completed; }).slice(0, 5);
    var tasksContainer = document.getElementById('todayTasks');
    if (pending.length === 0) {
        tasksContainer.innerHTML = '<div class="empty-state">All tasks completed! 🎉</div>';
    } else {
        var html = '';
        for (var i = 0; i < pending.length; i++) {
            var t = pending[i];
            html += '<div class="task-item">';
            html += '<div class="checkbox" onclick="toggleTask(' + t.id + ')"></div>';
            html += '<div class="task-text">' + escapeHtml(t.text) + '</div>';
            html += '<span class="priority-badge priority-' + t.priority + '">' + t.priority + '</span></div>';
        }
        tasksContainer.innerHTML = html;
    }
    
    var todayJournals = appData.journals.filter(function(j) {
        return j.date === today;
    });
    var journalContainer = document.getElementById('todayJournal');
    if (todayJournals.length === 0) {
        journalContainer.innerHTML = '<div class="empty-state">No activities recorded today</div>';
    } else {
        var html = '';
        var totalMinutes = 0;
        for (var i = 0; i < todayJournals.length; i++) {
            var j = todayJournals[i];
            var start = timeToMinutes(j.startTime);
            var end = timeToMinutes(j.endTime);
            var diff = end - start;
            if (diff < 0) diff += 24 * 60;
            totalMinutes += diff;
            
            html += '<div class="journal-item"><div class="journal-entry">';
            html += '<div class="journal-title">' + escapeHtml(j.title) + '</div>';
            html += '<div class="journal-time">⏰ ' + j.startTime + ' - ' + j.endTime + ' <span class="duration">' + j.duration + '</span></div>';
            if (j.content) html += '<div class="journal-content">' + escapeHtml(j.content) + '</div>';
            html += '</div></div>';
        }
        var totalHours = Math.floor(totalMinutes / 60);
        var totalMins = totalMinutes % 60;
        html = '<div style="background:#f0fdf4;padding:12px;border-radius:8px;margin-bottom:15px;font-weight:600;color:#166534;">Total time tracked today: ' + totalHours + 'h ' + totalMins + 'm</div>' + html;
        journalContainer.innerHTML = html;
    }
}

// ========================================
// ANALYTICS
// ========================================
function renderAnalytics() {
    document.getElementById('totalTasks').textContent = appData.tasks.length;
    var completed = 0;
    for (var i = 0; i < appData.tasks.length; i++) {
        if (appData.tasks[i].completed) completed++;
    }
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('totalEvents').textContent = appData.events.length;
    document.getElementById('totalJournals').textContent = appData.journals.length;
    
    var rate = appData.tasks.length > 0 ? Math.round((completed / appData.tasks.length) * 100) : 0;
    var high = 0;
    var med = 0;
    var low = 0;
    
    for (var i = 0; i < appData.tasks.length; i++) {
        if (appData.tasks[i].priority === 'high') high++;
        else if (appData.tasks[i].priority === 'medium') med++;
        else if (appData.tasks[i].priority === 'low') low++;
    }
    

}