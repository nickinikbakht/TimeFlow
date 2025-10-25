# ⏰ TimeFlow - Smart Schedule & Time Management

A powerful web application for managing tasks, scheduling events, tracking activities, and analyzing your time usage with cloud synchronization.

## 🌟 Features

- 📋 **Task Management** - Create, prioritize, and track tasks
- 📅 **Event Scheduling** - Schedule events with recurring options
- 📝 **Activity Journal** - Track activities with precise start/end times
- ⏱️ **Timeline View** - Visual timeline with overlap detection
- 📊 **Analytics** - Time tracking and productivity insights
- 📓 **Quick Notes** - Capture thoughts and ideas quickly
- 🔄 **Cloud Sync** - Firebase integration for multi-device sync
- 🔐 **Authentication** - Secure user accounts
- 📱 **PWA** - Install on mobile and desktop as a native app
- 🌐 **Offline Mode** - Works without internet connection

## 🚀 Quick Start

### 1. Download Files

Copy these 7 artifacts from the conversation:
1. `index.html` - Main HTML (artifact: timeflow-index)
2. `styles.css` - Styling (artifact: timeflow-styles)
3. `app.js` - JavaScript logic (artifact: timeflow-js)
4. `manifest.json` - PWA config (artifact: timeflow-manifest)
5. `service-worker.js` - Offline support (artifact: timeflow-serviceworker)
6. `SETUP_GUIDE.md` - Detailed setup (artifact: timeflow-setup)
7. `COMPLETE_FILE_LIST.md` - File guide (artifact: timeflow-complete-guide)

### 2. Set Up Firebase

1. Create project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password)
3. Enable Realtime Database
4. Copy config and paste into `app.js` (lines 8-15)

### 3. Create Icons

Create two PNG files:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Use https://favicon.io/ for quick generation.

### 4. Run Locally

```bash
python -m http.server 8000
# Open http://localhost:8000
```

### 5. Deploy (Optional)

Deploy to Firebase Hosting, Netlify, Vercel, or GitHub Pages.

## 📱 Install as App

Once deployed:
- **Mobile**: Tap browser menu → "Install app"
- **Desktop**: Click install icon in address bar

## ✨ What's New

### Auto-fill Start Time
Start time automatically fills with your last activity's end time.

### Quick Notes
Separate section for quick thoughts and notes.

### Productivity Tips
Random productivity tips to boost your efficiency.

### Overlap Detection
Automatically warns when activities overlap in time.

### Button Positioning
All action buttons positioned on the right for better UX.

## 🎯 Usage

### Recording Activities
1. Go to Journal tab
2. Select or type activity name
3. Set date, start time, and end time
4. Add optional notes and tags
5. Click "Record Activity"

Activities are automatically:
- Grouped by day
- Sorted by start time
- Checked for overlaps

### Viewing Timeline
1. Go to Timeline tab
2. Select a date
3. Click "Load Timeline"
4. See visual timeline with all activities
5. Overlapping activities appear in RED

### Managing Tasks
1. Go to Tasks tab
2. Add tasks with priorities
3. Filter by status or priority
4. Mark complete or delete

### Quick Notes
1. Go to Journal tab
2. Find "Quick Notes" section
3. Write your note
4. Click "Save Note"

## 🔒 Security

- Each user's data is completely isolated
- Firebase security rules prevent unauthorized access
- All authentication handled by Firebase Auth

## 🔧 Hidden Features

Press **Shift + Ctrl + R** three times in Analytics tab to reveal "Delete All Data" option.

## 📊 Data Structure

```
/users
  /{userId}
    /profile
      - name, email, createdAt
    /data
      /tasks
      /events  
      /journals
      /notes
```

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **PWA**: Service Worker, Web Manifest
- **Hosting**: Firebase Hosting / Netlify / Vercel

## 📄 File Structure

```
timeflow/
├── index.html           # Main app interface
├── styles.css           # All styling
├── app.js              # Application logic
├── manifest.json       # PWA configuration
├── service-worker.js   # Offline support
├── icon-192.png       # App icon (small)
├── icon-512.png       # App icon (large)
├── SETUP_GUIDE.md     # Setup instructions
└── README.md          # This file
```

## 🤝 Contributing

Feel free to fork and modify for your own use!

## 📝 License

Free to use for personal and commercial projects.

## 🆘 Support

- **Firebase**: https://firebase.google.com/docs
- **PWA Guide**: https://web.dev/progressive-web-apps/

---

**Built with ❤️ for better time management**