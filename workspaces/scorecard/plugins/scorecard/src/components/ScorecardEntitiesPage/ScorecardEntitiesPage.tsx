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

import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Content, Page } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import { ScorecardHomepageCard } from '../ScorecardHomepageSection/ScorecardHomepageCard';

import { EntitiesPageHeader } from './EntitiesPageHeader';
import { EntitiesTable } from './EntitiesTable/EntitiesTable';

export const ScorecardEntitiesPage = () => {
  const { metricId } = useParams<{ metricId?: string }>();

  const [metricTitle, setMetricTitle] = useState<string>('');

  return (
    <Page themeId="home">
      <EntitiesPageHeader
        title={metricTitle ? metricTitle : metricId || 'Unknown metric'}
      />
      <Divider />
      <Content>
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ py: 2, width: '67%', mr: 1.5 }}>
            <EntitiesTable
              metricId={metricId}
              setMetricTitle={setMetricTitle}
            />
          </Box>
          <Box
            sx={{
              py: 2,
              width: '33%',
              ml: 1.5,
              maxHeight: 480,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                '& > *': { flex: 1, minHeight: 0 },
              }}
            >
              <ScorecardHomepageCard
                metricId={metricId as string}
                showSubheader={false}
                showInfo={false}
              />
            </Box>
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
