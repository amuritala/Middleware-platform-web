import { useState, useEffect, useCallback } from "react";
import { adminApi, type ClientResponse } from "./api";

type Status = "loading" | "success" | "error";

export function useClients(statusFilter?: ClientResponse["status"]) {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = statusFilter
        ? (await adminApi.getAllClients()).filter(
            (c) => c.status === statusFilter,
          )
        : await adminApi.getAllClients();
      setClients(data);
      setStatus("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, status, error, refetch: fetchClients };
}

export function usePendingClients() {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await adminApi.getPendingClients();
      setClients(data);
      setStatus("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const approve = useCallback(
    async (clientId: string, roles: string[] = []) => {
      await adminApi.approveClient(clientId, roles);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    },
    [],
  );

  const reject = useCallback(async (clientId: string) => {
    await adminApi.rejectClient(clientId);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  }, []);

  return { clients, status, error, refetch: fetchPending, approve, reject };
}
