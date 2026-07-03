"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe, getTeams, submitCheckIn, User, Team } from "@/lib/api";

// Compress image to base64, max ~300KB
async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        let q = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", q);
        // Further compress if still too large (>400KB)
        while (dataUrl.length > 400 * 1024 && q > 0.3) {
          q -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState(teamIdParam);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoData, setPhotoData] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        if (userTeams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(userTeams[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, [router, selectedTeamId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".heic")) {
      setError("仅支持 JPG、PNG、WebP、HEIC 格式的图片");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10MB");
      return;
    }

    setError("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));

    // Compress image
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPhotoData(compressed);
    } catch {
      setError("图片处理失败，请换一张试试");
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoData || !selectedTeamId) {
      setError("请选择团队并上传照片");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await submitCheckIn(selectedTeamId, photoData, note || undefined);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "打卡失败");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">打卡成功！</h1>
          <p className="text-green-500">今天你吃苹果了！真棒 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </button>
          <h1 className="font-bold text-gray-800">📸 上传打卡</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择团队
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              required
            >
              <option value="" disabled>
                请选择团队
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              吃苹果照片
            </label>

            {preview ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                <img
                  src={preview}
                  alt="预览"
                  className="w-full h-full object-cover"
                />
                {compressing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm">处理中...</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoData("");
                    setPreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition"
              >
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-400 text-sm">点击上传吃苹果照片</p>
                <p className="text-gray-300 text-xs mt-1">
                  JPG / PNG / WebP，最大 10MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注（可选）
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="如：今天吃的是红富士🍎"
              maxLength={100}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !photoData || compressing}
            className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors text-lg"
          >
            {loading ? "上传中..." : compressing ? "处理图片..." : "✅ 确认打卡"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">🍎</div>
      </div>
    }>
      <UploadForm />
    </Suspense>
  );
}
