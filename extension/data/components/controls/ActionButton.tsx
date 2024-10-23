import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionButton.module.css';

export const ActionButton = forwardRef<
    HTMLButtonElement,
    ComponentPropsWithoutRef<'button'> & {
        inline?: boolean;
    }
>(({
    inline,
    className,
    ...props
}, ref) => (
    <button
        className={classes(
            css.actionButton,
            inline && css.inline,
            className,
        )}
        {...props}
        ref={ref}
    />
));
