const { PrismaClient } = require('@prisma/client');
console.log('PrismaClient:', PrismaClient);
try {
  const prisma = new PrismaClient();
  console.log('Success');
} catch (e) {
  console.error(e);
}
