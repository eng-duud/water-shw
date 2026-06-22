import prisma from './prisma';
import { TENANT_ID, DEFAULT_PRICING } from './constants';

export async function getOrCreateTenant(tenantId: string = TENANT_ID) {
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });

  if (!tenant) {
    // Self-healing: create the default tenant and settings if not exists
    tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name: "اسم مشروعك",
        settings: {
          create: {
            workUnitPrice: DEFAULT_PRICING.workUnitPrice,
            tier1Limit: DEFAULT_PRICING.tier1Limit,
            tier1PricePerUnit: DEFAULT_PRICING.tier1Price,
            tier2PricePerUnit: DEFAULT_PRICING.tier2Price,
          },
        },
      },
      include: { settings: true },
    });
  }

  return tenant;
}
