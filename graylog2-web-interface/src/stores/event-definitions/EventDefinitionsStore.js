import Reflux from 'reflux';
import URI from 'urijs';
import lodash from 'lodash';

import URLUtils from 'util/URLUtils';
import UserNotification from 'util/UserNotification';
import fetch from 'logic/rest/FetchProvider';
import CombinedProvider from 'injection/CombinedProvider';

const { EventDefinitionsActions } = CombinedProvider.get('EventDefinitions');

const EventDefinitionsStore = Reflux.createStore({
  listenables: [EventDefinitionsActions],
  sourceUrl: '/plugins/org.graylog.events/events/processors',
  all: undefined,
  eventDefinitions: undefined,
  query: undefined,
  pagination: {
    count: undefined,
    page: undefined,
    pageSize: undefined,
    total: undefined,
    grandTotal: undefined,
  },

  getInitialState() {
    return this.getState();
  },

  propagateChanges() {
    this.trigger(this.getState());
  },

  getState() {
    return {
      all: this.all,
      eventDefinitions: this.eventDefinitions,
      query: this.query,
      pagination: this.pagination,
    };
  },

  eventDefinitionsUrl({ segments = [], query = {} }) {
    const uri = new URI(this.sourceUrl);
    const nextSegments = lodash.concat(uri.segment(), segments);
    uri.segmentCoded(nextSegments);
    uri.query(query);

    return URLUtils.qualifyUrl(uri.resource());
  },

  refresh() {
    if (this.all) {
      this.listAll();
    }
    if (this.pagination.page) {
      this.listPaginated({
        query: this.pagination.query,
        page: this.pagination.page,
        pageSize: this.pagination.pageSize,
      });
    }
  },

  listAll() {
    const promise = fetch('GET', this.eventDefinitionsUrl({ query: { per_page: 0 } }));

    promise.then((response) => {
      this.all = response.event_processors;
      this.propagateChanges();
      return response;
    });

    EventDefinitionsActions.listAll.promise(promise);
  },

  listPaginated({ query = '', page = 1, pageSize = 10 }) {
    const promise = fetch('GET', this.eventDefinitionsUrl({
      query: {
        query: query,
        page: page,
        per_page: pageSize,
      },
    }));

    promise.then((response) => {
      this.eventDefinitions = response.event_processors;
      this.query = response.query;
      this.pagination = {
        count: response.count,
        page: response.page,
        pageSize: response.per_page,
        total: response.total,
        grandTotal: response.grand_total,
      };
      this.propagateChanges();
      return response;
    });

    EventDefinitionsActions.listPaginated.promise(promise);
  },

  get(eventDefinitionId) {
    const promise = fetch('GET', this.eventDefinitionsUrl({ segments: [eventDefinitionId] }));
    EventDefinitionsActions.get.promise(promise);
  },

  create(eventDefinition) {
    const promise = fetch('POST', this.eventDefinitionsUrl({}), eventDefinition);
    promise.then(
      (response) => {
        UserNotification.success('Event Definition created successfully', `Event Definition "${eventDefinition.title}" was created successfully.`);
        this.list();
        return response;
      },
      (error) => {
        UserNotification.error(`Creating Event Definition "${eventDefinition.title}" failed with status: ${error}`,
          'Could not save Event Definition');
      },
    );
    EventDefinitionsActions.create.promise(promise);
  },

  update(eventDefinitionId, eventDefinition) {
    const promise = fetch('PUT', this.eventDefinitionsUrl({ segments: [eventDefinitionId] }), eventDefinition);
    promise.then(
      (response) => {
        UserNotification.success('Event Definition updated successfully', `Event Definition "${eventDefinition.title}" was updated successfully.`);
        return response;
      },
      (error) => {
        UserNotification.error(`Updating Event Definition "${eventDefinition.title}" failed with status: ${error}`,
          'Could not update Event Definition');
      },
    );
    EventDefinitionsActions.update.promise(promise);
  },

  delete(eventDefinition) {
    const promise = fetch('DELETE', this.eventDefinitionsUrl({ segments: [eventDefinition.id] }));

    promise.then(
      () => {
        UserNotification.success('Event Definition deleted successfully', `Event Definition "${eventDefinition.title}" was deleted successfully.`);
        this.list();
      },
      (error) => {
        UserNotification.error(`Deleting Event Definition "${eventDefinition.title}" failed with status: ${error}`,
          'Could not delete Event Definition');
      },
    );

    EventDefinitionsActions.delete.promise(promise);
  },
});

export default EventDefinitionsStore;
