# SMS V2 Backend API

A Node.js/Express backend API for a mentor-student matching platform with SMS messaging capabilities.

## 🚀 Features

- **User Management**: Auth0 integration for authentication and user management
- **Mentor-Student Matching**: Intelligent matching system
- **SMS Messaging**: Twilio integration for real-time messaging
- **Real-time Communication**: Socket.io for live updates
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **Admin Panel**: Full administrative controls

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Auth0
- **SMS**: Twilio
- **Real-time**: Socket.io
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## 📋 Prerequisites

- Node.js 18+ 
- npm 8+
- MongoDB database
- Auth0 account
- Twilio account

## 🔧 Environment Variables

Copy `env.example` to `.env` and configure the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=4000

# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENTID=your-client-id
AUTH0_CLIENTSECRET=your-client-secret
AUTH0_SCOPE=read:users update:users create:users delete:users

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE=+1234567890

# Frontend URLs (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_URL=https://your-admin-domain.com

# Security
JWT_SECRET=your-jwt-secret-key
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sms-v2-backend/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link your project**
   ```bash
   railway link
   ```

4. **Set environment variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set MONGODB_URL=your-mongodb-url
   railway variables set AUTH0_DOMAIN=your-domain.auth0.com
   railway variables set AUTH0_CLIENTID=your-client-id
   railway variables set AUTH0_CLIENTSECRET=your-client-secret
   railway variables set AUTH0_SCOPE=read:users update:users create:users delete:users
   railway variables set TWILIO_ACCOUNT_SID=your-twilio-account-sid
   railway variables set TWILIO_AUTH_TOKEN=your-twilio-auth-token
   railway variables set TWILIO_PHONE=+1234567890
   railway variables set FRONTEND_URL=https://your-frontend-domain.com
   railway variables set ADMIN_URL=https://your-admin-domain.com
   railway variables set JWT_SECRET=your-jwt-secret-key
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## 📚 API Documentation

### Health Check
- `GET /health` - Server health status

### Authentication
- `GET /admin/users` - Get all Auth0 users
- `POST /admin/create-user` - Create new Auth0 user
- `DELETE /admin/delete-user/:userId` - Delete Auth0 user

### Messaging
- `POST /admin/send-message` - Send SMS message
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

### Analytics
- `GET /dashboard/total-messages` - Total message count
- `GET /dashboard/average-response-time` - Average response time
- `GET /dashboard/top-users` - Top messaging users
- `GET /dashboard/messages-by-month` - Monthly message statistics

### User Management
- `GET /mentors` - Get all mentors
- `GET /students` - Get all students
- `GET /matches` - Get all matches

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📊 Monitoring

The application includes:
- Health check endpoint (`/health`)
- Comprehensive error logging
- Graceful shutdown handling
- MongoDB connection monitoring

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify `MONGODB_URL` is correct
   - Check network connectivity
   - Ensure MongoDB is running

2. **Auth0 Authentication Issues**
   - Verify Auth0 credentials
   - Check domain and client configuration
   - Ensure proper scopes are set

3. **Twilio SMS Not Sending**
   - Verify Twilio credentials
   - Check phone number format
   - Ensure account has sufficient credits

### Logs

Check application logs for detailed error information:
```bash
# Railway logs
railway logs
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation 