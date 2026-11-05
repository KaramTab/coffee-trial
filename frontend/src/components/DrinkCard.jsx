import { MAX_QTY, MIN_QTY, formatRM } from "../api.js";

export default function DrinkCard({ drink, qty, onIncrease, onDecrease }) {
  return (
    <article className="drink-card">
      <div className="drink-emoji" aria-hidden="true">{drink.emoji}</div>
      <div>
        <div className="drink-category">{drink.category}</div>
        <h3 className="drink-name">{drink.name}</h3>
        <div className="drink-price">{formatRM(drink.price)} / cup</div>
      </div>
      <div className="stepper">
        <button
          type="button"
          onClick={onDecrease}
          disabled={qty <= MIN_QTY}
          aria-label={`Decrease ${drink.name}`}
        >
          &minus;
        </button>
        <span className="qty" aria-label={`${drink.name} quantity`}>{qty}</span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={qty >= MAX_QTY}
          aria-label={`Increase ${drink.name}`}
        >
          +
        </button>
      </div>
    </article>
  );
}
