# NexGen Investment Platform - Backend API

A comprehensive backend API for the NexGen Investment Platform supporting both User and Admin applications.

## 🏗️ Architecture

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with role-based access
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston with structured logging
- **Real-time**: Socket.IO for live updates

## 📁 Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── auth/            # Authentication controllers
│   ├── user/            # User app controllers
│   └── admin/           # Admin app controllers
├── middlewares/         # Custom middlewares
├── routes/              # API route definitions
├── services/            # Business logic services
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── config/              # Configuration files
└── app.ts              # Express app setup
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis (optional, for sessions)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npm run db:migrate
npm run db:generate
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:8000`

## 📚 API Documentation

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/user/login` - User login
- `POST /api/auth/user/register` - User registration
- `POST /api/auth/admin/login` - Admin login

### User App APIs
- `GET /api/user/dashboard/*` - User dashboard endpoints
- `GET /api/user/mining/*` - Mining operations
- `GET /api/user/investments/*` - Investment management
- `GET /api/user/transactions/*` - Transaction history

### Admin App APIs
- `GET /api/admin/users/*` - User management
- `POST /api/admin/credits/*` - Credit management
- `GET /api/admin/settings/*` - System settings

## 🛡️ Security Features

- JWT authentication with separate secrets for User/Admin
- Role-based access control
- Request rate limiting
- Input validation and sanitization
- Security headers with Helmet
- CORS configuration

## 📊 Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User** - User accounts and admin accounts
- **MiningOperation** - Mining rig operations
- **Investment** - Cryptocurrency and gold investments
- **Transaction** - All financial transactions
- **Notification** - User notifications
- **SystemSettings** - Configuration management

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio

## 🌍 Environment Variables

See `.env.example` for all available configuration options.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `USER_JWT_SECRET` - JWT secret for user authentication
- `ADMIN_JWT_SECRET` - JWT secret for admin authentication

## 📝 Logging

The application uses Winston for structured logging:
- Console output for development
- File logging for production
- Error and exception handling
- HTTP request logging

## 🚢 Deployment

### Docker Support (Coming Soon)
```bash
docker build -t nexgen-backend .
docker run -p 8000:8000 nexgen-backend
```

### Production Considerations
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper database connection pooling
- Set up monitoring and error tracking
- Use a reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.