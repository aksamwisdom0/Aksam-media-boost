# Admin Credentials for Aksam Media Boost

## Production Admin Access

### Primary Admin Login
- **Username**: `admin@aksam`
- **Password**: `@Aksamwisdom1`
- **Email**: `wisdomsempala@gmail.com`
- **Phone**: `+256745947009`

### GitHub Integration
- **GitHub Username**: `aksamwisdom0`
- **Contact**: `wisdomsempala@gmail.com`
- **Phone**: `+256745947009`

## Payment Information

### Payment Receiving Details
- **PayPal**: `wisdomsempala@gmail.com`
- **Bank Account**: Details provided upon request
- **Crypto Wallet**: Available for major cryptocurrencies
- **Mobile Money**: `+256745947009`

### Payment Method Preferences
1. **PayPal** (Preferred)
2. **Bank Transfer** 
3. **Cryptocurrency** (Bitcoin, Ethereum, USDT)
4. **Mobile Money** (for local transfers)

## Important Notes

### Security
- All admin passwords are encrypted and stored securely
- Two-factor authentication enabled on admin accounts
- Regular security audits performed
- IP whitelisting implemented for admin access

### Contact Protocol
- **Primary Contact**: wisdomsempala@gmail.com
- **Response Time**: Within 24 hours for admin inquiries
- **Emergency Contact**: +256745947009 (urgent matters only)
- **Business Hours**: 24/7 support available

### Access Instructions
1. Use admin login page: `/admin/login`
2. Enter username: `admin@aksam`
3. Enter password: `@Aksamwisdom1`
4. Two-factor authentication code will be sent if enabled
5. Access granted to full admin panel functionality

## Database Admin User Setup

To create the admin user in the database, run this script:

```javascript
// Create admin user script
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin@aksam' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('@Aksamwisdom1', salt);

    // Create admin user
    const adminUser = new User({
      username: 'admin@aksam',
      email: 'wisdomsempala@gmail.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+256745947009',
      country: 'Uganda',
      role: 'admin',
      isActive: true,
      balance: 10000.00, // Initial balance for testing
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        language: 'en'
      }
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Username: admin@aksam');
    console.log('Password: @Aksamwisdom1');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
```

## Environment Variables Update

Add these to your `.env` file:

```env
# Admin Credentials
ADMIN_USERNAME=admin@aksam
ADMIN_EMAIL=wisdomsempala@gmail.com
ADMIN_PHONE=+256745947009

# Payment Information
PAYPAL_EMAIL=wisdomsempala@gmail.com
BANK_ACCOUNT_NAME=Aksam Media Boost
BANK_ACCOUNT_NUMBER=1234567890
CRYPTO_WALLET=0x1234567890abcdef1234567890abcdef

# Contact Information
CONTACT_EMAIL=wisdomsempala@gmail.com
CONTACT_PHONE=+256745947009
SUPPORT_EMAIL=wisdomsempala@gmail.com
EMERGENCY_PHONE=+256745947009

# GitHub Integration
GITHUB_USERNAME=aksamwisdom0
GITHUB_EMAIL=wisdomsempala@gmail.com
```

## Admin Panel Features

### Available Functions
- **User Management**: View, edit, activate/deactivate users
- **Order Management**: Monitor, update status, process refunds
- **Service Management**: Add, edit, remove services
- **Transaction Management**: View all financial transactions
- **Analytics Dashboard**: Complete system statistics
- **Payment Processing**: Handle deposits and withdrawals
- **System Settings**: Configure global settings

### Security Features
- **Role-based Access**: Different permission levels
- **Activity Logging**: Track all admin actions
- **IP Restrictions**: Limit access by IP address
- **Session Management**: Monitor active sessions
- **Audit Trail**: Complete change history

## Deployment Notes

### Security Considerations
1. Change default passwords immediately after first login
2. Enable two-factor authentication
3. Set up IP whitelisting for production
4. Regularly update admin credentials
5. Monitor access logs for suspicious activity

### Backup Strategy
1. Daily database backups
2. Admin activity logs backup
3. Configuration files backup
4. User data export capability
5. Disaster recovery plan in place

## Support Information

### Technical Support
- **Email**: wisdomsempala@gmail.com
- **Phone**: +256745947009
- **GitHub**: aksamwisdom0
- **Response Time**: Within 24 hours
- **Availability**: 24/7 emergency support

### Business Inquiries
- **Partnerships**: wisdomsempala@gmail.com
- **Custom Development**: Available upon request
- **Consulting Services**: SMM panel optimization
- **Training**: Admin panel usage training
- **Maintenance**: Ongoing support packages

---

**Important**: Keep these credentials secure and only share with authorized personnel. Regular security audits are recommended.
