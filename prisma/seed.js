const { PrismaClient } = require("@prisma/client");
const { randomInt } = require("node:crypto");

const prisma = new PrismaClient();

function generatePhone() {
  let digits = "";
  for (let i = 0; i < 11; i += 1) {
    digits += String(randomInt(0, 10));
  }
  return `+${digits}`;
}

async function main() {
  const existingLeads = await prisma.lead.findMany({
    select: { phone: true }
  });

  const usedPhones = new Set(existingLeads.map((lead) => lead.phone));
  const leadsToCreate = [];

  while (leadsToCreate.length < 5) {
    const phone = generatePhone();
    if (usedPhones.has(phone)) {
      continue;
    }

    usedPhones.add(phone);
    leadsToCreate.push({
      name: `Seed User ${leadsToCreate.length + 1}`,
      phone
    });
  }

  const result = await prisma.lead.createMany({
    data: leadsToCreate
  });

  console.log(`Seed completed. Inserted leads: ${result.count}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
