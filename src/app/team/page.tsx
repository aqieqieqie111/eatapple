"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, getTeams, createTeam, joinTeam, User, Team } from "@/lib/api";
import Link from "next/link";

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadTeams() {
    try {
      const { teams: userTeams } = await getTeams();
      setTeams(userTeams);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const { user: me } = await getMe();
        if (!me) {
          router.push("/login");
          return;
        }
        setUser(me);
        await loadTeams();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("请输入团队名称");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      await createTeam(teamName.trim());
      setTeamName("");
      setShowCreate(false);
      await loadTeams();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("请输入邀请码");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      await joinTeam(inviteCode.trim());
      setInviteCode("");
      setShowJoin(false);
      await loadTeams();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "加入失败");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">🍎</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← 返回
          </Link>
          <h1 className="font-bold text-gray-800">👥 团队管理</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* My Teams */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">我的团队</h2>
          </div>

          {teams.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🍎</div>
              还没有加入任何团队
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {teams.map((team) => (
                <div key={team.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-xs text-gray-400">
                        {team.members.length} 位成员
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">邀请码（点击复制）</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(team.inviteCode);
                          setCopiedId(team.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="font-mono text-sm font-medium text-red-500 select-all bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition cursor-pointer"
                      >
                        {copiedId === team.id ? "✅ 已复制" : team.inviteCode}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setError(""); }}
            className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition"
          >
            ➕ 创建团队
          </button>
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setError(""); }}
            className="py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition"
          >
            🔗 加入团队
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl shadow p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="输入团队名称"
                required
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition"
              >
                {actionLoading ? "创建中..." : "创建团队"}
              </button>
            </form>
          </div>
        )}

        {/* Join form */}
        {showJoin && (
          <div className="bg-white rounded-xl shadow p-4">
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="输入邀请码"
                required
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition"
              >
                {actionLoading ? "加入中..." : "加入团队"}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
