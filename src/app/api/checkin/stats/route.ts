import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const teamId = req.nextUrl.searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json({ error: "请选择团队" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Get all members
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Get check-ins for the past 7 and 30 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDayStr = sevenDaysAgo.toISOString().slice(0, 10);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDayStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        teamId,
        date: { gte: thirtyDayStr },
      },
    });

    // Per-user stats
    const userStats = members.map((m) => {
      const userCheckIns = recentCheckIns.filter((c) => c.userId === m.user.id);
      const last7Days = userCheckIns.filter((c) => c.date >= sevenDayStr).length;
      const last30Days = userCheckIns.length;

      // Calculate current streak
      let streak = 0;
      const sortedDates = [...new Set(userCheckIns.map((c) => c.date))].sort().reverse();
      const todayDate = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        if (sortedDates.includes(ds)) {
          streak++;
        } else if (i === 0) {
          // Today not yet checked in, continue checking from yesterday
          continue;
        } else {
          break;
        }
      }

      return {
        userId: m.user.id,
        userName: m.user.name,
        userAvatar: m.user.avatar,
        last7Days,
        last30Days,
        streak,
      };
    });

    // Sort by streak descending
    userStats.sort((a, b) => b.streak - a.streak);

    // Today stats
    const todayCheckIns = recentCheckIns.filter((c) => c.date === today);
    const todayRate = members.length > 0 ? Math.round((todayCheckIns.length / members.length) * 100) : 0;

    return NextResponse.json({
      todayRate,
      totalMembers: members.length,
      todayChecked: todayCheckIns.length,
      userStats,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
