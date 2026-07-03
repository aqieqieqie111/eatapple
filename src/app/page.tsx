"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, User } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    getMe().then((data) => {
      if (data.user) {
        setUser(data.user);
        router.replace("/dashboard");
      } else {
        setUser(null);
        router.replace("/login");
      }
    });
  }, [router]);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">🍎</div>
      </div>
    );
  }

  return null;
}
