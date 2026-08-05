"use client";

import { useSyncExternalStore } from "react";
import { SuperAdminLogin } from "@/components/superadmin/SuperAdminLogin";
import { SuperAdminPanel } from "@/components/superadmin/SuperAdminPanel";
import { SUPER_ADMIN_KEY } from "@/lib/constants";
import { createClientStore } from "@/lib/storage";

interface SuperAdminSession {
  name: string;
  pinHash: string;
}

const superAdminStore = createClientStore<SuperAdminSession>(SUPER_ADMIN_KEY);

export default function SuperAdminPage() {
  const session = useSyncExternalStore(
    superAdminStore.subscribe,
    superAdminStore.read,
    superAdminStore.getServerSnapshot
  );

  if (!session) {
    return (
      <SuperAdminLogin
        onSuccess={(name, pinHash) => superAdminStore.set({ name, pinHash })}
      />
    );
  }

  return (
    <SuperAdminPanel session={session} onLogout={() => superAdminStore.set(null)} />
  );
}
