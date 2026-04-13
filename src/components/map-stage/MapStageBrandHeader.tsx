import jamissueLogo from '../../assets/jamissue-logo.png';

export function MapStageBrandHeader() {
  return (
    <header className="map-stage__header map-stage__header--brand-only">
      <div className="map-stage__brand map-stage__brand--row">
        <div className="map-stage__brand-mark">
          <img src={jamissueLogo} alt="Jam Issue logo" className="map-stage__brand-mark-image" />
        </div>
        <div className="map-stage__brand-copy">
          <p className="map-stage__brand-kicker">DAEJEON LOCAL GUIDE</p>
          <h1 className="map-stage__brand-title">JAM ISSUE</h1>
        </div>
      </div>
    </header>
  );
}
