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
import { Page, expect } from '@playwright/test';

export async function waitUntilApiCallSucceeds(
  page: Page,
  urlPart: string = '/api/scorecard/metrics/catalog/Component/default/red-hat-developer-hub',
): Promise<void> {
  const response = await page.waitForResponse(
    async res => {
      const urlMatches = res.url().includes(urlPart);
      const isSuccess = res.status() === 200;
      return urlMatches && isSuccess;
    },
    { timeout: 60000 },
  );

  expect(response.status()).toBe(200);
}

const SCORECARD_API_ROUTE =
  '**/api/scorecard/metrics/catalog/Component/default/red-hat-developer-hub';

export async function mockScorecardResponse(
  page: Page,
  responseData: object,
  status = 200,
) {
  await page.route(SCORECARD_API_ROUTE, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

const GITHUB_AGGREGATION_ROUTE =
  '**/api/scorecard/metrics/github.open_prs/catalog/aggregations';
const JIRA_AGGREGATION_ROUTE =
  '**/api/scorecard/metrics/jira.open_issues/catalog/aggregations';

export async function mockAggregatedScorecardResponse(
  page: Page,
  githubResponse: object,
  jiraResponse: object,
  status = 200,
) {
  await page.route(GITHUB_AGGREGATION_ROUTE, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(githubResponse),
    });
  });

  await page.route(JIRA_AGGREGATION_ROUTE, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(jiraResponse),
    });
  });
}

const entitiesDrillDownPattern = (metricId: string) =>
  `**/api/scorecard/metrics/${metricId}/catalog/aggregations/entities*`;

/**
 * Mocks the aggregated scorecard entity drill-down API:
 * GET /api/scorecard/metrics/{metricId}/catalog/aggregations/entities?page=1&pageSize=5
 */
export async function mockScorecardEntitiesDrillDown(
  page: Page,
  responseData: object,
  metricId: 'github.open_prs' | 'jira.open_issues' = 'github.open_prs',
  status = 200,
) {
  await page.route(entitiesDrillDownPattern(metricId), async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

const STATUS_ORDER_ASC = ['error', 'success', 'warning'];

interface EntitiesDrillDownPayload {
  entities?: Array<{ status?: string }>;
  [key: string]: unknown;
}

function sortEntitiesByStatus(
  data: EntitiesDrillDownPayload,
  sortOrder: 'asc' | 'desc',
): EntitiesDrillDownPayload {
  const entities = data.entities ? [...data.entities] : [];
  const order =
    sortOrder === 'asc' ? STATUS_ORDER_ASC : [...STATUS_ORDER_ASC].reverse();
  entities.sort((a, b) => {
    const aIdx = order.indexOf(a.status ?? '');
    const bIdx = order.indexOf(b.status ?? '');
    return aIdx - bIdx;
  });
  return { ...data, entities };
}

/**
 * Mocks the entities drill-down API and returns entities sorted by status when
 * sortBy=status and sortOrder are present in the request URL (so sort clicks are reflected in table data).
 */
export async function mockScorecardEntitiesDrillDownWithSort(
  page: Page,
  responseData: object,
  metricId: 'github.open_prs' | 'jira.open_issues' = 'github.open_prs',
  status = 200,
) {
  await page.route(entitiesDrillDownPattern(metricId), async route => {
    const url = new URL(route.request().url());
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = (url.searchParams.get('sortOrder') ?? 'asc') as
      | 'asc'
      | 'desc';
    const data =
      sortBy === 'status'
        ? sortEntitiesByStatus(
            responseData as EntitiesDrillDownPayload,
            sortOrder,
          )
        : responseData;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}
