import type { LucideIcon } from "lucide-react";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { AdminDashboardMetric } from "@/lib/dal/admin-dashboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionCardItem = AdminDashboardMetric & {
  icon: LucideIcon;
};

type SectionCardsProps = {
  items: SectionCardItem[];
};

function TrendIcon({
  direction,
}: {
  direction: AdminDashboardMetric["changeDirection"];
}) {
  if (direction === "down") {
    return <TrendingDownIcon className="size-4" />;
  }

  return <TrendingUpIcon className="size-4" />;
}

export function SectionCards({ items }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card className="@container/card" key={item.id}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className="size-4" />
                <span>{item.label}</span>
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {item.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon direction={item.changeDirection} />
                  {item.changeLabel}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {item.footerTitle}
                <TrendIcon direction={item.changeDirection} />
              </div>
              <div className="text-muted-foreground">{item.footerSubtitle}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
