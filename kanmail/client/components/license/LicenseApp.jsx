import React from "react";

import { closeWindow, openLink, makeDragElement } from "window.js";

import { delete_, post } from "util/requests.js";

export default class LicenseApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      license: "",
    };
  }

  handleLicenseUpdate = (ev) => {
    this.setState({
      license: ev.target.value,
    });
  };

  handleValidateLicense = (ev) => {
    ev.preventDefault();

    if (this.state.isSaving) {
      if (this.state.saveError) {
        this.setState({ isSaving: false, saveError: null });
      }
      return;
    }

    this.setState({ isSaving: true });

    post("/api/license", { license: this.state.license })
      .then(() => {
        closeWindow();
        this.setState({ isSaved: true });
      })
      .catch((err) => this.setState({ saveError: err }));
  };

  handleRemoveLicense = (ev) => {
    ev.preventDefault();

    delete_("/api/license")
      .then(() => closeWindow())
      .catch((err) => this.setState({ saveError: err }));
  };

  renderSaveButton() {
    if (this.state.isSaving) {
      let text;
      const classes = ["main-button"];

      if (this.state.saveError) {
        text = `Error saving license: ${this.state.saveError.data.errorMessage}`;
        classes.push("inactive");
      } else if (this.state.isSaved) {
        text = "Licensed saved, please close this window & reload the main one";
        classes.push("disabled");
      } else {
        text = "Saving...";
        classes.push("disabled");
      }

      return (
        <button
          type="submit"
          className={classes.join(" ")}
          onClick={this.handleValidateLicense}
        >
          {text}</button>
      );
    }

    return (
      <button
        type="submit"
        className="main-button submit"
        onClick={this.handleValidateLicense}
      >
        验证授权码 &rarr;</button>
    );
  }

  renderContent() {
    if (window.KANMAIL_LICENSED) {
      return (
        <div>
          <p>感谢您购买Kanmail许可证！</p>
          <p>
            Kanmail 授权给:{" "}
            <strong>{window.KANMAIL_LICENSE_EMAIL}</strong></p>
          <form>
            <button
              type="submit"
              className="main-button cancel"
              onClick={this.handleRemoveLicense}
            >
              移除授权</button>
          </form>
        </div>
      );
    }

    return (
      <div>
        <p>
          您好，Kanmail用户！Kanmail是由一个小团队开发。如果您经常使用Kanmail从中获得价值，请考虑{" "}<a onClick={() => openLink(`${window.KANMAIL_WEBSITE_URL}/license`)}>购买许可证</a>.</p>
        <form>
          <textarea
            placeholder="Paste license here"
            value={this.state.license}
            onChange={this.handleLicenseUpdate}
          ></textarea>

          {this.renderSaveButton()}
        </form>
      </div>
    );
  }

  render() {
    return (
      <section className="no-select">
        <header className="meta header-bar" ref={makeDragElement}>
          <h2>管理授权</h2>
        </header>

        <section id="license">
          <h2>Kanmail 授权</h2>
          {this.renderContent()}
        </section>
      </section>
    );
  }
}
