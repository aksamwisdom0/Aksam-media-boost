# Aksam Media Boost - SMM Panel

A comprehensive, production-ready Social Media Marketing (SMM) Panel built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

### 🚀 Core Features
- **User Management**: Registration, authentication, profile management
- **Service Management**: Dynamic service catalog with categories
- **Order Processing**: Real-time order tracking and status updates
- **Payment Integration**: Multiple payment gateways (PayPal, Stripe, Crypto)
- **Admin Dashboard**: Complete admin control panel
- **Wallet System**: User balance management and transactions
- **API Integration**: External SMM provider integration
- **Automated Processing**: Cron jobs for order status checks

### 🎯 Advanced Features
- **Drip Feed**: Gradual delivery options
- **Refill System**: Automatic refill for dropped followers/likes
- **Multi-Platform Support**: Instagram, Facebook, Twitter, YouTube, TikTok, LinkedIn, Spotify, and more
- **Real-time Updates**: Live order progress tracking
- **Statistics Dashboard**: Comprehensive analytics for users and admins
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Security**: JWT authentication, rate limiting, data sanitization

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Node-cron** for scheduled tasks
- **Axios** for API requests
- **Helmet** for security headers
- **Rate Limiting** for API protection

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Query** for state management
- **React Hook Form** for form handling

### Deployment
- **PM2** for process management
- **Nginx** for reverse proxy
- **Let's Encrypt** for SSL
- **Ubuntu** server environment

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm 8+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aksam-media-boost
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
# Database
MONGO_URI=mongodb://localhost:27017/aksam_media_boost

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# SMM API
SMM_API_KEY=your_smm_api_key
SMM_API_URL=https://api.smmprovider.com/v1

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Project Structure

```
aksam-media-boost/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/        # Helper functions
│   ├── package.json
│   └── server.js         # Entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   ├── context/     # React context
│   │   └── utils/       # Helper functions
│   ├── public/
│   └── package.json
├── nginx/                 # Nginx configuration
├── scripts/               # Deployment scripts
└── docs/                 # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `GET /api/services/category/:category` - Get services by category
- `POST /api/services` - Create service (Admin)
- `PUT /api/services/:id` - Update service (Admin)
- `DELETE /api/services/:id` - Delete service (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order

### Users
- `GET /api/user/profile` - Get user profile
- `GET /api/user/orders` - Get order history
- `GET /api/user/transactions` - Get transaction history
- `POST /api/user/add-funds` - Add funds to wallet
- `POST /api/user/withdraw-funds` - Withdraw funds

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user status
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/transactions` - Get all transactions

## Database Schema

### User
```javascript
{
  email: String,
  password: String, // Hashed
  firstName: String,
  lastName: String,
  balance: Number,
  role: String, // 'user' | 'admin'
  isActive: Boolean,
  preferences: Object,
  apiUsage: Object
}
```

### Service
```javascript
{
  name: String,
  category: String,
  serviceId: String, // External API ID
  price: Number,
  minQuantity: Number,
  maxQuantity: Number,
  description: String,
  dripFeed: Boolean,
  refill: Boolean,
  isActive: Boolean,
  statistics: Object
}
```

### Order
```javascript
{
  user: ObjectId,
  service: ObjectId,
  targetLink: String,
  quantity: Number,
  startCount: Number,
  currentCount: Number,
  charge: Number,
  status: String,
  apiOrderId: String,
  customComments: [String],
  dripFeedSettings: Object,
  progress: Object
}
```

### Transaction
```javascript
{
  user: ObjectId,
  type: String, // 'deposit' | 'spent' | 'refund' | 'bonus'
  amount: Number,
  balanceBefore: Number,
  balanceAfter: Number,
  description: String,
  relatedOrder: ObjectId,
  paymentMethod: String
}
```

## Deployment

### Production Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Docker Deployment
```bash
# Build and start with Docker Compose
docker-compose up -d
```

## Order Processing Flow

1. **Order Creation**: User places order → Deduct balance → Create order record
2. **API Integration**: Send to external SMM API → Store API order ID
3. **Status Monitoring**: Cron job checks status every 5 minutes
4. **Progress Updates**: Update order progress in database
5. **Completion**: Mark as complete → Update statistics
6. **Failure Handling**: Process refunds for failed orders

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **Data Sanitization**: Prevent MongoDB injection
- **XSS Protection**: Sanitize user inputs
- **CORS Configuration**: Restrict cross-origin requests
- **Security Headers**: Helmet.js for HTTP headers

## Monitoring & Logging

### Application Logs
- Request logging with Morgan
- Error logging and tracking
- Order processing logs
- API integration logs

### Performance Monitoring
- PM2 process monitoring
- Database query optimization
- Response time tracking
- Memory usage monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Email: wisdomsempala@gmail.com
- WhatsApp: +256 727 109 000
- GitHub: https://github.com/aksamwisdom0/aksam-intelligence
- TikTok: @aksamwisdom0
- Instagram: @aksamwisdom0
- LinkedIn: Professional collaboration inquiries
- Business Hours: 24/7 support available
- Response Time: Within 2 hours for inquiries
- Technical Support: Available for deployment and integration assistance

### Contact Information
- **Primary Contact**: Wisdom Semperla
- **Phone**: +256 727 109 000
- **Email**: wisdomsempala@gmail.com
- **Location**: Uganda, East Africa
- **Timezone**: EAT (UTC+3)

### Collaboration Opportunities
- **GitHub**: https://github.com/aksamwisdom0/aksam-intelligence
- **Partnerships**: Open to SMM panel collaborations
- **Custom Development**: Tailored solutions available
- **Consulting**: SMM business strategy consultation
- **Training**: Admin panel usage and optimization training

### Social Media Presence
- **TikTok**: @aksamwisdom0 - SMM tips and tutorials
- **Instagram**: @aksamwisdom0 - Case studies and success stories
- **LinkedIn**: Professional networking and business development
- **YouTube**: Technical tutorials and product demonstrations
- **Twitter**: Real-time updates and industry news

### Business Services
- **SMM Panel Development**: Custom panel solutions
- **API Integration**: Third-party service integration
- **Mobile Applications**: iOS and Android SMM apps
- **Consulting Services**: Business growth strategies
- **Training Programs**: SMM marketing education
- **White-label Solutions**: Branded panel offerings
- **Maintenance Packages**: Ongoing technical support
- **Migration Services**: Platform-to-platform data transfer

## Changelog

### v1.0.0
- Initial release
- Core SMM panel functionality
- User authentication and management
- Service catalog and ordering
- Admin dashboard
- Payment integration
- API integration with cron jobs

---

**Aksam Media Boost** - Your trusted partner for social media growth.
