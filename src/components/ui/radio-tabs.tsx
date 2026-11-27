/**
 * Tabs for one choice that changes what follows (a form's two versions),
 * drawn as a row with the chosen tab underlined (.tabs in components.css).
 * They're radios inside a fieldset, not ARIA tabs: the choice is submitted
 * with the form and works before scripts run, with CSS `:has()` showing the
 * matching content. Arrow keys move between them as with any radio group.
 * For a set of answers to pick from, use chips instead; tabs switch views.
 */
export function RadioTabs({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  /** What the choice is, for screen readers (the tabs speak for themselves). */
  legend: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <fieldset className="tabs">
      <legend className="visually-hidden">{legend}</legend>
      <div className="tabs__list">
        {options.map((option) => (
          <label key={option} className="tabs__tab">
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={option === (defaultValue ?? options[0])}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
