import * as React from 'react';
import { SFC } from 'react';

import { Icon, Menu } from 'antd';
import { NavLink } from 'react-router-dom';

import { Workspace } from '../../../shared/lib/workspace';
import { MenuItemContent } from './MenuItemContent';

export const AppMenu: SFC<{
  collapsed: boolean;
  workspaces?: Array<Workspace>;
  datasets?: Array<{
    name: string;
    id: string;
  }>;
  visualizations?: Array<{
    name: string;
    id: string;
  }>;
}> = ({ datasets, workspaces, visualizations, collapsed }) => (
  <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
    <Menu.Item key="menu_start">
      <MenuItemContent
        collapsed={collapsed}
        href="/"
        iconName="appstore-o"
        title="Start"
      />
    </Menu.Item>
    <Menu.SubMenu
      key="sub1"
      title={
        <span>
          <Icon type="database" />
          {!collapsed ? ' Data' : null}
        </span>
      }
    >
      <Menu.Item key="menu_datasets">
        <MenuItemContent collapsed={collapsed} href="/data" title="Datasets" />
      </Menu.Item>
      {datasets && datasets.length > 0 && <Menu.Divider />}
      {datasets &&
        datasets.map((ds: { name: string; id: string }) => (
          <Menu.Item key={`menu_passages+${ds.id}`}>
            <NavLink to={`/data/${ds.id}`}>{ds.name}</NavLink>
          </Menu.Item>
        ))}
    </Menu.SubMenu>
    <Menu.SubMenu
      key="sub2"
      title={
        <span>
          <Icon type="filter" />
          {!collapsed ? ' Explorer' : null}
        </span>
      }
    >
      <Menu.Item key="menu_workspaces">
        <MenuItemContent
          collapsed={collapsed}
          href="/workspaces"
          title="Workspaces"
        />
      </Menu.Item>
      {workspaces && workspaces.length > 0 && <Menu.Divider />}
      {workspaces &&
        workspaces.map((ws: { name: string; id: string }) => (
          <Menu.Item key={`menu_ws+${ws.id}`}>
            <NavLink to={`/workspaces/${ws.id}`}>{ws.name}</NavLink>
          </Menu.Item>
        ))}
    </Menu.SubMenu>
    <Menu.SubMenu
      key="sub3"
      title={
        <span>
          <Icon type="area-chart" />
          {!collapsed ? ' Visualizations' : null}
        </span>
      }
    >
      <Menu.Item key="menu_vis">
        <MenuItemContent
          collapsed={collapsed}
          href="/visualizations"
          title="Visualizations"
        />
      </Menu.Item>
      {visualizations && visualizations.length > 0 && <Menu.Divider />}
      {visualizations &&
        visualizations.map(({ name, id }) => (
          <Menu.Item key={`menu_vis+${id}`}>
            <NavLink to={`/visualizations/${id}`}>{name}</NavLink>
          </Menu.Item>
        ))}
    </Menu.SubMenu>
  </Menu>
);