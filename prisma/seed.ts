import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete existing data
  await prisma.verificationImage.deleteMany();
  await prisma.user.deleteMany();

  // Insert new data
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    },
  });

  await prisma.verificationImage.create({
    data: {
      userId: user.id,
      imageUrl: 'https://example.com/image.jpg',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
