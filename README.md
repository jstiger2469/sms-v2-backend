# SMS V2 Backend

A production-ready Node.js/Express backend API for a mentor-student matching platform with SMS messaging capabilities, optimized for Railway deployment.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- MongoDB database
- Auth0 account
- Twilio account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sms-v2-backend
   ```

2. **Navigate to server directory**
   ```bash
   cd server
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Railway Deployment

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

## 🛠️ Development

### Scripts

```bash
# Development
npm run dev          # Start development server
npm run start        # Start production server

# Testing
npm test             # Run tests
npm test -- --watch  # Run tests in watch mode
npm test -- --coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Project Structure

```
server/
├── db/                 # Database connection and models
├── models/            # Mongoose models
├── routes/            # API routes
├── tests/             # Test files
├── utils/             # Utility functions
├── .github/           # GitHub Actions workflows
├── Dockerfile         # Docker configuration
├── railway.json       # Railway configuration
└── env.example        # Environment variables template
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 4000) |
| `MONGODB_URL` | MongoDB connection string | Yes |
| `AUTH0_DOMAIN` | Auth0 domain | Yes |
| `AUTH0_CLIENTID` | Auth0 client ID | Yes |
| `AUTH0_CLIENTSECRET` | Auth0 client secret | Yes |
| `AUTH0_SCOPE` | Auth0 scopes | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes |
| `TWILIO_PHONE` | Twilio phone number | Yes |
| `FRONTEND_URL` | Frontend URL (for CORS) | No |
| `ADMIN_URL` | Admin URL (for CORS) | No |
| `JWT_SECRET` | JWT secret key | Yes |

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

```bash
# Railway logs
railway logs
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](server/LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📧 Create an issue in the repository
- 📖 Check the troubleshooting section
- 📚 Review the API documentation
- 🔍 Check the server README for detailed information 