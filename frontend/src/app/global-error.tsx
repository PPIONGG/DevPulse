"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#fafafa",
          color: "#171717",
        }}
      >
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "1rem",
              color: "#737373",
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.5rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fafafa",
              backgroundColor: "#171717",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
