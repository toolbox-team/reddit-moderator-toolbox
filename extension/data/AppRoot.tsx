import {Provider} from 'react-redux';

import store from './store';

import {PageNotificationContainer} from './components/PageNotificationContainer';
import {TextFeedbackContainer} from './components/TextFeedbackContainer';

export default () => (
    <Provider store={store}>
        <div className='tb-app-root'>
            <PageNotificationContainer />
            <TextFeedbackContainer />
        </div>
    </Provider>
);
