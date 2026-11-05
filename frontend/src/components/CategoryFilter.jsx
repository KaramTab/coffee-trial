export default function CategoryFilter({ categories, active, onSelect }) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter drinks by category">
      <button
        type="button"
        className={"filter-btn" + (active === "All" ? " active" : "")}
        onClick={() => onSelect("All")}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          className={"filter-btn" + (active === cat ? " active" : "")}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
