/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContextKeyExpr, RawContextKey } from 'vs/platform/contextkey/common/contextkey';
import { ICommandHandler } from 'vs/platform/commands/common/commands';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput';
import { IWorkbenchContribution } from 'vs/workbench/common/contributions';
import { Registry } from 'vs/platform/registry/common/platform';
import { IQuickAccessRegistry, Extensions as QuickAccessExtensions } from 'vs/platform/quickinput/common/quickAccess';
import { Action2, registerAction2 } from 'vs/platform/actions/common/actions';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { localize } from 'vs/nls';

export const inQuickPickContextKeyValue = 'inQuickOpen';
export const InQuickPickContextKey = new RawContextKey<boolean>(inQuickPickContextKeyValue, false);
export const inQuickPickContext = ContextKeyExpr.has(inQuickPickContextKeyValue);

export const defaultQuickAccessContextKeyValue = 'inFilesPicker';
export const defaultQuickAccessContext = ContextKeyExpr.and(inQuickPickContext, ContextKeyExpr.has(defaultQuickAccessContextKeyValue));

export interface IWorkbenchQuickAccessConfiguration {
	workbench: {
		commandPalette: {
			history: number;
			preserveInput: boolean;
		},
		quickOpen: {
			enableExperimentalNewVersion: boolean;
			preserveInput: boolean;
		}
	};
}

export function getQuickNavigateHandler(id: string, next?: boolean): ICommandHandler {
	return accessor => {
		const keybindingService = accessor.get(IKeybindingService);
		const quickInputService = accessor.get(IQuickInputService);

		const keys = keybindingService.lookupKeybindings(id);
		const quickNavigate = { keybindings: keys };

		quickInputService.navigate(!!next, quickNavigate);
	};
}

export class QuickAccessCommandRegistration implements IWorkbenchContribution {

	constructor() {
		const registry = Registry.as<IQuickAccessRegistry>(QuickAccessExtensions.Quickaccess);

		for (const quickaccess of registry.getQuickAccessProviders()) {
			for (const helpEntry of quickaccess.helpEntries) {
				const prefix = helpEntry.prefix ?? quickaccess.prefix;

				registerAction2(class OpenQuickAccessAction extends Action2 {
					constructor() {
						super({
							id: `quickAccess.commands.${prefix ?? 'anything'}`,
							title: prefix ? `${helpEntry.description} (${prefix})` : helpEntry.description,
							category: localize('quickAccess', "Quick Access"),
							f1: true
						});
					}
					run(accessor: ServicesAccessor): void {
						accessor.get(IQuickInputService).quickAccess.show(prefix);
					}
				});
			}
		}
	}
}
