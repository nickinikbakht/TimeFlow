// ========================================
// ========================================
// FIREBASE CONFIGURATION
// ========================================
// TEST_MODE: Set to true to use app WITHOUT Firebase (localStorage only)
// Set to false when you have Firebase configured

const TEST_MODE = true; // ← CHANGE THIS TO false WHEN FIREBASE IS READY

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

let db = null;
let auth = null;
let isFirebaseConfigured = false;

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
// INITIALIZE FIREBASE (ONLY IF NOT IN TEST MODE)
// ========================================
if (!TEST_MODE) {
    try {
        if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            auth = firebase.auth();
            isFirebaseConfigured = true;
            console.log('✅ Firebase initialized successfully');
        } else {
            console.warn('⚠️ Firebase config not set. Using TEST_MODE.');
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
    }
}

// ========================================
// AUTHENTICATION
// ========================================

// In TEST MODE, auto-login immediately when page loads
if (TEST_MODE) {
    // Don't wait for anything, go straight to app
    currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🧪 TEST MODE: Auto-login active');
            showMainApp();
            loadUserData();
        });
    } else {
        console.log('🧪 TEST MODE: Auto-login active');
        showMainApp();
        loadUserData();
    }
} else if (auth) {
    // Use Firebase authentication
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            console.log('✅ User signed in:', user.email);
            showMainApp();
            loadUserData();
        } else {
            console.log('❌ No user signed in');
            showLoginScreen();
        }
    });
} else {
    // Firebase not configured and not in test mode
    console.error('❌ Firebase not configured. Enable TEST_MODE or configure Firebase.');
    showLoginScreen();
}

function switchLoginTab(tab) {
    console.log('Switching to tab:', tab);
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
    console.log('Sign in attempted');
    
    if (TEST_MODE) {
        alert('TEST MODE: Firebase not configured. Data will save to localStorage only.');
        currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };
        showMainApp();
        loadUserData();
        return;
    }
    
    var email = document.getElementById('signinEmail').value;
    var password = document.getElementById('signinPassword').value;
    var errorEl = document.getElementById('signinError');
    
    errorEl.textContent = '';
    
    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    if (!auth) {
        errorEl.textContent = 'Firebase not initialized. Please configure Firebase in app.js';
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            console.log('Sign in successful');
        })
        .catch(function(error) {
            console.error('Sign in error:', error);
            errorEl.textContent = error.message;
        });
}

function signUp() {
    console.log('Sign up attempted');
    
    if (TEST_MODE) {
        alert('TEST MODE: Firebase not configured. Data will save to localStorage only.');
        currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };
        showMainApp();
        loadUserData();
        return;
    }
    
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
    
    if (!auth) {
        errorEl.textContent = 'Firebase not initialized. Please configure Firebase in app.js';
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            console.log('Account created successfully');
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(function() {
            if (db) {
                return db.ref('users/' + auth.currentUser.uid + '/profile').set({
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });
            }
        })
        .then(function() {
            console.log('Profile saved');
        })
        .catch(function(error) {
            console.error('Sign up error:', error);
            errorEl.textContent = error.message;
        });
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut();
    }
}

function showLoginScreen() {
    console.log('📱 Showing login screen');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    console.log('📱 Showing main app');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    var name = 'User';
    if (currentUser) {
        name = currentUser.displayName || currentUser.email || 'User';
    }
    
    var userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = 'Welcome, ' + name;
    }
    
    // Update sync status
    var syncStatusEl = document.getElementById('syncStatus');
    var syncTextEl = document.getElementById('syncText');
    if (syncStatusEl && syncTextEl) {
        if (TEST_MODE) {
            syncStatusEl.className = 'sync-status';
            syncStatusEl.style.background = '#fef3c7';
            syncStatusEl.style.color = '#92400e';
            syncTextEl.textContent = '💾 Local Storage';
        } else if (isFirebaseConfigured) {
            syncStatusEl.className = 'sync-status online';
            syncTextEl.textContent = '🟢 Cloud Synced';
        }
    }
}

// ========================================
// DATA MANAGEMENT
// ========================================
function loadUserData() {
    if (!currentUser) return;
    
    if (TEST_MODE || !isFirebaseConfigured) {
        // Load from localStorage in test mode
        try {
            var saved = localStorage.getItem('timeflow-testdata');
            if (saved) {
                var data = JSON.parse(saved);
                appData.tasks = data.tasks || [];
                appData.events = data.events || [];
                appData.journals = data.journals || [];
                appData.notes = data.notes || [];
            }
        } catch (err) {
            console.error('Error loading local data:', err);
        }
        renderAll();
        setLastEndTimeAsStartTime();
        return;
    }
    
    db.ref('users/' + currentUser.uid + '/data').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (data) {
            appData.tasks = data.tasks || [];
            appData.events = data.events || [];
            appData.journals = data.journals || [];
            appData.notes = data.notes || [];
        }
        renderAll();
        setLastEndTimeAsStartTime();
    });
}

function saveUserData() {
    if (!currentUser) return;
    
    if (TEST_MODE || !isFirebaseConfigured) {
        // Save to localStorage in test mode
        try {
            localStorage.setItem('timeflow-testdata', JSON.stringify({
                tasks: appData.tasks,
                events: appData.events,
                journals: appData.journals,
                notes: appData.notes,
                lastUpdated: new Date().toISOString()
            }));
            console.log('💾 Data saved to localStorage');
        } catch (err) {
            console.error('Error saving local data:', err);
        }
        return;
    }
    
    db.ref('users/' + currentUser.uid + '/data').set({
        tasks: appData.tasks,
        events: appData.events,
        journals: appData.journals,
        notes: appData.notes,
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
    console.log('🎬 Initializing app...');
    setupEventListeners();
    updateTodayDate();
    setDefaultTimes();
    setupDangerZone();
    showRandomProductivityTip();
    console.log('✅ App initialized successfully');
    
    // Debug info
    console.log('📊 Current state:');
    console.log('- Tasks:', appData.tasks.length);
    console.log('- Events:', appData.events.length);
    console.log('- Journals:', appData.journals.length);
    console.log('- Notes:', appData.notes.length);
}

function showRandomProductivityTip() {
    var tip = productivityTips[Math.floor(Math.random() * productivityTips.length)];
    document.getElementById('productivityTip').textContent = tip;
}

function setLastEndTimeAsStartTime() {
    if (appData.journals.length === 0) return;
    
    var sortedJournals = appData.journals.slice().sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    var lastEntry = sortedJournals[0];
    if (lastEntry && lastEntry.endTime) {
        document.getElementById('journalStartTime').value = lastEntry.endTime;
    }
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
    console.log('🔧 Setting up event listeners...');
    
    // Tab navigation
    var tabBtns = document.querySelectorAll('.tab');
    console.log('Found', tabBtns.length, 'tab buttons');
    for (var i = 0; i < tabBtns.length; i++) {
        tabBtns[i].addEventListener('click', handleTabClick);
    }
    
    // Task button
    var addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
        console.log('✅ Task button listener added');
    } else {
        console.error('❌ Task button not found');
    }
    
    // Task input enter key
    var taskInput = document.getElementById('newTaskInput');
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        console.log('✅ Task input listener added');
    } else {
        console.error('❌ Task input not found');
    }
    
    // Event button
    var addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', addEvent);
        console.log('✅ Event button listener added');
    } else {
        console.error('❌ Event button not found');
    }
    
    // Journal button
    var addJournalBtn = document.getElementById('addJournalBtn');
    if (addJournalBtn) {
        addJournalBtn.addEventListener('click', addJournal);
        console.log('✅ Journal button listener added');
    } else {
        console.error('❌ Journal button not found');
    }
    
    // Filter buttons
    var filterBtns = document.querySelectorAll('.filter-btn');
    console.log('Found', filterBtns.length, 'filter buttons');
    for (var i = 0; i < filterBtns.length; i++) {
        filterBtns[i].addEventListener('click', handleFilterClick);
    }
    
    // Set default dates
    var today = new Date().toISOString().split('T')[0];
    var journalDate = document.getElementById('journalDate');
    var timelineDate = document.getElementById('timelineDate');
    if (journalDate) journalDate.value = today;
    if (timelineDate) timelineDate.value = today;
    
    console.log('✅ All event listeners set up');
}

function handleTabClick(e) {
    console.log('🔄 Tab clicked:', e.target.getAttribute('data-tab'));
    var tabName = e.target.getAttribute('data-tab');
    
    if (!tabName) {
        console.error('❌ No tab name found');
        return;
    }
    
    var tabs = document.querySelectorAll('.tab');
    var contents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all tabs
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    
    // Hide all tab contents
    for (var i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }
    
    // Activate clicked tab
    e.target.classList.add('active');
    
    // Show corresponding content
    var targetContent = document.getElementById(tabName + 'Tab');
    if (targetContent) {
        targetContent.classList.add('active');
        console.log('✅ Switched to', tabName, 'tab');
    } else {
        console.error('❌ Tab content not found:', tabName + 'Tab');
    }
    
    // Special actions for certain tabs
    if (tabName === 'journal') {
        renderActivitySuggestions();
        showRandomProductivityTip();
        setLastEndTimeAsStartTime();
    } else if (tabName === 'timeline') {
        loadTimeline();
    }
}

function handleFilterClick(e) {
    console.log('🔄 Filter clicked:', e.target.getAttribute('data-filter'));
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
    console.log('🎨 Rendering tasks...');
    var container = document.getElementById('tasksList');
    
    if (!container) {
        console.error('❌ Tasks list container not found');
        return;
    }
    
    var filtered = appData.tasks;
    
    if (appData.currentFilter === 'active') {
        filtered = appData.tasks.filter(function(t) { return !t.completed; });
    } else if (appData.currentFilter === 'completed') {
        filtered = appData.tasks.filter(function(t) { return t.completed; });
    } else if (appData.currentFilter === 'high') {
        filtered = appData.tasks.filter(function(t) { return t.priority === 'high'; });
    }
    
    console.log('Tasks to render:', filtered.length);
    
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
    console.log('✅ Tasks rendered');
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
        setLastEndTimeAsStartTime();
    } else {
        alert('Please fill in activity name, date, start time, and end time');
    }
}

function deleteJournal(id) {
    appData.journals = appData.journals.filter(function(j) { return j.id !== id; });
    saveUserData();
    renderAll();
}

// ========================================
// NOTES
// ========================================
function addQuickNote() {
    var noteText = document.getElementById('quickNote').value;
    
    if (noteText.trim()) {
        appData.notes.push({
            id: Date.now(),
            text: noteText.trim(),
            createdAt: new Date().toISOString()
        });
        
        document.getElementById('quickNote').value = '';
        saveUserData();
        renderNotes();
    }
}

function deleteNote(id) {
    appData.notes = appData.notes.filter(function(n) { return n.id !== id; });
    saveUserData();
    renderNotes();
}

function renderNotes() {
    var container = document.getElementById('notesList');
    
    if (appData.notes.length === 0) {
        container.innerHTML = '<div class="empty-state">No notes yet. Write your first note above!</div>';
        return;
    }
    
    var sorted = appData.notes.slice().reverse();
    var html = '';
    
    for (var i = 0; i < sorted.length; i++) {
        var note = sorted[i];
        var date = new Date(note.createdAt);
        html += '<div class="journal-item"><div class="journal-entry">';
        html += '<div class="journal-date">' + date.toLocaleDateString() + ' at ' + date.toLocaleTimeString() + '</div>';
        html += '<div class="journal-content">' + escapeHtml(note.text) + '</div>';
        html += '</div><button class="btn-delete" onclick="deleteNote(' + note.id + ')">Delete</button></div>';
    }
    
    container.innerHTML = html;
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