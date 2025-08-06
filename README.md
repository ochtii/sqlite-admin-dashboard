# 🗄️ SQLite Admin Dashboard

A modern, full-stack SQLite database administration tool with authentication, real-time editing, and session management.

## ✨ Features

- **🔐 Authentication System**: Secure login with session management and cookie persistence
- **🎨 Modern Dark UI**: Responsive design with professional dark theme
- **✏️ Live Editing**: Real-time cell editing with auto-save functionality
- **📊 Database Management**: View, edit, add, and delete records across all tables
- **🔄 Session Tracking**: Real-time session monitoring with progress indicators
- **📋 Logging System**: Comprehensive activity logging with categorized messages
- **🗑️ Database Reset**: Safe database reset functionality with confirmation steps
- **🔒 Password Management**: Secure password change functionality
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ochtii/sqlite-admin-dashboard.git
   cd sqlite-admin-dashboard
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure authentication**
   - The system will create a `config.json` file automatically on first run
   - Default password: `admin123` (you'll be prompted to change it on first login)

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Backend runs on: http://localhost:6969

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend runs on: http://localhost:8888

3. **Access the application**
   - Open your browser and navigate to http://localhost:8888
   - Login with the default password: `admin123`
   - You'll be prompted to change the password on first login

## 🏗️ Project Structure

```
sqlite-admin-dashboard/
├── backend/
│   ├── config.json          # Authentication configuration
│   ├── server.js            # Express.js server with SQLite integration
│   ├── package.json         # Backend dependencies
│   └── db.sqlite           # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React application
│   │   ├── App.css         # Dark theme styles
│   │   ├── Auth.js         # Authentication components
│   │   └── Auth.css        # Authentication styles
│   ├── public/
│   │   ├── index.html      # HTML template
│   │   └── manifest.json   # PWA manifest
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation
```

## 🔧 Configuration

### Database Configuration

The database path can be configured in `backend/server.js`:

```javascript
const DBSOURCE = 'D:/einkaufsliste/backend/db.sqlite';
```

### Port Configuration

- **Backend**: Port 6969 (configurable in `server.js`)
- **Frontend**: Port 8888 (configured in `.env` file)

### Authentication Configuration

Authentication settings are stored in `backend/config.json`:

```json
{
  "auth": {
    "currentPassword": "your-secure-password",
    "passwordChanged": true,
    "sessionDuration": 3600000
  }
}
```

## 🎯 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/check` - Check session validity
- `POST /auth/change-password` - Change password
- `GET /auth/session` - Get session information
- `GET /auth/sessions` - List all active sessions

### Database Operations
- `GET /tables` - List all tables
- `GET /table/:name` - Get table data
- `POST /table/:name` - Add new record
- `PUT /table/:name/:id` - Update record
- `DELETE /table/:name/:id` - Delete record
- `DELETE /table/:name/clear` - Clear entire table

### System Information
- `GET /database/info` - Get database information

## 🛡️ Security Features

- **Session Management**: Secure session handling with automatic expiration
- **HTTP-Only Cookies**: Session tokens stored in secure HTTP-only cookies
- **CORS Protection**: Properly configured CORS for cross-origin security
- **Password Hashing**: Secure password storage (ready for bcrypt integration)
- **Session Validation**: Middleware-based session validation on all protected routes

## 🎨 UI Features

- **Dark Theme**: Professional dark color scheme with CSS custom properties
- **Session Indicators**: Real-time session status with color-coded progress bars
- **Live Editing**: Click-to-edit table cells with immediate saving
- **Responsive Tables**: Horizontally scrollable tables for large datasets
- **Modal Dialogs**: Professional modal system for confirmations and forms
- **Activity Logging**: Categorized logging system with timestamps

## 🔄 Session Management

- **Automatic Refresh**: Sessions refresh automatically every 30 seconds
- **Visual Indicators**: Color-coded session status (healthy/warning/critical)
- **Progress Tracking**: Real-time progress bars showing session time remaining
- **Multi-Session Support**: Support for multiple concurrent sessions
- **Cookie Persistence**: Sessions persist across browser refreshes

## 📱 Responsive Design

The application is fully responsive and works across:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm start
```

### Production Build
```bash
# Build frontend for production
cd frontend && npm run build

# Serve with a production server (e.g., nginx, Apache)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console logs in both browser and terminal
2. Ensure both frontend and backend servers are running
3. Verify database permissions and path configuration
4. Check that all dependencies are properly installed

## 🔮 Future Enhancements

- [ ] User management system
- [ ] Database backup/restore functionality
- [ ] SQL query executor
- [ ] Export data to CSV/JSON
- [ ] Database schema visualization
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Real-time notifications

---

Built with ❤️ using React, Express.js, and SQLite
