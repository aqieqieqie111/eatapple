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
    const date = req.nextUrl.searchParams.get("date");

    if (!teamId) {
      return NextResponse.json({ error: "请选择团队" }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().slice(0, 10);

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const checkIns = await prisma.checkIn.findMany({
      where: { teamId, date: targetDate },
    });

    const checkInMap = new Map(checkIns.map((c: typeof checkIns[number]) => [c.userId, c] as const));

    const memberStatuses = members.map((m: typeof members[number]) => {
      const checkIn = checkInMap.get(m.userId);
      const isToday = targetDate === new Date().toISOString().slice(0, 10);
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(15, 0, 0, 0);

      let status: "checked" | "waiting" | "missed";
      if (checkIn) {
        status = "checked";
      } else if (isToday && now < deadline) {
        status = "waiting";
      } else {
        status = "missed";
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

    return NextResponse.json({
      date: targetDate,
      members: memberStatuses,
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "获取历史记录失败" }, { status: 500 });
  }
}
