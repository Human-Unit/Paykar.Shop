import { MyShopping } from "@/components/my-shopping";
import styles from "./page.module.css";

export default function Page() {
  return (
    <div className={styles.scope}>
      <MyShopping />
    </div>
  );
}
