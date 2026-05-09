import { UserButton } from "@clerk/nextjs";

interface TopbarProps {
  title: string;
  restaurantName?: string;
}

export function Topbar({ title, restaurantName }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {restaurantName && (
          <p className="text-xs text-slate-400 mt-0.5">{restaurantName}</p>
        )}
      </div>
      <UserButton />
    </header>
  );
}
