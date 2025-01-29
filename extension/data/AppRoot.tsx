import {Provider} from 'react-redux';

import {storeFromInitialSettings} from './store';

import {PageNotificationContainer} from './components/PageNotificationContainer';
import {TextFeedbackContainer} from './components/TextFeedbackContainer';
import {useFetched} from './hooks';
import {getSettings} from './tbstorage';

export default function () {
    // We don't have a store premade - we have to fetch our settings first, then
    // use those values to prepopulate the store
    const initialSettings = useFetched(getSettings());

    // Render nothing if we don't have settings yet
    if (initialSettings == null) {
        return <></>;
    }

    // Create the store on the fly, providing the initial settings values as
    // preloaded state
    const store = storeFromInitialSettings(initialSettings);

    // Render the app
    return (
        <Provider store={store}>
            <div className='tb-app-root'>
                <PageNotificationContainer />
                <TextFeedbackContainer />
            </div>
        </Provider>
    );
}
