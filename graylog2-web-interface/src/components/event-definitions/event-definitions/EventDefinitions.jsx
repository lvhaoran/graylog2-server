import React from 'react';
import PropTypes from 'prop-types';
import { Button, Col, DropdownButton, MenuItem, Row } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { PluginStore } from 'graylog-web-plugin/plugin';
import moment from 'moment';
import {} from 'moment-duration-format';

import { NOTIFICATION_TYPE } from 'components/event-notifications/event-notification-types';

import Routes from 'routing/Routes';

import { EmptyEntity, EntityList, EntityListItem, PaginatedList, Pluralize, SearchForm } from 'components/common';

import styles from './EventDefinitions.css';

class EventDefinitions extends React.Component {
  static propTypes = {
    eventDefinitions: PropTypes.array.isRequired,
    pagination: PropTypes.object.isRequired,
    query: PropTypes.string.isRequired,
    onPageChange: PropTypes.func.isRequired,
    onQueryChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
  };

  getConditionPlugin = (type) => {
    if (type === undefined) {
      return {};
    }
    return PluginStore.exports('eventDefinitionTypes').find(edt => edt.type === type);
  };

  renderEmptyContent = () => {
    return (
      <Row>
        <Col md={4} mdOffset={4}>
          <EmptyEntity>
            <p>
              Create Event Definitions that are able to search, aggregate or correlate Messages and other
              Events, allowing you to record significant Events in Graylog and alert on them.
            </p>
            <LinkContainer to={Routes.NEXT_ALERTS.DEFINITIONS.CREATE}>
              <Button bsStyle="success">Get Started!</Button>
            </LinkContainer>
          </EmptyEntity>
        </Col>
      </Row>
    );
  };

  renderDescription = (definition) => {
    let schedulingInformation = 'Not scheduled.';
    if (definition.config.search_within_ms && definition.config.execute_every_ms) {
      const executeEveryFormatted = moment.duration(definition.config.execute_every_ms)
        .format('d [days] h [hours] m [minutes] s [seconds]', { trim: 'all', usePlural: false });
      const searchWithinFormatted = moment.duration(definition.config.search_within_ms)
        .format('d [days] h [hours] m [minutes] s [seconds]', { trim: 'all' });
      schedulingInformation = `Runs every ${executeEveryFormatted}, searching within the last ${searchWithinFormatted}.`;
    }

    const notificationActions = definition.actions.filter(action => action.type === NOTIFICATION_TYPE);
    let notificationsInformation = <span>Does <b>not</b> trigger any Notifications.</span>;
    if (notificationActions.length > 0) {
      notificationsInformation = (
        <span>
          Triggers {notificationActions.length}{' '}
          <Pluralize singular="Notification" plural="Notifications" value={notificationActions.length} />.
        </span>
      );
    }

    return (
      <React.Fragment>
        <p>{definition.description}</p>
        <p>{schedulingInformation} {notificationsInformation}</p>
      </React.Fragment>
    );
  };

  render() {
    const { eventDefinitions, pagination, query, onPageChange, onQueryChange, onDelete } = this.props;

    if (pagination.grandTotal === 0) {
      return this.renderEmptyContent();
    }

    const items = eventDefinitions.map((definition) => {
      const actions = (
        <React.Fragment key={`actions-${definition.id}`}>
          <LinkContainer to={Routes.NEXT_ALERTS.DEFINITIONS.edit(definition.id)}>
            <Button bsStyle="info">Edit</Button>
          </LinkContainer>
          <DropdownButton id="more-dropdown" title="More" pullRight>
            <MenuItem onClick={onDelete(definition)}>Delete</MenuItem>
          </DropdownButton>
        </React.Fragment>
      );

      const plugin = this.getConditionPlugin(definition.config.type);
      const titleSuffix = plugin.displayName || definition.config.type;
      return (
        <EntityListItem key={`event-definition-${definition.id}`}
                        title={definition.title}
                        titleSuffix={titleSuffix}
                        description={this.renderDescription(definition)}
                        noItemsText="Could not find any items with the given filter."
                        actions={actions} />
      );
    });

    return (
      <React.Fragment>
        <Row>
          <Col md={12}>
            <div className="pull-right">
              <LinkContainer to={Routes.NEXT_ALERTS.DEFINITIONS.CREATE}>
                <Button bsStyle="success">Create Event Definition</Button>
              </LinkContainer>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <SearchForm query={query}
                        onSearch={onQueryChange}
                        onReset={onQueryChange}
                        searchButtonLabel="Find"
                        placeholder="Find Event Definitions"
                        wrapperClass={styles.inline}
                        queryWidth={200}
                        topMargin={0}
                        useLoadingState />

            <PaginatedList activePage={pagination.page}
                           pageSize={pagination.pageSize}
                           pageSizes={[10, 25, 50]}
                           totalItems={pagination.total}
                           onChange={onPageChange}>
              <div className={styles.definitionList}>
                <EntityList items={items} />
              </div>
            </PaginatedList>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default EventDefinitions;
