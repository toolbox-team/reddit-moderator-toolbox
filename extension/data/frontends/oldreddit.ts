import TBLog from '../tblog';
import {PlatformObserver} from '.';

const log = TBLog('observer:old');

export default (() => {
    log.warn('Modmail observer not yet implemented');
}) satisfies PlatformObserver;
