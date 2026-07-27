import { useHomePage } from './useHomePage';
import styles from './HomePage.module.css';

/** JSX only — logic comes from useHomePage. */
export default function HomePage() {
  const { userName, categories, isLoading, onCategoryClick } = useHomePage();

  return (
    <div className={styles.container}>
      <h1 className={styles.greeting}>Hi, {userName} 👋</h1>
      <p className={styles.subtitle}>What service do you need today?</p>

      {isLoading ? (
        <div className={styles.center}>Loading categories…</div>
      ) : (
        <div className={styles.grid}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={styles.card}
              onClick={() => onCategoryClick(category)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
