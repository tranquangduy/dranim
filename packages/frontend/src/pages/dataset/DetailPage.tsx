import * as React from 'react';

import { GQLDataset } from '@masterthesis/shared';
import { Button, Tabs } from 'antd';
import gql from 'graphql-tag';
import { History } from 'history';
import { Component, SFC } from 'react';
import { Query } from 'react-apollo';
import { RouteComponentProps } from 'react-router';

import {
  CustomErrorCard,
  LoadingCard,
  UnknownErrorCard
} from '../../components/CustomCards';
import { PageHeaderCard } from '../../components/PageHeaderCard';
import { DataActionsPage } from './ActionsPage';
import { DataEntriesPage } from './EntriesPage';
import { DataSchemas } from './SchemasPage';

export interface DataDetailPageProps
  extends RouteComponentProps<{ id: string }, {}> {}

const NoDatasetExceptionActions: SFC<{ history: History }> = ({ history }) => (
  <Button type="primary" onClick={() => history.push('/data')}>
    Create new Dataset
  </Button>
);

const DATASET = gql`
  query dataset($id: String!) {
    dataset(id: $id) {
      id
      name
      valueschemas {
        name
        type
        required
        fallback
        unique
      }
      entriesCount
      latestEntries {
        id
        values
      }
    }
  }
`;

export default class DataDetailPage extends Component<DataDetailPageProps> {
  public render() {
    const {
      history,
      match: {
        params: { id }
      }
    } = this.props;

    return (
      <Query query={DATASET} variables={{ id }}>
        {({ loading, error, data, refetch }) => {
          if (loading) {
            return <LoadingCard />;
          }

          if (error) {
            return <UnknownErrorCard error={error} />;
          }

          if (!data.dataset) {
            return (
              <CustomErrorCard
                title="Unknown dataset"
                description="Dataset doesn't exist."
                actions={<NoDatasetExceptionActions history={history} />}
              />
            );
          }

          const dataset: GQLDataset = data.dataset;

          return (
            <>
              <PageHeaderCard title={dataset.name} typeTitle="Dataset" />
              <Tabs
                type="card"
                animated={{ inkBar: true, tabPane: false }}
                tabBarStyle={{ marginBottom: 0 }}
              >
                <Tabs.TabPane
                  tab={`${dataset.valueschemas.length} Schemas`}
                  key="schemas"
                >
                  <DataSchemas dataset={dataset} refetch={refetch} />
                </Tabs.TabPane>
                <Tabs.TabPane
                  tab={`${dataset.entriesCount} Entries`}
                  key="entries"
                >
                  <DataEntriesPage dataset={dataset} refetch={refetch} />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Actions" key="actions">
                  <DataActionsPage dataset={dataset} refetch={refetch} />
                </Tabs.TabPane>
              </Tabs>
            </>
          );
        }}
      </Query>
    );
  }
}