/*! Copyright (c) Microsoft Corporation. All rights reserved. */
import * as vsi from "@vsintellicode/vscode-intellicode-api";
export declare class PythonSupport implements vsi.IIntelliCodeLanguageSupport {
    getRequestedConfig(): vsi.IRequestedConfigSetting[];
    activate(api: vsi.IIntelliCode, logger: (str: string) => void): Promise<void>;
}
