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

    // Get all team members
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Get today's check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: { teamId, date: today },
    });

    const checkInMap = new Map(checkIns.map((c) => [c.userId, c]));

    const now = new Date();
    const deadline = new Date();
    deadline.setHours(15, 0, 0, 0);
    const isOverdue = now > deadline;

    const memberStatuses = members.map((m) => {
      const checkIn = checkInMap.get(m.userId);
      let status: "checked" | "waiting" | "missed";
      if (checkIn) {
        status = "checked";
      } else if (isOverdue) {
        status = "missed";
      } else {
        status = "waiting";
      }

      return {
        userId: m.user.id,
        userName: m.user.name,
        userAvatar: m.user.avatar,
        status,
        checkIn: checkIn
          ? {
              id: checkIn.id,
              photoData: checkIn.photoData,
              note: checkIn.note,
              checkedAt: checkIn.checkedAt.toISOString(),
            }
          : null,
      };
    });

    const checkedCount = memberStatuses.filter((s) => s.status === "checked").length;
    const totalCount = memberStatuses.length;

    return NextResponse.json({
      date: today,
      isOverdue,
      checkedCount,
      totalCount,
      members: memberStatuses,
    });
  } catch (error) {
    console.error("Today check-in error:", error);
    return NextResponse.json({ error: "获取打卡状态失败" }, { status: 500 });
  }
}
