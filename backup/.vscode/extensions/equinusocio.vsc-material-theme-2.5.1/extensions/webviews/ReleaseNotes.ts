import {WebviewController} from './Webview';
import {
  ExtensionContext
} from 'vscode';
import {ReleaseNotesBootstrap} from './interfaces';

export class ReleaseNotesWebview extends WebviewController<ReleaseNotesBootstrap> {
  constructor(context: ExtensionContext) {
    super(context);
  }

  get filename(): string {
    return 'release-notes.html';
  }

  get id(): string {
    return 'materialTheme.releaseNotes';
  }

  get title(): string {
    return 'Material Theme Release Notes';
  }

  /**
   * This will be called by the WebviewController when init the view
   * passing as `window.bootstrap` to the view.
   */
  getBootstrap() {
    return {
      something: 'something'
    } as ReleaseNotesBootstrap;
  }
}
