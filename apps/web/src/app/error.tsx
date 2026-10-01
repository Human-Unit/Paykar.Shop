"use client";
import { Failure } from "@/components/states";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Failure error={new Error("Не удалось открыть страницу.")} retry={reset} />
  );
}
