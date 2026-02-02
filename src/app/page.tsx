"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  name: string;
  maxPoints: number;
  updatedAt: number;
};

type ApiResponse =
  | {
      ok: true;
      data: {
        items: Row[];
      };
    }
  | {
      ok: false;
      error: string;
    };

export default function HomePage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  async function load() {
  setError(null);
  setLoading(true);

  try {
    const res = await fetch(`/api/client?order=${order}`, { cache: "no-store" });
    const text = await res.text();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `API вернул не JSON (HTTP ${res.status}). Начало ответа: ${text.slice(0, 80)}`
      );
    }

    if (typeof json !== "object" || json === null || !("ok" in json)) {
      throw new Error("Неверный формат ответа API");
    }

    const api = json as ApiResponse;

    if (!res.ok || api.ok === false) {
      throw new Error(api.ok === false ? api.error : `HTTP ${res.status}`);
    }

    setItems(api.data.items);
  } catch (e) {
    setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
  } finally {
    setLoading(false);
  }
}


  // Загружаем список при старте и при смене сортировки
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => (order === "desc" ? b.maxPoints - a.maxPoints : a.maxPoints - b.maxPoints));
    return arr;
  }, [items, order]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Пользователи</h1>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            maxPoints {order === "desc" ? "↓" : "↑"}
          </button>

          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: loading ? "#333" : "#111",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "Загрузка..." : "Обновить"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid #f2c2c2", background: "#fff5f5" }}>
          <div style={{ fontWeight: 700, color: "#b42318" }}>Ошибка</div>
          <div style={{ marginTop: 6, color: "#7a271a" }}>{error}</div>
        </div>
      )}

      <div style={{ marginTop: 18, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              {["ID", "Name", "Max Points", "Updated"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f7f7f7",
                    fontSize: 13,
                    color: "#111",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0", fontWeight: 700 }}>{u.id}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{u.name}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>{u.maxPoints.toLocaleString()}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0", color: "#666" }}>
                  {new Date(u.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}

            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 18, color: "#666" }}>
                  Пока нет пользователей. Отправь POST на <code>/api/client</code>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
        Формат POST:
        <pre
          style={{
            marginTop: 8,
            background: "#0b1020",
            color: "#e6edf3",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
{`{
  "client": {
    "name": "Nickname",
    "id": 123456,
    "maxPoints": 10000
  }
}`}
        </pre>
      </div>
    </main>
  );
}
