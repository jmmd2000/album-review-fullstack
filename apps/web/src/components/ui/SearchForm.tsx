import { Input } from "@/components/ui/Input";
import styles from "./SearchForm.module.css";

interface SearchFormProps {
  label: string;
  defaultValue: string;
  onSearch: (value: string) => void;
}

/** A search box that searches on Enter, and clears the search when emptied. */
export function SearchForm({ label, defaultValue, onSearch }: SearchFormProps) {
  return (
    // Keying on defaultValue remounts the field so back/forward navigation,
    // which only changes the URL, resets the box to the active query.
    <form
      key={defaultValue}
      className={styles.form}
      role="search"
      onSubmit={event => {
        event.preventDefault();
        onSearch(new FormData(event.currentTarget).get("search")?.toString() ?? "");
      }}
    >
      <Input
        name="search"
        type="search"
        defaultValue={defaultValue}
        aria-label={label}
        placeholder="Search"
        className={styles.input}
        onChange={event => {
          // The clear button or deleting the text empties the box
          if (event.currentTarget.value === "" && defaultValue !== "") onSearch("");
        }}
      />
    </form>
  );
}
