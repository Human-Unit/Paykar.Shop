export const metadata = {
  title: "Каталог · Пайкар",
  description: "Выберите продукты по категории, цене и наличию.",
};
import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { Loading } from "@/components/states";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Catalog />
    </Suspense>
  );
}
