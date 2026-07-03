import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

// Create a team
export async function POST(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "请输入团队名称" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: { members: true },
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "创建团队失败" }, { status: 500 });
  }
}

// Get user's teams
export async function GET(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    const teams = memberships.map((m) => m.team);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json({ error: "获取团队列表失败" }, { status: 500 });
  }
}
