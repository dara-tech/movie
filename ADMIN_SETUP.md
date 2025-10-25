# Admin User Setup Guide

## Quick Setup

### 1. Create Admin Users
Run the seed script to create admin users automatically:

```bash
npm run create-admin
```

This will create three test users:
- **Super Admin** - Full system access
- **Admin** - Management access  
- **Regular User** - Standard user access

### 2. Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Super Admin** | `superadmin@moviestream.com` | `admin123` | Full system access |
| **Admin** | `admin@moviestream.com` | `admin123` | Management access |
| **Regular User** | `user@moviestream.com` | `user123` | Standard access |

### 3. Access Admin Panel

1. **Login** with admin credentials at `http://localhost:3000/login`
2. **Navigate** to `http://localhost:3000/admin`
3. **Explore** the comprehensive admin dashboard

## Admin Features

### 🎯 **Dashboard**
- Real-time analytics and metrics
- System health monitoring
- Quick action buttons

### 👥 **User Management**
- View all users with advanced filtering
- Edit user roles and permissions
- Ban/unban users
- View user activity and engagement

### 🎬 **Content Management**
- Manage movie library
- Toggle content availability
- Advanced filtering and search
- Bulk operations

### 📊 **Analytics**
- User engagement metrics
- Content performance analytics
- System health monitoring
- Custom reports

### ⚙️ **System Management**
- Database monitoring
- System logs
- Auto-sync configuration
- Backup management

## Manual User Creation

If you prefer to create users manually:

### 1. Register Regular User
- Go to `/register`
- Create account normally

### 2. Update User Role in Database
```javascript
// Connect to MongoDB
use moviestream

// Update user to admin
db.users.updateOne(
  {email: "your-email@example.com"}, 
  {$set: {role: "admin"}}
)

// Or make super admin
db.users.updateOne(
  {email: "your-email@example.com"}, 
  {$set: {role: "super_admin"}}
)
```

## Security Notes

- **Change default passwords** in production
- **Use strong passwords** for admin accounts
- **Limit super admin access** to trusted users only
- **Regularly audit** admin user permissions

## Troubleshooting

### Admin Panel Not Accessible
- Ensure user has `admin` or `super_admin` role
- Check if user account is active (`isActive: true`)
- Verify JWT token is valid

### Users Not Created
- Check MongoDB connection
- Ensure database exists
- Check for duplicate email addresses
- Review server logs for errors

## Next Steps

1. **Test Admin Features** - Explore all admin functionality
2. **Customize Permissions** - Adjust role-based access as needed
3. **Add More Users** - Create additional admin accounts
4. **Configure Settings** - Set up system preferences
5. **Monitor Activity** - Use analytics to track usage

The admin system is now ready for comprehensive platform management!
