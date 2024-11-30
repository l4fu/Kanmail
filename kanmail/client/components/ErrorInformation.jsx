import React from "react";
import PropTypes from "prop-types";

class ErrorInformation extends React.Component {
  static propTypes = {
    // error: PropTypes.error.isRequired,
    componentStack: PropTypes.string.isRequired,
  };

  render() {
    return (
      <div id="no-app">
        <h1>
          <img src="/favicon.ico" /> Something broke!
        </h1>
        <p>
          <a onClick={() => window.location.reload()}>点击重新加载</a></p>
        <p>
          所以这很尴尬：有东西坏了！如果此错误仍然存在，请转到:{" "}
          <a target="_blank" rel="noreferrer" href="https://kanmail.io/support">
            kanmail.io/support
          </a>
          .</p>
        <pre>
          <code>{this.props.componentStack}</code>
        </pre>
      </div>
    );
  }
}

const showErrorInformation = ({ error, componentStack }) => (
  <ErrorInformation error={error} componentStack={componentStack} />
);
export default showErrorInformation;
