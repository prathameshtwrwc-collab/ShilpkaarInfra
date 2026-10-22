import type { Prisma } from "@prisma/client";
import { ENQUIRY_STATUSES } from "./validation";

/** Shared between the enquiry list and the CSV export so both match. */
export function enquiryWhere(params: URLSearchParams): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  const status = params.get("status");
  if (status && (ENQUIRY_STATUSES as readonly string[]).includes(status)) where.status = status;
  const material = params.get("material");
  if (material) where.materialName = material;
  const from = params.get("from");
  const to = params.get("to");
  if (from || to) {
    where.createdAt = {};
    if (from && !Number.isNaN(Date.parse(from))) where.createdAt.gte = new Date(from);
    if (to && !Number.isNaN(Date.parse(to))) where.createdAt.lte = new Date(`${to}T23:59:59.999`);
  }
  const q = params.get("q")?.trim();
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { contactPerson: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { deliveryLocation: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}
