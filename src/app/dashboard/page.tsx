"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getMe,
  getTeams,
  getTodayCheckIn,
  User,
  Team,
  TodayData,
} from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");

  // Countdown timer
  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(15, 0, 0, 0);

      if (now > deadline) {
        setCountdown("今日截止时间已过");
        return;
      }

      const diff = deadline.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTodayData = useCallback(async (teamId: string) => {
    try {
      const data = await getTodayCheckIn(teamId);
      setTodayData(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { user } = await getMe();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        const { teams: userTeams } = await getTeams();
        setTeams(userTeams);

        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0].id);
          await loadTodayData(userTeams[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, loadTodayData]);

  useEffect(() => {
    if (selectedTeamId) {
      loadTodayData(selectedTeamId);
    }
  }, [selectedTeamId, loadTodayData]);

  async function handleLogout() {
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-bounce text-4xl">🍎</div>
      </div>
    );
  }

  const currentTeam = teams.find((t) => t.id === selectedTeamId);
  const isToday = true;

  function getStatusBadge(status: string) {
    switch (status) {
      case "checked":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            ✅ 已打卡
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
            ⏰ 等待中
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            ❌ 未打卡
          </span>
        );
    }
  }

  function getCardBorderClass(status: string) {
    switch (status) {
      case "checked":
        return "border-green-400 bg-green-50/50";
      case "waiting":
        return "border-yellow-300 bg-yellow-50/30";
      case "missed":
        return "border-red-300 bg-red-50/50";
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              🍎 苹果打卡
            </h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-400">距今日截止</div>
              <div className={`font-mono font-bold text-sm ${todayData?.isOverdue ? "text-red-500" : "text-orange-500"}`}>
                {countdown}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/stats"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                📊
              </Link>
              <Link
                href="/team"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                👥
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Mobile countdown */}
        <div className="sm:hidden bg-white rounded-xl shadow p-4 mb-4 text-center">
          <div className="text-xs text-gray-400">距今日截止</div>
          <div className={`font-mono font-bold text-lg ${todayData?.isOverdue ? "text-red-500" : "text-orange-500"}`}>
            {countdown}
          </div>
        </div>

        {/* Team selector */}
        {teams.length > 1 && (
          <div className="mb-4">
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

        {teams.length === 0 ? (
          /* No team state */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍎</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              还没有团队
            </h2>
            <p className="text-gray-400 mb-6">
              创建或加入一个团队开始打卡吧！
            </p>
            <Link
              href="/team"
              className="inline-block px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition"
            >
              管理团队
            </Link>
          </div>
        ) : !todayData ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">今日打卡率</span>
                <span className="ml-2 text-2xl font-bold text-green-600">
                  {todayData.totalCount > 0
                    ? Math.round(
                        (todayData.checkedCount / todayData.totalCount) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="text-right text-sm text-gray-400">
                {todayData.checkedCount} / {todayData.totalCount} 人已打卡
              </div>
            </div>

            {/* Member cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {todayData.members.map((member) => (
                <div
                  key={member.userId}
                  className={`rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${getCardBorderClass(member.status)}`}
                >
                  {/* Photo area */}
                  <div className="aspect-square bg-gray-100 relative">
                    {member.checkIn ? (
                      <img
                        src={member.checkIn.photoData}
                        alt={`${member.userName}的打卡照片`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">
                            {member.userAvatar || "😶"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {member.status === "missed" ? "未打卡" : "等待中"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Check time badge */}
                    {member.checkIn && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        {new Date(member.checkIn.checkedAt).toLocaleTimeString(
                          "zh-CN",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {member.userName}
                      </span>
                    </div>
                    <div>{getStatusBadge(member.status)}</div>
                    {member.checkIn?.note && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {member.checkIn.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating upload button */}
      {teams.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <Link
            href={`/upload?teamId=${selectedTeamId}`}
            className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            📸 我要打卡
          </Link>
        </div>
      )}
    </div>
  );
}
