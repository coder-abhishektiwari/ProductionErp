# ProductionERP - Production Management System

A comprehensive ERP solution designed specifically for rubber manufacturing businesses, providing end-to-end management for production, inventory, sales, purchases, and financial operations.

## 🚀 Features

### Production Management
- **Stage 1: Sheet Making** - Track raw material to sheet production
- **Stage 2: Product Making** - Convert sheets to finished products
- Real-time production monitoring and tracking

### Inventory Control
- Raw material stock management (chemicals, rubber compounds)
- Sheet and waste stock tracking
- Finished goods inventory
- Low stock alerts and notifications

### Sales & Purchase Management
- Purchase orders and purchase returns
- Sales invoices and sales returns
- Customer order management
- Delivery challan generation
- Complete transaction history

### Financial Management
- Cash & Bank account management
- Expense tracking
- Loan management
- GST calculation and compliance
- Profit & Loss reports
- Account balances and receivables/payables

### System Features
- Multi-user role-based access (Admin, Accountant, Operator)
- Data backup and restore
- System settings and configuration
- Company details management
- Supabase cloud synchronization
- Local IndexedDB storage for offline capability

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Vite
- **Database**: SQLite (local), Supabase (cloud sync)
- **Backend**: Node.js, Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest (Unit), Playwright (E2E)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (for backend server)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/coder-abhishektiwari/ProductionErp.git
   cd ProductionErp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and fill in your actual values:
     ```env
     # Supabase Configuration (Get from: https://supabase.com → Your Project → Settings → API)
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     
     # JWT Configuration (Use a strong random string)
     JWT_SECRET=your-jwt-secret-key-here
     
     # PostgreSQL Database Configuration
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=rubber_erp
     DB_USER=postgres
     DB_PASSWORD=your-database-password
     
     # Server Configuration
     PORT=3000
     ```

4. **Initialize the database**
   ```bash
   # The app will automatically create the SQLite database on first run
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open browser and navigate to `http://localhost:5173`
   - Default login credentials will be created on first run

## 🏗️ Project Structure

```
ProductionErp/
├── src/
│   ├── main.js                 # Application entry point and router
│   ├── style.css               # Global styles
│   ├── components/
│   │   ├── layout.js           # Sidebar and header layout
│   │   ├── AIAssistant.js      # AI assistant component
│   │   └── sync-controls.js    # Supabase sync controls
│   ├── views/
│   │   ├── dashboard.js        # Dashboard overview
│   │   ├── purchase.js         # Purchase management
│   │   ├── sales.js            # Sales and invoicing
│   │   ├── production-sheet.js # Sheet making stage
│   │   ├── production-product.js # Product making stage
│   │   ├── inventory.js        # Stock management
│   │   ├── accounts.js         # Cash & Bank
│   │   ├── expenses.js         # Expense tracking
│   │   ├── loans.js            # Loan management
│   │   ├── gst.js              # GST management
│   │   ├── reports.js          # Financial reports
│   │   ├── masters.js          # Master data
│   │   ├── backup.js           # Backup & Restore
│   │   ├── system.js           # System settings
│   │   ├── company-details.js  # Company configuration
│   │   └── about-developer.js  # Developer information
│   ├── store/
│   │   ├── db.js               # Database operations
│   │   ├── supabase-config.js  # Supabase configuration
│   │   └── supabase-sync.js    # Cloud synchronization
│   ├── utils/
│   │   ├── print.js            # Print utilities
│   │   └── table-filter.js     # Excel-like table filters
│   └── assets/
│       └── [images and icons]
├── server.js                   # Backend server
├── supabase-schema.sql         # Supabase database schema
├── rubber_erp.sqlite           # Local SQLite database
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🎯 User Roles

### Admin
- Full system access
- User management
- System configuration
- Backup & restore
- All transaction modules

### Accountant
- Financial modules (Accounts, Expenses, Loans, GST)
- Reports and analytics
- Purchase and Sales management
- Cannot access system settings

### Operator
- Production modules (Sheet Making, Product Making)
- Inventory viewing
- Basic transaction entry
- Limited dashboard access

## 📊 Key Modules

### Dashboard
- Key metrics overview (Cash, Receivables, Payables, Profit, GST)
- Low stock alerts
- Raw material stock summary
- Pending orders tracking
- Recent transactions
- Finished goods inventory

### Production Workflow
1. **Sheet Making Stage**: Raw materials → Rubber Sheets
2. **Product Making Stage**: Sheets → Finished Products
3. Waste tracking and management

### Financial Management
- Multi-account support (Cash, Bank, etc.)
- Automated GST calculation
- Receivables and Payables tracking
- Comprehensive P&L reports
- Loan repayment scheduling

## 🔄 Data Synchronization

- **Local Storage**: SQLite database for offline access
- **Cloud Sync**: Optional Supabase integration for multi-device sync
- **Backup**: JSON export for data portability
- **Conflict Resolution**: Smart sync controls

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run end-to-end tests
npm run test:e2e
```

## 🚢 Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run E2E tests

### Adding New Features

1. Create view component in `src/views/`
2. Import in `src/main.js`
3. Add route to `viewMap`
4. Add sidebar item in `src/components/layout.js`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Abhishek Tiwari**
- Full Stack Developer
- GitHub: [@coder-abhishektiwari](https://github.com/coder-abhishektiwari)
- LinkedIn: [Abhishek Tiwari](https://www.linkedin.com/in/coder-abhishektiwari)

## 🙏 Acknowledgments

- Built with modern web technologies
- Icons by [Phosphor Icons](https://phosphoricons.com/)
- Designed for rubber manufacturing industry

---

**Version**: 3.0-supabase  
**Last Updated**: 2024

For support or queries, please reach out through the contact links provided in the application.