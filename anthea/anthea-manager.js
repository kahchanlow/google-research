// Copyright 2022 The Google Research Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview AntheaManager is the class that manages the overall Anthea
 * tool interface, offering menus to create/open/download/close active projects
 * and view downloaded project files.
 */

/**
 * AntheaManager is the main class managing the Anthea tool. It listens to
 * various UI events and handles them.
 */
class AntheaManager {
  /**
   * Constructor.
   */
  constructor() {
    /** @private @const {!Element} */
    this.logHeader_ = document.getElementById('anthea-log-header');
    /** @private @const {!Element} */
    this.log_ = document.getElementById('anthea-log');
    /** @private @const {!Element} */
    this.logItems_ = document.getElementById('anthea-log-items');
    /** @const {string} */
    this.INFO = "anthea-log-info";
    /** @const {string} */
    this.WARNING = "anthea-log-warning";
    /** @const {string} */
    this.ERROR = "anthea-log-error";

    /** @private {?AntheaEval} */
    this.eval_ = null;
    /** @private @const {!Element} */
    this.evalDiv_ = document.getElementById('anthea-eval-div');
    /** @private @const {!Element} */
    this.mqmViewer_ = document.getElementById('anthea-mqm-viewer');

    /** @private @const {string} */
    this.ACTIVE_KEY_PREFIX_ = 'anthea-active:';
    /** @private @const {string} */
    this.ACTIVE_RESULTS_KEY_PREFIX_ = 'anthea-active-results:';

    /** @private {string} */
    this.projectName_ = '';
    /** @private {string} */
    this.templateName_ = '';
    /** @private {string} */
    this.lastRaterId_ = '';
    /** @private {?Object} */
    this.activeData_ = null;
    /** @private {?Array<!Object>} */
    this.activeResults_ = null;

    /** @private @const {!Element} */
    this.evaluatingProject_ = document.getElementById(
        'anthea-evaluating-project');
    /** @private @const {!Element} */
    this.projectNameDisplay_ = document.getElementById('anthea-project-name');

    /** @private @const {!Element} */
    this.evaluatingTemplate_ = document.getElementById(
        'anthea-evaluating-template');
    /** @private @const {!Element} */
    this.templateNameDisplay_ = document.getElementById('anthea-template-name');

    /** @private @const {!Element} */
    this.viewing_ = document.getElementById('anthea-viewing');
    /** @private @const {!Element} */
    this.viewingList_ = document.getElementById('anthea-viewing-list');
    /** @private @const {!Element} */
    this.viewingCount_ = document.getElementById('anthea-viewing-count');
    /** @private @const {!Element} */
    this.viewingMQMTab_ = document.getElementById('anthea-viewing-mqm-tab');
    /** @private @const {!Element} */
    this.viewingMQM_ = document.getElementById('anthea-viewing-mqm');
    /** @private {string} */
    this.viewingMQMData_ = '';
    /** @private @const {!Element} */
    this.viewingEvalTab_ = document.getElementById('anthea-viewing-eval-tab');
    /** @private @const {!Element} */
    this.viewingEval_ = document.getElementById('anthea-viewing-eval');
    /** @private @const {!Array<!Object>} */
    this.viewingListData_ = [];
    /** @private @const {!Element} */
    this.viewFiles_ = document.getElementById('anthea-view-files');

    /** @private {string} */
    this.downloadName_ = '';
    /** @private @const {!Element} */
    this.afterDownload_ = document.getElementById('anthea-keep-active');
    this.afterDownload_.disabled = true;
    /** @private @const {!Element} */
    this.downloadButton_ = document.getElementById('anthea-download-button');
    this.downloadButton_.disabled = true;

    /** @private @const {!Element} */
    this.newProjectTemplate_ = document.getElementById(
        'anthea-new-project-template');
    /** @private @const {!Element} */
    this.newProjectFile_ = document.getElementById('anthea-new-project-file');
    /** @private @const {!Element} */
    this.activeList_ = document.getElementById('anthea-project-template-list');

    /** @private {?Element} */
    this.openMenuItem_ = null;

    /** @private @const {number} */
    this.MAX_ACTIVE_ = 16;
    /** @private {number} */
    this.numActive_ = 0;

    /** @private @const {!RegExp} */
    this.VALID_NAME_RE_ = /^[a-zA-Z0-9 ._\(\)-]+$/;

    /** @private @const {!Element} */
    this.antheaBellQuote_ = document.getElementById('anthea-bell-quote');

    this.populateTemplateChoices();
    this.populateActiveChoices();
    this.setUpListeners();

    this.clear();
    this.log(this.INFO, 'Anthea initialized');
  }

  /**
   * Compose a colon-separated name joining project name and template name.
   *
   * @param {string} p The project name.
   * @param {string} t The template name.
   * @return {string} The colon-concatenated joint name.
   */
  activeName(p, t) {
    return p + ':' + t;
  }

  /**
   * Parse a colon-separated name and extract the project name from it.
   *
   * @param {string} a The colon-concatenated name.
   * @return {string} The project-name part of the colon-concatenated name.
   */
  projectInActive(a) {
    const colon = a.indexOf(':');
    return a.substr(0, colon);
  }

  /**
   * Parse a colon-separated name and extract the template name from it.
   *
   * @param {string} a The colon-concatenated name.
   * @return {string} The template-name part of the colon-concatenated name.
   */
  templateInActive(a) {
    const colon = a.indexOf(':');
    return a.substr(colon + 1);
  }

  /**
   *  Set up event listeners.
   */
  setUpListeners() {
    this.newProjectFile_.addEventListener(
        'change', this.handleNewProjectFile.bind(this));
    this.viewFiles_.addEventListener(
        'change', this.handleViewFiles.bind(this));
    this.activeList_.addEventListener(
        'change', this.handleChangedActive.bind(this));
    this.afterDownload_.addEventListener(
        'change', this.handleChangeAfterDownload.bind(this));
    this.downloadButton_.addEventListener(
        'click', this.handleDownload.bind(this));
    this.viewingMQM_.addEventListener(
        'click', this.handleViewingMQMTab.bind(this));
    this.viewingList_.addEventListener(
        'change', this.handleViewingChange.bind(this));
    this.viewingEval_.addEventListener(
        'click', this.handleViewingEvalTab.bind(this));

    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleClick.bind(this));

    const menuButtons = document.getElementsByClassName(
        'anthea-dropdown-button');
    for (let i = 0; i < menuButtons.length; i++) {
      let menuContent = menuButtons[i].nextElementSibling;
      menuButtons[i].addEventListener('click', evt => {
        this.toggleMenu(menuContent);
        evt.stopPropagation();
      });
      menuButtons[i].addEventListener('mouseenter', evt => {
        if (this.openMenuItem_ != menuContent) {
          this.closeMenu();
        }
      });
    }
  }

  /**
   * Click handler that closes the currently open menu item if the
   * click is outside of it.
   *
   * @param {!Event} evt The click event.
   */
  handleClick(evt) {
    if (!this.openMenuItem_) {
      return;
    }
    if (!this.openMenuItem_.contains(evt.target) ||
        evt.key == "Escape") {
      this.closeMenu();
    }
  }

  /**
   * Close the currently open menu item, if there is one.
   */
  closeMenu() {
    if (!this.openMenuItem_) {
      return;
    }
    this.openMenuItem_.style.display = 'none';
    this.openMenuItem_ = null;
  }

  /**
   * Open/close the given menu item.
   *
   * @param {!Element} elt The element with class anthea-dropdown-content.
   */
  toggleMenu(elt) {
    if (elt == this.openMenuItem_) {
      this.closeMenu();
      return;
    }
    this.closeMenu();
    this.openMenuItem_ = elt;
    this.openMenuItem_.style.display = 'block';
  }

  /**
   * Populate template choices.
   */
  populateTemplateChoices() {
    const templateNames = Object.keys(antheaTemplates);
    this.newProjectTemplate_.innerHTML = '';
    let numTemplates = 0;
    for (let templateName of templateNames) {
      if (!this.VALID_NAME_RE_.test(templateName)) {
        this.log(this.WARNING, 'Template name is invalid: ' + templateName);
        continue;
      }
      numTemplates++;
      this.newProjectTemplate_.insertAdjacentHTML('beforeend', `
          <option value="${templateName}">${templateName}</option>`);
    }
    if (numTemplates == 0) {
      this.log(this.ERROR, 'Could not find any valid antheaTemplate entries');
      throw 'Failed to initialize AntheaManager';
    }
  }

  /**
   * Populate active project-template choices.
   */
  populateActiveChoices() {
    /**
     * Remove children instead of clearing innerHTML, to keep change listener.
     */
    while (this.activeList_.firstElementChild) {
      this.activeList_.firstElementChild.remove();
    }
    this.activeList_.insertAdjacentHTML('beforeend', '<option></option>');
    this.numActive_ = 0;
    for (let idx = 0; idx < window.localStorage.length; idx++) {
      const key = window.localStorage.key(idx);
      if (!key.startsWith(this.ACTIVE_KEY_PREFIX_)) {
        continue;
      }
      this.numActive_++;
      const activeName = key.substr(this.ACTIVE_KEY_PREFIX_.length);
      const projectName = this.projectInActive(activeName);
      const templateName = this.templateInActive(activeName);
      this.activeList_.insertAdjacentHTML('beforeend', `
          <option
              value="${activeName}">${projectName} (${templateName})</option>`);
    }
  }

  /**
   * Append a messsage to to the list of messages.
   *
   * @param {string} level One of INFO/WARNING/ERROR.
   * @param {string} message The message to display.
   */
  log(level, message) {
    const timestamp = new Date();
    const entry = `
      <div class="${level}">
        ${timestamp.toLocaleString()}: ${message}
      </div>
    `;
    this.logHeader_.className = level;
    this.logItems_.insertAdjacentHTML('beforeend', entry);
    this.log_.scrollTop = Number.MAX_SAFE_INTEGER;
  }

  /**
   * Saves the active project-template results to local storage. May log an
   * error if we're out of local storage.
   *
   * @param {!Array<!Object>} currentResults The array of results so far.
   */
  persistActiveResults(currentResults) {
    if (!this.projectName_ || !this.templateName_) {
      return;
    }
    const activeName = this.activeName(this.projectName_, this.templateName_);
    const activeResultsKey = this.ACTIVE_RESULTS_KEY_PREFIX_ + activeName;
    this.activeResults_ = currentResults;
    try {
      window.localStorage.setItem(activeResultsKey,
                                  JSON.stringify(this.activeResults_));
    } catch (err) {
      this.log(this.ERROR,
               'Could not save active state. Clear some space in local ' +
               'storage by deleting old actives, perhaps. Exception: ' +
                err.toString() + ' — Stack: ' + err.stack);
    }
  }

  /**
   * Create a new active project:template with the data in projectFilePath. The
   * project will be named by the basename of the file.
   *
   * @param {string} templateName Name of the template.
   * @param {string} projectFilePath Path of the project file.
   * @param {string} projectFileContents Contents of the project file.
   * @param {number=} hotwPercent HOTW testing rate (percent).
   */
  createActive(templateName, projectFilePath, projectFileContents,
               hotwPercent=0) {
    if (this.numActive_ >= this.MAX_ACTIVE_) {
      this.log(this.ERROR,
               'There already are ' + this.numActive_ + ' actives. ' +
               'Please close at least ' +
               (1 + this.numActives_ - this.MAX_ACTIVE_) + ' active(s).');
      return;
    }
    let lastSlash = projectFilePath.lastIndexOf('/');
    let lastBackSlash = projectFilePath.lastIndexOf('\\');
    const projectName = projectFilePath.substr(
        1 + Math.max(lastSlash, lastBackSlash));
    if (!this.VALID_NAME_RE_.test(projectName)) {
      this.log(this.WARNING, 'Project name is invalid: ' + projectName);
      return;
    }
    const activeName = this.activeName(projectName, templateName);
    const activeKey = this.ACTIVE_KEY_PREFIX_ + activeName;
    this.log(this.INFO, 'Creating project ' + projectName + ' with template ' +
             templateName);
    try {
      let activeData = window.localStorage.getItem(activeKey);
      if (activeData) {
        this.log(this.WARNING,
                 'A project:template named ' + activeName + '  already exists');
        return;
      }
      const parsedDocSys = AntheaDocSys.parseProjectFileContents(
          projectFileContents);
      activeData = {
        projectName: projectName,
        templateName: templateName,
        projectFilePath: projectFilePath,
        projectFileContents: projectFileContents,
        parsedDocSys: parsedDocSys,
        createdAt: Date.now(),
        hotwPercent: hotwPercent,
        // `JSON.stringify` can't deal with additional properties of arrays
        // nicely, hence we are adding them explicitly here.
        srcLang: parsedDocSys.srcLang,
        tgtLang: parsedDocSys.tgtLang,
      };
      window.localStorage.setItem(activeKey, JSON.stringify(activeData));
      const activeResultsKey = this.ACTIVE_RESULTS_KEY_PREFIX_ + activeName;
      window.localStorage.setItem(activeResultsKey, JSON.stringify([]));
      this.log(this.INFO, 'Created project ' + projectName + ' with template ' +
               templateName);
    } catch(err) {
      this.log(this.ERROR, 'Error in creating project ' + projectName +
               ' with template ' + templateName + ': ' +
               err.toString() + ' — Stack: ' + err.stack);
      return;
    }
    this.populateActiveChoices();
    this.openActive(activeName);
  }

  /**
   * Event handler for a change in the 'new project file' input.
   */
  handleNewProjectFile() {
    this.closeMenu();
    const templateName = this.newProjectTemplate_.value;
    const file = this.newProjectFile_.files[0];
    let fileReader = new FileReader();
    fileReader.onload = evt => {
      this.createActive(templateName, file.name, fileReader.result);
      this.newProjectFile_.value = '';
    };
    fileReader.readAsText(file);
  }

  /**
   * Event handler for a change in the 'open an active project' selection.
   */
  handleChangedActive() {
    this.closeMenu();
    if (this.activeList_.value !=
        this.activeName(this.projectName_, this.templateName_)) {
      this.openActive(this.activeList_.value);
    }
  }

  /**
   * Delete the currently active project.
   */
  deleteActive() {
    if (!this.projectName_ && !this.templateName_) {
      this.log(this.ERROR,
               'Called delete() but there no currently active project');
      return;
    }
    const activeName = this.activeName(this.projectName_, this.templateName_);
    try {
      const activeDataKey = this.ACTIVE_KEY_PREFIX_ + activeName;
      window.localStorage.removeItem(activeDataKey);
      const activeResultsKey = this.ACTIVE_RESULTS_KEY_PREFIX_ + activeName;
      window.localStorage.removeItem(activeResultsKey);
    } catch (err) {
      this.log(this.ERROR,
               'In delete(), there were problems clearing local storage: ' +
               err.toString() + ' —Stack: ' + err.stack);
    }
    this.clear();
    this.populateActiveChoices();
    this.log(this.INFO, 'Deleted project ' + this.projectInActive(activeName) +
             ' with template ' + this.templateInActive(activeName));
  }

  /**
   * Event handler for change in afterDownload_.
   */
  handleChangeAfterDownload() {
    this.afterDownload_.className = (this.afterDownload_.value == 'close') ?
        'anthea-select-close' : 'anthea-select-keep';
  }

  /**
   * Event handler for download.
   */
  handleDownload() {
    this.closeMenu();
    if (!this.activeData_ || !this.activeResults_ || !this.downloadName_) {
      this.log(this.WARNING, 'There is no active project to save');
      return;
    }
    let numVisited = 0;
    for (let sentRes of this.activeResults_) {
      if (sentRes.visited) {
        numVisited++;
      }
    }
    let message = 'Please enter user-name or ID to save with the evaluation.';

    if (numVisited < this.activeResults_.length) {
      message += ' Note that this project\'s evaluation has not yet been ' +
                 'completed. You can press Escape to cancel the download.';
    }
    let raterId = prompt(message, this.lastRaterId_);
    if (raterId) {
      raterId = raterId.trim();
    }
    if (!raterId) {
      return;
    }
    this.lastRaterId_ = raterId;
    const dataToSave = JSON.stringify({
      raterId: raterId,
      projectName: this.activeData_.projectName,
      templateName: this.activeData_.templateName,
      template: antheaTemplates[this.activeData_.templateName],
      projectFilePath: this.activeData_.projectFilePath,
      projectFileContents: this.activeData_.projectFileContents,
      parsedDocSys: this.activeData_.parsedDocSys,
      createdAt: this.activeData_.createdAt,
      results: this.activeResults_,
      hotwPercent: this.activeData_.hotwPercent,
      srcLang: this.activeData_.srcLang,
      tgtLang: this.activeData_.tgtLang,
      savedAt: Date.now(),
    });
    const a = document.createElement("a");
    a.style.display = 'none';
    document.body.appendChild(a);
    a.href = window.URL.createObjectURL(
      new Blob([dataToSave], {type: "text/json"})
    );
    const fileName = this.downloadName_.replace('[user-name]', raterId);
    a.setAttribute('download', fileName);
    a.click();
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
    this.log(this.INFO, 'Downloaded current results as ' +
             fileName.replace(/\.json$/, '*.json'));

    const close = this.afterDownload_.value == 'close';
    if (close) {
      if (!confirm('Are you sure you want to delete the project?')) {
        return;
      }
      this.deleteActive();
      this.afterDownload_.value = 'keep';
      this.afterDownload_.className = 'anthea-select-keep';
    }
  }

  /**
   * Event handler for a change in the 'view evaluation file(s)' input.
   */
  handleViewFiles() {
    this.closeMenu();
    this.clear();
    this.viewing_.style.display = '';
    this.viewingMQMTab_.style.display = 'none';
    this.viewingMQMData_ = '';
    let numRead = 0;
    const numToRead = this.viewFiles_.files.length;
    this.viewingCount_.innerHTML = numToRead;
    for (let index = 0; index < this.viewFiles_.files.length; index++) {
      const file = this.viewFiles_.files[index];
      let fileReader = new FileReader();
      fileReader.onload = evt => {
        this.addToViewingList(file.name, fileReader.result);
        numRead++;
        if (numRead == numToRead) {
          if (this.viewingMQMData_) {
            createMQMViewer(this.mqmViewer_, this.viewingMQMData_);
            this.viewingMQMTab_.style.display = '';
            this.handleViewingMQMTab();
          }
        }
      };
      fileReader.readAsText(file);
    }
    this.viewFiles_.value = '';
    this.handleViewingEvalTab();
  }

  /**
   * This clears just the current eval object and associated data..
   */
  clearEval() {
    if (this.eval_) {
      this.eval_.clear();
      this.eval_ = null;
    }
    this.evalDiv_.innerHTML = '';
  }

  /**
   * After a project is closed, or after opening a project fails, this
   * function is called to clear the state and the UI.
   */
  clear() {
    this.clearEval();
    this.evalDiv_.style.display = '';

    this.projectName_ = '';
    this.templateName_ = '';
    this.activeData_ = null;
    this.activeResults_ = null;
    this.activeList_.value = '';

    this.downloadName_ = '';
    this.downloadButton_.innerHTML = 'N/A';
    this.downloadButton_.disabled = true;
    this.afterDownload_.disabled = true;
    this.afterDownload_.className = 'anthea-select-keep';

    this.projectNameDisplay_.innerHTML = '';
    this.templateNameDisplay_.innerHTML = '';
    this.viewingList_.innerHTML = '';
    this.viewingListData_.length = 0;
    this.evaluatingProject_.style.display = 'none';
    this.evaluatingTemplate_.style.display = 'none';
    this.viewing_.style.display = 'none';
    this.mqmViewer_.innerHTML = '';
    this.mqmViewer_.style.display = 'none';

    this.antheaBellQuote_.style.display = '';
  }

  /**
   * Open the active project-template specified.
   *
   * @param {string} activeName The name of the project:template to open.
   */
  openActive(activeName) {
    this.log(this.INFO, 'Opening project ' + this.projectInActive(activeName) +
             ' with template ' + this.templateInActive(activeName));
    this.clear();
    this.projectName_ = this.projectInActive(activeName);
    this.templateName_ = this.templateInActive(activeName);
    try {
      const activeDataKey = this.ACTIVE_KEY_PREFIX_ + activeName;
      const activeDataJSON = window.localStorage.getItem(activeDataKey);
      this.activeData_ = JSON.parse(activeDataJSON);
      const activeResultsKey = this.ACTIVE_RESULTS_KEY_PREFIX_ + activeName;
      const activeResultsJSON = window.localStorage.getItem(activeResultsKey);
      this.activeResults_ = JSON.parse(activeResultsJSON);
      const template = antheaTemplates[this.activeData_.templateName];

      this.activeData_.parsedDocSys.srcLang = this.activeData_.srcLang;
      this.activeData_.parsedDocSys.tgtLang = this.activeData_.tgtLang;

      this.antheaBellQuote_.style.display = 'none';
      this.eval_ = new AntheaEval(this);
      this.eval_.setUpEval(this.evalDiv_, template,
                           this.activeData_.parsedDocSys, this.activeResults_,
                           this.activeData_.hotwPercent || 0);
    } catch (err) {
      this.clear();
      this.log(this.ERROR,
               'Failed to open project:template: ' + activeName + ': ' +
               err.toString() + ' — Stack: ' + err.stack);
      return;
    }
    this.downloadName_ =
        `anthea_[user-name]_`+
        `${this.projectName_}_${this.templateName_}.json`;
    this.activeList_.value = activeName;
    this.projectNameDisplay_.innerHTML = this.projectName_;
    this.templateNameDisplay_.innerHTML = this.templateName_;
    this.evaluatingProject_.style.display = '';
    this.evaluatingTemplate_.style.display = '';
    this.downloadButton_.innerHTML = this.downloadName_;
    this.downloadButton_.disabled = false;
    this.afterDownload_.disabled = false;
    this.log(this.INFO, 'Opened project ' + this.projectName_ +
             ' with template ' + this.templateName_);
  }

  /**
   * View the evaluation data in this.viewingListData_[index]
   *
   * @param {number} index The index in the viewingListData_ array.
   */
  viewEval(index) {
    if (index < 0 || index >= this.viewingListData_.length) {
      this.log(this.ERROR, 'Invalid index ' + index + ' in viewEval()');
      return;
    }
    const evalData = this.viewingListData_[index];
    this.clearEval();
    this.antheaBellQuote_.style.display = 'none';
    this.eval_ = new AntheaEval(this, true /* readOnly */);
    this.eval_.setUpEval(this.evalDiv_, evalData.template,
                         evalData.parsedDocSys, evalData.results);
    this.log(this.INFO, 'Viewing evaluation for ' + evalData.projectName +
             ' with template ' + evalData.templateName + ' done by ' +
             evalData.raterId);
  }

  /**
   * Event handler for a click on 'Evaluation Review'.
   */
  handleViewingEvalTab() {
    this.viewingEvalTab_.className = 'anthea-viewing-tab-active';
    this.mqmViewer_.style.display = 'none';
    this.evalDiv_.style.display = '';
    this.viewingMQMTab_.className = 'anthea-viewing-tab';
  }

  /**
   * Event handler for a change in the evaluation file selection.
   */
  handleViewingChange() {
    this.viewEval(this.viewingList_.value);
  }

  /**
   * Event handler for a click on 'MQM Analysis'.
   */
  handleViewingMQMTab() {
    this.viewingMQMTab_.className = 'anthea-viewing-tab-active';
    this.viewingEvalTab_.className = 'anthea-viewing-tab';
    this.antheaBellQuote_.style.display = 'none';
    this.log(this.INFO, 'Viewing MQM Analysis ');
    this.evalDiv_.style.display = 'none';
    this.mqmViewer_.style.display = '';
  }

  /**
   * Replace tabs, newlines, zero-width-spaces, etc. and return cleaned text.
   * @param {string} s The text to clean.
   * @return {string} The cleaned text.
   */
  cleanText(s) {
    const replacements = [['\u200b', ''], ['\t', ' '], ['\\t', ' '],
                          ['\n', ' '], ['\\n', ' '], ['\r', ' '],
                          ['\\r', ' ']];
    for (let r of replacements) {
      s = s.replaceAll(r[0], r[1]);
    }
    return s;
  }

  /**
   * Put a <v>...<.v> around the error span.
   * @param {string} text The text in which to insert the marking.
   * @param {!Object} error The error object, with start and end properties.
   * @return {string} The text after marking the error span.
   */
  markMQMSpan(text, error) {
    const start = error['start'];
    const end = error['end'];
    if (start < 0 || end < start) {
      return text;
    }
    const textParts = text.trim().split(' ');
    const partsWithSpace = [];
    let isFirst = !text.startsWith(' ');
    for (let part of textParts) {
      if (isFirst) {
        isFirst = false;
      } else {
        partsWithSpace.push(' ');
      }
      const subParts = part.split('\u200b');
      let isFirstSub = true;
      for (let subPart of subParts) {
        if (isFirstSub) {
          partsWithSpace.push(subPart);
          isFirstSub = false;
        } else {
          partsWithSpace.push('\u200b' + subPart);
        }
      }
    }
    if (text.endsWith(' ')) {
      partsWithSpace.push(' ');
    }
    let out = '';
    for (let index = 0; index < partsWithSpace.length; index++) {
      if (index == start) {
        out += '<v>';
      }
      out += partsWithSpace[index];
      if (index == end) {
        out += '</v>';
      }
    }
    return out;
  }

  /**
   * Get MQM-format data for the one error in the current segment.
   * @param {!Object} parsedData The full evaluation data.
   * @param {!AntheaDocSys} docsys The current AntheaDocSys.
   * @param {number} segIndex Index of the segment in this doc.
   * @param {string} src The source segment text.
   * @param {string} tgt The translated segment text.
   * @param {!Object} error The error object.
   * @return {string} One line of MQM TSV data.
   */
  getMQMSegData(parsedData, docsys, segIndex, src, tgt, error) {
    if (error.location == 'source') {
      src = this.markMQMSpan(src, error);
    } else if (error.location == 'translation') {
      tgt = this.markMQMSpan(tgt, error);
    }
    src = this.cleanText(src);
    tgt = this.cleanText(tgt);
    let type = error['type'];
    let subtype = error['subtype'];
    const templateError = parsedData.template.errors[type];
    if (templateError) {
      if (templateError.display) {
        type = templateError.display;
        if (templateError.subtypes && templateError.subtypes[subtype] &&
            templateError.subtypes[subtype].display) {
          subtype = templateError.subtypes[subtype].display;
        }
      }
    }
    let mqmSegData =
        docsys.sys +
        '\t' + docsys.doc +
        '\t' + segIndex +
        '\t' + docsys.doc + ':' + segIndex +
        '\t' + parsedData.projectName + ':' + parsedData.raterId +
        '\t' + src +
        '\t' + tgt +
        '\t' + type + (subtype ? '/' + subtype : '') +
        '\t' + error['severity'] +
        '\t' + JSON.stringify(error.metadata);
     mqmSegData += '\n';
     return mqmSegData;
  }

  /**
   * Return non-zero if e is an actual MQM error (as opposed to neutral etc.)
   * @param {!Object} e the error object.
   * @return {number}
   */
  mqmErrorGrade(e) {
    let grade = 1;
    const lsev = e['severity'].toLowerCase().replaceAll('-', '_');
    const lcat = e['type'].toLowerCase().replaceAll('-', '_');
    if (lsev.startsWith('non_translation') ||
        lcat.startsWith('non_translation')) {
      grade = 250;
    } else if (lsev == 'critical') {
      grade = 200;
    } else if (lsev == 'major') {
      grade = 50;
    } else if (lsev == 'minor') {
      grade = 10;
    } else if (lsev == 'trivial') {
      grade = 1;
    } else if (lsev == 'no_error' || lsev == 'unrateable' ||
               lsev == 'neutral' || lsev == 'hotw_test') {
      grade = 0;
    }
    return grade;
  }

  /**
   * Return TSV-formatted MQM data from the parsed evaluation data.
   * @param {!Object} parsedData The parsed evaluation data.
   * @return {string}
   */
  getMQMData(parsedData) {
    let mqmData = '';
    let resultIndex = 0;
    for (let docsys of parsedData.parsedDocSys) {
      let segIndex = 0;
      for (let l = 0; l < docsys.srcSentGroups.length; l++) {
        console.assert(l < docsys.tgtSentGroups.length,
                       l, docsys.tgtSentGroups.length);
        const src = docsys.srcSentGroups[l];
        if (!src) {
          continue;
        }
        const tgt = docsys.tgtSentGroups[l];
        console.assert(resultIndex < parsedData.results.length,
                       resultIndex, parsedData.results.length);
        const segResult = parsedData.results[resultIndex++];
        segIndex++;
        if (!segResult.visited) {
          continue;
        }
        const errors = segResult.errors.slice();
        let noError = true;
        for (let e of errors) {
          if (this.mqmErrorGrade(e) > 0) {
            noError = false;
            break;
          }
        }
        if (noError) {
          errors.push({
            'severity': 'No-error',
            'type': 'No-error',
            'subtype': '',
            'location': '',
            'start': 0,
            'end': 0,
            'metadata': {
              timestamp: segResult.timestamp,
              timing: segResult.timing,
            },
          });
        }
        if (segResult.hotw && segResult.hotw.done) {
          errors.push({
            'severity': 'HOTW-test',
            'type': (segResult.hotw.found ? 'Found' : 'Missed'),
            'subtype': '',
            'location': '',
            'start': 0,
            'end': 0,
            'metadata': {
              timestamp: segResult.hotw.timestamp,
              timing: segResult.hotw.timing,
              'note': this.cleanText(segResult.hotw.injected_error),
            },
          });
        }
        for (let error of errors) {
          if (!error.metadata) {
            error.metadata = {};
          }
          if (!error.metadata.timestamp) {
            error.metadata.timestamp = segResult.timestamp;
          }
          if (!error.metadata.timing) {
            error.metadata.timing = {};
          }
          if (error.note && !error.metadata.note) {
            error.metadata.note = error.note;
          }
          mqmData += this.getMQMSegData(parsedData, docsys,
                                        segIndex, src, tgt, error);
        }
      }
    }
    return mqmData;
  }

  /**
   * Add the passed evaluation data file to the viewing choices menu. Open it
   * if this is the first data file.
   *
   * @param {string} evaluationFileName The name of the evaluation data file.
   * @param {string} evaluationFileData The contents of the evaluation data file.
   */
  addToViewingList(evaluationFileName, evaluationFileData) {
    this.log(this.INFO, 'Opening evaluation data file ' + evaluationFileName +
             ' with data length ' + evaluationFileData.length);
    try {
      const parsedData = JSON.parse(evaluationFileData);
      if (!parsedData.raterId || !parsedData.projectName ||
          !parsedData.templateName || !parsedData.template ||
          !parsedData.parsedDocSys ||
          !parsedData.results || !parsedData.createdAt || !parsedData.savedAt ||
          !parsedData.srcLang || !parsedData.tgtLang) {
        throw 'Invalid evaluation data file: ' + evaluationFileName;
      }
      parsedData.parsedDocSys.srcLang = parsedData.srcLang;
      parsedData.parsedDocSys.tgtLang = parsedData.tgtLang;
      this.viewingList_.insertAdjacentHTML('beforeend', `
          <option value="${this.viewingListData_.length}">
              Project: ${parsedData.projectName} (${parsedData.templateName})
              Evaluated by: ${parsedData.raterId}
          </option>`);
      this.viewingListData_.push(parsedData);
      if (!parsedData.template.sqm) {
        this.viewingMQMData_ += this.getMQMData(parsedData);
      }
    } catch (err) {
      this.clear();
      this.log(this.ERROR, 'Failed to open evaluation data file ' +
               evaluationFileName + ': ' +
               err.toString() + ' — Stack: ' + err.stack);
      return;
    }
    if (this.viewingListData_.length == 1) {
      this.viewEval(0);
    }
  }
}