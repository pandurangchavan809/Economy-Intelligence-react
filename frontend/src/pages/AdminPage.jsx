import { useEffect, useState } from "react";

import { apiGet, apiPost, clearApiCache } from "../api";
import SectionHeading from "../components/SectionHeading";
import { formatTableValue } from "../utils/formatters";

const TOKEN_KEY = "economy-admin-token";

export default function AdminPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [summary, setSummary] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState(null);
  const [query, setQuery] = useState("SELECT * FROM countries LIMIT 10");
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    apiGet("/admin/summary", token)
      .then(setSummary)
      .catch((err) => {
        setError(err.message);
        handleLogout();
      });

    apiGet("/admin/tables", token)
      .then((data) => {
        setTables(data);
        setSelectedTable(data[0] || "");
      })
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedTable) return;
    apiGet(`/admin/table-data?table=${encodeURIComponent(selectedTable)}`, token)
      .then(setTableData)
      .catch((err) => setError(err.message));
  }, [selectedTable, token]);

  async function handleLogin(event) {
    event.preventDefault();
    try {
      setError("");
      const data = await apiPost("/admin/login", { adminId, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    clearApiCache("/admin/");
    setToken("");
    setSummary(null);
    setTables([]);
    setTableData(null);
    setQueryResult(null);
  }

  async function handleRunQuery(event) {
    event.preventDefault();
    try {
      setError("");
      const data = await apiPost("/admin/query", { query }, token, {
        invalidatePrefixes: ["/admin/summary", "/admin/tables", "/admin/table-data"]
      });
      setQueryResult(data);
      if (selectedTable) {
        const refreshed = await apiGet(
          `/admin/table-data?table=${encodeURIComponent(selectedTable)}`,
          token,
          { cache: false, force: true }
        );
        setTableData(refreshed);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <SectionHeading
          eyebrow="Admin Access"
          title="Secure control panel"
          text="Use your admin credentials to access table previews and SQL commands."
        />
        <form className="panel space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="label">Admin ID</label>
            <input className="input" value={adminId} onChange={(e) => setAdminId(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button className="button-primary" type="submit">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading
        eyebrow="Admin Panel"
        title="Database controls"
        text="This keeps the original admin idea but presents it as a cleaner web panel with token-based login."
      />

      {error ? <div className="panel text-rose-600">{error}</div> : null}

      <div className="flex justify-end">
        <button className="button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="panel">
          <p className="text-sm uppercase tracking-[0.25em] text-brass">Countries</p>
          <p className="mt-3 font-display text-4xl">{summary?.countries ?? "..."}</p>
        </div>
        <div className="panel">
          <p className="text-sm uppercase tracking-[0.25em] text-brass">Tables</p>
          <p className="mt-3 font-display text-4xl">{summary?.tables ?? "..."}</p>
        </div>
        <div className="panel">
          <p className="text-sm uppercase tracking-[0.25em] text-brass">Recent Tables</p>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            {(summary?.latestTables || []).slice(0, 4).join(", ") || "Loading..."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr,1.3fr]">
        <div className="panel">
          <label className="label">Browse table</label>
          <select
            className="input"
            value={selectedTable}
            onChange={(event) => setSelectedTable(event.target.value)}
          >
            {tables.map((tableName) => (
              <option key={tableName} value={tableName}>
                {tableName}
              </option>
            ))}
          </select>

          <div className="mt-6 rounded-[1.5rem] bg-mist p-4 text-sm text-ink/70">
            Preview mode loads up to 100 rows from the selected table.
          </div>
        </div>

        <div className="panel overflow-x-auto">
          <p className="mb-4 font-display text-2xl text-ink">Table preview</p>
          {tableData?.rows?.length ? (
            <table className="data-table min-w-full">
              <thead>
                <tr>
                  {tableData.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.slice(0, 12).map((row, index) => (
                  <tr key={index}>
                    {tableData.columns.map((column) => (
                      <td key={`${index}-${column}`}>{formatTableValue(row[column])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-ink/60">No rows to preview.</p>
          )}
        </div>
      </div>

      <div className="panel">
        <p className="font-display text-2xl text-ink">SQL command center</p>
        <form className="mt-5 space-y-4" onSubmit={handleRunQuery}>
          <textarea
            className="input min-h-40 resize-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="button-primary" type="submit">
            Run query
          </button>
        </form>

        {queryResult ? (
          <div className="mt-6 rounded-[1.5rem] bg-mist p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-ink/50">Query result</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-ink/75">
              {JSON.stringify(queryResult, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
