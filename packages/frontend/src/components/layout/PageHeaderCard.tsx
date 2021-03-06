import React, { SFC } from 'react';

import { Colors } from '@masterthesis/shared';
import { Button, Card, Col, Divider, Modal, Row, Tooltip } from 'antd';
import { css } from 'glamor';

import { UserInfo } from '../infos/UserInfo';

export interface PageHeaderProps {
  title: JSX.Element | string;
  typeTitle?: string;
  marginBottom?: 'small' | 'big' | 'none';
  helpContent?: JSX.Element;
  endContent?: JSX.Element;
}

export const showHelp = (content: JSX.Element) => {
  Modal.info({
    title: 'Help',
    iconType: 'question-circle',
    width: '50%',
    content
  });
};

export const PageHeaderCard: SFC<PageHeaderProps> = ({
  title,
  typeTitle,
  marginBottom = 'small',
  helpContent,
  endContent
}) => (
  <Card
    bordered={false}
    bodyStyle={{
      paddingLeft: 24,
      paddingRight: 24,
      paddingTop: 16,
      paddingBottom: 16
    }}
    style={{
      marginBottom: marginBottom ? (marginBottom === 'big' ? 32 : 16) : 0
    }}
  >
    <Row type="flex" justify="space-around" align="middle">
      <Col xs={24} sm={12} md={16} xl={18}>
        <h1 {...css({ marginBottom: 0 })}>
          <Row type="flex" align="middle">
            <Col>{title}</Col>
            <Col>
              {typeTitle ? (
                <Col>
                  <Divider type="vertical" />
                  <span
                    {...css({
                      color: Colors.GrayMedium,
                      fontWeight: 'initial'
                    })}
                  >
                    {typeTitle}
                  </span>
                </Col>
              ) : null}
            </Col>
          </Row>
        </h1>
      </Col>

      <Col xs={24} sm={12} md={8} xl={6} style={{ textAlign: 'right' }}>
        {helpContent && (
          <>
            <Tooltip title="Help" mouseEnterDelay={1}>
              <Button
                style={{ border: 'none' }}
                onClick={() => showHelp(helpContent)}
                icon="question-circle"
              />
            </Tooltip>
            <Divider type="vertical" />
          </>
        )}
        <UserInfo />
      </Col>
    </Row>
    {endContent}
  </Card>
);
