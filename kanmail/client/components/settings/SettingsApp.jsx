import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import Select, { Creatable } from "react-select";

import AccountList from "components/settings/AccountList.jsx";
import SignatureList from "components/settings/SignatureList.jsx";
import { AccountAndSignatureSettingsMixin } from "components/settings/OverlayItemList.jsx";

import { THEME_NAMES } from "constants.js";
import keyboard from "keyboard.js";
import {
  closeWindow,
  openLicense,
  makeDragElement,
  makeNoDragElement,
} from "window.js";

import { delete_, put } from "util/requests.js";

export default class SettingsApp extends AccountAndSignatureSettingsMixin {
  static propTypes = {
    settings: PropTypes.object.isRequired,
    accountNameToConnected: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    keyboard.disable();

    this.state = {
      selectedTab: "accounts",
      accounts: props.settings.accounts,
      accountNameToConnected: props.accountNameToConnected,
      signatures: props.settings.signatures,
      systemSettings: props.settings.system || {},
      styleSettings: props.settings.style || {},
    };

    const sidebarFolderOptions = _.map(
      this.state.styleSettings.sidebar_folders,
      (folder) => ({ label: folder, value: folder })
    );

    this.state.initialSidebarFolderOptions = sidebarFolderOptions;
    this.state.styleSettings.sidebar_folders = sidebarFolderOptions;

    this.state.styleSettings.theme_light = {
      label: this.state.styleSettings.theme_light,
      value: this.state.styleSettings.theme_light,
    };
    this.state.styleSettings.theme_dark = {
      label: this.state.styleSettings.theme_dark,
      value: this.state.styleSettings.theme_dark,
    };
  }

  handleSettingUpdate = (stateKey, key, value) => {
    const settings = this.state[stateKey];
    settings[key] = value;

    this.setState({
      [stateKey]: settings,
    });
  };

  handleInputUpdate = (stateKey, key, ev) => {
    let value = ev.target.value;
    if (value && ev.target.type === "number") {
      value = parseInt(value);
    }
    return this.handleSettingUpdate(stateKey, key, value);
  };

  handleCheckboxUpdate = (stateKey, key) => {
    const value = this.state[stateKey][key];
    return this.handleSettingUpdate(stateKey, key, !value);
  };

  handleSaveSettings = (ev) => {
    ev.preventDefault();

    if (this.state.isSaving) {
      if (this.state.saveError) {
        this.setState({ isSaving: false, saveError: null });
      }
      return;
    }

    this.setState({ isSaving: true });

    const newSettings = {
      accounts: this.state.accounts,
      signatures: this.state.signatures,
      system: this.state.systemSettings,
      style: _.clone(this.state.styleSettings),
      columns: this.props.settings.columns,
    };

    newSettings.style.theme_light = newSettings.style.theme_light.value;
    newSettings.style.theme_dark = newSettings.style.theme_dark.value;

    newSettings.style.sidebar_folders = _.map(
      newSettings.style.sidebar_folders,
      (option) => option.value
    );

    put("/api/settings", newSettings)
      .then(() => {
        closeWindow();
        this.setState({ isSaved: true });
      })
      .catch((err) => this.setState({ saveError: err, isSaving: false }));
  };

  handleBustCache = (ev) => {
    ev.preventDefault();

    delete_("/api/settings/cache")
      .then(() => closeWindow())
      .catch((err) => console.error("SETTING ERROR", err));
  };

  selectTab = (selectedTab) => {
    this.setState({ selectedTab });
  };

  renderSaveButton() {
    let text = (
      <span>
        <i className="fa fa-save" /> Save
      </span>
    );
    const classes = [];

    if (this.state.isSaving) {
      text = "Saving...";
      classes.push("disabled");
    } else {
      classes.push("submit");
    }

    return (
      <button
        type="submit"
        className={classes.join(" ")}
        onClick={this.handleSaveSettings}
        ref={makeNoDragElement}
      >
        {text}</button>
    );
  }

  renderMessage() {
    if (this.state.saveError) {
      return (
        <div className="message error">
          Error saving settings: {this.state.saveError.data.errorMessage}
        </div>
      );
    }

    if (this.state.isSaved) {
      return (
        <div className="message success">
          Settings saved, please close this window &amp; reload the main one.
        </div>
      );
    }

    return null;
  }

  renderAccountSettings() {
    return (
      <div className="settings">
        <AccountList
          accounts={this.state.accounts}
          accountNameToConnected={this.props.accountNameToConnected}
          addAccount={this.addAccount}
          deleteAccount={this.deleteAccount}
          updateAccount={this.updateAccount}
          moveAccount={this.moveAccount}
        />

        <SignatureList
          signatures={this.state.signatures}
          addSignature={this.addSignature}
          deleteSignature={this.deleteSignature}
          updateSignature={this.updateSignature}
          moveSignature={this.moveSignature}
        />
      </div>
    );
  }

  renderAppearanceSettings() {
    const themeOptions = _.map(THEME_NAMES, (themeName) => ({
      value: themeName,
      label: themeName,
    }));

    return (
      <div className="settings" id="style">
        <div className="flex">
          <div className="half">
            <label htmlFor="theme_light">
              亮色主题
              <small>系统主题为浅色时使用的主题</small>
            </label>
            <div className="select-wrapper">
              <Select
                classNamePrefix="react-select"
                options={themeOptions}
                value={this.state.styleSettings.theme_light}
                onChange={_.partial(
                  this.handleSettingUpdate,
                  "styleSettings",
                  "theme_light"
                )}
              />
            </div>
          </div>

          <div className="half">
            <label htmlFor="theme_dark">
              暗色主题
              <small>系统主题为暗色时使用的主题</small>
            </label>
            <div className="select-wrapper">
              <Select
                classNamePrefix="react-select"
                options={themeOptions}
                value={this.state.styleSettings.theme_dark}
                onChange={_.partial(
                  this.handleSettingUpdate,
                  "styleSettings",
                  "theme_dark"
                )}
              />
            </div>
          </div>
        </div>

        <div className="checkbox">
          <label htmlFor="compact_columns">使用紧凑的列布局</label>
          <input
            type="checkbox"
            id="compact_columns"
            checked={this.state.styleSettings.compact_columns}
            onChange={_.partial(
              this.handleCheckboxUpdate,
              "styleSettings",
              "compact_columns"
            )}
          />
        </div>

        <label htmlFor="sidebar_folders">
          侧边栏文件夹
          <small>要固定在侧边栏中的文件夹</small>
        </label>
        <div className="select-wrapper">
          <Creatable
            isMulti
            defaultOptions
            cacheOptions
            classNamePrefix="react-select"
            options={this.state.initialSidebarFolderOptions}
            value={this.state.styleSettings.sidebar_folders}
            onChange={_.partial(
              this.handleSettingUpdate,
              "styleSettings",
              "sidebar_folders"
            )}
          />
        </div>

        <div className="checkbox">
          <label htmlFor="group_single_sender_threads">
            对单个发件人线程进行分组
            <small>对来自同一发件人的单个消息线程进行分组</small>
          </label>
          <input
            type="checkbox"
            id="group_single_sender_threads"
            checked={this.state.systemSettings.group_single_sender_threads}
            onChange={_.partial(
              this.handleCheckboxUpdate,
              "systemSettings",
              "group_single_sender_threads"
            )}
          />
        </div>

        <div className="checkbox">
          <label htmlFor="load_contact_icons">
            加载联系人图标
            <small>查找联系人的收藏夹和收藏夹</small>
          </label>
          <input
            type="checkbox"
            id="load_contact_icons"
            checked={this.state.systemSettings.load_contact_icons}
            onChange={_.partial(
              this.handleCheckboxUpdate,
              "systemSettings",
              "load_contact_icons"
            )}
          />
        </div>

        <div className="checkbox">
          <label htmlFor="show_help_button">显示帮助菜单 </label>
          <input
            type="checkbox"
            id="show_help_button"
            checked={this.state.systemSettings.show_help_button}
            onChange={_.partial(
              this.handleCheckboxUpdate,
              "systemSettings",
              "show_help_button"
            )}
          />
        </div>
      </div>
    );
  }

  renderSyncSettings() {
    return (
      <div>
        <div className="settings" id="style">
          <label htmlFor="undo_ms">
            撤消时间（ms）
            <small>撤消操作的时间长度</small>
          </label>
          <input
            type="number"
            id="undo_ms"
            value={this.state.systemSettings.undo_ms}
            onChange={_.partial(
              this.handleInputUpdate,
              "systemSettings",
              "undo_ms"
            )}
          />

          <label htmlFor="sync_interval">
            更新间隔（ms）
            <small>多久获取一次新电子邮件</small>
          </label>
          <input
            required
            type="number"
            id="sync_interval"
            value={this.state.systemSettings.sync_interval}
            onChange={_.partial(
              this.handleInputUpdate,
              "systemSettings",
              "sync_interval"
            )}
          />

          <label htmlFor="sync_days">
            同步天数
            <small>
              要同步的电子邮件天数（0=全部），不影响搜索
            </small>
          </label>
          <input
            required
            type="number"
            id="sync_days"
            value={this.state.systemSettings.sync_days}
            onChange={_.partial(
              this.handleInputUpdate,
              "systemSettings",
              "sync_days"
            )}
          />
        </div>

        {window.KANMAIL_LICENSED && (
          <div className="settings licensed">
            <div>
              <i className="yellow fa fa-star" /> Exclusive settings
            </div>

            <div className="checkbox">
              <label htmlFor="disable_error_logging">
                禁用错误记录
                <small>
                  禁止Kanmail向Sentry发送匿名错误日志--后台已禁止
                </small>
              </label>
              <input
                type="checkbox"
                id="disable_error_logging"
                checked={this.state.systemSettings.disable_error_logging}
                onChange={_.partial(
                  this.handleCheckboxUpdate,
                  "systemSettings",
                  "disable_error_logging"
                )}
              />
            </div>

            <div className="checkbox">
              <label htmlFor="disable_analytics">
                禁用分析
                <small>
                  防止Kanmail向Posthog发送匿名分析--后台已禁止
                </small>
              </label>
              <input
                type="checkbox"
                id="disable_analytics"
                checked={this.state.systemSettings.disable_analytics}
                onChange={_.partial(
                  this.handleCheckboxUpdate,
                  "systemSettings",
                  "disable_analytics"
                )}
              />
            </div>
          </div>
        )}

        <div className="settings advanced" id="system">
          <div>
            <i className="red fa fa-exclamation-triangle" /> 危险设置
          </div>

          <label htmlFor="batch_size">
            批量大小
            <small>一次要获取的电子邮件数量</small>
          </label>
          <input
            required
            type="number"
            id="batch_size"
            value={this.state.systemSettings.batch_size}
            onChange={_.partial(
              this.handleInputUpdate,
              "systemSettings",
              "batch_size"
            )}
          />

          <label htmlFor="initial_batches">
            初始批次
            <small>要提取的初始批次数</small>
          </label>
          <input
            required
            type="number"
            id="initial_batches"
            value={this.state.systemSettings.initial_batches}
            onChange={_.partial(
              this.handleInputUpdate,
              "systemSettings",
              "initial_batches"
            )}
          />

          <label>
            清空缓存
            <small>
              任何设置更改都将丢失，将立即重新加载应用程序
            </small>
          </label>
          <button className="cancel" onClick={this.handleBustCache}>
            清空缓存</button>

          {window.KANMAIL_LICENSED && (
            <div className="no-input">
              <label>
                更新授权
                <small>修改或移除授权</small>
              </label>
              <button className="" onClick={openLicense}>
                设置授权</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    return (
      <section className="no-select">
        <header className="settings flex header-bar" ref={makeDragElement}>
          <h2>设置</h2>
          <div className="button-set" ref={makeNoDragElement}>
            <button
              className={this.state.selectedTab === "accounts" ? "active" : ""}
              onClick={_.partial(this.selectTab, "accounts")}
            >
              <i className="fa fa-envelope" /> 账户列表</button>
            <button
              className={
                this.state.selectedTab === "appearance" ? "active" : ""
              }
              onClick={_.partial(this.selectTab, "appearance")}
            >
              <i className="fa fa-paint-brush" /> 外观</button>
            <button
              className={this.state.selectedTab === "system" ? "active" : ""}
              onClick={_.partial(this.selectTab, "system")}
            >
              <i className="fa fa-cog" /> 系统</button>
          </div>
          <div>{this.renderSaveButton()}</div>
        </header>

        <section id="settings">
          {this.renderMessage()}
          {this.state.selectedTab === "accounts" &&
            this.renderAccountSettings()}
          {this.state.selectedTab === "appearance" &&
            this.renderAppearanceSettings()}
          {this.state.selectedTab === "system" && this.renderSyncSettings()}
        </section>
      </section>
    );
  }
}
