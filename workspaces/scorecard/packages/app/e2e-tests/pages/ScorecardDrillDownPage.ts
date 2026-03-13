/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Locator, Page, expect } from '@playwright/test';
import {
  ScorecardMessages,
  getDrillDownCardSnapshot,
  getDrillDownMissingPermissionSnapshot,
  getDrillDownNoDataFoundSnapshot,
  getEntitiesPageMissingPermission,
  getEntitiesPageNoDataFound,
  getEntitiesTableHeaderLabels,
  getMetricTitleEn,
  getSomeEntitiesNotReportingTooltip,
} from '../utils/translationUtils';

type MetricId = 'github.open_prs' | 'jira.open_issues';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ScorecardDrillDownPage {
  readonly page: Page;
  readonly translations: ScorecardMessages;

  constructor(page: Page, translations: ScorecardMessages) {
    this.page = page;
    this.translations = translations;
  }

  async expectOnPage(metricId: MetricId) {
    await expect(this.page).toHaveURL(
      new RegExp(`/scorecard/metrics/${metricId.replace('.', '\\.')}`),
    );
  }

  async expectPageTitle(metricId: MetricId) {
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.metric[metricId].title,
        level: 1,
      }),
    ).toBeVisible();
  }

  /** Inner article (the scorecard card); on drill-down page the card is nested inside a wrapper article. */
  getDrillDownCard(metricId: MetricId): Locator {
    const translatedTitle = this.translations.metric[metricId].title;
    const enTitle = getMetricTitleEn(metricId);
    const pattern =
      translatedTitle === enTitle
        ? translatedTitle
        : new RegExp(`${escapeRegex(translatedTitle)}|${escapeRegex(enTitle)}`);
    return this.page.locator('article').filter({ hasText: pattern });
  }

  getEntitiesTable(): Locator {
    return this.page.getByRole('table');
  }

  async expectDrillDownCardSnapshot(metricId: MetricId) {
    const card = this.getDrillDownCard(metricId);
    await expect(card).toMatchAriaSnapshot(
      getDrillDownCardSnapshot(this.translations, metricId),
    );
  }

  async expectCardHasMissingPermission(metricId: MetricId) {
    const card = this.getDrillDownCard(metricId);
    await expect(card).toContainText(
      this.translations.errors.missingPermission,
    );
    await expect(card).toMatchAriaSnapshot(
      getDrillDownMissingPermissionSnapshot(this.translations, metricId),
    );
  }

  async expectTableHasMissingPermission() {
    const msg = getEntitiesPageMissingPermission(this.translations);
    await expect(this.page.locator('tbody')).toContainText(msg);
  }

  async expectCardHasNoDataFound(metricId: MetricId) {
    const card = this.getDrillDownCard(metricId);
    await expect(card).toContainText(this.translations.errors.noDataFound);
    await expect(card).toMatchAriaSnapshot(
      getDrillDownNoDataFoundSnapshot(this.translations, metricId),
    );
  }

  async expectTableNoDataFound() {
    const noDataText = getEntitiesPageNoDataFound(this.translations);
    await expect(this.page.locator('tbody')).toContainText(noDataText);
  }

  /** Verifies the "some entities not reporting" icon tooltip on the drill-down card. */
  async verifySomeEntitiesNotReportingTooltip() {
    const icon = this.page.getByTestId('ReportProblemOutlinedIcon');
    await expect(icon).toBeVisible();
    await icon.hover();
    const tooltipText = getSomeEntitiesNotReportingTooltip(this.translations);
    await expect(this.page.getByRole('tooltip')).toContainText(tooltipText);
  }

  async expectTableHeadersVisible() {
    const tableHeaders = getEntitiesTableHeaderLabels(this.translations);
    const headerNames = [
      tableHeaders.metric,
      tableHeaders.value,
      tableHeaders.entity,
      tableHeaders.owner,
      tableHeaders.kind,
      tableHeaders.lastUpdated,
    ];
    const entitiesTable = this.getEntitiesTable();
    for (const name of headerNames) {
      await expect(
        entitiesTable.getByRole('columnheader', { name }),
      ).toBeVisible();
    }
  }

  async expectEntityNamesVisible(entityNames: string[]) {
    for (const name of entityNames) {
      await expect(this.page.getByText(name, { exact: true })).toBeVisible();
    }
  }

  async verifyMetricColumnSort() {
    const tableHeaders = getEntitiesTableHeaderLabels(this.translations);
    const entitiesTable = this.getEntitiesTable();
    const metricColumnHeader = entitiesTable.getByRole('columnheader', {
      name: tableHeaders.metric,
    });

    await metricColumnHeader.click();
    await expect(entitiesTable.getByRole('row').nth(1)).toContainText('error');
    await expect(entitiesTable.getByRole('row').nth(2)).toContainText(
      'success',
    );

    await metricColumnHeader.click();
    await expect(entitiesTable.getByRole('row').nth(1)).toContainText(
      'warning',
    );
  }
}
