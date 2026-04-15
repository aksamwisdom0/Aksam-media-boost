# Aksam Media Boost - Complete Project Structure

```
aksam-media-boost/
├── backend/                          # Node.js/Express API
│   ├── src/
│   │   ├── controllers/              # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── serviceController.js
│   │   │   ├── orderController.js
│   │   │   └── adminController.js
│   │   ├── middleware/               # Custom middleware
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   └── validation.js
│   │   ├── models/                   # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Service.js
│   │   │   ├── Order.js
│   │   │   └── Transaction.js
│   │   ├── routes/                   # API routes
│   │   │   ├── auth.js
│   │   │   ├── user.js
│   │   │   ├── services.js
│   │   │   ├── orders.js
│   │   │   └── admin.js
│   │   ├── services/                 # Business logic
│   │   │   ├── orderProcessor.js
│   │   │   ├── smmApi.js
│   │   │   └── emailService.js
│   │   ├── utils/                    # Helper functions
│   │   │   ├── jwt.js
│   │   │   ├── bcrypt.js
│   │   │   └── validators.js
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.js
│   │   │   └── constants.js
│   │   └── app.js                    # Express app setup
│   ├── package.json
│   ├── .env
│   └── server.js                     # Server entry point
├── frontend/                         # React + Vite
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   └── Modal.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── services/
│   │   │   │   ├── ServiceCard.jsx
│   │   │   │   ├── ServiceGrid.jsx
│   │   │   │   └── ServiceFilter.jsx
│   │   │   ├── orders/
│   │   │   │   ├── OrderForm.jsx
│   │   │   │   ├── OrderHistory.jsx
│   │   │   │   └── OrderStatus.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── UserDashboard.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── Wallet.jsx
│   │   │   │   └── StatsCard.jsx
│   │   │   └── admin/
│   │   │       ├── UserManagement.jsx
│   │   │       ├── OrderManagement.jsx
│   │   │       └── ServiceManagement.jsx
│   │   ├── pages/                    # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   ├── OrderPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useOrders.js
│   │   │   └── useServices.js
│   │   ├── services/                 # API service functions
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── orderService.js
│   │   │   └── serviceService.js
│   │   ├── context/                  # React Context
│   │   │   ├── AuthContext.js
│   │   │   └── OrderContext.js
│   │   ├── utils/                    # Frontend utilities
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   └── validators.js
│   │   ├── styles/                   # CSS/Tailwind
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── nginx/                            # Nginx configuration
│   └── default.conf
├── scripts/                          # Deployment scripts
│   ├── deploy.sh
│   └── setup.sh
├── docker-compose.yml                # Docker configuration
├── .gitignore
├── README.md
└── package.json                      # Root package.json
```
