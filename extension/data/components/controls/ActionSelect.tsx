import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionSelect.module.css';

export const ActionSelect = forwardRef<
    HTMLSelectElement,
    ComponentPropsWithoutRef<'select'> & {
        inline?: boolean;
    }
>(({
    inline,
    className,
    ...props
}, ref) => (
    <select
        className={classes(
            css.actionSelect,
            inline && css.inline,
            className,
        )}
        {...props}
        ref={ref}
    />
));
