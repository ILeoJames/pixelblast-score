"use client";

import { memo, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LimitMode = "all" | "50" | "200";
type Status = "loading" | "refreshing" | "online";

type Props = {
  order: "asc" | "desc";
  onToggleOrder: () => void;
  onRefresh: () => void;
  disabled: boolean;

  status: Status;

  query: string;
  setQuery: (v: string) => void;

  onlineOnly: boolean;
  setOnlineOnly: (v: boolean) => void;

  limitMode: LimitMode;
  setLimitMode: (v: LimitMode) => void;
};

export const ControlBar = memo(function ControlBar(props: Props) {
  const {
    order,
    onToggleOrder,
    onRefresh,
    disabled,
    status,
    query,
    setQuery,
    onlineOnly,
    setOnlineOnly,
    limitMode,
    setLimitMode,
  } = props;

  const dq = useDeferredValue(query);

  const dot =
    status === "loading"
      ? "bg-white/40"
      : status === "refreshing"
      ? "bg-yellow-300/70"
      : "bg-emerald-300/80";

  const statusText =
    status === "loading"
      ? "загрузка"
      : status === "refreshing"
      ? "обновление"
      : "онлайн";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
      {/* Левая часть: обновление + статус */}
      <div className="flex items-center gap-2">
        <Button
          className="h-10 min-w-[128px] bg-white text-black hover:bg-white/90"
          onClick={onRefresh}
          disabled={disabled}
        >
          {status === "refreshing" ? "Обновляю…" : "Обновить"}
        </Button>

        <div className="flex h-10 min-w-[140px] items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 tabular-nums">
          <span className={`mr-2 h-2.5 w-2.5 rounded-full ${dot}`} />
          <span className="text-sm text-white/80">{statusText}</span>
        </div>
      </div>

      {/* Правая часть: поиск → сортировка → фильтры */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:justify-end">
        {/* Поиск */}
        <div className="relative">
          <Input
            value={dq}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по никнейму…"
            className="h-10 w-full border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
              title="Очистить"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* ✅ КНОПКА maxPoints теперь после поиска */}
        <Button
          variant="secondary"
          className="h-10 min-w-[128px] bg-white/10 text-white hover:bg-white/15"
          onClick={onToggleOrder}
          disabled={disabled}
        >
          Рейтинг {order === "desc" ? "↓" : "↑"}
        </Button>

        {/* Только онлайн */}
        <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3">
          <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
          <span className="whitespace-nowrap text-sm text-white/80">
            только онлайн
          </span>
        </div>

        {/* Лимит */}
        <Select
          value={limitMode}
          onValueChange={(v) => setLimitMode(v as LimitMode)}
        >
          <SelectTrigger className="h-10 w-[160px] border-white/10 bg-white/10 text-white focus:ring-white/20">
            <SelectValue placeholder="Лимит" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="50">ТОП 50</SelectItem>
            <SelectItem value="200">ТОП 200</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});
