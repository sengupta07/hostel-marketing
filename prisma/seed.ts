import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user (General Secretary)
  const adminPassword = await bcrypt.hash("Hello@123", 10);
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
  const managerPassword = await bcrypt.hash("Hello@123", 10);
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
  const boarderPassword = await bcrypt.hash("Hello@123", 10);
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
