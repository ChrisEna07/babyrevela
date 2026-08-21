"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { ADMIN_KEY } from "@/lib/constants";
import { createClientStore } from "@/lib/storage";
import { getHostInfo } from "@/lib/db";
import { FullPageLoader } from "@/components/shared/FullPageLoader";

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

  const [verifying, setVerifying] = useState(true);
  const [authorizedPinHash, setAuthorizedPinHash] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkSecurity() {
      if (!session?.pinHash) {
        if (active) {
          setAuthorizedPinHash(null);
          setVerifying(false);
        }
        return;
      }

      try {
        const host = await getHostInfo();
        if (active) {
          if (host?.pinHash && host.pinHash === session.pinHash) {
            setAuthorizedPinHash(session.pinHash);
          } else {
            adminStore.set(null);
            setAuthorizedPinHash(null);
          }
        }
      } catch {
        if (active) {
          adminStore.set(null);
          setAuthorizedPinHash(null);
        }
      } finally {
        if (active) {
          setVerifying(false);
        }
      }
    }

    checkSecurity();

    return () => {
      active = false;
    };
  }, [session]);

  if (verifying) {
    return <FullPageLoader label="Verificando seguridad de Anfitrión…" />;
  }

  if (!authorizedPinHash) {
    return (
      <AdminLogin
        onSuccess={(pinHash) => {
          adminStore.set({ pinHash });
          setAuthorizedPinHash(pinHash);
        }}
      />
    );
  }

  return (
    <AdminPanel
      pinHash={authorizedPinHash}
      onLogout={() => {
        adminStore.set(null);
        setAuthorizedPinHash(null);
      }}
    />
  );
}
