import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./SearchForm.module.css";

interface SearchFormProps {
  label: string;
  defaultValue: string;
  onSearch: (value: string) => void;
}

export function SearchForm({ label, defaultValue, onSearch }: SearchFormProps) {
  return (
    // Keying on defaultValue remounts the field so back/forward navigation,
    // which only changes the URL, resets the box to the active query.
    <form
      key={defaultValue}
      className={styles.form}
      onSubmit={event => {
        event.preventDefault();
        onSearch(new FormData(event.currentTarget).get("query")?.toString() ?? "");
      }}
    >
      <Input name="query" type="search" defaultValue={defaultValue} aria-label={label} placeholder={label} className={styles.input} />
      <Button type="submit">Search</Button>
    </form>
  );
}
