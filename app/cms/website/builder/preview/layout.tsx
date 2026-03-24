/**
 * Minimal layout for the iframe preview route.
 *
 * The preview inherits parent layouts (root + CMS) that inject styles and
 * components we don't want inside the iframe:
 * - CMS layout's <div data-cms> with min-h-screen, overflow-x-hidden, bg-background
 * - Root layout's Agentation dev toolbar
 *
 * This layout resets those via CSS overrides so the iframe renders a clean
 * website preview.
 */
export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: [
            /* Reset CMS layout wrapper styles so website content renders cleanly */
            "[data-cms] { min-height: auto !important; overflow: visible !important; background: transparent !important; }",
            /* Reset body for iframe context */
            "body { margin: 0; overflow-x: hidden; }",
            /* Hide Agentation dev toolbar inside iframe */
            "[data-agentation], .agentation-toolbar, #agentation-root { display: none !important; }",
          ].join("\n"),
        }}
      />
      {children}
    </>
  )
}
