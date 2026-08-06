interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔎</span>

      <input
        type="search"
        placeholder="Rechercher un dossier..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}