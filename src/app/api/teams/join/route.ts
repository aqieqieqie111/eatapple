import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { inviteCode } = await req.json();
    if (!inviteCode) {
      return NextResponse.json({ error: "请输入邀请码" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { inviteCode },
    });

    if (!team) {
      return NextResponse.json({ error: "无效的邀请码" }, { status: 400 });
    }

    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: team.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "你已经是该团队的成员了" }, { status: 400 });
    }

    await prisma.teamMember.create({
      data: { userId, teamId: team.id },
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Join team error:", error);
    return NextResponse.json({ error: "加入团队失败" }, { status: 500 });
  }
}
