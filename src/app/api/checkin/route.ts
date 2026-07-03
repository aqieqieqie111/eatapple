import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { teamId, photoData, note } = body;

    if (!teamId) {
      return NextResponse.json({ error: "请选择团队" }, { status: 400 });
    }

    if (!photoData) {
      return NextResponse.json({ error: "请上传照片" }, { status: 400 });
    }

    // Check membership
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) {
      return NextResponse.json({ error: "你不是该团队的成员" }, { status: 403 });
    }

    // Check if already checked in today
    const today = new Date().toISOString().slice(0, 10);
    const existing = await prisma.checkIn.findUnique({
      where: { userId_teamId_date: { userId, teamId, date: today } },
    });
    if (existing) {
      return NextResponse.json({ error: "你今天已经打过卡了" }, { status: 400 });
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        teamId,
        date: today,
        photoData,
        note: note || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ checkIn });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "打卡失败" }, { status: 500 });
  }
}
