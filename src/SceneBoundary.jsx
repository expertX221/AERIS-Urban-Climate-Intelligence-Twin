import { Component } from "react";
export class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.("error");
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="scene-error" role="status">
        <h3>The district is still explorable.</h3>
        <p>
          The 3D view could not load. Continue using the scenario and inspection
          controls, or refresh to load the latest version.
        </p>
        <button className="text-button" onClick={() => location.reload()}>
          Refresh 3D view
        </button>
      </div>
    );
  }
}
