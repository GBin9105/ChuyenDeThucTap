"use client";

import { useEffect, useMemo, useState } from "react";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

function extractUsers(res: any): any[] {
  const d = res?.data;

  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  if (Array.isArray(d?.data?.data?.data)) return d.data.data.data;

  return [];
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(extractUsers(res));
    } catch (e: any) {
      console.error(e);
      setUsers([]);
      setError(e?.response?.data?.message || "Không tải được danh sách users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá user này?")) return;
    try {
      await userService.delete(id);
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || "Xoá user thất bại.");
    }
  };

  useEffect(() => {
    fetchUsers();

    const onFocus = () => fetchUsers();

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "profile_updated_at" || ev.key === "user") {
        fetchUsers();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) =>
      `${u.name ?? ""} ${u.username ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, search]);

  const headerCells = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "text-center w-[160px]" },
  ];

  return (
    <div className="p-6">
      <div
        className="
          w-full p-6 rounded-2xl
          bg-white/40 backdrop-blur-md
          border border-gray-300
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black">Users</h1>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              className="whitespace-nowrap"
            >
              {loading ? "Đang tải..." : "Reload"}
            </Button>

            <Button
              onClick={() => router.push("/admin/users/create")}
              className="
                px-4 py-2 text-white
                bg-gradient-to-r from-blue-600 to-indigo-600
                rounded-lg font-medium
                shadow-[0_0_15px_rgba(90,120,255,0.4)]
                hover:shadow-[0_0_25px_rgba(90,120,255,0.7)]
                transition
              "
            >
              + Create User
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5">
          <input
            type="text"
            placeholder="Tìm theo tên, username, email hoặc phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full max-w-md px-4 py-2.5
              rounded-xl text-sm
              bg-white/70 backdrop-blur-md
              border border-gray-300
              focus:outline-none focus:ring-2
              focus:ring-blue-400
              shadow
            "
          />
        </div>

        <div
          className="
            overflow-x-auto rounded-xl
            bg-white/70 backdrop-blur-md
            border border-gray-300 shadow-md
          "
        >
          <table className="w-full text-sm text-black border-collapse">
            <thead className="bg-white/80 border-b border-gray-300">
              <tr>
                {headerCells.map((c) => (
                  <th
                    key={c.key}
                    className={`p-3 border ${c.className ?? ""}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/50 transition border-b">
                  {[
                    <td key="id" className="p-3 border">
                      {u.id}
                    </td>,
                    <td key="name" className="p-3 border font-medium">
                      {u.name}
                    </td>,
                    <td key="username" className="p-3 border">
                      {u.username || "-"}
                    </td>,
                    <td key="email" className="p-3 border">
                      {u.email}
                    </td>,
                    <td key="phone" className="p-3 border">
                      {u.phone || "-"}
                    </td>,
                    <td key="role" className="p-3 border">
                      <Badge
                        className={
                          u.roles === "admin"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-500 text-white"
                        }
                      >
                        {u.roles}
                      </Badge>
                    </td>,
                    <td key="status" className="p-3 border">
                      <Badge
                        className={
                          u.status
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }
                      >
                        {u.status ? "Active" : "Inactive"}
                      </Badge>
                    </td>,
                    <td
                      key="actions"
                      className="p-3 border text-center space-x-2"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/users/${u.id}/edit`)}
                        className="
                          px-3
                          shadow-[0_0_12px_rgba(90,150,255,0.45)]
                          hover:shadow-[0_0_22px_rgba(120,170,255,0.8)]
                          transition
                        "
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(u.id)}
                        className="
                          px-3
                          shadow-[0_0_12px_rgba(255,100,100,0.45)]
                          hover:shadow-[0_0_22px_rgba(255,120,120,0.8)]
                          transition
                        "
                      >
                        Delete
                      </Button>
                    </td>,
                  ]}
                </tr>
              ))}

              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={headerCells.length}
                    className="p-4 text-center text-gray-600 italic"
                  >
                    {loading ? "Đang tải..." : "Không tìm thấy user"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
