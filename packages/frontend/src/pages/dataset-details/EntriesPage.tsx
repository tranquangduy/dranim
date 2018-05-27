import * as React from 'react';

import { Dataset, Value } from '@masterthesis/shared';
import { ApolloQueryResult } from 'apollo-client';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

import { Card, Col, Row, Table } from 'antd';
import { AsyncButton } from '../../components/AsyncButton';
import { tryOperation } from '../../utils/form';
import { CreateEntryForm } from '../forms/CreateEntryForm';

export interface DataEntriesProps {
  dataset: Dataset;
  refetch: () => Promise<ApolloQueryResult<any>>;
}

const ADD_ENTRY = gql`
  mutation addEntry($datasetId: String!, $values: String!) {
    addEntry(datasetId: $datasetId, values: $values) {
      id
    }
  }
`;

const DELETE_ENTRY = gql`
  mutation deleteEntry($datasetId: String!, $entryId: String!) {
    deleteEntry(datasetId: $datasetId, entryId: $entryId)
  }
`;

const expandedRowRender = (e: { values: Array<Value>; key: string }) => {
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Value', dataIndex: 'value', key: 'value' }
  ];

  const data = e.values.map(v => ({
    key: `${e.key}-${v.name}`,
    name: v.name,
    value: v.val
  }));

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={data}
      pagination={false}
    />
  );
};

export class DataEntries extends React.Component<
  DataEntriesProps,
  { saving: boolean }
> {
  public componentWillMount() {
    this.setState({
      saving: false
    });
  }

  public render() {
    const { dataset, refetch } = this.props;
    const entriesDataSource = dataset.latestEntries.map(e => ({
      key: e.id,
      summary: `${e.values.length} values`,
      values: e.values
    }));

    const entriesColumns = [
      {
        title: 'Index',
        dataIndex: 'key',
        key: 'key'
      },
      {
        title: 'Summary',
        dataIndex: 'summary',
        key: 'summary'
      },
      {
        title: 'Operations',
        dataIndex: 'operation',
        render: (text, record) => (
          <Mutation mutation={DELETE_ENTRY}>
            {deleteEntry => (
              <AsyncButton
                confirmMessage="Delete Entry?"
                confirmClick
                onClick={() =>
                  tryOperation({
                    op: () =>
                      deleteEntry({
                        variables: {
                          datasetId: dataset.id,
                          entryId: record.key
                        }
                      }),
                    refetch,
                    successTitle: () => 'Entry deleted',
                    successMessage: () => `Entry deleted successfully.`,
                    failedTitle: 'Entry not deleted.',
                    failedMessage: `Entry deletion failed.`
                  })
                }
              >
                Delete
              </AsyncButton>
            )}
          </Mutation>
        )
      }
    ];

    return (
      <>
        <Row style={{ marginBottom: 12 }}>
          <Col>
            <Card bordered={false}>
              <h3>Add Entry</h3>
              <Mutation mutation={ADD_ENTRY}>
                {addEntry => (
                  <CreateEntryForm
                    handleCreateEntry={values =>
                      tryOperation({
                        op: () =>
                          addEntry({
                            variables: {
                              datasetId: dataset.id,
                              values: JSON.stringify(values)
                            }
                          }),
                        refetch,
                        successTitle: () => 'Entry created',
                        successMessage: () => `Entry created successfully.`,
                        failedTitle: 'Entry not created.',
                        failedMessage: `Entry creation failed.`
                      })
                    }
                    schema={dataset.valueschemas}
                  />
                )}
              </Mutation>
            </Card>
          </Col>
        </Row>
        <Row style={{ marginBottom: 12 }}>
          <Col>
            <Card bordered={false}>
              <h3>Last Entries</h3>
              <Table
                size="small"
                expandedRowRender={expandedRowRender}
                dataSource={entriesDataSource}
                columns={entriesColumns}
              />
            </Card>
          </Col>
        </Row>
      </>
    );
  }
}
