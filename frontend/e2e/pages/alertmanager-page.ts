import { expect } from '@playwright/test';
import yaml from 'js-yaml';

import BasePage from './base-page';

type AlertmanagerConfig = {
  global?: Record<string, any>;
  receivers?: AlertmanagerReceiver[];
  route?: any;
  inhibit_rules?: any[];
};

type AlertmanagerReceiver = {
  name: string;
  [key: string]: any;
};

export class AlertmanagerPage extends BasePage {
  private readonly createReceiverButton = this.page.getByTestId('create-receiver');
  private readonly receiverNameInput = this.page.getByTestId('receiver-name');
  private readonly receiverTypeDropdown = this.page.getByTestId('receiver-type');
  private readonly saveChangesButton = this.page.getByTestId('save-changes');
  private readonly advancedConfigButton = this.page.getByTestId('advanced-configuration');

  /**
   * Navigate to the Alertmanager configuration page
   */
  async navigateToAlertmanager(): Promise<void> {
    await this.goTo('/settings/cluster/alertmanagerconfig');
    await this.createReceiverButton.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to the Alertmanager YAML editor page
   */
  async navigateToYAMLPage(): Promise<void> {
    await this.goTo('/settings/cluster/alertmanageryaml');
    // Wait for editor toolbar to load (indicates editor is ready)
    await this.page.getByRole('button', { name: 'Copy code to clipboard' }).waitFor();
  }

  /**
   * Navigate to the edit page for a specific receiver
   */
  async navigateToEditReceiver(receiverName: string): Promise<void> {
    await this.goTo(`/settings/cluster/alertmanagerconfig/receivers/${receiverName}/edit`);
    await this.saveChangesButton.waitFor({ state: 'visible' });
  }

  /**
   * Start creating a new receiver
   * @param receiverName - Name for the receiver
   * @param receiverTypeConfig - The receiver type config name (e.g. 'email_configs')
   */
  async createReceiver(receiverName: string, receiverTypeConfig: string): Promise<void> {
    await this.robustClick(this.createReceiverButton);
    await this.receiverNameInput.fill(receiverName);

    // Open receiver type dropdown and select
    await this.robustClick(this.receiverTypeDropdown);
    const typeOption = this.page.getByTestId(`receiver-type-${receiverTypeConfig}`);
    await this.robustClick(typeOption);
  }

  /**
   * Click the save changes button and wait for changes to rollout
   */
  async save(): Promise<void> {
    await expect(this.saveChangesButton).toBeEnabled();
    await this.robustClick(this.saveChangesButton);
    // Wait for changes to propagate to alertmanager pods
    await this.page.waitForTimeout(10000);
  }

  /**
   * Expand the advanced configuration section
   */
  async showAdvancedConfiguration(): Promise<void> {
    const button = this.advancedConfigButton.locator('button');
    await this.robustClick(button);
  }

  /**
   * Get the YAML editor content
   * @returns The YAML content as a string
   */
  async getYAMLContent(): Promise<string> {
    // Get content from Monaco editor
    const content = await this.page.evaluate(() => {
      const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
      return monacoEditor?.getValue() || '';
    });

    return content;
  }

  /**
   * Set the YAML editor content
   */
  async setYAMLContent(content: string): Promise<void> {
    await this.page.evaluate((text) => {
      const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
      monacoEditor?.setValue(text);
    }, content);
  }

  /**
   * Validate that a receiver appears in the list with expected cells
   */
  async validateReceiverInList(receiverName: string): Promise<void> {
    // Navigate to list page first
    await this.navigateToAlertmanager();

    // Check receiver row exists
    const receiverRow = this.page.getByRole('row', { name: new RegExp(receiverName) });
    await expect(receiverRow).toBeVisible();

    // Check that integration type cell is visible
    const integrationTypeCell = this.page.getByTestId(
      `data-view-cell-${receiverName}-integration-types`,
    );
    await expect(integrationTypeCell).toBeVisible();

    // Check that routing labels cell is visible
    const routingLabelsCell = this.page.getByTestId(
      `data-view-cell-${receiverName}-routing-labels`,
    );
    await expect(routingLabelsCell).toBeVisible();
  }
}

/**
 * Parse YAML content and extract global config and receiver config
 * @param receiverName - Name of the receiver to find
 * @param configName - Config type name (e.g. 'email_configs')
 * @param yamlContent - The YAML content string
 * @returns Object with globals and receiverConfig
 */
export function getGlobalsAndReceiverConfig(
  receiverName: string,
  configName: string,
  yamlContent: string,
): {
  globals: any;
  receiverConfig: any;
} {
  const config: AlertmanagerConfig = yaml.load(yamlContent) as AlertmanagerConfig;
  const receiver: AlertmanagerReceiver | undefined = config.receivers?.find(
    (r) => r.name === receiverName,
  );

  return {
    globals: config.global || {},
    receiverConfig: receiver?.[configName]?.[0] || {},
  };
}
