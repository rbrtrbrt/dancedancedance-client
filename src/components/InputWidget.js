import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
import classnames from "classnames";

import { logStyles } from "../helpers/debug/stylePrinter";
import { ll } from "../helpers/debug/ll";

export class InputWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasFocus: false };
    this.widgetRef = React.createRef();
    this.inputRef = React.createRef();
    this.contentViewRef = React.createRef();
    this.inputBackgroundRef = React.createRef();
  }

  onChangeValue = evt => {
    this.props.onChange(evt);
  };

  onChangeFocus = hasFocus => evt => {
    this.setState({ hasFocus });
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.hasFocus) {
      if (prevState.hasFocus == false) {
        this.inputRef.current.focus();
        this.inputRef.current.select();
      }
      if (prevState.hasFocus == false || prevProps.value != this.props.value) {
        this.updateWidth();
      }
    }
  }

  componentDidMount() {
    if(this.inputRef.current) {
      this.updateWidth()
    }
  }

  updateWidth() {
    const textWidth = window.getComputedStyle(this.contentViewRef.current).width;
    this.widgetRef.current.style.setProperty("--textWidth", textWidth);
  }

  get isActive() {
    return this.state.hasFocus || !this.props.value
  }

  render() {
    const { hasFocus } = this.state;
    const { onChange, value } = this.props;
    const input = this.isActive ? (
      <input
        ref={this.inputRef}
        type="text"
        value={value || ""}
        onChange={this.onChangeValue}
        onBlur={this.onChangeFocus(false)}
      />
    ) : null;

    return (
      <div
        className={classnames('inputWidget', { active: this.isActive })}
        tabIndex={hasFocus ? -1 : 0}
        onFocus={this.onChangeFocus(true)}
        ref={this.widgetRef}
      >
        <div ref={this.inputBackgroundRef} className="inputBackground">&nbsp;</div>
        {input}
        <div ref={this.contentViewRef} className="contentView">
          {value || '\u00a0\u00a0'}
        </div>
      </div>
    );
  }
}