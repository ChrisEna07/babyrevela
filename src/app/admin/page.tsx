"use client";

import { useSyncExternalStore } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { ADMIN_KEY } from "@/lib/constants";
import { createClientStore } from "@/lib/storage";

interface AdminSession {
  pinHash: string;
}

const adminStore = createClientStore<AdminSession>(ADMIN_KEY);

export default function AdminPage() {
  const session = useSyncExternalStore(
    adminStore.subscribe,
    adminStore.read,
    adminStore.getServerSnapshot
  );

  if (!session) {
    return <AdminLogin onSuccess={(pinHash) => adminStore.set({ pinHash })} />;
  }

  return (
    <AdminPanel
      pinHash={session.pinHash}
      onLogout={() => adminStore.set(null)}
    />
  );
}
