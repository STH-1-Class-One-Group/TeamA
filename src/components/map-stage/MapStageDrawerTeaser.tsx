export function MapStageDrawerTeaser() {
  return (
    <section className="map-drawer-teaser">
      <span className="map-drawer-teaser__handle" aria-hidden="true" />
      <div className="map-drawer-teaser__peek" aria-hidden="true">
        <div className="map-drawer-teaser__line" />
        <div className="map-drawer-teaser__line map-drawer-teaser__line--short" />
        <div className="map-drawer-teaser__chips">
          <span className="map-drawer-teaser__chip" />
          <span className="map-drawer-teaser__chip" />
          <span className="map-drawer-teaser__chip map-drawer-teaser__chip--wide" />
        </div>
      </div>
    </section>
  );
}
