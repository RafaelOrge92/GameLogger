import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TabsDashboard from "@/components/TabsDashboard";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Estadísticas & Tasación 📊
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Análisis financiero de tu catálogo de videojuegos retro
        </p>
      </div>

      {/* Main Tabs Dashboard */}
      <div className="w-full">
        <TabsDashboard />
      </div>
    </div>
  );
}
