export default function Page() {
  return (
    <main
      style={{
        padding: "var(--page-padding)",
        display: "grid",
        gap: "var(--page-gap)",
      }}
    >
      <section>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--font-size-3xl)",
            lineHeight: "var(--line-height-3xl)",
            fontWeight: "var(--font-weight-bold)",
          }}
        >
          Dynamic Ads Editor
        </h1>

        <p
          style={{
            marginTop: "var(--spacing-2)",
            marginBottom: 0,
            fontSize: "var(--font-size-base)",
            lineHeight: "var(--line-height-base)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-muted)",
          }}
        >
          Token pipeline smoke test.
        </p>
      </section>

      <div
        style={{
          border:
            "var(--border-width-default) solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-6)",
          background: "#ffffff",
        }}
      >
        If this looks right, the token pipeline is working.
      </div>
    </main>
  );
}
