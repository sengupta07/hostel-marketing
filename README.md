# Hostel Marketing Management System

A comprehensive system for managing hostel marketing tasks, bills, and budget cycles with role-based access control.

## Features

- **Authentication**: Secure login and registration with role-based access control
- **Role-Based Dashboards**: Different views for General Secretary, Mess Manager, and Boarders
- **Marketing Task Management**: Assign tasks to students and track their completion
- **Bill Submission**: Submit and review bills for marketing tasks
- **Budget Management**: Track monthly budget cycles and calculate per-head costs
- **Payment Processing**: Integrated with Stripe for online payments
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS, shadcn/ui
- **State Management**: Redux Toolkit with RTK Query
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Payment Processing**: Stripe

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL database (or use Neon DB for serverless PostgreSQL)
- Stripe account (for payment processing)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/hostel-marketing.git
cd hostel-marketing
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
```

### Database Setup

#### Option 1: Neon DB (Recommended)

1. Create a free account at [Neon DB](https://neon.tech/)
2. Create a new project
3. Create a new database
4. Get your connection string from the dashboard
5. Replace the `DATABASE_URL` in your `.env` file with the connection string

#### Option 2: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database
3. Update the `DATABASE_URL` in your `.env` file with your local connection string

### Initialize the Database

Run the Prisma migrations to set up your database schema:

```bash
npx prisma migrate dev --name init
```

### Seed the Database (Optional)

Create a seed script to populate your database with initial data:

1. Create a file `prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user (General Secretary)
  const adminPassword = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: UserRole.GENERAL_SECRETARY,
    },
  });

  // Create mess manager
  const managerPassword = await bcrypt.hash("password123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "Mess Manager",
      password: managerPassword,
      role: UserRole.MESS_MANAGER,
    },
  });

  // Create some boarders
  const boarderPassword = await bcrypt.hash("password123", 10);
  const boarders = [];
  for (let i = 1; i <= 5; i++) {
    const boarder = await prisma.user.upsert({
      where: { email: `boarder${i}@example.com` },
      update: {},
      create: {
        email: `boarder${i}@example.com`,
        name: `Boarder ${i}`,
        password: boarderPassword,
        role: UserRole.BOARDER,
      },
    });
    boarders.push(boarder);
  }

  // Create a budget cycle
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const paymentDeadline = new Date(today.getFullYear(), today.getMonth(), 6);

  const budgetCycle = await prisma.budgetCycle.upsert({
    where: {
      month_year: {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      },
    },
    update: {},
    create: {
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      startDate,
      endDate,
      paymentDeadline,
      isFinalized: false,
    },
  });

  console.log({ admin, manager, boarders, budgetCycle });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

2. Add the seed script to your `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

3. Install ts-node:

```bash
npm install -D ts-node
# or
yarn add -D ts-node
```

4. Run the seed script:

```bash
npx prisma db seed
```

### Run the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Accessing the Application

You can access the application with the following credentials:

### General Secretary (Admin)

- Email: admin@example.com
- Password: password123
- URL: http://localhost:3000/admin

### Mess Manager

- Email: manager@example.com
- Password: password123
- URL: http://localhost:3000/manager

### Boarder

- Email: boarder1@example.com (through boarder5@example.com)
- Password: password123
- URL: http://localhost:3000/dashboard

## Testing Stripe Payments

For testing Stripe payments, you can use the following test card details:

- Card number: 4242 4242 4242 4242
- Expiry date: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- Name: Any name
- Postal code: Any postal code (e.g., 12345)

## Troubleshooting

### Common Issues

#### "React Context is unavailable in Server Components" Error

If you encounter this error, make sure that all components using React context (like providers) are marked with "use client" at the top of the file. The following files should have "use client" at the top:

- `app/layout.tsx`
- `app/auth/signin/page.tsx`
- `app/auth/signup/page.tsx`
- `app/dashboard/page.tsx`
- `app/manager/page.tsx`
- `app/admin/page.tsx`

#### Database Connection Issues

- Ensure your Neon DB project is active
- Check that your connection string is correct in the `.env` file
- Make sure your IP is allowed in the Neon DB dashboard

#### Authentication Issues

- Verify that `NEXTAUTH_SECRET` is set correctly
- Check that the user exists in the database
- Ensure the password is correct

#### Stripe Integration Issues

- Verify that your Stripe API keys are correct
- Ensure the webhook endpoint is configured correctly
- Check that the webhook signing secret is correct

## Project Structure

- `/app`: Next.js app directory
  - `/api`: API routes
  - `/auth`: Authentication pages
  - `/dashboard`: Boarder dashboard
  - `/manager`: Mess Manager dashboard
  - `/admin`: General Secretary dashboard
- `/components`: React components
- `/prisma`: Prisma schema and migrations
- `/store`: Redux store and RTK Query slices
- `/types`: TypeScript type definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
