"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, getTeams, getStats, User, Team, StatsData } from "@/lib/api";
import Link from "next/link";

export default function StatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { user: me } = await getMe();
        if (!me) {
          router.push("/login");
          return;
        }
        setUser(me);

        const { teams: userTeams } = await getTeams();
        setTeams(userTeams);
        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    if (selectedTeamId) {
      getStats(selectedTeamId).then(setStats).catch(console.error);
    }
  }, [selectedTeamId]);

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← 返回
          </Link>
          <h1 className="font-bold text-gray-800">📊 统计排行</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Team selector */}
        {teams.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!stats ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.todayRate}%
                </div>
                <div className="text-xs text-gray-400 mt-1">今日打卡率</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.todayChecked}/{stats.totalMembers}
                </div>
                <div className="text-xs text-gray-400 mt-1">今日已打卡</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.totalMembers}
                </div>
                <div className="text-xs text-gray-400 mt-1">团队成员</div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700">🏆 连续打卡排行</h2>
              </div>

              <div className="divide-y divide-gray-50">
                {stats.userStats.map((stat, index) => (
                  <div
                    key={stat.userId}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {index === 0 ? (
                        <span className="text-xl">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-xl">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-sm text-gray-400 font-mono">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {stat.userAvatar || "😶"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {stat.userName}
                      </div>
                      <div className="text-xs text-gray-400">
                        近7天 {stat.last7Days} 次 · 近30天 {stat.last30Days} 次
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-500">
                        🔥 {stat.streak}
                      </div>
                      <div className="text-xs text-gray-400">连续天数</div>
                    </div>
                  </div>
                ))}

                {stats.userStats.length === 0 && (
                  <div className="px-4 py-10 text-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
