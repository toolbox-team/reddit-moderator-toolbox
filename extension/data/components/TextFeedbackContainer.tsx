import {AnimatePresence, motion} from 'framer-motion';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import {TextFeedbackLocation} from '../store/textFeedbackSlice';

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

    return (
        <AnimatePresence>
            {currentMessage && (
                <motion.div
                    id='tb-feedback-window'
                    className={currentMessage.kind}
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
