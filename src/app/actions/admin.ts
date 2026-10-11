"use server";

import { revalidatePath } from "next/cache";

import {
  addAudit,
  createInventoryItem,
  updateInquiry,
  updateInventoryStatus,
} from "@/lib/db/repositories";
import { assertStaff } from "@/lib/auth/guards";
import { AuthorizationError } from "@/lib/auth/guards";
import {
  createInventorySchema,
  inquiryStatusSchema,
  inventoryStatusSchema,
} from "@/lib/validation/schemas";
import type { InquiryView, InventoryView } from "@/types";

/**
 * ADMIN COMMAND CENTRE mutations (spec §35).
 *
 * Every action re-checks authorisation on the server. A client component cannot
 * reach these without a verified ADMIN or OPERATOR session — the UI state that
 * shows the button is never the thing that grants the permission.
 *
 * Failures are logged server-side and surfaced as generic copy; raw database or
 * stack errors are never returned to the browser.
 */

export type AdminActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Record<string, string> };

async function staffOrFailure<T = unknown>(): Promise<
  { user: Awaited<ReturnType<typeof assertStaff>> } | { failure: AdminActionResult<T> }
> {
  try {
    return { user: await assertStaff() };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        failure: {
          ok: false,
          error:
            error.code === "UNAUTHORIZED"
              ? "Your session expired. Sign in again."
              : "You don't have permission to make that change.",
        },
      };
    }
    return { failure: { ok: false, error: "We couldn't complete that request. Please try again." } };
  }
}

/* -------------------------------------------------------------------------- */
/* Inquiry queue                                                               */
/* -------------------------------------------------------------------------- */

export async function updateInquiryStatusAction(
  _prev: AdminActionResult<InquiryView> | null,
  formData: FormData,
): Promise<AdminActionResult<InquiryView>> {
  const guard = await staffOrFailure<InquiryView>();
  if ("failure" in guard) return guard.failure;

  const parsed = inquiryStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "That update was rejected. Check the status and notes.",
      fields: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    };
  }

  try {
    const updated = await updateInquiry(parsed.data.id, {
      status: parsed.data.status,
      ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
    });

    if (!updated) return { ok: false, error: "That request no longer exists." };

    await addAudit({
      actorId: guard.user.id,
      actorRole: guard.user.role,
      action: "inquiry.status.update",
      entity: "storage_inquiries",
      entityId: updated.id,
      meta: { to: updated.status, reference: updated.reference },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/inquiries");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("[admin] inquiry status update failed", error);
    return { ok: false, error: "We couldn't complete your request. Please try again." };
  }
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateInventoryStatusAction(
  _prev: AdminActionResult<InventoryView> | null,
  formData: FormData,
): Promise<AdminActionResult<InventoryView>> {
  const guard = await staffOrFailure<InventoryView>();
  if ("failure" in guard) return guard.failure;

  const parsed = inventoryStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, error: "Choose a valid inventory status." };
  }

  try {
    const updated = await updateInventoryStatus(parsed.data.id, parsed.data.status);
    if (!updated) return { ok: false, error: "That batch no longer exists." };

    await addAudit({
      actorId: guard.user.id,
      actorRole: guard.user.role,
      action: "inventory.status.update",
      entity: "inventory_items",
      entityId: updated.id,
      meta: { to: updated.status, batch: updated.batch },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/portal");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("[admin] inventory status update failed", error);
    return { ok: false, error: "We couldn't complete your request. Please try again." };
  }
}

export async function createInventoryAction(
  _prev: AdminActionResult<InventoryView> | null,
  formData: FormData,
): Promise<AdminActionResult<InventoryView>> {
  const guard = await staffOrFailure<InventoryView>();
  if ("failure" in guard) return guard.failure;

  const parsed = createInventorySchema.safeParse({
    productName: String(formData.get("productName") ?? ""),
    product: String(formData.get("product") ?? ""),
    zoneId: String(formData.get("zoneId") ?? ""),
    location: String(formData.get("location") ?? ""),
    quantity: formData.get("quantity"),
    unit: String(formData.get("unit") ?? "PALLET"),
    clientId: String(formData.get("clientId") ?? ""),
    temperatureLabel: String(formData.get("temperatureLabel") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields and try again.",
      fields: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    };
  }

  try {
    const created = await createInventoryItem({
      ...parsed.data,
      clientId: parsed.data.clientId || null,
      temperatureLabel: parsed.data.temperatureLabel || undefined,
    });

    await addAudit({
      actorId: guard.user.id,
      actorRole: guard.user.role,
      action: "inventory.create",
      entity: "inventory_items",
      entityId: created.id,
      meta: { batch: created.batch, zone: created.zone },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    return { ok: true, data: created };
  } catch (error) {
    console.error("[admin] inventory create failed", error);
    return { ok: false, error: "We couldn't create that batch. Please try again." };
  }
}
