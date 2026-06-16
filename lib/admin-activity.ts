import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type RecordAdminActivityParams = {
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  organizationId?: string | null;
  userId?: string | null;
};

export async function recordAdminActivity({
  action,
  entity,
  entityId = null,
  metadata = {},
  organizationId = null,
  userId = null,
}: RecordAdminActivityParams) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      action,
      entity,
      entity_id: entityId,
      metadata,
      organization_id: organizationId,
      user_id: userId,
    });

    if (error) {
      console.error("admin_activity_log_failed", {
        action,
        entity,
        entityId,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("admin_activity_log_failed", {
      action,
      entity,
      entityId,
      error,
    });
  }
}
