// Matches the inline boot spinner in index.html so transitions from the
// pre-React paint into the React tree look identical.
export default function Spinner({ fullscreen = false }) {
  return (
    <div className={`app-spinner-wrap${fullscreen ? ' app-spinner-fullscreen' : ''}`}>
      <div className="app-spinner-logo">🦎</div>
      <div className="app-spinner" />
    </div>
  );
}
