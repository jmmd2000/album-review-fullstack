import switchStyles from "@/components/stats/ViewSwitch.module.css";

interface OptionSwitchProps<Value extends string> {
  /** Names the group for screen readers, such as "Sort tracks by" */
  label: string;
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}

/** A pill of options where one is pressed, the same as the Stats view switch. */
export function OptionSwitch<Value extends string>({ label, options, value, onChange }: OptionSwitchProps<Value>) {
  return (
    <div className={switchStyles.switch} role="group" aria-label={label}>
      {options.map(option => (
        <button key={option.value} type="button" className={switchStyles.option} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
