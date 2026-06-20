"use client";

// Заменяет корневой layout при фатальной ошибке — поэтому со своими html/body
// и инлайновыми стилями (globals.css тут недоступен).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          margin: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>Что-то пошло не так</h1>
          <p style={{ color: "#666" }}>Попробуйте обновить страницу.</p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
