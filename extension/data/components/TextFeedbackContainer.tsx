import {AnimatePresence, motion} from 'framer-motion';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import {TextFeedbackKind, TextFeedbackLocation} from '../store/textFeedbackSlice';
import {classes} from '../util/ui_interop';
import css from './TextFeedbackContainer.module.css';

export function TextFeedbackContainer () {
    const currentMessage = useSelector((state: RootState) => state.textFeedback.current);

    // TODO: dont judge me for this im just duplicating how it was done before.
    // eventually we will have a way to do scoped component styles and this will
    // be better
    const style = currentMessage && currentMessage.location === TextFeedbackLocation.BOTTOM
        ? {
            left: '5px',
            bottom: '40px',
            top: 'auto',
            position: 'fixed',
        } as const
        : {
            transform: 'translate(-50%)',
        } as const;

    // really rushed and messy way to map an enum to a CSS class but whatever
    const displayClassName = currentMessage && {
        [TextFeedbackKind.POSITIVE]: 'positive',
        [TextFeedbackKind.NEGATIVE]: 'negative',
        [TextFeedbackKind.NEUTRAL]: undefined,
    }[currentMessage.kind];

    return (
        <AnimatePresence>
            {currentMessage && (
                <motion.div
                    className={classes(css.window, displayClassName && css[displayClassName])}
                    style={style}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                >
                    <span className='tb-feedback-text'>{currentMessage.message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
